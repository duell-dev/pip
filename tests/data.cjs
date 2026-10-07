const assert = require("node:assert/strict");
const { mkdirSync, mkdtempSync, writeFileSync } = require("node:fs");
const { resolve, join } = require("node:path");
const { fork } = require("node:child_process");
const { once } = require("node:events");
const { createHash } = require("node:crypto");
const { openDatabase } = require("../out/main/database.js");

if (process.argv[2] === "--child") {
  const store = openDatabase(process.argv[3]);
  const d = {
    ...store.readDraft(),
    text: "crash draft ő 🚀\r\nhttps://example.com",
    version: 1,
  };
  store.saveDraft(d);
  if (process.argv[4] === "before-commit") {
    store.db.exec("BEGIN IMMEDIATE");
    store.db
      .prepare("INSERT INTO captures (id,captured_at,timezone) VALUES (?,?,?)")
      .run(d.id, new Date().toISOString(), d.timezone);
    process.send({ id: d.id });
  } else if (process.argv[4] === "after-commit") {
    process.send(store.capture(d));
  } else process.send(d);
  setInterval(() => {}, 1000);
} else {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

async function main() {
  mkdirSync("test-results", { recursive: true });
  const folder = mkdtempSync(resolve("test-results/data ő "));
  const filename = join(folder, "pip.db");
  let store = openDatabase(filename);
  assert.equal(store.db.pragma("user_version", { simple: true }), 2);
  assert.equal(store.db.pragma("journal_mode", { simple: true }), "wal");
  assert.equal(store.db.pragma("synchronous", { simple: true }), 2);
  assert.equal(store.db.pragma("foreign_keys", { simple: true }), 1);
  const source =
    "  ő 🐤\r\nhttps://example.com/?a=1&b=2\n<script>ignored</script>  ";
  const d = { ...store.readDraft(), text: source, version: 1 };
  store.saveDraft(d);
  const first = store.capture(d);
  assert.equal(first.capture.text, source);
  assert.equal(
    store.db
      .prepare(
        "SELECT content_hash FROM capture_revisions WHERE capture_id=? AND revision=1",
      )
      .get(first.capture.id).content_hash,
    createHash("sha256").update(source).digest("hex"),
  );
  assert.equal(
    store.capture(d).capture.id,
    first.capture.id,
    "retry is idempotent",
  );
  assert.equal(store.snapshot().total, 1);
  assert.equal(
    store.saveDraft(d).id,
    first.draft.id,
    "late autosave cannot resurrect captured draft",
  );
  assert.throws(() => store.capture({ ...d, text: "changed" }), /conflict/i);
  assert.throws(() =>
    store.capture({ ...first.draft, text: "   ", version: 1 }),
  );
  assert.throws(() => store.saveDraft({ ...first.draft, extra: true }));
  assert.throws(() =>
    store.saveDraft({ ...first.draft, timezone: "not-a-zone" }),
  );
  assert.throws(() =>
    store.saveDraft({ ...first.draft, text: "x".repeat(1_000_001) }),
  );
  assert.throws(() => store.saveDraft({ ...first.draft, version: NaN }));
  assert.throws(() => store.saveDraft({ ...first.draft, id: "../../file" }));
  const latest = { ...first.draft, text: "latest", version: 2 };
  store.saveDraft(latest);
  assert.equal(
    store.saveDraft({ ...latest, text: "stale", version: 1 }).text,
    "latest",
  );
  assert.throws(() => store.capture({ ...latest, version: 1 }));

  // Real SQLite lock contention. Input remains in the last committed draft.
  const blocker = openDatabase(filename);
  blocker.db.exec("BEGIN IMMEDIATE");
  assert.throws(() => store.capture(latest), { code: "SQLITE_BUSY" });
  blocker.db.exec("ROLLBACK");
  blocker.close();
  assert.equal(store.readDraft().text, "latest");
  assert.equal(store.snapshot().total, 1);

  // Failure after inserting the capture must roll back capture, revision and draft together.
  store.db.exec(
    "CREATE TRIGGER reject_revision BEFORE INSERT ON capture_revisions BEGIN SELECT RAISE(ABORT, 'controlled failure'); END;",
  );
  assert.throws(() => store.capture(latest));
  assert.equal(store.snapshot().total, 1);
  assert.equal(store.readDraft().id, latest.id);
  store.db.exec("DROP TRIGGER reject_revision");
  store.capture(latest);

  const timings = [];
  for (let i = 0; i < 100; i++) {
    const next = {
      ...store.readDraft(),
      text: `Synthetic capture ${i}\n` + "a".repeat(20_000),
      version: 1,
    };
    const start = performance.now();
    store.capture(next);
    timings.push(performance.now() - start);
  }
  const migrationDraft = {
    ...store.readDraft(),
    text: "Keep this draft through a v1 upgrade",
    version: 1,
  };
  store.saveDraft(migrationDraft);
  store.db.exec("DROP TABLE notch_position; PRAGMA user_version=1");
  store.close();
  store = openDatabase(filename);
  assert.equal(store.db.pragma("user_version", { simple: true }), 2);
  assert.deepEqual(store.readDraft(), migrationDraft);
  assert.equal(store.position(), undefined);
  const placement = { displayId: 12, fraction: 0.2 };
  store.position(placement);
  assert.throws(() => store.position({ displayId: 12, fraction: NaN }));
  assert.throws(() => store.position({ displayId: 12, fraction: 1.5 }));
  store.close();
  store = openDatabase(filename);
  assert.deepEqual(store.position(), placement);
  assert.equal(store.snapshot().total, 102);
  const page1 = store.list(),
    page2 = store.list(page1.at(-1).seq),
    page3 = store.list(page2.at(-1).seq);
  assert.equal(
    new Set([...page1, ...page2, ...page3].map((c) => c.id)).size,
    102,
  );
  assert.equal(store.db.pragma("integrity_check", { simple: true }), "ok");
  store.close();

  const crashes = {};
  for (const point of ["before-commit", "after-commit", "draft-only"]) {
    const file = join(folder, point + ".db");
    const child = fork(__filename, ["--child", file, point], {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
      windowsHide: true,
      stdio: ["ignore", "ignore", "pipe", "ipc"],
    });
    const timeout = setTimeout(() => child.kill(), 15000);
    const [message] = await once(child, "message");
    const exited = once(child, "exit");
    child.kill("SIGKILL");
    await exited;
    clearTimeout(timeout);
    const reopened = openDatabase(file);
    assert.equal(reopened.db.pragma("integrity_check", { simple: true }), "ok");
    assert.equal(reopened.snapshot().total, point === "after-commit" ? 1 : 0);
    if (point === "after-commit")
      assert.equal(reopened.list()[0].id, message.capture.id);
    else assert.match(reopened.readDraft().text, /crash draft/);
    reopened.close();
    crashes[point] = "passed";
  }

  // A bounded database produces SQLite's real SQLITE_FULL result without filling the host disk.
  const full = openDatabase(join(folder, "full.db"));
  const fullDraft = {
    ...full.readDraft(),
    text: "recoverable input",
    version: 1,
  };
  full.saveDraft(fullDraft);
  full.db.pragma(
    `max_page_count = ${full.db.pragma("page_count", { simple: true })}`,
  );
  assert.throws(
    () => full.capture({ ...fullDraft, text: "x".repeat(500_000), version: 2 }),
    { code: "SQLITE_FULL" },
  );
  assert.equal(full.snapshot().total, 0);
  assert.equal(full.readDraft().text, fullDraft.text);
  full.close();
  const futureFile = join(folder, "future.db");
  const future = openDatabase(futureFile);
  future.db.pragma("user_version = 3");
  future.close();
  assert.throws(() => openDatabase(futureFile), /newer Pip/);
  const { protectCredential } = require("../out/main/credentials.js");
  let encryptCalled = false;
  await assert.rejects(
    protectCredential("synthetic", {
      isAsyncEncryptionAvailable: async () => false,
      encryptStringAsync: async () => {
        encryptCalled = true;
      },
    }),
    /unavailable/,
  );
  assert.equal(encryptCalled, false, "no plaintext or encryption fallback");

  const report = {
    checkedAt: new Date().toISOString(),
    node: process.versions.node,
    electron: process.versions.electron,
    sqlite: require("better-sqlite3")(":memory:")
      .prepare("SELECT sqlite_version() AS version")
      .get().version,
    capturesAfterRestart: 102,
    migration: "v1 to v2 preserves 102 captures and the committed draft",
    notchPosition: "range validation and persistence after reopen passed",
    p95Save20KBMs: timings.sort((a, b) => a - b)[94],
    crashes,
    sqliteBusy: "real lock",
    sqliteFull: "real error via simulated capacity ceiling",
    rollback: "controlled trigger failure",
    credentialUnavailable: "simulated; fail closed",
  };
  writeFileSync("test-results/data.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.log(
    "PASS: exact source, drafts, idempotency, rollback, lock/full, crash/restart, paging, migration refusal, credential failure.",
  );
}
