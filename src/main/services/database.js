const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

function now() {
  return new Date().toISOString();
}

function createDatabase(userDataPath) {
  fs.mkdirSync(userDataPath, { recursive: true });
  const sqlite = new Database(path.join(userDataPath, 'telvault.sqlite'));
  sqlite.pragma('journal_mode = WAL');
  
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      folder_path TEXT NOT NULL,
      tg_channel_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_commit_at TEXT
    );

    CREATE TABLE IF NOT EXISTS versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      version_num INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      tg_message_id TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE(project_id, version_num)
    );

    CREATE TABLE IF NOT EXISTS file_states (
      project_id INTEGER NOT NULL,
      relative_path TEXT NOT NULL,
      last_archived_mtime REAL NOT NULL,
      last_archived_size INTEGER NOT NULL,
      PRIMARY KEY (project_id, relative_path),
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  return {
    getSetting(key) {
      return sqlite.prepare('SELECT value FROM settings WHERE key = ?').get(key)?.value || null;
    },
    setSetting(key, value) {
      sqlite
        .prepare('INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
        .run(key, value);
    },
    deleteSetting(key) {
      sqlite.prepare('DELETE FROM settings WHERE key = ?').run(key);
    },
    listProjects() {
      return sqlite.prepare('SELECT * FROM projects ORDER BY COALESCE(last_commit_at, created_at) DESC').all();
    },
    getProject(id) {
      return sqlite.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    },
    createProject({ name, folderPath, tgChannelId }) {
      const createdAt = now();
      const info = sqlite
        .prepare('INSERT INTO projects(name, folder_path, tg_channel_id, created_at) VALUES(?, ?, ?, ?)')
        .run(name, folderPath, tgChannelId, createdAt);
      return this.getProject(info.lastInsertRowid);
    },
    listVersions(projectId) {
      return sqlite
        .prepare('SELECT * FROM versions WHERE project_id = ? ORDER BY version_num DESC')
        .all(projectId);
    },
    getVersion(id) {
      return sqlite.prepare('SELECT * FROM versions WHERE id = ?').get(id);
    },
    nextVersionNumber(projectId) {
      const row = sqlite.prepare('SELECT COALESCE(MAX(version_num), 0) + 1 AS next FROM versions WHERE project_id = ?').get(projectId);
      return row.next;
    },
    createVersion({ projectId, versionNum, title, description, tgMessageId, fileSize }) {
      const createdAt = now();
      const trx = sqlite.transaction(() => {
        const info = sqlite
          .prepare(
            `INSERT INTO versions(project_id, version_num, title, description, tg_message_id, file_size, created_at)
             VALUES(?, ?, ?, ?, ?, ?, ?)`
          )
          .run(projectId, versionNum, title, description, tgMessageId, fileSize, createdAt);
        sqlite.prepare('UPDATE projects SET last_commit_at = ? WHERE id = ?').run(createdAt, projectId);
        return info.lastInsertRowid;
      });
      return this.getVersion(trx());
    },
    
    // --- New: File states tracking (Index) ---
    getFileStates(projectId) {
      const rows = sqlite.prepare('SELECT relative_path, last_archived_mtime, last_archived_size FROM file_states WHERE project_id = ?').all(projectId);
      const map = new Map();
      for (const r of rows) {
        map.set(r.relative_path, { mtime: r.last_archived_mtime, size: r.last_archived_size });
      }
      return map;
    },
    updateFileStates(projectId, fileUpdates) {
      const stmt = sqlite.prepare(`
        INSERT INTO file_states(project_id, relative_path, last_archived_mtime, last_archived_size)
        VALUES(?, ?, ?, ?)
        ON CONFLICT(project_id, relative_path) DO UPDATE SET
          last_archived_mtime = excluded.last_archived_mtime,
          last_archived_size = excluded.last_archived_size
      `);
      const trx = sqlite.transaction(() => {
        for (const update of fileUpdates) {
          stmt.run(projectId, update.relativePath, update.mtime, update.size);
        }
      });
      trx();
    }
  };
}

module.exports = { createDatabase };
