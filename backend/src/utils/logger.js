const LEVELS = { info: '→', warn: '⚠', error: '✖', debug: '·' };

function log(level, ...args) {
  const time  = new Date().toTimeString().slice(0, 8);
  const icon  = LEVELS[level] ?? '•';
  const label = `[${time}] ${icon} [${level.toUpperCase()}]`;
  if (level === 'error') console.error(label, ...args);
  else if (level === 'warn') console.warn(label, ...args);
  else console.log(label, ...args);
}

export const logger = {
  info:  (...a) => log('info',  ...a),
  warn:  (...a) => log('warn',  ...a),
  error: (...a) => log('error', ...a),
  debug: (...a) => process.env.NODE_ENV !== 'production' && log('debug', ...a),
};
