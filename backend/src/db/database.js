import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { logger } from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

let db;

export function getDB() {
  if (!db) throw new Error('Base de datos no inicializada. Llamá a initDB() primero.');
  return db;
}

export function initDB(dbPath) {
  try {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');   // mejor concurrencia
    db.pragma('foreign_keys = ON');    // integridad referencial
    db.pragma('synchronous = NORMAL'); // balance seguridad/performance

    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    db.exec(schema);

    logger.info(`Base de datos inicializada en: ${dbPath}`);
    return db;
  } catch (err) {
    logger.error('Error al inicializar la base de datos:', err.message);
    throw err;
  }
}

export function closeDB() {
  if (db) {
    db.close();
    db = null;
    logger.info('Conexión a la base de datos cerrada.');
  }
}
