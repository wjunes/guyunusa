import { clearApp, $, $$ }                from '../utils/dom.js';
import { store, router }                   from '../app.js';
import { logout }                          from '../services/auth.js';
import { api }                             from '../services/api.js';
import { setTheme, getCurrentTheme,
         onThemeChange }                   from '../modules/theme.js';
import { initial }                         from '../utils/helpers.js';
import { Platform }                        from '../modules/native.js';
import { FREE_DAILY_LIMIT }                from '../../../shared/constants.js';

const APP_VERSION = '1.0.0';

export function mount() {
  if (!store.get('user')) { router.navigate('/login'); return; }

  const app  = clearApp();
  const user = store.get('user') || {};

  app.innerHTML = `
    <div class="c-settings">

      <!-- Header -->
      <div class="c-settings__header">
        <a href="#/" class="c-settings__back" title="Volver al chat">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
            <path fill-rule="evenodd"
              d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/>
          </svg>
        </a>
        <span class="c-settings__header-title">Configuración</span>
      </div>

      <!-- Cuerpo -->
      <div class="c-settings__body">
        <div class="c-settings__inner">

          <!-- ① Perfil -->
          <div class="c-settings__section">
            <div class="c-settings__avatar-row">
              <div class="c-settings__avatar" id="avatar-letter">
                ${initial(user.username)}
              </div>
              <div class="c-settings__avatar-info">
                <div class="c-settings__avatar-name">${escHTML(user.username || '')}</div>
                <div class="c-settings__avatar-email">${escHTML(user.email || '')}</div>
              </div>
              ${planBadge(user.plan)}
            </div>

            <div class="c-settings__section-title">Datos del perfil</div>
            <div class="c-settings__section-body">
              <div class="field">
                <label for="s-username">Nombre de usuario</label>
                <input class="input" type="text" id="s-username"
                       value="${escHTML(user.username || '')}"
                       autocomplete="username" maxlength="30"/>
                <span class="field-error" id="err-username"></span>
              </div>

              <div class="field">
                <label for="s-email">Email</label>
                <input class="input" type="email" id="s-email"
                       value="${escHTML(user.email || '')}" disabled/>
              </div>

              <div id="profile-feedback" class="c-settings__feedback"></div>

              <button class="btn btn--primary" id="save-profile-btn">
                Guardar cambios
              </button>
            </div>
          </div>

          <!-- ② Contraseña -->
          <div class="c-settings__section">
            <div class="c-settings__section-title">Contraseña</div>
            <div class="c-settings__section-body">
              <div class="field">
                <label for="s-current-pw">Contraseña actual</label>
                <input class="input" type="password" id="s-current-pw"
                       placeholder="••••••••" autocomplete="current-password"/>
                <span class="field-error" id="err-current-pw"></span>
              </div>
              <div class="field">
                <label for="s-new-pw">Nueva contraseña</label>
                <input class="input" type="password" id="s-new-pw"
                       placeholder="Mínimo 6 caracteres" autocomplete="new-password"/>
                <span class="field-error" id="err-new-pw"></span>
              </div>
              <div class="field">
                <label for="s-confirm-pw">Confirmar contraseña</label>
                <input class="input" type="password" id="s-confirm-pw"
                       placeholder="Repetí la nueva contraseña" autocomplete="new-password"/>
                <span class="field-error" id="err-confirm-pw"></span>
              </div>

              <div id="pw-feedback" class="c-settings__feedback"></div>

              <button class="btn btn--primary" id="save-pw-btn">
                Cambiar contraseña
              </button>
            </div>
          </div>

          <!-- ③ Apariencia -->
          <div class="c-settings__section">
            <div class="c-settings__section-title">Apariencia</div>
            <div class="c-settings__section-body">
              <div class="c-theme-selector" id="theme-selector">
                ${themeOptionHTML('light',  'Claro',   previewLight())}
                ${themeOptionHTML('dark',   'Oscuro',  previewDark())}
                ${themeOptionHTML('system', 'Sistema', previewSystem())}
              </div>
            </div>
          </div>

          <!-- ④ Plan -->
          <div class="c-settings__section">
            <div class="c-settings__section-title">Tu plan</div>
            <div class="c-settings__section-body">
              <div class="c-plan-card">
                <div class="c-plan-card__header">
                  <span class="c-plan-card__name">
                    ${user.plan === 'pro' ? '✦ Plan Pro' : 'Plan Gratuito'}
                  </span>
                  ${planBadge(user.plan)}
                </div>
                <div class="c-plan-card__features">
                  ${user.plan === 'pro' ? featuresPro() : featuresFree()}
                </div>
              </div>
              ${user.plan !== 'pro' ? `
                <button class="btn btn--primary" id="upgrade-btn"
                        style="background:linear-gradient(135deg,#e8b84b,#c98f1a);border:none;">
                  ✦ Pasarte al plan Pro
                </button>
              ` : ''}
            </div>
          </div>

          <!-- ⑤ Acerca de -->
          <div class="c-settings__section">
            <div class="c-settings__section-title">Acerca de</div>
            <div class="c-settings__section-body" style="gap:var(--space-sm)">
              <div class="c-settings__row">
                <div class="c-settings__row-info">
                  <div class="c-settings__row-label">Versión</div>
                </div>
                <span style="font-size:var(--text-sm);color:var(--text-muted)">
                  ${APP_VERSION}
                </span>
              </div>
              <div class="c-settings__row">
                <div class="c-settings__row-info">
                  <div class="c-settings__row-label">Plataforma</div>
                </div>
                <span style="font-size:var(--text-sm);color:var(--text-muted)">
                  ${platformLabel()}
                </span>
              </div>
              <div class="c-settings__row" style="border:none">
                <div class="c-settings__row-info">
                  <div class="c-settings__row-label">Dominio</div>
                </div>
                <a href="https://guyunusa.uy" target="_blank"
                   style="font-size:var(--text-sm);color:var(--accent)">
                  guyunusa.uy
                </a>
              </div>
            </div>
          </div>

          <!-- ⑥ Zona de peligro -->
          <div class="c-settings__section">
            <div class="c-settings__section-title">Sesión y cuenta</div>
            <div class="c-settings__section-body" style="gap:var(--space-sm)">
              <button class="c-settings__danger-btn c-settings__danger-btn--logout"
                      id="logout-btn">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
                  <path fill-rule="evenodd"
                    d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
                </svg>
                Cerrar sesión
              </button>

              <button class="c-settings__danger-btn c-settings__danger-btn--delete"
                      id="delete-account-btn">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                  <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                </svg>
                Eliminar cuenta
              </button>
            </div>
          </div>

          <div class="c-settings__version">
            Guyunusa v${APP_VERSION} · guyunusa.uy · Hecho con 🧉 en Uruguay
          </div>

        </div>
      </div>
    </div>

    <!-- Modal de confirmación eliminar cuenta -->
    <div class="c-modal-overlay u-hidden" id="delete-modal">
      <div class="c-modal" role="dialog" aria-modal="true">
        <div class="c-modal__title">⚠ Eliminar cuenta</div>
        <div class="c-modal__body">
          Esta acción es permanente. Se eliminarán tu cuenta y todas tus
          conversaciones. Para confirmar, ingresá tu contraseña.
          <div class="field" style="margin-top:var(--space-md)">
            <input class="input" type="password" id="delete-confirm-pw"
                   placeholder="Tu contraseña actual"/>
            <span class="field-error" id="err-delete-pw"></span>
          </div>
        </div>
        <div class="c-modal__actions">
          <button class="btn btn--ghost" id="delete-cancel-btn">Cancelar</button>
          <button class="btn btn--primary" id="delete-confirm-btn"
                  style="width:auto;background:#c0392b;">
            Eliminar cuenta
          </button>
        </div>
      </div>
    </div>
  `;

  bindEvents(user);
  initThemeSelector();
}

