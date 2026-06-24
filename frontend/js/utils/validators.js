export function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
export function minLength(v, n) {
  return typeof v === 'string' && v.trim().length >= n;
}
export function validateLogin({ email, password }) {
  const errors = {};
  if (!isEmail(email))         errors.email    = 'Ingresá un email válido';
  if (!minLength(password, 6)) errors.password = 'La contraseña debe tener al menos 6 caracteres';
  return errors;
}
export function validateRegister({ email, username, password }) {
  const errors = {};
  if (!isEmail(email))          errors.email    = 'Ingresá un email válido';
  if (!minLength(username, 3))  errors.username = 'El usuario debe tener al menos 3 caracteres';
  if (!minLength(password, 6))  errors.password = 'La contraseña debe tener al menos 6 caracteres';
  return errors;
}
