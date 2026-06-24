/**
 * api.js — Servicio de comunicación con el backend
 */
import { Platform } from '../modules/native.js';

const DEV_OVERRIDE = new URLSearchParams(window.location.search).get('api');

function getBaseURL() {
  if (DEV_OVERRIDE)         return DEV_OVERRIDE + '/api/v1';
  if (Platform.isCapacitor) return 'https://api.guyunusa.uy/api/v1';
  return '/api/v1';
}

function getToken() {
  return localStorage.getItem('guyunusa_token');
}

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token   = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${getBaseURL()}${path}`, {
    method,
    headers,
    body:   body ? JSON.stringify(body) : null,
    signal: AbortSignal.timeout(20_000),
  });

  const data = await res.json();
  if (!data.ok) throw new Error(data.message || 'Error del servidor');
  return data;
}

export const api = {
  get:    (path)         => request('GET',    path),
  post:   (path, body)   => request('POST',   path, body),
  put:    (path, body)   => request('PUT',    path, body),
  delete: (path, body)   => request('DELETE', path, body),
};
