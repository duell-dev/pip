export const MAX_TEXT_BYTES = 1_000_000;
export const SHORTCUTS = [
  "Control+Alt+Space",
  "Control+Shift+Space",
  "Control+Alt+P",
  "Disabled",
] as const;
export type Shortcut = (typeof SHORTCUTS)[number];
export type Draft = {
  id: string;
  text: string;
  version: number;
  timezone: string;
};
export type Capture = {
  id: string;
  seq: number;
  text: string;
  capturedAt: string;
  timezone: string;
  revision: number;
};
export type Preferences = { shortcut: Shortcut; quiet: boolean };
export type Snapshot = {
  draft: Draft;
  captures: Capture[];
  total: number;
  preferences: Preferences;
};
export type ShellState = {
  expanded: boolean;
  shortcutAvailable: boolean;
  dataDirectory: string;
};
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
export type PipApi = {
  snapshot: () => Promise<Result<Snapshot & ShellState>>;
  draft: (draft: Draft) => Promise<Result<Draft>>;
  capture: (
    draft: Draft,
  ) => Promise<Result<{ capture: Capture; draft: Draft }>>;
  list: (before: number) => Promise<Result<Capture[]>>;
  expand: (expanded: boolean) => Promise<Result<ShellState>>;
  preferences: (
    preferences: Preferences,
  ) => Promise<Result<Preferences & { shortcutAvailable: boolean }>>;
  quit: () => Promise<Result<void>>;
  onAction: (
    listener: (action: "open" | "dismiss" | "quit") => void,
  ) => () => void;
};

function object(value: unknown, keys: string[]): Record<string, unknown> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).sort().join() !== keys.sort().join()
  )
    throw new Error("Invalid request.");
  return value as Record<string, unknown>;
}
export function validateDraft(value: unknown): Draft {
  const d = object(value, ["id", "text", "version", "timezone"]);
  if (
    typeof d.id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      d.id,
    ) ||
    typeof d.text !== "string" ||
    new TextEncoder().encode(d.text).length > MAX_TEXT_BYTES ||
    !Number.isSafeInteger(d.version) ||
    (d.version as number) < 0 ||
    typeof d.timezone !== "string" ||
    d.timezone.length > 100
  )
    throw new Error(
      "Invalid draft or text exceeds 1 MB. Your input is still here.",
    );
  try {
    new Intl.DateTimeFormat("en", { timeZone: d.timezone });
  } catch {
    throw new Error("Invalid timezone.");
  }
  return d as Draft;
}
export function validatePreferences(value: unknown): Preferences {
  const p = object(value, ["shortcut", "quiet"]);
  if (
    !SHORTCUTS.includes(p.shortcut as Shortcut) ||
    typeof p.quiet !== "boolean"
  )
    throw new Error("Invalid preferences.");
  return p as Preferences;
}
