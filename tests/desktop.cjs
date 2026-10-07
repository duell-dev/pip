const assert = require("node:assert/strict");
const { _electron: electron } = require("playwright");
const { mkdirSync, mkdtempSync, writeFileSync } = require("node:fs");
const { resolve, join } = require("node:path");
const { spawn, spawnSync } = require("node:child_process");
const { once } = require("node:events");
const { setTimeout: delay } = require("node:timers/promises");

async function main() {
  const packaged = process.argv.includes("--packaged");
  const mode = packaged ? "packaged" : "desktop";
  mkdirSync("test-results", { recursive: true });
  const profile = mkdtempSync(resolve(`test-results/${mode} ő `));
  const env = { ...process.env, PIP_DATA_DIR: profile };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.ELECTRON_RENDERER_URL;
  let app, page, blocker;
  const errors = [];
  async function launch() {
    app = await electron.launch({
      executablePath: packaged
        ? resolve("dist/win-unpacked/Pip.exe")
        : require("electron"),
      args: packaged ? [] : ["."],
      env,
      timeout: 30000,
    });
    page = await app.firstWindow();
    page.on("pageerror", (error) => errors.push(error.message));
    await app.context().setOffline(true);
    await page.getByRole("button", { name: "Open Pip capture" }).click();
    await page.getByLabel("What’s on your mind?").waitFor();
    await page.waitForFunction(
      () => !document.querySelector("textarea").disabled,
    );
  }
  async function draft(text) {
    await page.getByLabel("What’s on your mind?").fill(text);
    await page
      .getByText("Draft saved on this device", { exact: true })
      .waitFor();
  }
  async function capture(text) {
    await draft(text);
    const start = performance.now();
    await page.getByRole("button", { name: /Save capture/ }).click();
    await page.getByText("Saved on this device", { exact: true }).waitFor();
    return performance.now() - start;
  }
  async function kill() {
    const exited = once(app.process(), "exit");
    spawnSync("taskkill", ["/PID", String(app.process().pid), "/T", "/F"], {
      windowsHide: true,
      stdio: "ignore",
    });
    await exited;
  }
  try {
    const start = performance.now();
    await launch();
    const startupToInputMs = performance.now() - start;
    const boundaries = await app.evaluate(
      ({ BrowserWindow, safeStorage, app, screen }) => {
        const window = BrowserWindow.getAllWindows()[0];
        return {
          sandbox: window.webContents.getLastWebPreferences().sandbox,
          contextIsolation:
            window.webContents.getLastWebPreferences().contextIsolation,
          nodeIntegration:
            window.webContents.getLastWebPreferences().nodeIntegration,
          packaged: app.isPackaged,
          dataDirectory: app.getPath("userData"),
          displays: screen.getAllDisplays().map((d) => ({
            bounds: d.bounds,
            workArea: d.workArea,
            scaleFactor: d.scaleFactor,
          })),
          encryption: safeStorage.isEncryptionAvailable(),
        };
      },
    );
    assert.equal(boundaries.packaged, packaged);
    assert.equal(boundaries.sandbox, true);
    assert.equal(boundaries.contextIsolation, true);
    assert.equal(boundaries.nodeIntegration, false);
    assert.equal(await page.evaluate(() => typeof window.require), "undefined");
    const rejected = await page.evaluate(() =>
      window.pip.capture({ text: "invalid" }),
    );
    assert.equal(rejected.ok, false);
    const secret = await app.evaluate(async ({ safeStorage }) => {
      if (!(await safeStorage.isAsyncEncryptionAvailable()))
        return { available: false };
      const encrypted = await safeStorage.encryptStringAsync(
        "pip-synthetic-secret",
      );
      return {
        available: true,
        plaintextAbsent: !encrypted.includes(
          Buffer.from("pip-synthetic-secret"),
        ),
        matches:
          (await safeStorage.decryptStringAsync(encrypted)).result ===
          "pip-synthetic-secret",
      };
    });
    assert.deepEqual(secret, {
      available: true,
      plaintextAbsent: true,
      matches: true,
    });
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Open Pip capture" }).waitFor();
    assert.equal(
      await page
        .getByLabel("Drag to move Pip", { exact: true })
        .evaluate((element) =>
          getComputedStyle(element).getPropertyValue("-webkit-app-region"),
        ),
      "drag",
    );
    // Simulate the native drag events; a real Windows drag is checked separately.
    const notchBounds = await app.evaluate(({ BrowserWindow, screen }) => {
      const window = BrowserWindow.getAllWindows()[0];
      const area = screen.getDisplayMatching(window.getBounds()).workArea;
      const target = { ...window.getBounds(), x: area.x + 40, y: area.y + 100 };
      window.emit("will-move", {}, target);
      window.setBounds(target);
      window.emit("moved");
      return { actual: window.getBounds(), expected: { ...target, y: area.y } };
    });
    assert.deepEqual(notchBounds.actual, notchBounds.expected);
    // Worker barrier: the new anchor has committed before any restart.
    assert.equal((await page.evaluate(() => window.pip.snapshot())).ok, true);
    await page.getByRole("button", { name: "Open Pip capture" }).click();
    const movedBounds = await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].getBounds(),
    );
    assert.equal(
      movedBounds.x,
      notchBounds.actual.x - 40,
      "workspace clamps at the left edge",
    );
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Open Pip capture" }).waitFor();
    assert.deepEqual(
      await app.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()[0].getBounds(),
      ),
      notchBounds.actual,
      "expanding must not replace the chosen notch anchor",
    );
    await page.getByRole("button", { name: "Open Pip capture" }).click();
    const source =
      "  Book a dentist appointment\r\nő 🐤 https://example.com/?a=1&b=2\n<script>window.bad = true</script>  ";
    await page.getByLabel("What’s on your mind?").focus();
    await page.evaluate((text) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData("text/plain", text);
      document.querySelector("textarea").dispatchEvent(
        new ClipboardEvent("paste", {
          clipboardData,
          bubbles: true,
          cancelable: true,
        }),
      );
    }, source);
    await page
      .getByText("Draft saved on this device", { exact: true })
      .waitFor();
    // Editing after a paste must preserve untouched CRLF in the stored source.
    await page.getByLabel("What’s on your mind?").press("Control+End");
    await page.keyboard.insertText("!");
    await page
      .getByText("Draft saved on this device", { exact: true })
      .waitFor();
    const firstStart = performance.now();
    await page.getByRole("button", { name: /Save capture/ }).click();
    await page.getByText("Saved on this device", { exact: true }).waitFor();
    const timings = [performance.now() - firstStart];
    assert.equal(
      await page.locator("li p").first().textContent(),
      source + "!",
    );
    assert.equal(await page.evaluate(() => window.bad), undefined);
    const currentDraft = await page.evaluate(
      async () => (await window.pip.snapshot()).value.draft,
    );
    await draft("Must survive a failed save");
    blocker = spawn(
      require("electron"),
      [resolve("tests/lock.cjs"), join(profile, "pip.db")],
      {
        env: { ...env, ELECTRON_RUN_AS_NODE: "1" },
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    await once(blocker.stdout, "data");
    await page.getByRole("button", { name: /Save capture/ }).click();
    await page.getByRole("alert").filter({ hasText: "SQLITE_BUSY" }).waitFor();
    assert.equal(
      await page.getByLabel("What’s on your mind?").inputValue(),
      "Must survive a failed save",
    );
    assert.equal(await page.locator("li").count(), 1);
    await page.keyboard.press("Escape");
    assert.equal(
      await page.getByLabel("What’s on your mind?").isVisible(),
      true,
      "failed draft flush must not dismiss",
    );
    const unlocked = once(blocker, "exit");
    blocker.kill();
    await unlocked;
    blocker = null;
    await page.getByRole("button", { name: /Save capture/ }).click();
    await page.getByText("Saved on this device", { exact: true }).waitFor();
    const stale = await page.evaluate(
      (d) => window.pip.draft({ ...d, text: "late message", version: 100 }),
      currentDraft,
    );
    assert.equal(
      stale.value.text,
      "",
      "old draft does not reappear after capture",
    );
    for (let i = 2; i < 100; i++)
      timings.push(await capture(`Offline synthetic capture ${i} · ő`));
    assert.equal(
      (await page.evaluate(() => window.pip.snapshot())).value.total,
      100,
    );
    await draft("Recovered after dismissal and forced exit · ő");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Open Pip capture" }).waitFor();
    await page.getByRole("button", { name: "Open Pip capture" }).click();
    assert.match(
      await page.getByLabel("What’s on your mind?").inputValue(),
      /Recovered after dismissal/,
    );
    await page.waitForFunction(
      () => document.querySelector("canvas").dataset.frame === "11",
      undefined,
      { timeout: 500 },
    );
    await page.screenshot({ path: `test-results/${mode}.png` });
    await kill();
    await launch();
    assert.deepEqual(
      await app.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()[0].getBounds(),
      ),
      movedBounds,
      "position survives forced process termination",
    );
    assert.match(
      await page.getByLabel("What’s on your mind?").inputValue(),
      /Recovered after dismissal/,
    );
    assert.equal(
      (await page.evaluate(() => window.pip.snapshot())).value.total,
      100,
    );
    await page.getByRole("button", { name: "Load older captures" }).click();
    await page.waitForFunction(
      () => document.querySelectorAll("li").length === 100,
    );

    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.getByLabel("Capture shortcut").selectOption("Control+Alt+P");
    const registered = await app.evaluate(({ globalShortcut }) =>
      globalShortcut.isRegistered("Control+Alt+P"),
    );
    assert.equal(registered, true);
    const reserved = await app.evaluate(({ globalShortcut }) =>
      globalShortcut.register("Control+Shift+Space", () => {}),
    );
    await page
      .getByLabel("Capture shortcut")
      .selectOption("Control+Shift+Space");
    await page
      .getByRole("alert")
      .filter({ hasText: "That shortcut is in use" })
      .waitFor();
    assert.equal(
      (await page.evaluate(() => window.pip.snapshot())).value.preferences
        .shortcut,
      "Control+Alt+P",
    );
    if (reserved)
      await app.evaluate(({ globalShortcut }) =>
        globalShortcut.unregister("Control+Shift+Space"),
      );
    await page.getByLabel("Quiet mode · still Pip").check();
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await capture("Reduced motion capture");
    await page.waitForFunction(
      () => document.querySelector("canvas").dataset.frame === "11",
    );
    await draft("Draft survives graceful quit");
    // Reset baseline after the finite capture animation; no ongoing timers should consume CPU.
    await app.evaluate(({ app }) => app.getAppMetrics());
    await delay(1000);
    const memory = await app.evaluate(({ app }) =>
      app.getAppMetrics().map((p) => ({
        type: p.type,
        workingSetKB: p.memory.workingSetSize,
        percentCPU: p.cpu.percentCPUUsage,
      })),
    );
    const prefsBeforeQuit = (await page.evaluate(() => window.pip.snapshot()))
      .value.preferences;
    const monitorRecovery = await app.evaluate(({ BrowserWindow, screen }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.setPosition(-30000, -30000);
      screen.emit("display-removed", {}, screen.getPrimaryDisplay());
      const b = win.getBounds();
      return screen
        .getAllDisplays()
        .some(
          ({ workArea: a }) =>
            b.x >= a.x &&
            b.y >= a.y &&
            b.x + b.width <= a.x + a.width &&
            b.y + b.height <= a.y + a.height,
        );
    });
    assert.equal(monitorRecovery, true);
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    const exited = once(app.process(), "exit");
    await page.getByRole("button", { name: "Quit Pip", exact: true }).click();
    await exited;
    await launch();
    assert.deepEqual(
      await app.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()[0].getBounds(),
      ),
      movedBounds,
      "position survives graceful restart",
    );
    assert.equal(
      await page.getByLabel("What’s on your mind?").inputValue(),
      "Draft survives graceful quit",
    );
    assert.deepEqual(
      (await page.evaluate(() => window.pip.snapshot())).value.preferences,
      prefsBeforeQuit,
    );
    assert.equal(
      (await page.evaluate(() => window.pip.snapshot())).value.total,
      101,
    );
    assert.deepEqual(errors, []);
    await page.screenshot({ path: `test-results/${mode}-restart.png` });
    await kill();
    app = null;
    const report = {
      checkedAt: new Date().toISOString(),
      mode,
      startupToInputMs,
      uiSaveP95Ms: timings.sort((a, b) => a - b)[
        Math.floor(timings.length * 0.95)
      ],
      acknowledgedCapturesAfterForcedExit: 100,
      finalCapturesAfterGracefulExit: 101,
      sqliteBusy: "real second-process lock",
      shortcutCollision:
        "real registration collision, reserved by test process",
      monitorRecovery:
        "simulated display-removed event after moving offscreen; physical unplug unverified",
      notchPosition:
        "simulated native move events; top snap, edge clamp, expand/collapse anchor and forced/graceful restart passed",
      network: "Playwright context offline; app denies remote requests",
      sourceCRLF:
        "raw paste and untouched CRLF after editing preserved exactly",
      boundaries,
      safeStorage: secret,
      memory,
      errors,
    };
    writeFileSync(`test-results/${mode}.json`, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    console.log(
      `PASS: ${mode} real window, 100 captures, failed save/dismiss, hard exit, draft recovery, quiet mode, settings, graceful quit.`,
    );
  } finally {
    blocker?.kill();
    if (app && app.process().exitCode === null)
      spawnSync("taskkill", ["/PID", String(app.process().pid), "/T", "/F"], {
        windowsHide: true,
        stdio: "ignore",
      });
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
