// Constantes compartidas entre frontend y backend

export const API_VERSION = 'v1';
export const API_BASE    = `/api/${API_VERSION}`;

export const AI_PROVIDERS = {
  OPENROUTER: 'openrouter',
  DEEPSEEK:   'deepseek',
};

export const MESSAGE_ROLES = {
  USER:      'user',
  ASSISTANT: 'assistant',
  SYSTEM:    'system',
};

export const USER_PLANS = {
  FREE: 'free',
  PRO:  'pro',
};

export const FREE_DAILY_LIMIT = 20; // mensajes por día en plan gratuito

export const HTTP_STATUS = {
  OK:           200,
  CREATED:      201,
  BAD_REQUEST:  400,
  UNAUTHORIZED: 401,
  FORBIDDEN:    403,
  NOT_FOUND:    404,
  SERVER_ERROR: 500,
};

export const ERRORS = {
  INVALID_CREDENTIALS: 'Credenciales inválidas',
  USER_EXISTS:         'El usuario ya existe',
  TOKEN_EXPIRED:       'Sesión expirada, volvé a ingresar',
  AI_UNAVAILABLE:      'Los servicios de IA no están disponibles ahora',
  RATE_LIMITED:        'Llegaste al límite de mensajes por hoy',
};
