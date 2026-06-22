import { api }   from './api.js';

export async function initAuth(store) {
  const token = localStorage.getItem('guyunusa_token');
  if (!token) return;
  try {
    const data = await api.get('/user');
    store.update({ user: data.user, token });
  } catch {
    localStorage.removeItem('guyunusa_token');
  }
}

export async function login(email, password, store) {
  const data = await api.post('/auth/login', { email, password });
  localStorage.setItem('guyunusa_token', data.token);
  store.update({ user: data.user, token: data.token });
  return data;
}

export async function register(email, username, password, store) {
  const data = await api.post('/auth/register', { email, username, password });
  localStorage.setItem('guyunusa_token', data.token);
  store.update({ user: data.user, token: data.token });
  return data;
}

export function logout(store) {
  localStorage.removeItem('guyunusa_token');
  store.update({ user: null, token: null, conversations: [], messages: [] });
}