/* ——————————————————————————————————————————
   EVENTOS
   —————————————————————————————————————————— */
function bindEvents(user) {

  // — Guardar perfil (nombre de usuario) —
  $('#save-profile-btn')?.addEventListener('click', async () => {
    const username = $('#s-username').value.trim();
    const errEl    = $('#err-username');
    const feedback = $('#profile-feedback');

    clearField('s-username', 'err-username');
    hideFeedback('profile-feedback');

    if (username.length < 3) {
      showFieldError('s-username', 'err-username', 'Mínimo 3 caracteres');
      return;
    }

    const btn = $('#save-profile-btn');
    btn.disabled    = true;
    btn.textContent = 'Guardando...';

    try {
      const data = await api.put('/user', { username });
      store.update({ user: { ...store.get('user'), username: data.user.username } });
      // Actualizar avatar y nombre en pantalla
      $('#avatar-letter').textContent       = initial(data.user.username);
      document.querySelector('.c-settings__avatar-name').textContent = data.user.username;
      showFeedback('profile-feedback', '✓ Perfil actualizado', 'success');
    } catch (err) {
      showFeedback('profile-feedback', err.message, 'error');
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Guardar cambios';
    }
  });

  // — Cambiar contraseña —
  $('#save-pw-btn')?.addEventListener('click', async () => {
    const currentPw = $('#s-current-pw').value;
    const newPw     = $('#s-new-pw').value;
    const confirmPw = $('#s-confirm-pw').value;

    clearField('s-current-pw', 'err-current-pw');
    clearField('s-new-pw',     'err-new-pw');
    clearField('s-confirm-pw', 'err-confirm-pw');
    hideFeedback('pw-feedback');

    let valid = true;
    if (!currentPw) {
      showFieldError('s-current-pw', 'err-current-pw', 'Ingresá tu contraseña actual');
      valid = false;
    }
    if (newPw.length < 6) {
      showFieldError('s-new-pw', 'err-new-pw', 'Mínimo 6 caracteres');
      valid = false;
    }
    if (newPw !== confirmPw) {
      showFieldError('s-confirm-pw', 'err-confirm-pw', 'Las contraseñas no coinciden');
      valid = false;
    }
    if (!valid) return;

    const btn = $('#save-pw-btn');
    btn.disabled    = true;
    btn.textContent = 'Cambiando...';

    try {
      await api.put('/user', { currentPassword: currentPw, newPassword: newPw });
      $('#s-current-pw').value = '';
      $('#s-new-pw').value     = '';
      $('#s-confirm-pw').value = '';
      showFeedback('pw-feedback', '✓ Contraseña actualizada', 'success');
    } catch (err) {
      showFeedback('pw-feedback', err.message, 'error');
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Cambiar contraseña';
    }
  });

  // — Cerrar sesión —
  $('#logout-btn')?.addEventListener('click', () => {
    logout(store);
    router.navigate('/login');
  });

  // — Upgrade (placeholder) —
  $('#upgrade-btn')?.addEventListener('click', () => {
    alert('🧉 Plan Pro próximamente disponible en guyunusa.uy');
  });

  // — Modal eliminar cuenta —
  $('#delete-account-btn')?.addEventListener('click', () => {
    $('#delete-modal')?.classList.remove('u-hidden');
    setTimeout(() => $('#delete-confirm-pw')?.focus(), 50);
  });

  $('#delete-cancel-btn')?.addEventListener('click', () => {
    $('#delete-modal')?.classList.add('u-hidden');
    $('#delete-confirm-pw').value = '';
    clearField('delete-confirm-pw', 'err-delete-pw');
  });

  $('#delete-confirm-btn')?.addEventListener('click', async () => {
    const pw  = $('#delete-confirm-pw').value;
    const btn = $('#delete-confirm-btn');

    clearField('delete-confirm-pw', 'err-delete-pw');

    if (!pw) {
      showFieldError('delete-confirm-pw', 'err-delete-pw', 'Ingresá tu contraseña');
      return;
    }

    btn.disabled    = true;
    btn.textContent = 'Eliminando...';

    try {
      await api.delete('/user', { password: pw });
      logout(store);
      router.navigate('/login');
    } catch (err) {
      showFieldError('delete-confirm-pw', 'err-delete-pw', err.message);
      btn.disabled    = false;
      btn.textContent = 'Eliminar cuenta';
    }
  });

  // Cerrar modal al clickear overlay
  $('#delete-modal')?.addEventListener('click', (e) => {
    if (e.target === $('#delete-modal')) {
      $('#delete-modal')?.classList.add('u-hidden');
    }
  });
}

