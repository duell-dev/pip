import { contextBridge, ipcRenderer } from "electron";
import type { PipApi } from "../shared/contracts";

const api: PipApi = {
  snapshot: () => ipcRenderer.invoke("pip:snapshot"),
  draft: (value) => ipcRenderer.invoke("pip:draft", value),
  capture: (value) => ipcRenderer.invoke("pip:capture", value),
  list: (value) => ipcRenderer.invoke("pip:list", value),
  expand: (value) => ipcRenderer.invoke("pip:expand", value),
  preferences: (value) => ipcRenderer.invoke("pip:preferences", value),
  quit: () => ipcRenderer.invoke("pip:quit"),
  onAction: (listener) => {
    const callback = (
      _event: Electron.IpcRendererEvent,
      action: "open" | "dismiss" | "quit",
    ) => listener(action);
    ipcRenderer.on("pip:action", callback);
    return () => ipcRenderer.removeListener("pip:action", callback);
  },
};
contextBridge.exposeInMainWorld("pip", api);
