/**
 * paymentModal.js — Modal de selección y proceso de pago
 * Opciones: Mercado Pago | PayPal
 */
import { api }     from '../services/api.js';
import { store }   from '../app.js';
import { t }       from '../modules/i18n.js';

const PRICE = '6.00';

export function openPaymentModal() {
  // Evitar doble apertura
  if (document.getElementById('payment-modal-overlay')) return;

  const overlay = document.createElement('div');
  overlay.className = 'c-modal-overlay';
  overlay.id = 'payment-modal-overlay';

  overlay.innerHTML = `
    <div class="c-payment-modal" role="dialog" aria-modal="true"
         aria-label="Suscribirse al plan Pro">

      <!-- Header -->
      <div class="c-payment-modal__header">
        <div class="c-payment-modal__badge">✦ Pro</div>
        <h2 class="c-payment-modal__title">Guyunusa Pro</h2>
        <p class="c-payment-modal__subtitle">
          Mensajes ilimitados · Sin restricciones · USD ${PRICE}/mes
        </p>
      </div>

      <!-- Features -->
      <ul class="c-payment-modal__features">
        <li><span class="c-payment-modal__check">✓</span> Mensajes ilimitados por día</li>
        <li><span class="c-payment-modal__check">✓</span> Prioridad en las respuestas</li>
        <li><span class="c-payment-modal__check">✓</span> Acceso a todos los modelos de IA</li>
        <li><span class="c-payment-modal__check">✓</span> Historial de conversaciones sin límite</li>
        <li><span class="c-payment-modal__check">✓</span> Soporte prioritario</li>
      </ul>

      <!-- Divider -->
      <div class="c-payment-modal__divider">Elegí tu medio de pago</div>

      <!-- Opciones de pago -->
      <div class="c-payment-modal__methods">

        <!-- Mercado Pago -->
        <button class="c-payment-modal__method" id="pay-mp" data-provider="mp">
          <div class="c-payment-modal__method-icon c-payment-modal__method-icon--mp">
            ${iconMP()}
          </div>
          <div class="c-payment-modal__method-info">
            <strong>Mercado Pago</strong>
            <span>Tarjeta, débito, transferencia, efectivo</span>
          </div>
          <svg class="c-payment-modal__method-arrow" width="14" height="14"
               viewBox="0 0 16 16" fill="currentColor">
            <path fill-rule="evenodd"
              d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/>
          </svg>
        </button>

        <!-- PayPal -->
        <button class="c-payment-modal__method" id="pay-paypal" data-provider="paypal">
          <div class="c-payment-modal__method-icon c-payment-modal__method-icon--paypal">
            ${iconPayPal()}
          </div>
          <div class="c-payment-modal__method-info">
            <strong>PayPal</strong>
            <span>Tarjeta de crédito o cuenta PayPal</span>
          </div>
          <svg class="c-payment-modal__method-arrow" width="14" height="14"
               viewBox="0 0 16 16" fill="currentColor">
            <path fill-rule="evenodd"
              d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/>
          </svg>
        </button>
      </div>

      <!-- Estado de carga / error -->
      <div class="c-payment-modal__status u-hidden" id="payment-status"></div>

      <!-- Seguridad -->
      <p class="c-payment-modal__security">
        🔒 Pago seguro · No guardamos datos de tarjeta · Podés cancelar cuando quieras
      </p>

      <button class="c-payment-modal__close" id="payment-close">Cancelar</button>
    </div>
  `;

  document.body.appendChild(overlay);

  /* ── Eventos ── */
  const close = () => overlay.remove();

  document.getElementById('payment-close')?.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  document.getElementById('pay-mp')?.addEventListener('click',
    () => handlePayment('mp', overlay));

  document.getElementById('pay-paypal')?.addEventListener('click',
    () => handlePayment('paypal', overlay));
}

