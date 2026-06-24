#!/usr/bin/env node
/**
 * check-env.js — Verifica que el entorno esté listo para arrancar
 * Uso: node scripts/check-env.js
 */
import 'dotenv/config';
import { existsSync, mkdirSync } from 'fs';
import { dirname }               from 'path';

const REQUIRED = ['JWT_SECRET', 'OPENROUTER_API_KEY', 'DEEPSEEK_API_KEY'];
const OPTIONAL = ['PORT', 'OPENROUTER_MODEL', 'DEEPSEEK_MODEL', 'DB_PATH', 'NODE_ENV', 'ALLOWED_ORIGINS'];

let allOk = true;

console.log('\n🧉 Guyunusa — Verificación de entorno\n' + '─'.repeat(44));

// Variables requeridas
console.log('\n📋 Variables requeridas:');
for (const key of REQUIRED) {
  const val = process.env[key];
  const missing = !val || val.includes('REEMPLAZAR') || val.includes('xxxxxxx');
  if (missing) {
    console.log(`  ✖  ${key} — NO configurada`);
    allOk = false;
  } else {
    const preview = (key.includes('KEY') || key.includes('SECRET'))
      ? val.slice(0,8) + '...' + val.slice(-4)
      : val;
    console.log(`  ✓  ${key} = ${preview}`);
  }
}

// Variables opcionales
console.log('\n📋 Variables opcionales:');
for (const key of OPTIONAL) {
  const val = process.env[key];
  console.log(`  ${val ? '✓' : '·'}  ${key} = ${val || '(valor por defecto)'}`);
}

// Directorio de la base de datos
console.log('\n📁 Base de datos:');
const dbPath = process.env.DB_PATH || './data/guyunusa.db';
const dbDir  = dirname(dbPath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
  console.log(`  ✓  Directorio creado: ${dbDir}`);
} else {
  console.log(`  ✓  Directorio existe: ${dbDir}`);
}

// Conectividad con las APIs
console.log('\n🌐 Verificando conectividad...');

async function checkAPI(name, baseURL, apiKey) {
  if (!apiKey || apiKey.includes('REEMPLAZAR') || apiKey.includes('xxxxxxx')) {
    console.log(`  ·  ${name.padEnd(12)} — key no configurada, saltando`);
    return;
  }
  try {
    const res = await fetch(`${baseURL}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      console.log(`  ✓  ${name.padEnd(12)} — OK (HTTP ${res.status})`);
    } else {
      console.log(`  ✖  ${name.padEnd(12)} — HTTP ${res.status} ${res.statusText}`);
      allOk = false;
    }
  } catch (err) {
    console.log(`  ✖  ${name.padEnd(12)} — ${err.message}`);
    allOk = false;
  }
}

await checkAPI(
  'OpenRouter',
  process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  process.env.OPENROUTER_API_KEY
);
await checkAPI(
  'DeepSeek',
  process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
  process.env.DEEPSEEK_API_KEY
);

// Resumen
console.log('\n' + '─'.repeat(44));
if (allOk) {
  console.log('✅  Todo listo. Arrancá con:\n');
  console.log('    npm run dev\n');
} else {
  console.log('❌  Hay problemas. Editá backend/.env y volvé a correr este script.\n');
  process.exit(1);
}
