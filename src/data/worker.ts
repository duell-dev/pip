import { parentPort, workerData } from "node:worker_threads";
import { openDatabase } from "./database";

const store = openDatabase(workerData.filename);
parentPort!.on("message", ({ id, method, value }) => {
  try {
    let result: unknown;
    switch (method) {
      case "snapshot":
        result = store.snapshot();
        break;
      case "draft":
        result = store.saveDraft(value);
        break;
      case "capture":
        result = store.capture(value);
        break;
      case "list":
        result = store.list(value);
        break;
      case "preferences":
        result = store.setPreferences(value);
        break;
      case "position":
        result = store.position(value);
        break;
      default:
        throw new Error("Invalid database operation.");
    }
    parentPort!.postMessage({ id, ok: true, value: result });
  } catch (error) {
    const code = (error as { code?: string }).code;
    const message = code?.startsWith("SQLITE_")
      ? `Local storage could not save (${code}). Your input is still here. Check free space and retry.`
      : error instanceof Error
        ? error.message
        : "Local storage is unavailable. Your input is still here.";
    parentPort!.postMessage({ id, ok: false, error: message });
  }
});
