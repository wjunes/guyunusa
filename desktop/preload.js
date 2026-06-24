/**
 * preload.js — Bridge seguro entre el proceso main y el renderer
 * Expone solo lo necesario via contextBridge (sin nodeIntegration)
 */
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {

  // Obtener si el sistema prefiere modo oscuro
  getNativeTheme: () => ipcRenderer.invoke('get-native-theme'),

  // Escuchar cambios de tema del SO
  onNativeThemeChanged: (callback) => {
    ipcRenderer.on('native-theme-changed', (_event, data) => callback(data));
  },

  // Información del entorno
  isElectron: true,
  platform:   process.platform,  // 'win32' | 'darwin' | 'linux'
});
