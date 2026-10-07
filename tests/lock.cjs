const Database = require("better-sqlite3");
const db = new Database(process.argv[2]);
db.exec("BEGIN IMMEDIATE");
console.log("LOCKED");
setInterval(() => {}, 1000);
