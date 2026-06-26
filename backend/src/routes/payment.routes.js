import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  mpCreate, mpWebhook, mpSuccess,
  paypalCreate, paypalCapture, paypalWebhook,
  paymentStatus,
} from '../controllers/payment.controller.js';

const router = Router();

/* Estado del plan (protegido) */
router.get('/status', requireAuth, paymentStatus);

/* Mercado Pago */
router.post('/mp/create',  requireAuth, mpCreate);
router.post('/mp/webhook', mpWebhook);          // MP llama sin auth
router.get('/mp/success',  mpSuccess);           // redirect de vuelta

/* PayPal */
router.post('/paypal/create',  requireAuth, paypalCreate);
router.get('/paypal/capture',  paypalCapture);  // redirect de vuelta
router.post('/paypal/webhook', paypalWebhook);  // PayPal llama sin auth

export default router;
