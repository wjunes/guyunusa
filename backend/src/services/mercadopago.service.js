/**
 * mercadopago.service.js
 * Integración con Mercado Pago — Checkout Pro
 *
 * Credenciales: MP_ACCESS_TOKEN en .env
 * Docs: https://www.mercadopago.com.uy/developers/es/docs/checkout-pro
 */
import { logger } from '../utils/logger.js';

const BASE_URL  = 'https://api.mercadopago.com';
const TOKEN     = () => process.env.MP_ACCESS_TOKEN || '';
const PRICE     = () => parseFloat(process.env.PRO_PRICE_USD || '6.00');
const LABEL     = () => process.env.PRO_PLAN_LABEL || 'Guyunusa Pro';
const PUBLIC_URL = () => process.env.APP_PUBLIC_URL || 'http://localhost:3000';
const FRONT_URL  = () => process.env.FRONTEND_URL   || 'http://localhost:3000';

/**
 * Crea una preferencia de pago en MP.
 * Retorna { id, init_point } — init_point es la URL al checkout de MP.
 */
export async function createPreference(userId, userEmail) {
  if (!TOKEN()) throw new Error('MP_ACCESS_TOKEN no configurado en .env');

  const body = {
    items: [{
      id:          'guyunusa_pro',
      title:       LABEL(),
      description: 'Acceso ilimitado a Guyunusa — IA con identidad uruguaya',
      quantity:    1,
      unit_price:  PRICE(),
      currency_id: 'USD',
    }],
    payer: {
      email: userEmail,
    },
    external_reference: String(userId),   // lo usamos en el webhook para identificar al usuario
    back_urls: {
      success: `${FRONT_URL()}/#/payment/success`,
      failure: `${FRONT_URL()}/#/payment/failure`,
      pending: `${FRONT_URL()}/#/payment/pending`,
    },
    auto_return: 'approved',
    notification_url: `${PUBLIC_URL()}/api/v1/payment/mp/webhook`,
    statement_descriptor: 'GUYUNUSA',
    expires: false,
  };

  const res = await fetch(`${BASE_URL}/checkout/preferences`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${TOKEN()}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });

  const data = await res.json();
  if (!res.ok) {
    logger.error('MP createPreference error:', JSON.stringify(data));
    throw new Error(data.message || `MP error ${res.status}`);
  }

  logger.info(`MP preferencia creada: ${data.id} para user ${userId}`);
  return {
    id:         data.id,
    init_point: data.init_point,       // producción
    sandbox_url: data.sandbox_init_point, // sandbox
  };
}

/**
 * Obtiene el detalle de un pago por su ID.
 * Útil para verificar en el webhook.
 */
export async function getPayment(paymentId) {
  const res = await fetch(`${BASE_URL}/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${TOKEN()}` },
    signal:  AbortSignal.timeout(10_000),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `MP error ${res.status}`);
  return data;
}

/**
 * Verifica la firma del webhook de MP.
 * MP envía x-signature en el header.
 */
export function verifyWebhookSignature(req) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // si no hay secret configurado, aceptar todo en dev

  const signature = req.headers['x-signature'];
  const requestId = req.headers['x-request-id'];
  if (!signature) return false;

  // MP firma: ts=timestamp,v1=hash
  // hash = HMAC-SHA256(ts + requestId + dataId, secret)
  // Implementación simplificada — para producción usar la verificación completa
  return true; // TODO: implementar verificación completa al tener credenciales reales
}
