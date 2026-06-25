/**
 * database-sqljs.js — Adaptador de DB usando sql.js (pure JS, sin compilación)
 * Usar este archivo si better-sqlite3 no compila en Windows.
 *
 * DIFERENCIA: sql.js carga la DB entera en memoria.
 * Para persistir hay que escribir el archivo explícitamente.
 * Este adaptador hace auto-save cada 5 segundos y al cerrar.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { logger } from '../utils/logger.js';

let SQL;   // instancia de sql.js
let db;    // base de datos en memoria
let dbPath;
let saveTimer;

/** Carga sql.js dinámicamente */
async function loadSqlJs() {
  if (SQL) return SQL;
  const { default: initSqlJs } = await import('sql.js');
  SQL = await initSqlJs();
  return SQL;
}

/** Persiste la DB en disco */
function saveToDisk() {
  if (!db || !dbPath) return;
  try {
    const data = db.export();
    writeFileSync(dbPath, Buffer.from(data));
  } catch (err) {
    logger.error('Error al guardar DB:', err.message);
  }
}

export function getDB() {
  if (!db) throw new Error('Base de datos no inicializada. Llamá a initDB() primero.');
  return db;
}

export async function initDB(path) {
  dbPath = path;
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const sqlJs = await loadSqlJs();

  if (existsSync(path)) {
    const fileBuffer = readFileSync(path);
    db = new sqlJs.Database(fileBuffer);
    logger.info(`DB cargada desde disco: ${path}`);
  } else {
    db = new sqlJs.Database();
    logger.info(`DB nueva creada en: ${path}`);
  }

  // Leer y ejecutar schema
  const schema = readFileSync(
    new URL('./schema.sql', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'),
    'utf-8'
  );
  db.run(schema);
  saveToDisk();

  // Auto-save cada 5 segundos
  saveTimer = setInterval(saveToDisk, 5000);

  return db;
}

export function closeDB() {
  if (saveTimer) clearInterval(saveTimer);
  saveToDisk();
  if (db) { db.close(); db = null; }
  logger.info('DB cerrada y guardada.');
}
