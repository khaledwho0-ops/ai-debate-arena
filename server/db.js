// ============================================================
// AI DEBATE ARENA — Database Setup (sql.js — pure JS SQLite)
// ============================================================
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'debates.db');
const dataDir = path.join(__dirname, '..', 'data');

let db = null;

async function initDB() {
  if (db) return db;

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const SQL = await initSqlJs();

  // Load existing DB or create new
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Schema
  db.run(`
    CREATE TABLE IF NOT EXISTS debates (
      id TEXT PRIMARY KEY,
      topic TEXT NOT NULL,
      language TEXT DEFAULT 'en',
      status TEXT DEFAULT 'pending',
      total_rounds INTEGER DEFAULT 5,
      current_round INTEGER DEFAULT 0,
      winner TEXT,
      pro_total_score INTEGER DEFAULT 0,
      con_total_score INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS rounds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      debate_id TEXT NOT NULL,
      round_number INTEGER NOT NULL,
      pro_argument TEXT,
      con_argument TEXT,
      pro_score_logic INTEGER DEFAULT 0,
      pro_score_evidence INTEGER DEFAULT 0,
      pro_score_rhetoric INTEGER DEFAULT 0,
      con_score_logic INTEGER DEFAULT 0,
      con_score_evidence INTEGER DEFAULT 0,
      con_score_rhetoric INTEGER DEFAULT 0,
      pro_fallacies TEXT DEFAULT '[]',
      con_fallacies TEXT DEFAULT '[]',
      pro_total INTEGER DEFAULT 0,
      con_total INTEGER DEFAULT 0,
      audience_pro_votes INTEGER DEFAULT 0,
      audience_con_votes INTEGER DEFAULT 0,
      scoring_explanation TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(debate_id) REFERENCES debates(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS debate_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      debate_id TEXT NOT NULL,
      summary TEXT,
      key_moments TEXT,
      final_scores TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(debate_id) REFERENCES debates(id)
    )
  `);

  saveDB();
  console.log('✅ Database initialized');
  return db;
}

function saveDB() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function getDB() {
  if (!db) throw new Error('Database not initialized. Call initDB() first.');
  return db;
}

// Helper functions that mimic better-sqlite3 API
function run(sql, params = []) {
  const d = getDB();
  d.run(sql, params);
  saveDB();
}

function get(sql, params = []) {
  const d = getDB();
  const stmt = d.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function all(sql, params = []) {
  const d = getDB();
  const results = [];
  const stmt = d.prepare(sql);
  stmt.bind(params);
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

module.exports = { initDB, getDB, saveDB, run, get, all };
