const { spawnSync } = require("node:child_process");
const result = spawnSync(require("electron"), process.argv.slice(2), {
  stdio: "inherit",
  windowsHide: true,
  env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
});
process.exit(result.status ?? 1);
