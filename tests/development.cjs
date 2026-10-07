const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { spawn, spawnSync } = require("node:child_process");
const { mkdirSync, mkdtempSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");
mkdirSync("test-results", { recursive: true });
const profile = mkdtempSync(resolve("test-results/vite ő "));
const env = {
  ...process.env,
  PIP_DATA_DIR: profile,
  REMOTE_DEBUGGING_PORT: "0",
};
delete env.ELECTRON_RUN_AS_NODE;
const child = spawn(
  process.execPath,
  ["node_modules/electron-vite/bin/electron-vite.js", "dev"],
  { env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
);
let browser;
(async () => {
  const endpoint = await new Promise((accept, reject) => {
    const timeout = setTimeout(
      () =>
        reject(new Error("Development app did not expose its test endpoint.")),
      30000,
    );
    function inspect(chunk) {
      const match = String(chunk).match(
        /DevTools listening on (ws:\/\/[^\s]+)/,
      );
      if (match) {
        clearTimeout(timeout);
        accept(match[1]);
      }
    }
    child.stdout.on("data", inspect);
    child.stderr.on("data", inspect);
    child.on("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Development process exited ${code}`));
    });
  });
  browser = await chromium.connectOverCDP(endpoint);
  const page =
    browser.contexts()[0].pages()[0] ||
    (await browser.contexts()[0].waitForEvent("page"));
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.getByRole("button", { name: "Open Pip capture" }).click();
  await page
    .getByLabel("What’s on your mind?")
    .fill("Development mode capture · ő");
  await page.getByRole("button", { name: /Save capture/ }).click();
  await page.getByText("Saved on this device", { exact: true }).waitFor();
  assert.equal(
    (await page.evaluate(() => window.pip.snapshot())).value.total,
    1,
  );
  await page.getByLabel("What’s on your mind?").fill("Development draft");
  await page.getByText("Draft saved on this device", { exact: true }).waitFor();
  await page.reload();
  await page
    .getByText("Recovered draft · saved on this device", { exact: true })
    .waitFor();
  assert.equal(
    await page.getByLabel("What’s on your mind?").inputValue(),
    "Development draft",
  );
  assert.equal(
    await page.locator("li p").first().textContent(),
    "Development mode capture · ő",
  );
  assert.deepEqual(errors, []);
  await page.screenshot({ path: "test-results/development.png" });
  writeFileSync(
    "test-results/development.json",
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        command:
          "electron-vite dev; REMOTE_DEBUGGING_PORT=0 for test instrumentation only",
        capture: "passed",
        draftAfterRendererReload: "passed",
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: electron-vite development server, real SQLite capture, draft and inbox after renderer reload.",
  );
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await browser?.close();
    spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
      windowsHide: true,
      stdio: "ignore",
    });
  });
