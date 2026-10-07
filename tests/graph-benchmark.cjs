// Phase 0 physical-storage experiment, deliberately separate from the application schema.
const assert = require("node:assert/strict");
const Database = require("better-sqlite3");
const { mkdirSync, mkdtempSync, writeFileSync, statSync } = require("node:fs");
const { resolve, join } = require("node:path");
mkdirSync("test-results", { recursive: true });
const folder = mkdtempSync(resolve("test-results/graph "));
function measure(operation) {
  const start = performance.now();
  operation();
  return performance.now() - start;
}
const results = [];
for (const [nodeCount, edgeCount] of [
  [25000, 75000],
  [50000, 150000],
]) {
  const filename = join(folder, `${nodeCount}.db`),
    db = new Database(filename);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = FULL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE captures(id INTEGER PRIMARY KEY, text TEXT NOT NULL);
    CREATE TABLE nodes(id INTEGER PRIMARY KEY, kind TEXT NOT NULL, status TEXT NOT NULL, capture_id INTEGER REFERENCES captures(id) ON DELETE CASCADE);
    CREATE INDEX nodes_capture ON nodes(capture_id);
    CREATE TABLE assertions(id INTEGER PRIMARY KEY, source INTEGER REFERENCES nodes(id) ON DELETE CASCADE, target INTEGER REFERENCES nodes(id) ON DELETE CASCADE, relation TEXT, capture_id INTEGER REFERENCES captures(id) ON DELETE CASCADE, revision INTEGER, evidence TEXT);
    CREATE INDEX assertions_capture ON assertions(capture_id);
    CREATE INDEX assertions_source ON assertions(source);
    CREATE INDEX assertions_target ON assertions(target);
    CREATE TABLE edges(source INTEGER REFERENCES nodes(id) ON DELETE CASCADE, target INTEGER REFERENCES nodes(id) ON DELETE CASCADE, relation TEXT, PRIMARY KEY(source,target,relation)) WITHOUT ROWID;
    CREATE INDEX edges_out ON edges(source,relation,target);
    CREATE INDEX edges_in ON edges(target,relation,source);
    CREATE VIRTUAL TABLE search USING fts5(text);
  `);
  const insertCapture = db.prepare("INSERT INTO captures VALUES (?,?)");
  const insertNode = db.prepare("INSERT INTO nodes VALUES (?,?,?,?)");
  const insertAssertion = db.prepare(
    "INSERT INTO assertions VALUES (?,?,?,?,?,1,?)",
  );
  const insertEdge = db.prepare("INSERT INTO edges VALUES (?,?,?)");
  const insertSearch = db.prepare(
    "INSERT INTO search(rowid,text) VALUES (?,?)",
  );
  const itemCount = nodeCount - 11000;
  const ingestionMs = measure(() =>
    db.transaction(() => {
      for (let i = 1; i <= 10000; i++) {
        const text =
          `Synthetic capture ${i}: dentist project ${i % 200}, notes and resources for a personal commitment. ` +
          "Reference context. ".repeat(12);
        insertCapture.run(i, text);
        insertSearch.run(i, text);
        insertNode.run(i, "capture", "open", i);
      }
      for (let i = 10001; i <= 11000; i++)
        insertNode.run(
          i,
          i <= 10200
            ? "project"
            : i <= 10203
              ? "area"
              : i <= 10500
                ? "person"
                : "topic",
          "open",
          null,
        );
      for (let i = 0; i < itemCount; i++)
        insertNode.run(
          11001 + i,
          ["task", "note", "resource", "idea"][i % 4],
          i % 7 ? "open" : "done",
          (i % 10000) + 1,
        );
      for (let i = 0; i < edgeCount; i++) {
        const item = i % itemCount,
          round = Math.floor(i / itemCount),
          source = 11001 + item;
        let target, relation;
        if (round === 0) {
          target = (item % 10000) + 1;
          relation = "derived_from";
        } else if (round === 1) {
          target = (item % 200) + 10001;
          relation = "belongs_to";
        } else if (round === 2) {
          target = (item % 3) + 10201;
          relation = "belongs_to";
        } else if (round === 3 && item % 4 === 0 && item >= 4) {
          target = source - 4;
          relation = "depends_on";
        } else if (round === 3 && item % 4 === 2) {
          target = (item % 200) + 10001;
          relation = "supports";
        } else {
          target = ((item + round * 31) % 500) + 10501;
          relation = "mentions";
        }
        insertAssertion.run(
          i + 1,
          source,
          target,
          relation,
          (item % 10000) + 1,
          "Synthetic benchmark evidence",
        );
        insertEdge.run(source, target, relation);
      }
    })(),
  );
  const queries = {
    projectMembership: [
      "SELECT n.id,n.kind FROM edges e JOIN nodes n ON n.id=e.source WHERE e.target=? AND e.relation='belongs_to' LIMIT 100",
      10003,
    ],
    oneHop: [
      "SELECT target AS id FROM edges WHERE source=? UNION SELECT source FROM edges WHERE target=? LIMIT 100",
      11005,
      11005,
    ],
    twoHop: [
      `WITH first AS (SELECT target AS id FROM edges WHERE source=? UNION SELECT source FROM edges WHERE target=? LIMIT 100)
      SELECT e.target AS id FROM first f JOIN edges e ON e.source=f.id UNION SELECT e.source FROM first f JOIN edges e ON e.target=f.id LIMIT 100`,
      11005,
      11005,
    ],
    supportingSources: [
      "SELECT a.capture_id,a.revision,a.evidence,c.text FROM assertions a JOIN captures c ON c.id=a.capture_id WHERE a.target=? AND a.relation='supports' LIMIT 100",
      10003,
    ],
    unresolvedPrerequisites: [
      "SELECT n.id,n.status FROM edges e JOIN nodes n ON n.id=e.target WHERE e.source=? AND e.relation='depends_on' AND n.status!='done' LIMIT 100",
      11009,
    ],
    resourcesByProject: [
      "SELECT n.id FROM edges e JOIN nodes n ON n.id=e.source WHERE e.target=? AND e.relation='belongs_to' AND n.kind='resource' LIMIT 100",
      10003,
    ],
    fts: ["SELECT rowid FROM search WHERE search MATCH ? LIMIT 50", "dentist"],
  };
  const queryResults = {};
  for (const [name, [sql, ...params]] of Object.entries(queries)) {
    const statement = db.prepare(sql),
      samples = [];
    let rows;
    for (let run = 0; run < 100; run++)
      samples.push(
        measure(() => {
          rows = statement.all(...params);
        }),
      );
    assert(rows.length > 0 && rows.length <= 100, name);
    queryResults[name] = {
      rows: rows.length,
      p95Ms: samples.sort((a, b) => a - b)[94],
    };
  }
  const rebuildMs = measure(() =>
    db.transaction(() => {
      db.exec(
        "DELETE FROM edges; INSERT INTO edges SELECT source,target,relation FROM assertions GROUP BY source,target,relation",
      );
    })(),
  );
  assert.equal(
    db.prepare("SELECT count(*) AS n FROM edges").get().n,
    edgeCount,
  );
  const delete100CapturesMs = measure(() =>
    db.transaction(() => {
      db.exec(
        "DELETE FROM captures WHERE id<=100; DELETE FROM search WHERE rowid<=100",
      );
    })(),
  );
  assert.equal(db.pragma("foreign_key_check").length, 0);
  assert.equal(db.pragma("integrity_check", { simple: true }), "ok");
  db.pragma("wal_checkpoint(TRUNCATE)");
  results.push({
    captures: 10000,
    nodeCount,
    edgeCount,
    ingestionMs,
    rebuildMs,
    delete100CapturesMs,
    databaseBytes: statSync(filename).size,
    queries: queryResults,
  });
  db.close();
}
const report = {
  checkedAt: new Date().toISOString(),
  corpus:
    "Deterministic synthetic captures and typed edges; bounded views; warm query samples; no model calls",
  results,
};
writeFileSync("test-results/graph.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
