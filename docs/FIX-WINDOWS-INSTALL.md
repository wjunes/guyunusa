# Fix: Error de instalación en Windows

## Diagnóstico

El error ocurre por dos razones combinadas:

1. **Node 16 activo** (nvm está usando v16.20.2) pero npm está instalado para v20
2. **better-sqlite3** requiere compilar código nativo (C++) — necesita node-gyp,
   Python y herramientas de build que no están configuradas correctamente

## Solución recomendada: actualizar Node a v20 con nvm

```cmd
# Abrir CMD o PowerShell como Administrador:

nvm use 20.19.5
node --version
# → v20.19.5

npm --version
# → 10.x.x
```

Luego volver a intentar:
```cmd
cd backend
npm install
```

## Solución alternativa: reemplazar better-sqlite3 por sql.js

Si el problema persiste, usamos `sql.js` que es JavaScript puro
(sin compilación nativa) y tiene la misma API.

Ver instrucciones abajo.
