/**
 * api.js — Cliente HTTP hacia el backend
 *
 * Detecta automáticamente la URL base según el entorno:
 *  - Capacitor (Android) → API pública en producción
 *  - Electron            → localhost (el backend corre embebido)
 *  - Web en desarrollo   → localhost:3000 (backend separado)
 *  - Web en producción   → ruta relativa (mismo servidor)
 */
import { Platform } from '../modules/native.js';

function getBaseURL() {
  // Parámetro de override para desarrollo: ?api=http://192.168.x.x:3000
  const override = new URLSearchParams(window.location.search).get('api');
  if (override) return override + '/api/v1';

  // Android nativo → API pública
  if (Platform.isCapacitor) return 'https://api.guyunusa.uy/api/v1';

  // Electron → backend embebido en mismo puerto
  if (Platform.isElectron) return 'http://localhost:3000/api/v1';

  // Desarrollo web: Live Server corre en 5500, backend en 3000
  // Si la página se carga desde un puerto distinto al 3000, apuntamos a 3000
  const port = window.location.port;
  if (port && port !== '3000') {
    const host = window.location.hostname;
    return `http://${host}:3000/api/v1`;
  }

  // Producción: frontend y backend en el mismo servidor
  return '/api/v1';
}

function getToken() {
  return localStorage.getItem('guyunusa_token');
}

async function request(method, path, body = null) {
  const baseURL = getBaseURL();
  const headers = { 'Content-Type': 'application/json' };
  const token   = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${baseURL}${path}`, {
      method,
      headers,
      body:   body ? JSON.stringify(body) : null,
      signal: AbortSignal.timeout(20_000),
    });
  } catch (err) {
    // Error de red — backend no responde
    if (err.name === 'TypeError' || err.name === 'AbortError') {
      throw new Error(
        'No se pudo conectar con el servidor. ' +
        '¿Está corriendo el backend en el puerto 3000?'
      );
    }
    throw err;
  }

  // Respuesta vacía o no-JSON
  const text = await res.text();
  if (!text || !text.trim()) {
    throw new Error(`El servidor devolvió una respuesta vacía (HTTP ${res.status})`);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error('Respuesta no-JSON del servidor:', text.slice(0, 200));
    throw new Error(`Respuesta inválida del servidor (HTTP ${res.status})`);
  }

  if (!data.ok) throw new Error(data.message || 'Error del servidor');
  return data;
}

export const api = {
  get:    (path)       => request('GET',    path),
  post:   (path, body) => request('POST',   path, body),
  put:    (path, body) => request('PUT',    path, body),
  delete: (path, body) => request('DELETE', path, body),
};
