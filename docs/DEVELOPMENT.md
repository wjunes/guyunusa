# Guía de desarrollo — Guyunusa

## Primera vez que arrancás el proyecto

### 1. Clonar y configurar

```bash
git clone https://github.com/tu-usuario/guyunusa.git
cd guyunusa

cd backend
npm install
cp .env.example .env
# → Editar .env con tus API keys reales
```

### 2. Verificar el entorno

```bash
npm run check
```

Este script verifica:
- Que todas las variables de entorno requeridas estén configuradas
- Que el directorio `data/` exista (lo crea si no)
- Que las APIs de OpenRouter y DeepSeek respondan correctamente

### 3. Arrancar

```bash
npm run dev
```

En otra terminal, servir el frontend con Live Server de VS Code
o con `npx serve ../frontend -p 5500`.

---

## Flujo de trabajo típico

```
1. Cambiar código del frontend
   → El navegador recarga automáticamente (Live Server)

2. Cambiar código del backend
   → Node --watch reinicia automáticamente

3. Cambiar el sistema prompt (shared/systemPrompt.js)
   → Reiniciar el backend

4. Cambiar el schema de la DB (src/db/schema.sql)
   → npm run db:reset  (borra y recrea la DB)
   ⚠ Solo en desarrollo — en producción usar migraciones
```

---

## Probar el failover de IA

Para forzar que OpenRouter falle y activar el fallback a DeepSeek:

```bash
# En .env, poner una key inválida temporalmente
OPENROUTER_API_KEY=sk-or-invalida

# Arrancar el backend y enviar un mensaje
# → Los logs mostrarán el intento fallido y el switch a DeepSeek
```

---

## Endpoints útiles para testing manual

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Registrar usuario de prueba
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","username":"tester","password":"123456"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# Enviar mensaje (reemplazar TOKEN con el del login)
curl -X POST http://localhost:3000/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"content":"Hola Guyunusa, ¿quién fue Artigas?"}'
```

---

## Estructura del system prompt

El archivo `shared/systemPrompt.js` es el corazón del producto.
Define la personalidad, el conocimiento y el comportamiento de Guyunusa.

Para modificar la identidad de la IA:
1. Editar `shared/systemPrompt.js`
2. Reiniciar el backend
3. Probar con mensajes culturales y conversacionales

El system prompt NO se guarda en la base de datos — se inyecta en cada
request al armar el array de mensajes para la API.

---

## Depuración de problemas comunes

### "Cannot find module 'better-sqlite3'"
```bash
cd backend && npm install
# Si sigue fallando en Windows:
npm install --build-from-source
```

### "CORS error" en el navegador
Agregar el origen a `ALLOWED_ORIGINS` en `.env`:
```env
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:5500
```

### "JWT malformed" o "Token expirado"
Limpiar el localStorage del navegador:
```js
// En la consola del navegador:
localStorage.clear()
```

### La IA responde en inglés
Verificar que el system prompt se esté enviando correctamente.
Revisar los logs del backend — debe mostrar `[messages] system prompt incluido`.

### "AI_UNAVAILABLE" en producción
1. Verificar que las API keys tengan créditos
2. Correr `npm run check` en el servidor
3. Revisar logs: `pm2 logs guyunusa`
