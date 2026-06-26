import { clearApp, $ }                       from '../utils/dom.js';
import { validateRegister }                   from '../utils/validators.js';
import { register }                           from '../services/auth.js';
import { store, router }                      from '../app.js';
import { toggleTheme, getCurrentTheme }       from '../modules/theme.js';

export function mount() {
  const app = clearApp();

  app.innerHTML = `
    <div class="auth-screen">

      <button class="auth-theme-btn" id="auth-theme-btn"
              title="Cambiar tema" aria-label="Cambiar tema">
        ${themeIcon()}
      </button>

      <div class="auth-brand">
        <div class="auth-brand__logo">${solDeMayoSVG()}</div>
        <div class="auth-brand__name">Guyunusa</div>
        <p class="auth-brand__tagline">
          Una voz uruguaya que llegó al mundo sin perder su raíz.
        </p>
        <div class="auth-brand__stripes">
          ${Array.from({length:9},()=>'<span></span>').join('')}
        </div>
        <span class="auth-brand__footer">guyunusa.uy</span>
      </div>

      <div class="auth-form-panel">
        <div class="auth-form-wrap">
          <h2>Creá tu cuenta</h2>
          <p class="auth-subtitle">Gratis, sin tarjeta. Empezá ahora.</p>

          <div id="auth-alert" class="auth-alert" role="alert"></div>

          <form class="auth-form" id="register-form" novalidate>
            <div class="field">
              <label for="email">Email</label>
              <input class="input" type="email" id="email"
                     placeholder="vos@ejemplo.com" autocomplete="email"/>
              <span class="field-error" id="error-email"></span>
            </div>
            <div class="field">
              <label for="username">Nombre de usuario</label>
              <input class="input" type="text" id="username"
                     placeholder="tuapodo" autocomplete="username"/>
              <span class="field-error" id="error-username"></span>
            </div>
            <div class="field">
              <label for="password">Contraseña</label>
              <input class="input" type="password" id="password"
                     placeholder="Mínimo 6 caracteres" autocomplete="new-password"/>
              <span class="field-error" id="error-password"></span>
            </div>
            <button class="btn btn--primary" type="submit" id="submit-btn">
              Crear cuenta
            </button>
          </form>

          <p class="auth-switch">
            ¿Ya tenés cuenta? <a href="#/login">Ingresá acá</a>
          </p>
        </div>
      </div>

    </div>
  `;

  $('#auth-theme-btn')?.addEventListener('click', function() {
    toggleTheme();
    this.innerHTML = themeIcon();
  });

  const form      = $('#register-form');
  const submitBtn = $('#submit-btn');
  const alertEl   = $('#auth-alert');

  function showFieldError(field, msg) {
    $(`#${field}`)?.classList.toggle('error', !!msg);
    const errEl = $(`#error-${field}`);
    if (errEl) errEl.textContent = msg || '';
  }

  function clearErrors() {
    ['email','username','password'].forEach(f => showFieldError(f, ''));
    alertEl.className   = 'auth-alert';
    alertEl.textContent = '';
  }

  function showAlert(msg, type = 'error') {
    alertEl.className   = `auth-alert ${type}`;
    alertEl.textContent = msg;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const email    = $('#email').value.trim();
    const username = $('#username').value.trim();
    const password = $('#password').value;
    const errors   = validateRegister({ email, username, password });

    if (Object.keys(errors).length) {
      Object.entries(errors).forEach(([f, m]) => showFieldError(f, m));
      return;
    }

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Creando cuenta...';

    try {
      await register(email, username, password, store);
      router.navigate('/');
    } catch (err) {
      showAlert(err.message || 'No se pudo crear la cuenta. Intentá de nuevo.');
    } finally {
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Crear cuenta';
    }
  });
}

function themeIcon() {
  const dark = getCurrentTheme() === 'dark';
  return dark
    ? `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708"/>
      </svg>`
    : `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M6 .278a.77.77 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.792-.001 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278"/>
      </svg>`;
}

function solDeMayoSVG() {
  return `<img src="assets/icons/guyunusa.ico" alt="Guyunusa"
               style="width:90px;height:90px;border-radius:50%;object-fit:contain;"/>`;
}
