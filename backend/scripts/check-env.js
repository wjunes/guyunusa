#!/usr/bin/env node
/**
 * check-env.js — Verifica que el entorno esté listo
 * Uso: node scripts/check-env.js
 */
import 'dotenv/config';
import { existsSync, mkdirSync } from 'fs';
import { dirname }               from 'path';

const REQUIRED = ['JWT_SECRET', 'OPENROUTER_API_KEY', 'DEEPSEEK_API_KEY'];
const OPTIONAL = ['PORT', 'OPENROUTER_MODEL', 'DEEPSEEK_MODEL', 'DB_PATH', 'NODE_ENV', 'ALLOWED_ORIGINS'];

let allOk = true;

console.log('\n🧉 Guyunusa — Verificación de entorno\n' + '─'.repeat(44));

// ── Versión de Node ──
const nodeVer  = process.versions.node;
const nodeMajor = parseInt(nodeVer.split('.')[0]);
console.log(`\n⬢  Node.js: v${nodeVer}`);
if (nodeMajor < 18) {
  console.log(`   ✖  Node ${nodeVer} es demasiado viejo. Se requiere Node 18 o superior.`);
  console.log(`   → Solución en Windows:`);
  console.log(`     nvm use 20        (si usás nvm)`);
  console.log(`     o descargar desde: https://nodejs.org`);
  allOk = false;
} else {
  console.log(`   ✓  Versión compatible`);
}

// ── Verificar que better-sqlite3 está disponible ──
console.log(`\n📦 Módulos nativos:`);
try {
  await import('better-sqlite3');
  console.log(`   ✓  better-sqlite3 — disponible (modo nativo)`);
} catch {
  try {
    await import('sql.js');
    console.log(`   ·  better-sqlite3 — no compilado`);
    console.log(`   ✓  sql.js          — disponible (modo compatibilidad)`);
  } catch {
    console.log(`   ✖  Ningún módulo de DB disponible`);
    console.log(`   → Corré: npm install`);
    allOk = false;
  }
}

// ── Variables de entorno ──
console.log('\n📋 Variables requeridas:');
for (const key of REQUIRED) {
  const val     = process.env[key];
  const missing = !val || val.includes('REEMPLAZAR') || val.includes('xxxxxxx');
  if (missing) {
    console.log(`   ✖  ${key} — falta configurar en .env`);
    allOk = false;
  } else {
    const preview = (key.includes('KEY') || key.includes('SECRET'))
      ? val.slice(0, 8) + '...' + val.slice(-4)
      : val;
    console.log(`   ✓  ${key} = ${preview}`);
  }
}

console.log('\n📋 Variables opcionales:');
for (const key of OPTIONAL) {
  const val = process.env[key];
  console.log(`   ${val ? '✓' : '·'}  ${key} = ${val || '(valor por defecto)'}`);
}

// ── Directorio de datos ──
console.log('\n📁 Base de datos:');
const dbPath = process.env.DB_PATH || './data/guyunusa.db';
const dbDir  = dirname(dbPath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
  console.log(`   ✓  Directorio creado: ${dbDir}`);
} else {
  console.log(`   ✓  Directorio existe: ${dbDir}`);
}

// ── Conectividad APIs ──
console.log('\n🌐 Verificando conectividad...');

async function checkAPI(name, baseURL, apiKey) {
  if (!apiKey || apiKey.includes('REEMPLAZAR') || apiKey.includes('xxxxxxx')) {
    console.log(`   ·  ${name.padEnd(12)} — key no configurada, saltando`);
    return;
  }
  try {
    const res = await fetch(`${baseURL}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal:  AbortSignal.timeout(8000),
    });
    if (res.ok) {
      console.log(`   ✓  ${name.padEnd(12)} — OK (HTTP ${res.status})`);
    } else {
      console.log(`   ✖  ${name.padEnd(12)} — HTTP ${res.status}: verificá la API key`);
      allOk = false;
    }
  } catch (err) {
    console.log(`   ✖  ${name.padEnd(12)} — sin conexión (${err.message})`);
    allOk = false;
  }
}

await checkAPI('OpenRouter', process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1', process.env.OPENROUTER_API_KEY);
await checkAPI('DeepSeek',   process.env.DEEPSEEK_BASE_URL   || 'https://api.deepseek.com/v1',  process.env.DEEPSEEK_API_KEY);

// ── Resumen ──
console.log('\n' + '─'.repeat(44));
if (allOk) {
  console.log('✅  Todo listo. Arrancá con:\n');
  console.log('    npm run dev\n');
} else {
  console.log('❌  Hay problemas. Revisá los puntos con ✖ arriba.\n');
  process.exit(1);
}
