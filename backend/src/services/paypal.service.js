/**
 * paypal.service.js
 * Integración con PayPal — Orders API v2
 * Sin SDK externo — fetch directo a la API REST
 *
 * Credenciales: PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET en .env
 * Docs: https://developer.paypal.com/docs/api/orders/v2/
 */
import { logger } from '../utils/logger.js';

const MODE      = () => process.env.PAYPAL_MODE || 'sandbox';
const BASE_URL  = () => MODE() === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';
const CLIENT_ID     = () => process.env.PAYPAL_CLIENT_ID     || '';
const CLIENT_SECRET = () => process.env.PAYPAL_CLIENT_SECRET || '';
const PRICE         = () => parseFloat(process.env.PRO_PRICE_USD || '6.00').toFixed(2);
const LABEL         = () => process.env.PRO_PLAN_LABEL || 'Guyunusa Pro';
const FRONT_URL     = () => process.env.FRONTEND_URL || 'http://localhost:3000';
const PUBLIC_URL    = () => process.env.APP_PUBLIC_URL || 'http://localhost:3000';

/* ── Obtener access token de PayPal ── */
async function getAccessToken() {
  if (!CLIENT_ID() || !CLIENT_SECRET()) {
    throw new Error('PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET no configurados en .env');
  }

  const credentials = Buffer.from(`${CLIENT_ID()}:${CLIENT_SECRET()}`).toString('base64');

  const res = await fetch(`${BASE_URL()}/v1/oauth2/token`, {
    method:  'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body:   'grant_type=client_credentials',
    signal: AbortSignal.timeout(10_000),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || `PayPal auth error ${res.status}`);
  return data.access_token;
}

/**
 * Crea una orden de pago en PayPal.
 * Retorna { id, approve_url } — approve_url redirige al usuario a PayPal.
 */
export async function createOrder(userId) {
  const token = await getAccessToken();

  const body = {
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id:  String(userId),
      description:   LABEL(),
      custom_id:     `user_${userId}`,   // lo usamos para identificar al usuario
      amount: {
        currency_code: 'USD',
        value:         PRICE(),
        breakdown: {
          item_total: { currency_code: 'USD', value: PRICE() },
        },
      },
      items: [{
        name:        LABEL(),
        description: 'Acceso ilimitado a Guyunusa — IA con identidad uruguaya',
        quantity:    '1',
        unit_amount: { currency_code: 'USD', value: PRICE() },
        category:    'DIGITAL_GOODS',
      }],
    }],
    payment_source: {
      paypal: {
        experience_context: {
          brand_name:          'Guyunusa',
          locale:              'es-UY',
          landing_page:        'LOGIN',
          shipping_preference: 'NO_SHIPPING',
          user_action:         'PAY_NOW',
          return_url: `${PUBLIC_URL()}/api/v1/payment/paypal/capture?user_id=${userId}`,
          cancel_url: `${FRONT_URL()}/#/payment/cancelled`,
        },
      },
    },
  };

  const res = await fetch(`${BASE_URL()}/v2/checkout/orders`, {
    method:  'POST',
    headers: {
      'Authorization':      `Bearer ${token}`,
      'Content-Type':       'application/json',
      'PayPal-Request-Id':  `guyunusa_${userId}_${Date.now()}`,
    },
    body:   JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });

  const data = await res.json();
  if (!res.ok) {
    logger.error('PayPal createOrder error:', JSON.stringify(data));
    throw new Error(data.message || `PayPal error ${res.status}`);
  }

  const approveLink = data.links?.find(l => l.rel === 'payer-action')?.href
                   || data.links?.find(l => l.rel === 'approve')?.href;

  logger.info(`PayPal orden creada: ${data.id} para user ${userId}`);
  return { id: data.id, approve_url: approveLink };
}

/**
 * Captura el pago de una orden aprobada.
 * Se llama cuando PayPal redirige de vuelta con el token.
 */
export async function captureOrder(orderId) {
  const token = await getAccessToken();

  const res = await fetch(`${BASE_URL()}/v2/checkout/orders/${orderId}/capture`, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
    },
    signal: AbortSignal.timeout(15_000),
  });

  const data = await res.json();
  if (!res.ok) {
    logger.error('PayPal captureOrder error:', JSON.stringify(data));
    throw new Error(data.message || `PayPal capture error ${res.status}`);
  }

  const unit   = data.purchase_units?.[0];
  const userId = unit?.reference_id || unit?.custom_id?.replace('user_', '');
  const status = data.status; // COMPLETED | DECLINED | ...

  logger.info(`PayPal orden capturada: ${orderId} status=${status} user=${userId}`);
  return { orderId, status, userId: userId ? Number(userId) : null, data };
}

/**
 * Verifica la firma de un webhook de PayPal.
 * (Se implementa completamente cuando se tienen las credenciales reales)
 */
export async function verifyWebhook(headers, body) {
  // TODO: implementar verificación con PAYPAL_WEBHOOK_ID
  return true;
}
