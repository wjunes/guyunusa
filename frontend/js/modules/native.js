/**
 * native.js — Abstracción de funciones nativas (Capacitor / Electron / Web)
 *
 * Permite que el resto del código llame funciones nativas
 * sin saber en qué plataforma está corriendo.
 *
 * Detección:
 *   - Capacitor: window.Capacitor
 *   - Electron:  window.electronAPI
 *   - Web:       ninguno de los anteriores
 */

export const Platform = {
  isCapacitor: typeof window !== 'undefined' && !!window.Capacitor,
  isElectron:  typeof window !== 'undefined' && !!window.electronAPI,
  get isNative() { return this.isCapacitor || this.isElectron; },
  get isWeb()    { return !this.isNative; },
  get name() {
    if (this.isCapacitor) return 'android';
    if (this.isElectron)  return 'desktop';
    return 'web';
  },
};

/* ——————————————————————————————————————
   HAPTICS — vibración táctil (solo Android)
   —————————————————————————————————————— */
export async function vibrate(style = 'light') {
  if (!Platform.isCapacitor) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
    await Haptics.impact({ style: map[style] ?? ImpactStyle.Light });
  } catch { /* silencioso */ }
}

export async function vibrateNotification() {
  if (!Platform.isCapacitor) return;
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics');
    await Haptics.notification({ type: NotificationType.Success });
  } catch { /* silencioso */ }
}

/* ——————————————————————————————————————
   STATUS BAR — barra de estado Android
   —————————————————————————————————————— */
export async function setStatusBar(isDark) {
  if (!Platform.isCapacitor) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    await StatusBar.setBackgroundColor({
      color: isDark ? '#1a1814' : '#1a4fa0',
    });
  } catch { /* silencioso */ }
}

/* ——————————————————————————————————————
   KEYBOARD — teclado virtual
   —————————————————————————————————————— */
export async function initKeyboard() {
  if (!Platform.isCapacitor) return;
  try {
    const { Keyboard } = await import('@capacitor/keyboard');

    // Cuando el teclado aparece, hacer scroll al input
    Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.style.paddingBottom = info.keyboardHeight + 'px';
      const input = document.getElementById('chat-input');
      input?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.style.paddingBottom = '0';
    });
  } catch { /* silencioso */ }
}

/* ——————————————————————————————————————
   NETWORK — estado de red
   —————————————————————————————————————— */
export async function isOnline() {
  if (!Platform.isCapacitor) return navigator.onLine;
  try {
    const { Network } = await import('@capacitor/network');
    const status = await Network.getStatus();
    return status.connected;
  } catch {
    return navigator.onLine;
  }
}

export async function onNetworkChange(callback) {
  if (!Platform.isCapacitor) {
    window.addEventListener('online',  () => callback(true));
    window.addEventListener('offline', () => callback(false));
    return;
  }
  try {
    const { Network } = await import('@capacitor/network');
    Network.addListener('networkStatusChange', s => callback(s.connected));
  } catch { /* silencioso */ }
}

/* ——————————————————————————————————————
   PREFERENCES — storage nativo persistente
   (alternativa a localStorage en Capacitor)
   —————————————————————————————————————— */
export async function nativeGet(key) {
  if (!Platform.isCapacitor) return localStorage.getItem(key);
  try {
    const { Preferences } = await import('@capacitor/preferences');
    const { value } = await Preferences.get({ key });
    return value;
  } catch {
    return localStorage.getItem(key);
  }
}

export async function nativeSet(key, value) {
  if (!Platform.isCapacitor) { localStorage.setItem(key, value); return; }
  try {
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.set({ key, value: String(value) });
  } catch {
    localStorage.setItem(key, value);
  }
}

/* ——————————————————————————————————————
   APP — ciclo de vida (pausa/reanuda)
   —————————————————————————————————————— */
export async function initAppLifecycle({ onPause, onResume } = {}) {
  if (!Platform.isCapacitor) return;
  try {
    const { App } = await import('@capacitor/app');
    if (onPause)  App.addListener('pause',  onPause);
    if (onResume) App.addListener('resume', onResume);

    // Botón "atrás" de Android
    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) App.exitApp();
    });
  } catch { /* silencioso */ }
}

/* ——————————————————————————————————————
   SHARE — compartir conversación
   —————————————————————————————————————— */
export async function shareText(title, text) {
  if (!Platform.isCapacitor) {
    // Fallback web: copiar al portapapeles
    await navigator.clipboard.writeText(text).catch(() => {});
    return;
  }
  try {
    const { Share } = await import('@capacitor/share');
    await Share.share({ title, text, dialogTitle: 'Compartir conversación' });
  } catch { /* silencioso */ }
}