async function handlePayment(provider, overlay) {
  const statusEl = document.getElementById('payment-status');
  const btnMP    = document.getElementById('pay-mp');
  const btnPP    = document.getElementById('pay-paypal');

  // UI de carga
  statusEl.className = 'c-payment-modal__status c-payment-modal__status--loading';
  statusEl.textContent = provider === 'mp'
    ? 'Conectando con Mercado Pago...'
    : 'Conectando con PayPal...';

  btnMP.disabled = true;
  btnPP.disabled = true;

  try {
    if (provider === 'mp') {
      const data = await api.post('/payment/mp/create', {});
      // Redirigir al checkout de Mercado Pago
      window.location.href = data.checkout_url;
    } else {
      const data = await api.post('/payment/paypal/create', {});
      // Redirigir al checkout de PayPal
      window.location.href = data.approve_url;
    }
  } catch (err) {
    statusEl.className = 'c-payment-modal__status c-payment-modal__status--error';
    statusEl.textContent = `Error: ${err.message}`;
    btnMP.disabled = false;
    btnPP.disabled = false;
  }
}

/* ── Manejar resultado del pago (cuando vuelve el redirect) ── */
export async function handlePaymentReturn() {
  const hash = window.location.hash;

  if (hash.startsWith('#/payment/success')) {
    const provider = new URLSearchParams(hash.split('?')[1]).get('provider');
    showPaymentResult('success', provider);

    // Actualizar el plan en el store
    try {
      const data = await api.get('/payment/status');
      if (data.plan === 'pro') {
        store.update({ user: { ...store.get('user'), plan: 'pro' } });
      }
    } catch { /* silencioso */ }

    // Limpiar el hash y navegar al chat
    setTimeout(() => { window.location.hash = '/'; }, 3500);

  } else if (hash.startsWith('#/payment/failure')) {
    showPaymentResult('failure');
    setTimeout(() => { window.location.hash = '/settings'; }, 3500);

  } else if (hash.startsWith('#/payment/cancelled')) {
    window.location.hash = '/settings';

  } else if (hash.startsWith('#/payment/pending')) {
    showPaymentResult('pending');
    setTimeout(() => { window.location.hash = '/'; }, 4000);
  }
}

function showPaymentResult(type, provider) {
  const app = document.getElementById('app');
  if (!app) return;

  const configs = {
    success: {
      icon:  '✅',
      title: '¡Pago exitoso!',
      msg:   `Tu plan Pro está activo. ¡Bienvenido, ${store.get('user')?.username || ''}!`,
      color: 'var(--color-mate)',
      bg:    'var(--color-mate-light)',
    },
    failure: {
      icon:  '❌',
      title: 'El pago no se procesó',
      msg:   'Podés intentarlo de nuevo desde Configuración.',
      color: '#c0392b',
      bg:    '#fdf0ef',
    },
    pending: {
      icon:  '⏳',
      title: 'Pago pendiente',
      msg:   'Tu pago está siendo procesado. Te avisaremos cuando se confirme.',
      color: '#e67e22',
      bg:    '#fef9f0',
    },
  };

  const cfg = configs[type] || configs.success;

  app.innerHTML = `
    <div style="
      min-height:100vh;display:flex;flex-direction:column;
      align-items:center;justify-content:center;
      gap:var(--space-md);padding:var(--space-xl);
      background:var(--bg-app);text-align:center;">
      <div style="font-size:56px;line-height:1;">${cfg.icon}</div>
      <h2 style="font-size:var(--text-xl);color:var(--text-primary);">${cfg.title}</h2>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);max-width:320px;">
        ${cfg.msg}
      </p>
      <div style="
        padding:8px 16px;border-radius:var(--radius-md);
        background:${cfg.bg};color:${cfg.color};
        font-size:var(--text-sm);font-weight:var(--weight-medium);">
        Redirigiendo en un momento...
      </div>
    </div>
  `;
}

/* ── Íconos ── */
function iconMP() {
  // Logotipo simplificado de Mercado Pago en SVG
  return `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#009EE3"/>
    <text x="16" y="22" text-anchor="middle" font-size="13" font-weight="bold"
          font-family="system-ui" fill="white">MP</text>
  </svg>`;
}

function iconPayPal() {
  return `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#003087"/>
    <text x="16" y="22" text-anchor="middle" font-size="11" font-weight="bold"
          font-family="system-ui" fill="white">PayPal</text>
  </svg>`;
}
