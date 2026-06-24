/**
 * main.js — Proceso principal de Electron (Guyunusa Desktop)
 */
import { app, BrowserWindow, Menu, shell,
         nativeTheme, ipcMain }  from 'electron';
import { fileURLToPath }         from 'url';
import { dirname, join }         from 'path';
import { fork }                  from 'child_process';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const isDev      = process.argv.includes('--dev');
const BACKEND_PORT = 3000;

let mainWindow;
let backendProcess;

/* ——— 1. Arrancar el backend Node.js como proceso hijo ——— */
function startBackend() {
  const serverPath = join(__dirname, '..', 'backend', 'server.js');
  backendProcess = fork(serverPath, [], {
    env:    { ...process.env, NODE_ENV: 'production', PORT: String(BACKEND_PORT) },
    silent: !isDev,
  });

  backendProcess.on('error', err => console.error('[Backend]', err));
  backendProcess.on('exit',  code => {
    if (code !== 0) console.warn('[Backend] Proceso terminó con código:', code);
  });

  // Esperar un momento para que el backend arranque
  return new Promise(resolve => setTimeout(resolve, 1200));
}

/* ——— 2. Crear la ventana principal ——— */
function createWindow() {
  mainWindow = new BrowserWindow({
    width:           1100,
    height:          720,
    minWidth:        760,
    minHeight:       520,
    title:           'Guyunusa',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1a1814' : '#faf9f6',
    show:            false, // mostrar luego de cargar (evita flash)
    webPreferences: {
      preload:           join(__dirname, 'preload.js'),
      contextIsolation:  true,
      nodeIntegration:   false,
      sandbox:           true,
    },
    // Sin barra de menú nativa en producción
    autoHideMenuBar: !isDev,
  });

  // Cargar el frontend apuntando al backend local
  const url = isDev
    ? `http://localhost:${BACKEND_PORT}`            // dev: backend sirve frontend
    : `http://localhost:${BACKEND_PORT}`;

  mainWindow.loadURL(url);

  // Mostrar cuando esté lista (sin flash blanco)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  // Links externos → navegador del sistema
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

/* ——— 3. Menú de la aplicación ——— */
function buildMenu() {
  const template = [
    {
      label: 'Guyunusa',
      submenu: [
        { label: 'Acerca de Guyunusa', role: 'about' },
        { type: 'separator' },
        { label: 'Salir', role: 'quit', accelerator: 'CmdOrCtrl+Q' },
      ],
    },
    {
      label: 'Editar',
      submenu: [
        { label: 'Deshacer',   role: 'undo',       accelerator: 'CmdOrCtrl+Z' },
        { label: 'Rehacer',    role: 'redo',        accelerator: 'CmdOrCtrl+Shift+Z' },
        { type: 'separator' },
        { label: 'Cortar',     role: 'cut',         accelerator: 'CmdOrCtrl+X' },
        { label: 'Copiar',     role: 'copy',        accelerator: 'CmdOrCtrl+C' },
        { label: 'Pegar',      role: 'paste',       accelerator: 'CmdOrCtrl+V' },
        { label: 'Seleccionar todo', role: 'selectAll', accelerator: 'CmdOrCtrl+A' },
      ],
    },
    {
      label: 'Ver',
      submenu: [
        { label: 'Recargar',   role: 'reload',      accelerator: 'CmdOrCtrl+R' },
        { type: 'separator' },
        { label: 'Acercar',    role: 'zoomIn',      accelerator: 'CmdOrCtrl+=' },
        { label: 'Alejar',     role: 'zoomOut',     accelerator: 'CmdOrCtrl+-' },
        { label: 'Tamaño real',role: 'resetZoom',   accelerator: 'CmdOrCtrl+0' },
        { type: 'separator' },
        { label: 'Pantalla completa', role: 'togglefullscreen', accelerator: 'F11' },
        ...(isDev ? [
          { type: 'separator' },
          { label: 'Herramientas de desarrollador', role: 'toggleDevTools' },
        ] : []),
      ],
    },
    {
      label: 'Ventana',
      submenu: [
        { label: 'Minimizar', role: 'minimize', accelerator: 'CmdOrCtrl+M' },
        { label: 'Cerrar',    role: 'close',    accelerator: 'CmdOrCtrl+W' },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/* ——— 4. IPC: comunicación renderer ↔ main ——— */

// El renderer puede pedir el tema del sistema operativo
ipcMain.handle('get-native-theme', () => ({
  shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
}));

// Notificar al renderer cuando el SO cambia el tema
nativeTheme.on('updated', () => {
  mainWindow?.webContents.send('native-theme-changed', {
    shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
  });
});

/* ——— 5. Ciclo de vida de la app ——— */
app.whenReady().then(async () => {
  await startBackend();
  buildMenu();
  createWindow();

  // macOS: recrear ventana si se cierra y se hace clic en el dock
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  backendProcess?.kill();
});
