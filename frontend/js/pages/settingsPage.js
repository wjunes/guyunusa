import { clearApp, $, $$ }   from '../utils/dom.js';
import { store, router }      from '../app.js';
import { logout }             from '../services/auth.js';
import { api }                from '../services/api.js';
import { setTheme, getCurrentTheme, onThemeChange } from '../modules/theme.js';
import { t, getLang }         from '../modules/i18n.js';
import { renderLangSelector } from '../components/langSelector.js';
import { initial }            from '../utils/helpers.js';
import { Platform }           from '../modules/native.js';
import { openPaymentModal }    from '../components/paymentModal.js';
import { FREE_DAILY_LIMIT }   from '../../../shared/constants.js';

const APP_VERSION = '1.0.0';

/* helpers */
function escHTML(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function initial_(n) { return (String(n||'')[0] || '?').toUpperCase(); }
function platformLabel() {
  if (Platform.isCapacitor) return 'Android';
  if (Platform.isElectron)  return 'Desktop';
  return 'Web';
}

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
            style="color:${icon==='✓'?'var(--color-mate)':'var(--text-muted)'}">${icon}</span>
      <span style="${icon==='✗'?'color:var(--text-muted)':''}">${text}</span>
    </div>`).join('');
}

function featuresPro() {
  return [
    ['✓','Mensajes ilimitados'],
    ['✓','Prioridad en respuestas'],
    ['✓','Acceso a todos los modelos'],
    ['✓','Historial sin límite'],
    ['✓','Soporte prioritario'],
  ].map(([icon, text]) => `
    <div class="c-plan-card__feature">
      <span class="c-plan-card__feature-icon">${icon}</span>
      <span>${text}</span>
    </div>`).join('');
}

function themeOptionHTML(value, label, preview) {
  const active = (localStorage.getItem('guyunusa_theme') || 'system') === value;
  return `
    <div class="c-theme-option ${active ? 'c-theme-option--active' : ''}"
         data-theme="${value}" role="button" tabindex="0">
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
    <text x="26" y="22" text-anchor="middle" font-size="8"
          fill="#1a4fa0" font-family="system-ui">A</text>
  </svg>`;
}

/* ─── MOUNT ─── */
export function mount() {
  if (!store.get('user')) { router.navigate('/login'); return; }

  const app  = clearApp();
  const user = store.get('user') || {};
  const tr   = t() || {};
  const s    = tr.settings || {};

  app.innerHTML = `
  <div class="c-settings">

    <!-- ── Header ── -->
    <div class="c-settings__header">
      <a href="#/" class="c-settings__back" title="${s.back || 'Volver'}">
        <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
          <path fill-rule="evenodd"
            d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/>
        </svg>
      </a>
      <span class="c-settings__header-title">${s.title || 'Configuración'}</span>
    </div>

    <!-- ── Cuerpo ── -->
    <div class="c-settings__body">
      <div class="c-settings__inner">

        <!-- ① Perfil -->
        <div class="c-settings__section">
          <div class="c-settings__avatar-row">
            <div class="c-settings__avatar" id="s-avatar">${initial_(user.username)}</div>
            <div class="c-settings__avatar-info">
              <div class="c-settings__avatar-name">${escHTML(user.username)}</div>
              <div class="c-settings__avatar-email">${escHTML(user.email)}</div>
            </div>
            ${planBadge(user.plan)}
          </div>

          <div class="c-settings__section-title">${s.profileSection || 'Perfil'}</div>
          <div class="c-settings__section-body">
            <div class="field">
              <label for="s-username">${s.usernameLabel || 'Nombre de usuario'}</label>
              <input class="input" type="text" id="s-username"
                     value="${escHTML(user.username)}"
                     autocomplete="username" maxlength="30"/>
              <span class="field-error" id="err-username"></span>
            </div>
            <div class="field">
              <label for="s-email">${s.emailLabel || 'Email'}</label>
              <input class="input" type="email" id="s-email"
                     value="${escHTML(user.email)}" disabled/>
            </div>
            <div id="profile-feedback" class="c-settings__feedback"></div>
            <button class="btn btn--primary" id="save-profile-btn">
              ${s.saveProfile || 'Guardar cambios'}
            </button>
          </div>
        </div>

        <!-- ② Contraseña -->
        <div class="c-settings__section">
          <div class="c-settings__section-title">${s.passwordSection || 'Contraseña'}</div>
          <div class="c-settings__section-body">
            <div class="field">
              <label for="s-cur-pw">${s.currentPw || 'Contraseña actual'}</label>
              <input class="input" type="password" id="s-cur-pw"
                     placeholder="••••••••" autocomplete="current-password"/>
              <span class="field-error" id="err-cur-pw"></span>
            </div>
            <div class="field">
              <label for="s-new-pw">${s.newPw || 'Nueva contraseña'}</label>
              <input class="input" type="password" id="s-new-pw"
                     placeholder="${s.newPwMin || 'Mínimo 6 caracteres'}"
                     autocomplete="new-password"/>
              <span class="field-error" id="err-new-pw"></span>
            </div>
            <div class="field">
              <label for="s-confirm-pw">${s.confirmPw || 'Confirmar contraseña'}</label>
              <input class="input" type="password" id="s-confirm-pw"
                     placeholder="${s.repeatPw || 'Repetí la nueva contraseña'}"
                     autocomplete="new-password"/>
              <span class="field-error" id="err-confirm-pw"></span>
            </div>
            <div id="pw-feedback" class="c-settings__feedback"></div>
            <button class="btn btn--primary" id="save-pw-btn">
              ${s.savePw || 'Cambiar contraseña'}
            </button>
          </div>
        </div>

        <!-- ③ Apariencia -->
        <div class="c-settings__section">
          <div class="c-settings__section-title">${s.appearSection || 'Apariencia'}</div>
          <div class="c-settings__section-body">
            <div class="c-theme-selector" id="theme-selector">
              ${themeOptionHTML('light',  s.themeLight  || 'Claro',   previewLight())}
              ${themeOptionHTML('dark',   s.themeDark   || 'Oscuro',  previewDark())}
              ${themeOptionHTML('system', s.themeSystem || 'Sistema', previewSystem())}
            </div>
          </div>
        </div>

        <!-- ④ Idioma -->
        <div class="c-settings__section">
          <div class="c-settings__section-title">${s.langSection || 'Idioma'}</div>
          <div class="c-settings__section-body">
            <div id="lang-selector-container"></div>
          </div>
        </div>

        <!-- ⑤ Plan -->
        <div class="c-settings__section">
          <div class="c-settings__section-title">${s.planSection || 'Tu plan'}</div>
          <div class="c-settings__section-body">
            <div class="c-plan-card">
              <div class="c-plan-card__header">
                <span class="c-plan-card__name">
                  ${user.plan === 'pro' ? (s.proPlan||'✦ Plan Pro') : (s.freePlan||'Plan Gratuito')}
                </span>
                ${planBadge(user.plan)}
              </div>
              <div class="c-plan-card__features">
                ${user.plan === 'pro' ? featuresPro() : featuresFree()}
              </div>
            </div>
            ${user.plan !== 'pro' ? `
              <button class="btn btn--primary" id="upgrade-btn"
                      style="background:linear-gradient(135deg,#e8b84b,#c98f1a);border:none;margin-top:var(--space-sm)">
                ${s.upgradeBtn || '✦ Pasarte al plan Pro'}
              </button>` : ''}
          </div>
        </div>

        <!-- ⑥ Acerca de -->
        <div class="c-settings__section">
          <div class="c-settings__section-title">${s.aboutSection || 'Acerca de'}</div>
          <div class="c-settings__section-body" style="gap:var(--space-sm)">
            <div class="c-settings__row">
              <div class="c-settings__row-info">
                <div class="c-settings__row-label">${s.version || 'Versión'}</div>
              </div>
              <span style="font-size:var(--text-sm);color:var(--text-muted)">${APP_VERSION}</span>
            </div>
            <div class="c-settings__row">
              <div class="c-settings__row-info">
                <div class="c-settings__row-label">${s.platform || 'Plataforma'}</div>
              </div>
              <span style="font-size:var(--text-sm);color:var(--text-muted)">${platformLabel()}</span>
            </div>
            <div class="c-settings__row" style="border:none">
              <div class="c-settings__row-info">
                <div class="c-settings__row-label">${s.domain || 'Dominio'}</div>
              </div>
              <a href="https://guyunusa.uy" target="_blank"
                 style="font-size:var(--text-sm);color:var(--accent)">guyunusa.uy</a>
            </div>
          </div>
        </div>

        <!-- ⑦ Sesión y cuenta -->
        <div class="c-settings__section">
          <div class="c-settings__section-title">${s.sessionSection || 'Sesión y cuenta'}</div>
          <div class="c-settings__section-body" style="gap:var(--space-sm)">
            <button class="c-settings__danger-btn c-settings__danger-btn--logout" id="logout-btn">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"/>
                <path fill-rule="evenodd"
                  d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
              </svg>
              ${s.logoutBtn || 'Cerrar sesión'}
            </button>
            <button class="c-settings__danger-btn c-settings__danger-btn--delete" id="delete-account-btn">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
              </svg>
              ${s.deleteBtn || 'Eliminar cuenta'}
            </button>
          </div>
        </div>

        <div class="c-settings__version">
          Guyunusa v${APP_VERSION} · guyunusa.uy · ${s.footer || 'Hecho con 🧉 en Uruguay'}
        </div>

      </div>
    </div>
  </div>

  <!-- Modal eliminar cuenta -->
  <div class="c-modal-overlay u-hidden" id="delete-modal">
    <div class="c-modal" role="dialog" aria-modal="true">
      <div class="c-modal__title">${s.deleteTitle || '⚠ Eliminar cuenta'}</div>
      <div class="c-modal__body">
        ${s.deleteBody || 'Esta acción es permanente. Ingresá tu contraseña para confirmar.'}
        <div class="field" style="margin-top:var(--space-md)">
          <input class="input" type="password" id="delete-confirm-pw"
                 placeholder="••••••••"/>
          <span class="field-error" id="err-delete-pw"></span>
        </div>
      </div>
      <div class="c-modal__actions">
        <button class="btn btn--ghost" id="delete-cancel-btn">
          ${(tr.chat||{}).cancel || 'Cancelar'}
        </button>
        <button class="btn btn--primary" id="delete-confirm-btn"
                style="width:auto;background:#c0392b;">
          ${s.deleteConfirm || 'Eliminar cuenta'}
        </button>
      </div>
    </div>
  </div>
  `;

  /* ── Inicializar subcomponentes ── */
  renderLangSelector(document.getElementById('lang-selector-container'));
  initThemeSelector();
  bindEvents(s);
}

/* ─── THEME SELECTOR ─── */
function initThemeSelector() {
  const current = localStorage.getItem('guyunusa_theme') || 'system';
  markActiveTheme(current);

  $$('.c-theme-option').forEach(opt => {
    opt.addEventListener('click', () => {
      setTheme(opt.dataset.theme);
      markActiveTheme(opt.dataset.theme);
    });
    opt.addEventListener('keydown', e => { if (e.key === 'Enter') opt.click(); });
  });

  onThemeChange(() => {
    markActiveTheme(localStorage.getItem('guyunusa_theme') || 'system');
  });
}

function markActiveTheme(active) {
  $$('.c-theme-option').forEach(opt => {
    opt.classList.toggle('c-theme-option--active', opt.dataset.theme === active);
  });
}

/* ─── EVENTOS ─── */
function bindEvents(s) {

  /* Guardar perfil */
  $('#save-profile-btn')?.addEventListener('click', async () => {
    const username = $('#s-username').value.trim();
    clearField('s-username','err-username');
    hideFeedback('profile-feedback');

    if (username.length < 3) {
      showFieldError('s-username','err-username','Mínimo 3 caracteres');
      return;
    }
    const btn = $('#save-profile-btn');
    btn.disabled = true;
    btn.textContent = s.saving || 'Guardando...';
    try {
      const data = await api.put('/user', { username });
      store.update({ user: { ...store.get('user'), username: data.user.username } });
      $('#s-avatar').textContent = (data.user.username[0]||'?').toUpperCase();
      document.querySelector('.c-settings__avatar-name').textContent = data.user.username;
      showFeedback('profile-feedback', s.profileOk || '✓ Perfil actualizado', 'success');
    } catch (err) {
      showFeedback('profile-feedback', err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = s.saveProfile || 'Guardar cambios';
    }
  });

  /* Cambiar contraseña */
  $('#save-pw-btn')?.addEventListener('click', async () => {
    const cur  = $('#s-cur-pw').value;
    const nw   = $('#s-new-pw').value;
    const conf = $('#s-confirm-pw').value;
    clearField('s-cur-pw','err-cur-pw');
    clearField('s-new-pw','err-new-pw');
    clearField('s-confirm-pw','err-confirm-pw');
    hideFeedback('pw-feedback');

    let ok = true;
    if (!cur)      { showFieldError('s-cur-pw','err-cur-pw','Ingresá tu contraseña actual'); ok=false; }
    if (nw.length < 6) { showFieldError('s-new-pw','err-new-pw', s.newPwMin||'Mínimo 6 caracteres'); ok=false; }
    if (nw !== conf)   { showFieldError('s-confirm-pw','err-confirm-pw', s.pwNoMatch||'Las contraseñas no coinciden'); ok=false; }
    if (!ok) return;

    const btn = $('#save-pw-btn');
    btn.disabled = true;
    btn.textContent = s.changingPw || 'Cambiando...';
    try {
      await api.put('/user', { currentPassword: cur, newPassword: nw });
      $('#s-cur-pw').value = '';
      $('#s-new-pw').value = '';
      $('#s-confirm-pw').value = '';
      showFeedback('pw-feedback', s.pwOk || '✓ Contraseña actualizada', 'success');
    } catch (err) {
      showFeedback('pw-feedback', err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = s.savePw || 'Cambiar contraseña';
    }
  });

  /* Upgrade (placeholder) */
  $('#upgrade-btn')?.addEventListener('click', () => openPaymentModal());

  /* Cerrar sesión */
  $('#logout-btn')?.addEventListener('click', () => {
    logout(store);
    router.navigate('/login');
  });

  /* Abrir modal de eliminar */
  $('#delete-account-btn')?.addEventListener('click', () => {
    $('#delete-modal')?.classList.remove('u-hidden');
    setTimeout(() => $('#delete-confirm-pw')?.focus(), 50);
  });

  /* Cerrar modal */
  $('#delete-cancel-btn')?.addEventListener('click', closeDeleteModal);
  $('#delete-modal')?.addEventListener('click', e => {
    if (e.target === $('#delete-modal')) closeDeleteModal();
  });

  /* Confirmar eliminar */
  $('#delete-confirm-btn')?.addEventListener('click', async () => {
    const pw  = $('#delete-confirm-pw').value;
    const btn = $('#delete-confirm-btn');
    clearField('delete-confirm-pw','err-delete-pw');

    if (!pw) { showFieldError('delete-confirm-pw','err-delete-pw','Ingresá tu contraseña'); return; }

    btn.disabled = true;
    btn.textContent = s.deleting || 'Eliminando...';
    try {
      await api.delete('/user', { password: pw });
      logout(store);
      router.navigate('/login');
    } catch (err) {
      showFieldError('delete-confirm-pw','err-delete-pw', err.message);
      btn.disabled = false;
      btn.textContent = s.deleteConfirm || 'Eliminar cuenta';
    }
  });
}

function closeDeleteModal() {
  $('#delete-modal')?.classList.add('u-hidden');
  const el = $('#delete-confirm-pw');
  if (el) el.value = '';
  clearField('delete-confirm-pw','err-delete-pw');
}

/* ─── UI helpers ─── */
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
  el.className = `c-settings__feedback ${type}`;
  el.textContent = msg;
  setTimeout(() => { if (el) el.className = 'c-settings__feedback'; }, 4000);
}
function hideFeedback(id) {
  const el = $(`#${id}`);
  if (el) el.className = 'c-settings__feedback';
}
