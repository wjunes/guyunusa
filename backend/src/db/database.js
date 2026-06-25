/**
 * database.js — Base de datos con fallback automático
 * better-sqlite3 (nativo) → sql.js (pure JS, sin compilación)
 */
import { readFileSync, writeFileSync,
         existsSync, mkdirSync }  from 'fs';
import { fileURLToPath }          from 'url';
import { dirname, join }          from 'path';
import { logger }                 from '../utils/logger.js';

const __dir = dirname(fileURLToPath(import.meta.url));

let _db        = null;
let _adapter   = null;
let _saveTimer = null;
let _rawSqlJs  = null;
let _dbPath    = null;

/* ─── Persistencia sql.js ─── */
function saveToDisc() {
  if (!_rawSqlJs || !_dbPath) return;
  try {
    writeFileSync(_dbPath, Buffer.from(_rawSqlJs.export()));
  } catch (err) {
    logger.error('Error al guardar DB en disco:', err.message);
  }
}

/* ─── Normalizar parámetros para sql.js ─────────────────────────────
   better-sqlite3: stmt.run(a, b, c)  o  stmt.run([a, b, c])
   sql.js:         stmt.bind([a, b, c])
   ──────────────────────────────────────────────────────────────────── */
function flatParams(args) {
  if (args.length === 0) return [];
  // Si el único argumento ya es un array, usarlo directamente
  if (args.length === 1 && Array.isArray(args[0])) return args[0];
  return args;
}

/* ─── Wrapper sql.js → API de better-sqlite3 ─── */
function wrapSqlJs(raw) {

  function prepare(sql) {
    return {
      /* Ejecuta sin retorno de filas (INSERT, UPDATE, DELETE) */
      run(...args) {
        const params = flatParams(args);
        try {
          raw.run(sql, params);
        } catch (e) {
          logger.error(`DB run error: ${e.message}\nSQL: ${sql}\nParams: ${JSON.stringify(params)}`);
          throw e;
        }
        saveToDisc();
        // Obtener lastInsertRowid y changes
        const r = raw.exec('SELECT last_insert_rowid() AS id, changes() AS ch');
        const vals = r[0]?.values[0] ?? [0, 0];
        return { lastInsertRowid: vals[0], changes: vals[1] };
      },

      /* Retorna la primera fila como objeto */
      get(...args) {
        const params = flatParams(args);
        let stmt;
        try {
          stmt = raw.prepare(sql);
          if (params.length) stmt.bind(params);
          if (!stmt.step()) { stmt.free(); return undefined; }
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          stmt.free();
          const obj = {};
          cols.forEach((c, i) => { obj[c] = vals[i]; });
          return obj;
        } catch (e) {
          logger.error(`DB get error: ${e.message}\nSQL: ${sql}\nParams: ${JSON.stringify(params)}`);
          stmt?.free();
          throw e;
        }
      },

      /* Retorna todas las filas como array de objetos */
      all(...args) {
        const params = flatParams(args);
        let stmt;
        try {
          stmt = raw.prepare(sql);
          if (params.length) stmt.bind(params);
          const rows = [];
          while (stmt.step()) {
            const cols = stmt.getColumnNames();
            const vals = stmt.get();
            const obj  = {};
            cols.forEach((c, i) => { obj[c] = vals[i]; });
            rows.push(obj);
          }
          stmt.free();
          return rows;
        } catch (e) {
          logger.error(`DB all error: ${e.message}\nSQL: ${sql}\nParams: ${JSON.stringify(params)}`);
          stmt?.free();
          throw e;
        }
      },
    };
  }

  return {
    prepare,
    exec(sql) {
      try {
        raw.run(sql);
        saveToDisc();
      } catch (e) {
        logger.error(`DB exec error: ${e.message}`);
        throw e;
      }
    },
    pragma() {},  // no-op — sql.js no usa pragmas de la misma forma
    close()  { saveToDisc(); raw.close(); },
  };
}

/* ═══════════════════════════════════════
   API PÚBLICA
   ═══════════════════════════════════════ */

export function getDB() {
  if (!_db) throw new Error('DB no inicializada. Llamá a initDB() primero.');
  return _db;
}

export async function initDB(dbPath) {
  _dbPath = dbPath;

  const dir = dirname(dbPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const schema = readFileSync(join(__dir, 'schema.sql'), 'utf-8');

  /* ── Intento 1: better-sqlite3 (nativo, rápido) ── */
  try {
    const { default: Database } = await import('better-sqlite3');
    const raw = new Database(dbPath);
    raw.pragma('journal_mode = WAL');
    raw.pragma('foreign_keys = ON');
    raw.pragma('synchronous = NORMAL');
    raw.exec(schema);
    _db      = raw;
    _adapter = 'better-sqlite3';
    logger.info(`✓ DB lista con better-sqlite3: ${dbPath}`);
    return _db;
  } catch (e) {
    logger.warn(`better-sqlite3 no disponible → usando sql.js (${e.message.split('\n')[0]})`);
  }

  /* ── Intento 2: sql.js (pure JS, sin compilación) ── */
  try {
    const { default: initSqlJs } = await import('sql.js');
    const SQL = await initSqlJs();

    const raw = existsSync(dbPath)
      ? new SQL.Database(readFileSync(dbPath))
      : new SQL.Database();

    // Ejecutar schema (DDL)
    raw.run(schema);

    _rawSqlJs = raw;
    writeFileSync(dbPath, Buffer.from(raw.export()));

    // Auto-save cada 3 segundos
    _saveTimer = setInterval(saveToDisc, 3000);

    _db      = wrapSqlJs(raw);
    _adapter = 'sql.js';
    logger.info(`✓ DB lista con sql.js (modo compatibilidad): ${dbPath}`);
    return _db;
  } catch (e) {
    logger.error('No se pudo inicializar ninguna DB:', e.message);
    throw e;
  }
}

export function closeDB() {
  if (_saveTimer) { clearInterval(_saveTimer); _saveTimer = null; }
  if (_db) {
    _db.close?.();
    _db = null;
    logger.info(`DB cerrada (${_adapter})`);
  }
}

export const getAdapter = () => _adapter;
