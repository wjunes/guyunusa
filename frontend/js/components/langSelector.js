/**
 * langSelector.js — Selector visual de idioma para la página de settings
 */
import { getLang, setLang }  from '../modules/i18n.js';
import { EventBus }          from '../modules/eventBus.js';

const LANGS = [
  { code: 'es', label: 'Español',    flag: '🇺🇾' },
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'pt', label: 'Português',  flag: '🇧🇷' },
];

/** Renderiza el selector dentro del elemento dado */
export function renderLangSelector(container) {
  if (!container) return;

  const current = getLang();

  container.innerHTML = `
    <div class="c-lang-selector">
      ${LANGS.map(l => `
        <button class="c-lang-option ${l.code === current ? 'c-lang-option--active' : ''}"
                data-lang="${l.code}" title="${l.label}">
          <span class="c-lang-option__flag">${l.flag}</span>
          <span class="c-lang-option__label">${l.label}</span>
          ${l.code === current ? '<span class="c-lang-option__check">✓</span>' : ''}
        </button>
      `).join('')}
    </div>
  `;

  container.querySelectorAll('.c-lang-option').forEach(btn => {
    btn.addEventListener('click', async () => {
      const code = btn.dataset.lang;
      if (code === getLang()) return;
      await setLang(code);
      renderLangSelector(container); // re-renderizar para actualizar activo
      EventBus.emit('lang:changed', code);
    });
  });
}
