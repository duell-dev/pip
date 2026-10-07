const { app, nativeImage } = require("electron");
const { mkdirSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");
app.whenReady().then(() => {
  mkdirSync("build", { recursive: true });
  const icon = nativeImage
    .createFromPath(resolve("pip-project-kit/assets/animation/idle.png"))
    .crop({ x: 0, y: 0, width: 362, height: 362 })
    .resize({ width: 256, height: 256 });
  writeFileSync("build/icon.png", icon.toPNG());
  app.quit();
});
