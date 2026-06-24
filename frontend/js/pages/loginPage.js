import { clearApp, $ }                       from '../utils/dom.js';
import { validateLogin }                      from '../utils/validators.js';
import { login }                              from '../services/auth.js';
import { store, router }                      from '../app.js';
import { toggleTheme, getCurrentTheme }       from '../modules/theme.js';

export function mount() {
  const app = clearApp();

  app.innerHTML = `
    <div class="auth-screen">

      <!-- Botón tema flotante -->
      <button class="auth-theme-btn" id="auth-theme-btn"
              title="Cambiar tema" aria-label="Cambiar tema">
        ${themeIcon()}
      </button>

      <!-- Panel izquierdo: identidad -->
      <div class="auth-brand">
        <div class="auth-brand__logo">${solDeMayoSVG()}</div>
        <div class="auth-brand__name">Guyunusa</div>
        <p class="auth-brand__tagline">
          Una voz uruguaya que llegó al mundo sin perder su raíz.
        </p>
        <div class="auth-brand__stripes">
          ${Array.from({length: 9}, () => '<span></span>').join('')}
        </div>
        <span class="auth-brand__footer">guyunusa.uy</span>
      </div>

      <!-- Panel derecho: formulario -->
      <div class="auth-form-panel">
        <div class="auth-form-wrap">
          <h2>Bienvenido de vuelta</h2>
          <p class="auth-subtitle">Ingresá a tu cuenta para continuar</p>

          <div id="auth-alert" class="auth-alert" role="alert"></div>

          <form class="auth-form" id="login-form" novalidate>
            <div class="field">
              <label for="email">Email</label>
              <input class="input" type="email" id="email"
                     placeholder="vos@ejemplo.com" autocomplete="email"/>
              <span class="field-error" id="error-email"></span>
            </div>
            <div class="field">
              <label for="password">Contraseña</label>
              <input class="input" type="password" id="password"
                     placeholder="••••••••" autocomplete="current-password"/>
              <span class="field-error" id="error-password"></span>
            </div>
            <button class="btn btn--primary" type="submit" id="submit-btn">
              Ingresar
            </button>
          </form>

          <p class="auth-switch">
            ¿No tenés cuenta? <a href="#/register">Registrate</a>
          </p>
        </div>
      </div>

    </div>
  `;

  // Toggle tema
  $('#auth-theme-btn')?.addEventListener('click', function() {
    toggleTheme();
    this.innerHTML = themeIcon();
  });

  // Formulario
  const form      = $('#login-form');
  const submitBtn = $('#submit-btn');
  const alertEl   = $('#auth-alert');

  function showFieldError(field, msg) {
    $(`#${field}`)?.classList.toggle('error', !!msg);
    const errEl = $(`#error-${field}`);
    if (errEl) errEl.textContent = msg || '';
  }

  function clearErrors() {
    ['email','password'].forEach(f => showFieldError(f, ''));
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
    const password = $('#password').value;
    const errors   = validateLogin({ email, password });

    if (Object.keys(errors).length) {
      Object.entries(errors).forEach(([f, m]) => showFieldError(f, m));
      return;
    }

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Ingresando...';

    try {
      await login(email, password, store);
      router.navigate('/');
    } catch (err) {
      showAlert(err.message || 'No se pudo ingresar. Revisá tus datos.');
    } finally {
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Ingresar';
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
  return `
  <svg width="90" height="90" viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">
    <style>
      .sol-l { transform-origin: 45px 45px; animation: rotar-l 18s linear infinite; }
      @keyframes rotar-l { to { transform: rotate(360deg); } }
    </style>
    <g class="sol-l" opacity="0.85">
      ${Array.from({length:16},(_,i)=>{
        const a=(i*360/16)*Math.PI/180;
        const x1=(45+24*Math.cos(a)).toFixed(1), y1=(45+24*Math.sin(a)).toFixed(1);
        const x2=(45+38*Math.cos(a)).toFixed(1), y2=(45+38*Math.sin(a)).toFixed(1);
        const x3=(45+33*Math.cos(a)).toFixed(1), y3=(45+33*Math.sin(a)).toFixed(1);
        return i%2===0
          ? `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#e8b84b" stroke-width="3" stroke-linecap="round"/>`
          : `<line x1="${x1}" y1="${y1}" x2="${x3}" y2="${y3}" stroke="#e8b84b" stroke-width="1.5" stroke-linecap="round"/>`;
      }).join('')}
    </g>
    <circle cx="45" cy="45" r="20" fill="#e8b84b"/>
    <circle cx="45" cy="45" r="17" fill="#f0c96a"/>
    <circle cx="39" cy="43" r="2.2" fill="#b8860b"/>
    <circle cx="51" cy="43" r="2.2" fill="#b8860b"/>
    <path d="M39 51 Q45 56 51 51" stroke="#b8860b" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  </svg>`;
}
