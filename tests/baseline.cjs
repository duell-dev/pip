const { _electron: electron } = require("playwright");
const { mkdirSync, mkdtempSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { spawnSync } = require("node:child_process");
const { setTimeout: delay } = require("node:timers/promises");
const os = require("node:os");
(async () => {
  mkdirSync("test-results", { recursive: true });
  const env = {
    ...process.env,
    PIP_DATA_DIR: mkdtempSync(resolve("test-results/baseline ")),
  };
  delete env.ELECTRON_RUN_AS_NODE;
  const app = await electron.launch({
    executablePath: resolve("dist/win-unpacked/Pip.exe"),
    args: [],
    env,
    timeout: 30000,
  });
  const pid = app.process().pid;
  try {
    const page = await app.firstWindow();
    await page.getByRole("button", { name: "Open Pip capture" }).waitFor();
    await app.context().setOffline(true);
    await delay(5000);
    await app.evaluate(({ app }) => app.getAppMetrics());
    const samples = [];
    for (let i = 0; i < 20; i++) {
      await delay(30000);
      const metrics = await app.evaluate(({ app }) => app.getAppMetrics());
      samples.push({
        cpu: metrics.reduce((n, p) => n + p.cpu.percentCPUUsage, 0),
        workingSetMB:
          metrics.reduce((n, p) => n + p.memory.workingSetSize, 0) / 1024,
      });
      if (i % 2)
        console.log(`Idle baseline: ${(i + 1) / 2}/10 minutes measured.`);
    }
    const report = {
      checkedAt: new Date().toISOString(),
      osRelease: os.release(),
      cpu: os.cpus()[0].model,
      logicalCPUs: os.cpus().length,
      ramGB: os.totalmem() / 1024 ** 3,
      measuredSeconds: 600,
      averageElectronCPUPercent:
        samples.reduce((n, s) => n + s.cpu, 0) / samples.length,
      maxWorkingSetMB: Math.max(...samples.map((s) => s.workingSetMB)),
      samples,
      note: "Unsigned packaged app, empty isolated profile, collapsed still Pip, Playwright attached, sum of Electron process CPU/working sets (shared pages may be counted more than once).",
    };
    writeFileSync(
      "test-results/baseline.json",
      JSON.stringify(report, null, 2),
    );
    console.log(JSON.stringify(report, null, 2));
  } finally {
    spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], {
      windowsHide: true,
      stdio: "ignore",
    });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