/* ——————————————————————————————————————————
   SELECTOR DE TEMA
   —————————————————————————————————————————— */
function initThemeSelector() {
  const current = localStorage.getItem('guyunusa_theme') || 'system';
  markActiveTheme(current);

  $$('.c-theme-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const t = opt.dataset.theme;
      setTheme(t);
      markActiveTheme(t);
    });
  });

  // Sincronizar si cambia desde otro lado
  onThemeChange(() => {
    markActiveTheme(localStorage.getItem('guyunusa_theme') || 'system');
  });
}

function markActiveTheme(active) {
  $$('.c-theme-option').forEach(opt => {
    opt.classList.toggle('c-theme-option--active', opt.dataset.theme === active);
  });
}

/* ——————————————————————————————————————————
   HELPERS
   —————————————————————————————————————————— */
function showFieldError(inputId, errId, msg) {
  $(`#${inputId}`)?.classList.add('error');
  const e = $(`#${errId}`);
  if (e) e.textContent = msg;
}
function clearField(inputId, errId) {
  $(`#${inputId}`)?.classList.remove('error');
  const e = $(`#${errId}`);
  if (e) e.textContent = '';
}
function showFeedback(id, msg, type) {
  const el = $(`#${id}`);
  if (!el) return;
  el.className   = `c-settings__feedback ${type}`;
  el.textContent = msg;
  setTimeout(() => hideFeedback(id), 4000);
}
function hideFeedback(id) {
  const el = $(`#${id}`);
  if (el) el.className = 'c-settings__feedback';
}
function escHTML(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function initial(name = '') { return (name[0] || '?').toUpperCase(); }

function platformLabel() {
  if (Platform.isCapacitor) return 'Android';
  if (Platform.isElectron)  return 'Desktop';
  return 'Web';
}

/* ——————————————————————————————————————————
   TEMPLATES HTML
   —————————————————————————————————————————— */
function planBadge(plan) {
  return plan === 'pro'
    ? `<span class="c-settings__plan-badge c-settings__plan-badge--pro">✦ Pro</span>`
    : `<span class="c-settings__plan-badge c-settings__plan-badge--free">Gratuito</span>`;
}

function featuresFree() {
  return [
    ['✓', `${FREE_DAILY_LIMIT} mensajes por día`],
    ['✓', 'Acceso a DeepSeek via OpenRouter'],
    ['✓', 'Historial de conversaciones'],
    ['✗', 'Mensajes ilimitados'],
    ['✗', 'Prioridad en respuestas'],
  ].map(([icon, text]) => `
    <div class="c-plan-card__feature">
      <span class="c-plan-card__feature-icon"
            style="color:${icon==='✓'?'var(--color-mate)':'var(--text-muted)'}">
        ${icon}
      </span>
      <span style="${icon==='✗'?'color:var(--text-muted)':''}">${text}</span>
    </div>`).join('');
}

function featuresPro() {
  return [
    ['✓', 'Mensajes ilimitados'],
    ['✓', 'Prioridad en respuestas'],
    ['✓', 'Acceso a todos los modelos'],
    ['✓', 'Historial sin límite'],
    ['✓', 'Soporte prioritario'],
  ].map(([icon, text]) => `
    <div class="c-plan-card__feature">
      <span class="c-plan-card__feature-icon">${icon}</span>
      <span>${text}</span>
    </div>`).join('');
}

function themeOptionHTML(value, label, preview) {
  return `
    <div class="c-theme-option" data-theme="${value}" role="button" tabindex="0">
      <div class="c-theme-option__preview">${preview}</div>
      <span class="c-theme-option__label">${label}</span>
    </div>`;
}

function previewLight() {
  return `<svg width="52" height="36" viewBox="0 0 52 36" xmlns="http://www.w3.org/2000/svg">
    <rect width="52" height="36" fill="#faf9f6"/>
    <rect x="0" y="0" width="14" height="36" fill="#f0ede6"/>
    <rect x="14" y="0" width="38" height="9" fill="#ffffff"/>
    <rect x="16" y="12" width="22" height="3" rx="1.5" fill="#dce8f8"/>
    <rect x="16" y="18" width="30" height="2" rx="1" fill="#e8e6df"/>
    <rect x="16" y="23" width="26" height="2" rx="1" fill="#e8e6df"/>
    <rect x="2" y="4" width="10" height="2" rx="1" fill="#cec9be"/>
    <rect x="2" y="9" width="10" height="2" rx="1" fill="#cec9be"/>
    <rect x="2" y="14" width="10" height="2" rx="1" fill="#cec9be"/>
  </svg>`;
}

function previewDark() {
  return `<svg width="52" height="36" viewBox="0 0 52 36" xmlns="http://www.w3.org/2000/svg">
    <rect width="52" height="36" fill="#1a1814"/>
    <rect x="0" y="0" width="14" height="36" fill="#1e1c18"/>
    <rect x="14" y="0" width="38" height="9" fill="#22201c"/>
    <rect x="16" y="12" width="22" height="3" rx="1.5" fill="#1a3060"/>
    <rect x="16" y="18" width="30" height="2" rx="1" fill="#2e2b24"/>
    <rect x="16" y="23" width="26" height="2" rx="1" fill="#2e2b24"/>
    <rect x="2" y="4" width="10" height="2" rx="1" fill="#3a3629"/>
    <rect x="2" y="9" width="10" height="2" rx="1" fill="#3a3629"/>
    <rect x="2" y="14" width="10" height="2" rx="1" fill="#3a3629"/>
  </svg>`;
}

function previewSystem() {
  return `<svg width="52" height="36" viewBox="0 0 52 36" xmlns="http://www.w3.org/2000/svg">
    <rect width="26" height="36" fill="#faf9f6"/>
    <rect x="26" width="26" height="36" fill="#1a1814"/>
    <line x1="26" y1="0" x2="26" y2="36" stroke="#1a4fa0" stroke-width="1"/>
    <rect x="0" y="0" width="7" height="36" fill="#f0ede6"/>
    <rect x="29" y="0" width="7" height="36" fill="#1e1c18"/>
    <rect x="8" y="12" width="12" height="2" rx="1" fill="#e8e6df"/>
    <rect x="30" y="12" width="12" height="2" rx="1" fill="#2e2b24"/>
    <text x="26" y="22" text-anchor="middle"
          font-size="8" fill="#1a4fa0" font-family="system-ui">A</text>
  </svg>`;
}
