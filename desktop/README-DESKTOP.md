# Guyunusa Desktop — Electron

## Requisitos
- Node.js 18+
- El backend de Guyunusa (`/backend`) configurado con su `.env`

## Instalación

```bash
cd desktop
npm install
```

## Desarrollo

```bash
# Terminal 1: arrancar el backend
cd ../backend && npm run dev

# Terminal 2: lanzar Electron en modo dev
cd ../desktop && npm run dev
```

En modo `--dev` se abre DevTools automáticamente.

## Build de distribución

```bash
cd desktop

# Windows (.exe instalador)
npm run build:win

# macOS (.dmg)
npm run build:mac

# Linux (.AppImage + .deb)
npm run build:linux

# Todas las plataformas (desde CI)
npm run build
```

Los binarios quedan en `desktop/dist/`.

## Cómo funciona

```
Electron main.js
  ├── fork() → backend/server.js   (proceso hijo Node.js)
  └── BrowserWindow → http://localhost:3000
        └── frontend/index.html   (servido por Express)
```

El proceso main arranca el backend como proceso hijo antes de abrir
la ventana. Al cerrar la app, el backend se termina automáticamente.

## Íconos

Colocar en `desktop/assets/`:
- `icon.ico`  — Windows (256x256)
- `icon.icns` — macOS
- `icon.png`  — Linux (512x512)

Se puede generar desde un PNG con: https://www.electron.build/icons
