/**
 * langBanner.js — Banner de detección de idioma del navegador
 *
 * Aparece UNA SOLA VEZ cuando el idioma del navegador difiere
 * del idioma activo (español por defecto).
 * El usuario elige: cambiar al idioma detectado, quedarse en español,
 * o descartar para más adelante.
 */
import { checkLangPrompt, markPrompted,
         setLang, langName, t }  from '../modules/i18n.js';
import { EventBus }              from '../modules/eventBus.js';

export function maybeShowLangBanner() {
  const info = checkLangPrompt();
  if (!info) return;

  const { detected } = info;
  const tr = t();

  // Nombre legible del idioma detectado (en el idioma detectado mismo)
  const detectedName = langName(detected);

  const banner = document.createElement('div');
  banner.className = 'c-lang-banner';
  banner.id = 'lang-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Language detected');

  banner.innerHTML = `
    <div class="c-lang-banner__text">
      ${tr.i18n.detected(detectedName)}<br>
      <strong>${tr.i18n.question}</strong>
    </div>
    <div class="c-lang-banner__actions">
      <button class="c-lang-banner__btn c-lang-banner__btn--primary" id="lang-switch">
        ${tr.i18n.switchTo(detectedName)}
      </button>
      <button class="c-lang-banner__btn" id="lang-keep">
        ${tr.i18n.keepSpanish}
      </button>
    </div>
    <button class="c-lang-banner__dismiss" id="lang-later">
      ${tr.i18n.later}
    </button>
  `;

  document.body.appendChild(banner);

  // Cambiar al idioma detectado
  document.getElementById('lang-switch')?.addEventListener('click', async () => {
    markPrompted();
    await setLang(detected);
    banner.remove();
    // Re-montar la página actual para que se vea en el nuevo idioma
    EventBus.emit('lang:changed', detected);
  });

  // Quedarse en español
  document.getElementById('lang-keep')?.addEventListener('click', () => {
    markPrompted();
    banner.remove();
  });

  // Más adelante — no marcar como prompted para volver a mostrar luego
  document.getElementById('lang-later')?.addEventListener('click', () => {
    banner.remove();
  });
}
