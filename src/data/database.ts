import Database from "better-sqlite3";
import { createHash, randomUUID } from "node:crypto";
import {
  validateDraft,
  validatePreferences,
  type Capture,
  type Draft,
  type Preferences,
  type Snapshot,
} from "../shared/contracts";

export function openDatabase(filename: string) {
  const db = new Database(filename, { timeout: 1500 });
  try {
    db.pragma("foreign_keys = ON");
    const version = db.pragma("user_version", { simple: true }) as number;
    if (version > 2)
      throw new Error("This database requires a newer Pip version.");
    db.pragma("journal_mode = WAL");
    db.pragma("synchronous = FULL");
    if (version === 0)
      db.transaction(() => {
        db.exec(`
        CREATE TABLE captures (
          seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL UNIQUE,
          current_revision INTEGER NOT NULL DEFAULT 1 CHECK(current_revision > 0),
          captured_at TEXT NOT NULL, timezone TEXT NOT NULL
        ) STRICT;
        CREATE TABLE capture_revisions (
          capture_id TEXT NOT NULL REFERENCES captures(id) ON DELETE CASCADE,
          revision INTEGER NOT NULL CHECK(revision > 0), text TEXT NOT NULL,
          content_hash TEXT NOT NULL, created_at TEXT NOT NULL,
          PRIMARY KEY(capture_id, revision)
        ) STRICT;
        CREATE TABLE draft (
          singleton INTEGER PRIMARY KEY CHECK(singleton = 1), id TEXT NOT NULL,
          text TEXT NOT NULL, version INTEGER NOT NULL, timezone TEXT NOT NULL
        ) STRICT;
        CREATE TABLE preferences (
          singleton INTEGER PRIMARY KEY CHECK(singleton = 1), shortcut TEXT NOT NULL, quiet INTEGER NOT NULL
        ) STRICT;
        INSERT INTO preferences VALUES (1, 'Control+Alt+Space', 0);
        PRAGMA user_version = 1;
      `);
        const d = freshDraft();
        db.prepare(
          "INSERT INTO draft VALUES (1, @id, @text, @version, @timezone)",
        ).run(d);
      })();
    if (version < 2)
      db.transaction(() => {
        db.exec(`CREATE TABLE notch_position (
        singleton INTEGER PRIMARY KEY CHECK(singleton=1),
        display_id INTEGER NOT NULL, fraction REAL NOT NULL CHECK(fraction BETWEEN 0 AND 1)
      ) STRICT; PRAGMA user_version=2;`);
      })();
  } catch (error) {
    db.close();
    throw error;
  }

  function freshDraft(): Draft {
    return {
      id: randomUUID(),
      text: "",
      version: 0,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }
  const readDraft = () =>
    db
      .prepare(
        "SELECT id, text, version, timezone FROM draft WHERE singleton = 1",
      )
      .get() as Draft;
  const putDraft = db.prepare(
    "UPDATE draft SET id=@id, text=@text, version=@version, timezone=@timezone WHERE singleton=1",
  );
  const selectCapture = `SELECT c.id, c.seq, r.text, c.captured_at AS capturedAt, c.timezone, c.current_revision AS revision
    FROM captures c JOIN capture_revisions r ON r.capture_id=c.id AND r.revision=c.current_revision`;
  const find = (id: string) =>
    db.prepare(selectCapture + " WHERE c.id=?").get(id) as Capture | undefined;
  function list(before = Number.MAX_SAFE_INTEGER): Capture[] {
    if (!Number.isSafeInteger(before) || before < 1)
      throw new Error("Invalid page.");
    return db
      .prepare(selectCapture + " WHERE c.seq < ? ORDER BY c.seq DESC LIMIT 50")
      .all(before) as Capture[];
  }
  function preferences(): Preferences {
    const p = db
      .prepare("SELECT shortcut, quiet FROM preferences WHERE singleton=1")
      .get() as Preferences;
    return { ...p, quiet: Boolean(p.quiet) };
  }
  const saveDraft = db.transaction((input: unknown) => {
    const next = validateDraft(input),
      current = readDraft();
    // Delayed autosaves from an acknowledged capture must never resurrect it.
    if (next.id !== current.id) {
      if (find(next.id)) return current;
      throw new Error(
        "This draft changed. Keep your input and restart Pip to recover it.",
      );
    }
    if (next.version < current.version) return current;
    if (next.version === current.version && next.text !== current.text)
      throw new Error("Conflicting draft revision.");
    putDraft.run(next);
    return next;
  });
  const capture = db.transaction((input: unknown) => {
    const d = validateDraft(input);
    if (!d.text.trim()) throw new Error("Write something before saving.");
    const existing = find(d.id);
    if (existing) {
      if (existing.text !== d.text || existing.timezone !== d.timezone)
        throw new Error("Capture ID conflict. Your input is still here.");
      return { capture: existing, draft: readDraft() };
    }
    const current = readDraft();
    if (d.id !== current.id || d.version < current.version)
      throw new Error("A newer draft exists. Your input is still here.");
    if (d.version === current.version && d.text !== current.text)
      throw new Error("Conflicting draft revision.");
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO captures (id,captured_at,timezone) VALUES (?,?,?)",
    ).run(d.id, now, d.timezone);
    db.prepare("INSERT INTO capture_revisions VALUES (?,1,?,?,?)").run(
      d.id,
      d.text,
      createHash("sha256").update(d.text).digest("hex"),
      now,
    );
    const next = freshDraft();
    putDraft.run(next);
    return { capture: find(d.id)!, draft: next };
  });
  return {
    db,
    readDraft,
    saveDraft,
    capture,
    list,
    snapshot(): Snapshot {
      return {
        draft: readDraft(),
        captures: list(),
        total: (
          db.prepare("SELECT count(*) AS n FROM captures").get() as {
            n: number;
          }
        ).n,
        preferences: preferences(),
      };
    },
    setPreferences(input: unknown) {
      const p = validatePreferences(input);
      db.prepare(
        "UPDATE preferences SET shortcut=?, quiet=? WHERE singleton=1",
      ).run(p.shortcut, Number(p.quiet));
      return p;
    },
    position(value?: { displayId: number; fraction: number }) {
      if (value !== undefined) {
        if (
          !Number.isSafeInteger(value.displayId) ||
          !Number.isFinite(value.fraction) ||
          value.fraction < 0 ||
          value.fraction > 1
        )
          throw new Error("Invalid notch position.");
        db.prepare(
          "INSERT INTO notch_position VALUES (1,?,?) ON CONFLICT(singleton) DO UPDATE SET display_id=excluded.display_id, fraction=excluded.fraction",
        ).run(value.displayId, value.fraction);
      }
      return db
        .prepare(
          "SELECT display_id AS displayId, fraction FROM notch_position WHERE singleton=1",
        )
        .get() as { displayId: number; fraction: number } | undefined;
    },
    close() {
      db.close();
    },
  };
}
