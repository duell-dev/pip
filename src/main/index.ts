import {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
  ipcMain,
  Menu,
  nativeImage,
  screen,
  session,
  Tray,
} from "electron";
import { Worker } from "node:worker_threads";
import { mkdirSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  validateDraft,
  validatePreferences,
  type Result,
  type ShellState,
  type Snapshot,
} from "../shared/contracts";

app.setName("Pip");
const override = process.env.PIP_DATA_DIR;
if (override && !isAbsolute(override))
  throw new Error("PIP_DATA_DIR must be an absolute path.");
const dataDirectory =
  override ||
  (app.isPackaged
    ? join(app.getPath("appData"), "Pip")
    : join(app.getAppPath(), ".local", "development"));
mkdirSync(dataDirectory, { recursive: true });
app.setPath("userData", dataDirectory);

let win: BrowserWindow;
let tray: Tray;
let worker: Worker;
let expanded = false,
  quitting = false,
  shortcutAvailable = false,
  activeShortcut = "",
  sequence = 0;
let storageError = "";
let notchPosition: { displayId: number; fraction: number } | undefined;
let dragging = false;
const pending = new Map<number, (result: Result<unknown>) => void>();
const devUrl = !app.isPackaged ? process.env.ELECTRON_RENDERER_URL : undefined;
const rendererFile = join(__dirname, "../renderer/index.html");
const rendererUrl = devUrl
  ? new URL(devUrl).href
  : pathToFileURL(rendererFile).href;

