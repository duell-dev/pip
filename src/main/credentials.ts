import { safeStorage } from "electron";

// Phase 0 gate only. No key entry, persistence or provider adapter exists yet.
export async function protectCredential(
  secret: string,
  storage = safeStorage,
): Promise<Buffer> {
  if (
    process.platform !== "win32" ||
    !(await storage.isAsyncEncryptionAvailable())
  )
    throw new Error(
      "Windows protected storage is unavailable. No credential was saved.",
    );
  return storage.encryptStringAsync(secret);
}
