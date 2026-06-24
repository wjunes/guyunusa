# Guyunusa 🇺🇾

> IA conversacional con identidad uruguaya profunda.
> Nombrada en honor a **Guyunusa**, líder charrúa llevada a París en 1833 — símbolo de resistencia y puente entre mundos.

---

## Índice

1. [Descripción](#descripción)
2. [Stack tecnológico](#stack-tecnológico)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Instalación rápida](#instalación-rápida)
5. [Configuración](#configuración)
6. [Desarrollo local](#desarrollo-local)
7. [Build de producción](#build-de-producción)
8. [Desktop — Electron](#desktop--electron)
9. [Android — Capacitor](#android--capacitor)
10. [Arquitectura CSS (ITCSS)](#arquitectura-css-itcss)
11. [Arquitectura JS](#arquitectura-js)
12. [API REST](#api-rest)
13. [Sistema de IA y failover](#sistema-de-ia-y-failover)
14. [Sistema de temas](#sistema-de-temas)
15. [Roadmap](#roadmap)

---

## Descripción

Guyunusa es una aplicación de chat con IA que combina:

- **Modelos open-source** vía OpenRouter y DeepSeek con failover automático
- **Identidad cultural uruguaya** profunda: voseo rioplatense, historia, música, literatura y cultura local en el system prompt
- **Tres plataformas** desde un único codebase: Web, Desktop (Electron) y Android (Capacitor)
- **Sin frameworks UI** — HTML, CSS (ITCSS) y JS ES Modules puros, sin React ni Vue

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5 · CSS ITCSS · JavaScript ES Modules |
| Backend | Node.js 18+ · Express 4 |
| Base de datos | SQLite vía `better-sqlite3` |
| Autenticación | JWT + bcryptjs |
| IA primaria | OpenRouter.ai → DeepSeek |
| IA failover | DeepSeek API directa |
| Desktop | Electron 30 |
| Android | Capacitor 6 |

---

## Estructura del proyecto

```
guyunusa/
│
├── frontend/                   # Código fuente web (sirve las 3 plataformas)
│   ├── index.html
│   ├── css/
│   │   ├── main.css            # Punto de entrada ITCSS
│   │   ├── 1-settings/         # Variables, colores, tipografía
│   │   ├── 2-tools/            # Mixins y helpers
│   │   ├── 3-generic/          # Reset y box-sizing
│   │   ├── 4-elements/         # Estilos de etiquetas base
│   │   ├── 5-objects/          # Patrones de layout
│   │   ├── 6-components/       # Componentes de UI
│   │   └── 7-trumps/           # Utilidades, temas, mobile
│   └── js/
│       ├── app.js              # Punto de entrada
│       ├── modules/            # router, store, eventBus, theme, native
│       ├── services/           # api, auth, chat
│       ├── components/         # sidebar, header, chatWindow, inputBar, ...
│       ├── pages/              # loginPage, registerPage, chatPage, settingsPage
│       └── utils/              # dom, helpers, validators, markdown
│
├── backend/                    # API REST Node.js
│   ├── server.js               # Entrada principal
│   ├── .env                    # Variables de entorno (NO subir a git)
│   ├── .env.example            # Plantilla de configuración
│   ├── data/                   # SQLite .db (generado automáticamente)
│   └── src/
│       ├── routes/             # auth, chat, user
│       ├── controllers/        # lógica de cada ruta
│       ├── services/           # ai.service (failover), auth.service
│       ├── db/                 # database.js, schema.sql
│       ├── middleware/         # auth, error, rateLimit
│       └── utils/              # logger, crypto
│
├── desktop/                    # Wrapper Electron
│   ├── main.js                 # Proceso principal
│   ├── preload.js              # Bridge seguro con contextBridge
│   └── package.json
│
├── android/                    # Configuración Capacitor
│   ├── capacitor.config.json
│   └── package.json
│
├── shared/                     # Código compartido front ↔ back
│   ├── constants.js            # HTTP status, errores, límites
│   └── systemPrompt.js         # Identidad de Guyunusa (el corazón del producto)
│
└── docs/                       # Documentación adicional
```

---

## Instalación rápida

### Requisitos previos

- **Node.js 18+** — https://nodejs.org
- **npm 9+** (incluido con Node)
- **Git**

### Clonar e instalar

```bash
git clone https://github.com/tu-usuario/guyunusa.git
cd guyunusa/backend
npm install
```

---

## Configuración

### 1. Variables de entorno

```bash
cd backend
cp .env.example .env
```

Editar `.env` con tus claves reales:

```env
# Puerto del servidor
PORT=3000

# JWT — cambiar por un secreto largo y aleatorio en producción
JWT_SECRET=tu_secreto_muy_largo_y_aleatorio_aqui
JWT_EXPIRES_IN=7d

# OpenRouter (proveedor primario)
# Obtener en: https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=deepseek/deepseek-chat

# DeepSeek (proveedor de respaldo)
# Obtener en: https://platform.deepseek.com/api_keys
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat

# Base de datos
DB_PATH=./data/guyunusa.db

# Entorno
NODE_ENV=development

# Orígenes permitidos para CORS (separados por coma)
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:5500
```

### 2. Obtener API keys

**OpenRouter** (recomendado como primario):
1. Crear cuenta en https://openrouter.ai
2. Ir a Keys → Create Key
3. El modelo `deepseek/deepseek-chat` cuesta ~$0.14 por millón de tokens

**DeepSeek** (respaldo):
1. Crear cuenta en https://platform.deepseek.com
2. API Keys → Create new key
3. Cargar créditos (mínimo $5 USD)

---

## Desarrollo local

### Arrancar el backend

```bash
cd backend
npm run dev
# → Guyunusa backend corriendo en http://localhost:3000
```

El backend también sirve el frontend en modo producción. En desarrollo se usa Live Server.

### Arrancar el frontend

**Opción A — VS Code Live Server:**
1. Instalar extensión "Live Server"
2. Click derecho en `frontend/index.html` → "Open with Live Server"
3. Se abre en `http://127.0.0.1:5500`

**Opción B — npx serve:**
```bash
npx serve frontend -p 5500
```

**Opción C — backend sirve el frontend** (producción local):
```bash
# En .env: NODE_ENV=production
cd backend && npm start
# Abrir http://localhost:3000
```

### Verificar que funciona

```bash
curl http://localhost:3000/api/v1/health
# → {"status":"ok","app":"Guyunusa","version":"1.0.0"}
```

---

## Build de producción

### Preparar el servidor

```bash
# En el servidor (Ubuntu/Debian)
sudo apt update
sudo apt install nodejs npm

# Instalar PM2 para mantener el proceso vivo
npm install -g pm2

cd /var/www/guyunusa/backend
npm install --production

# Copiar .env con variables de producción
# (nunca subir .env a git)

# Arrancar con PM2
pm2 start server.js --name guyunusa
pm2 save
pm2 startup
```

### Nginx como reverse proxy

```nginx
server {
    listen 80;
    server_name guyunusa.uy www.guyunusa.uy;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# SSL con Let's Encrypt
sudo certbot --nginx -d guyunusa.uy -d www.guyunusa.uy
```

---

## Desktop — Electron

```bash
cd desktop
npm install

# Desarrollo (con DevTools abierto)
# Terminal 1:
cd ../backend && npm run dev
# Terminal 2:
cd desktop && npm run dev

# Build de distribución
npm run build:win    # → .exe instalador (Windows)
npm run build:mac    # → .dmg (macOS)
npm run build:linux  # → .AppImage + .deb (Linux)
```

Los binarios quedan en `desktop/dist/`.

### Íconos necesarios

Colocar en `desktop/assets/`:
- `icon.ico` — Windows (256×256 px)
- `icon.icns` — macOS
- `icon.png` — Linux (512×512 px)

Generador: https://www.electron.build/icons

---

## Android — Capacitor

### Requisitos adicionales

- Android Studio (Hedgehog+)
- Android SDK API 24+ (Android 7.0 mínimo)
- Java JDK 17

### Setup inicial (una sola vez)

```bash
cd android
npm install
npx cap init "Guyunusa" "uy.guyunusa.app" --web-dir ../frontend
npx cap add android
npx cap sync android
npx cap open android
```

### Flujo de trabajo diario

```bash
cd android
npx cap sync android    # después de cambiar el frontend
npx cap open android    # abre Android Studio
# Build → Run (en dispositivo o emulador)
```

### Build de release para Play Store

```bash
# Generar keystore (una sola vez, guardar en lugar seguro)
keytool -genkey -v \
  -keystore guyunusa-release.keystore \
  -alias guyunusa \
  -keyalg RSA -keysize 2048 -validity 10000

# En Android Studio:
# Build → Generate Signed Bundle / APK → Android App Bundle (.aab)
```

---

## Arquitectura CSS (ITCSS)

El CSS sigue la metodología **ITCSS** (Inverted Triangle CSS) — de lo más genérico a lo más específico:

```
main.css (orquestador)
│
├── 1-settings/     Variables globales (colores, espaciado, tipografía)
├── 2-tools/        Helpers y mixins CSS
├── 3-generic/      Reset y normalización (sin clases)
├── 4-elements/     Estilos de etiquetas HTML (h1, p, a, input...)
├── 5-objects/      Patrones de layout sin estilo visual (.o-app, .o-main)
├── 6-components/   Componentes de UI (.c-sidebar, .c-message, .c-header...)
└── 7-trumps/       Utilidades, temas claro/oscuro, overrides mobile
```

**Convención de clases:**
- `.o-*` — objects (layout puro)
- `.c-*` — components (UI con estilo)
- `.u-*` — utilities (helpers de una propiedad)

---

## Arquitectura JS

```
app.js (entrada)
│
├── modules/
│   ├── router.js      SPA router basado en hash (#/ruta)
│   ├── store.js       Estado reactivo con suscripciones
│   ├── eventBus.js    Bus de eventos para comunicación entre módulos
│   ├── theme.js       Sistema claro/oscuro/sistema con persistencia
│   └── native.js      Abstracción multiplataforma (Capacitor/Electron/Web)
│
├── services/
│   ├── api.js         HTTP client con detección de plataforma
│   ├── auth.js        Login, register, logout, initAuth
│   └── chat.js        Mensajes, conversaciones, historial
│
├── components/        Piezas de UI reutilizables (render puro → DOM)
│   ├── sidebar.js
│   ├── header.js
│   ├── chatWindow.js
│   ├── inputBar.js
│   ├── messageItem.js
│   ├── shareModal.js
│   └── modal.js
│
├── pages/             Montan el layout completo de cada vista
│   ├── chatPage.js    (ruta /)
│   ├── loginPage.js   (ruta /login)
│   ├── registerPage.js(ruta /register)
│   └── settingsPage.js(ruta /settings)
│
└── utils/
    ├── dom.js         $(), $$(), el(), clearApp()
    ├── helpers.js     formatTime, truncate, scrollToBottom, debounce
    ├── validators.js  validateLogin, validateRegister
    └── markdown.js    Parser mínimo sin dependencias externas
```

**Flujo de datos:**
```
Usuario → EventBus.emit() → chatPage handler
  → service (api.js) → backend
  → store.set() → component re-render
```

---

## API REST

Base URL: `http://localhost:3000/api/v1`

### Auth

| Método | Ruta | Body | Descripción |
|--------|------|------|-------------|
| POST | `/auth/register` | `{email, username, password}` | Crear cuenta |
| POST | `/auth/login` | `{email, password}` | Iniciar sesión |
| POST | `/auth/logout` | — | Cerrar sesión |

### Chat *(requiere Bearer token)*

| Método | Ruta | Body | Descripción |
|--------|------|------|-------------|
| POST | `/chat/message` | `{content, conversation_id?}` | Enviar mensaje |
| GET | `/chat/conversations` | — | Listar conversaciones |
| GET | `/chat/conversations/:id` | — | Mensajes de una conversación |
| DELETE | `/chat/conversations/:id` | — | Eliminar conversación |

### Usuario *(requiere Bearer token)*

| Método | Ruta | Body | Descripción |
|--------|------|------|-------------|
| GET | `/user` | — | Perfil del usuario |
| PUT | `/user` | `{username?, currentPassword?, newPassword?}` | Actualizar perfil |
| DELETE | `/user` | `{password}` | Eliminar cuenta |

### Respuesta estándar

```json
{ "ok": true, "data": ... }
{ "ok": false, "message": "Descripción del error" }
```

---

## Sistema de IA y failover

```
Frontend → POST /api/v1/chat/message
              ↓
         ai.service.js
              ↓
    ┌─────────────────────┐
    │  1. OpenRouter API  │  ← intenta primero
    │  deepseek/deepseek  │
    └─────────┬───────────┘
              │ falla (timeout, 5xx, sin créditos)
              ↓
    ┌─────────────────────┐
    │  2. DeepSeek API    │  ← respaldo automático
    │  deepseek-chat      │
    └─────────────────────┘
              ↓
         respuesta al frontend
         (incluye qué proveedor respondió)
```

El timeout por proveedor es de **30 segundos**. Si ambos fallan, devuelve error `503` con mensaje amigable en español.

---

## Sistema de temas

| Prioridad | Fuente | Descripción |
|-----------|--------|-------------|
| 1 | `localStorage` | Preferencia manual del usuario |
| 2 | `electronAPI` | Tema nativo del SO (solo Electron) |
| 3 | `prefers-color-scheme` | Preferencia del navegador/sistema |

**Valores:** `'light'` · `'dark'` · `'system'`

El atributo `data-theme` en `<html>` controla el tema activo vía CSS custom properties. Un script inline en `<head>` aplica el tema antes de que cargue el CSS, eliminando el flash de contenido sin estilo.

En Android, el status bar cambia de color automáticamente al cambiar el tema.

---

## Roadmap

### v1.1 — Próximas mejoras
- [ ] Streaming de respuestas (SSE) para feedback en tiempo real
- [ ] Búsqueda en el historial de conversaciones
- [ ] Exportar conversación como PDF
- [ ] Imagen de perfil (avatar)

### v1.2 — Monetización
- [ ] Integración Mercado Pago (plan Pro)
- [ ] Panel de administración
- [ ] Métricas de uso por usuario

### v2.0 — RAG y conocimiento uruguayo
- [ ] Base vectorial con historia, legislación y cultura uruguaya
- [ ] Fine-tuning sobre dataset rioplatense
- [ ] Modo "Experto Uruguay" con fuentes citadas

---

## Licencia

Desarrollado por **Algoritmos.uy** · Montevideo, Uruguay  
Dominio: **guyunusa.uy**

---

*"Una voz uruguaya que llegó al mundo sin perder su raíz."*