function database<T>(method: string, value?: unknown): Promise<Result<T>> {
  if (storageError) return Promise.resolve({ ok: false, error: storageError });
  return new Promise((resolve) => {
    const id = ++sequence;
    pending.set(id, resolve as (result: Result<unknown>) => void);
    worker.postMessage({ id, method, value });
  });
}
function storageFailed() {
  storageError =
    "Local storage is unavailable. Keep your input, then restart Pip. Nothing new has been confirmed saved.";
  for (const resolve of pending.values())
    resolve({ ok: false, error: storageError });
  pending.clear();
}
function shellState(): ShellState {
  return { expanded, shortcutAvailable, dataDirectory };
}
function position() {
  const display =
    screen
      .getAllDisplays()
      .find((display) => display.id === notchPosition?.displayId) ||
    screen.getDisplayNearestPoint(
      win
        ? {
            x: win.getBounds().x + win.getBounds().width / 2,
            y: win.getBounds().y,
          }
        : screen.getCursorScreenPoint(),
    );
  const area = display.workArea;
  const width = Math.min(expanded ? 600 : 240, area.width);
  const height = Math.min(expanded ? 740 : 64, area.height);
  win.setBounds({
    x: Math.round(
      Math.max(
        area.x,
        Math.min(
          area.x + area.width - width,
          area.x + area.width * (notchPosition?.fraction ?? 0.5) - width / 2,
        ),
      ),
    ),
    y: area.y,
    width,
    height,
  });
}
function open() {
  if (!win || win.isDestroyed()) return;
  expanded = true;
  position();
  win.show();
  win.focus();
  win.webContents.send("pip:action", "open");
}
function requestDismiss(action: "dismiss" | "quit") {
  if (!win || win.isDestroyed()) return;
  win.webContents.send("pip:action", action);
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => {
    if (win) open();
  });
  app.on("before-quit", (event) => {
    if (!quitting && win) {
      event.preventDefault();
      requestDismiss("quit");
    }
  });
  app.on("will-quit", () => {
    globalShortcut.unregisterAll();
    void worker?.terminate();
  });
  app
    .whenReady()
    .then(async () => {
      Menu.setApplicationMenu(null);
      worker = new Worker(join(__dirname, "worker.js"), {
        workerData: { filename: join(dataDirectory, "pip.db") },
      });
      worker.on("message", (reply) => {
        pending.get(reply.id)?.(reply);
        pending.delete(reply.id);
      });
      worker.on("error", storageFailed);
      worker.on("exit", () => {
        if (!quitting) storageFailed();
      });
      const initial = await database<Snapshot>("snapshot");
      const savedPosition = await database<typeof notchPosition>("position");
      if (savedPosition.ok) notchPosition = savedPosition.value;
      const shortcut = initial.ok
        ? initial.value.preferences.shortcut
        : "Control+Alt+Space";
      if (shortcut !== "Disabled") {
        shortcutAvailable = globalShortcut.register(shortcut, open);
        if (shortcutAvailable) activeShortcut = shortcut;
      } else shortcutAvailable = true;

      const icon = app.isPackaged
        ? nativeImage.createFromPath(join(process.resourcesPath, "icon.png"))
        : nativeImage
            .createFromPath(join(app.getAppPath(), "assets/pip/idle.png"))
            .crop({ x: 0, y: 0, width: 362, height: 362 });
      win = new BrowserWindow({
        width: 240,
        height: 64,
        show: false,
        frame: false,
        resizable: false,
        maximizable: false,
        alwaysOnTop: true,
        backgroundColor: "#fbf5ed",
        title: "Pip",
        icon,
        webPreferences: {
          preload: join(__dirname, "../preload/index.js"),
          sandbox: true,
          contextIsolation: true,
          nodeIntegration: false,
          webSecurity: true,
          spellcheck: false,
        },
      });
      position();
      // Native drag regions move the window; only a user move updates the saved anchor.
      win.on("will-move", () => {
        dragging = true;
      });
      win.on("moved", () => {
        if (!dragging) return;
        dragging = false;
        const bounds = win.getBounds();
        const display = screen.getDisplayMatching(bounds);
        notchPosition = {
          displayId: display.id,
          fraction: Math.max(
            0,
            Math.min(
              1,
              (bounds.x + bounds.width / 2 - display.workArea.x) /
                display.workArea.width,
            ),
          ),
        };
        position();
        void database("position", notchPosition).then((result) => {
          if (!result.ok)
            dialog.showMessageBox(win, {
              type: "warning",
              message:
                "Pip moved, but its position could not be saved. It may return to the previous position after restart.",
            });
        });
      });
      win.on("close", (event) => {
        if (!quitting) {
          event.preventDefault();
          requestDismiss("dismiss");
        }
      });
      win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
      win.webContents.on("will-navigate", (event) => event.preventDefault());
      win.webContents.on("will-attach-webview", (event) =>
        event.preventDefault(),
      );
      win.webContents.on("render-process-gone", () => {
        dialog
          .showMessageBox(win, {
            type: "error",
            title: "Pip needs to reopen",
            message:
              "The interface stopped. Saved captures and committed drafts are safe.",
            buttons: ["Reopen"],
          })
          .then(() => win.reload());
      });
      session.defaultSession.setPermissionRequestHandler(
        (_contents, _permission, callback) => callback(false),
      );
      session.defaultSession.setPermissionCheckHandler(() => false);
      const localPrefix = pathToFileURL(join(__dirname, "../renderer/")).href;
      session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
        const url = new URL(details.url);
        const devAllowed =
          devUrl &&
          (url.origin === new URL(devUrl).origin ||
            (url.protocol === "ws:" && url.host === new URL(devUrl).host));
        callback({
          cancel: !(
            devAllowed ||
            details.url.startsWith(localPrefix) ||
            url.protocol === "data:"
          ),
        });
      });

      function handle(channel: string, operation: (value: unknown) => unknown) {
        ipcMain.handle("pip:" + channel, async (event, value) => {
          if (
            event.sender !== win.webContents ||
            event.senderFrame !== win.webContents.mainFrame ||
            event.senderFrame.url !== rendererUrl
          )
            return { ok: false, error: "Untrusted request." };
          try {
            return await operation(value);
          } catch (error) {
            return {
              ok: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Could not complete this action.",
            };
          }
        });
      }
      handle("snapshot", async () => {
        const result = await database<Snapshot>("snapshot");
        return result.ok
          ? { ok: true, value: { ...result.value, ...shellState() } }
          : result;
      });
      handle("draft", (value) => database("draft", validateDraft(value)));
      handle("capture", (value) => database("capture", validateDraft(value)));
      handle("list", (value) => {
        if (!Number.isSafeInteger(value) || (value as number) < 1)
          throw new Error("Invalid page.");
        return database("list", value);
      });
      handle("expand", (value) => {
        if (typeof value !== "boolean") throw new Error("Invalid panel state.");
        expanded = value;
        position();
        if (expanded) {
          win.show();
          win.focus();
        }
        return { ok: true, value: shellState() };
      });
      handle("preferences", async (value) => {
        const p = validatePreferences(value);
        const changing = p.shortcut !== activeShortcut;
        if (
          changing &&
          p.shortcut !== "Disabled" &&
          !globalShortcut.register(p.shortcut, open)
        )
          throw new Error(
            "That shortcut is in use. Choose another; tray access still works.",
          );
        const result = await database("preferences", p);
        if (!result.ok) {
          if (changing && p.shortcut !== "Disabled")
            globalShortcut.unregister(p.shortcut);
          return result;
        }
        if (changing && activeShortcut)
          globalShortcut.unregister(activeShortcut);
        activeShortcut = p.shortcut === "Disabled" ? "" : p.shortcut;
        shortcutAvailable = true;
        return { ok: true, value: { ...p, shortcutAvailable } };
      });
      handle("quit", async () => {
        // FIFO worker barrier: preceding draft/capture writes finish before exit.
        const result = await database("snapshot");
        if (!result.ok) return result;
        quitting = true;
        setImmediate(() => app.quit());
        return { ok: true, value: undefined };
      });
      tray = new Tray(icon.resize({ width: 32, height: 32 }));
      tray.setToolTip("Pip — capture a thought");
      tray.setContextMenu(
        Menu.buildFromTemplate([
          { label: "Open Pip", click: open },
          { label: "Collapse Pip", click: () => requestDismiss("dismiss") },
          { type: "separator" },
          { label: "Quit Pip", click: () => requestDismiss("quit") },
        ]),
      );
      tray.on("click", open);
      screen.on("display-removed", position);
      screen.on("display-metrics-changed", position);
      await win.loadURL(rendererUrl);
      win.showInactive();
    })
    .catch(() => {
      dialog.showErrorBox(
        "Pip could not start",
        "Local storage or the window could not open. No captures were confirmed. Check the data directory permissions and restart Pip.",
      );
      quitting = true;
      app.quit();
    });
}
