// Servicio de IA con failover automático: OpenRouter → DeepSeek
import { logger } from '../utils/logger.js';
import { AI_PROVIDERS } from '../../../shared/constants.js';

const PROVIDERS = {
  [AI_PROVIDERS.OPENROUTER]: {
    baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    apiKey:  process.env.OPENROUTER_API_KEY,
    model:   process.env.OPENROUTER_MODEL   || 'deepseek/deepseek-chat',
    headers: {
      'HTTP-Referer': 'https://guyunusa.uy',
      'X-Title':      'Guyunusa',
    },
  },
  [AI_PROVIDERS.DEEPSEEK]: {
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    apiKey:  process.env.DEEPSEEK_API_KEY,
    model:   process.env.DEEPSEEK_MODEL    || 'deepseek-chat',
    headers: {},
  },
};

async function callProvider(providerKey, messages, stream = false) {
  const provider = PROVIDERS[providerKey];
  if (!provider.apiKey) throw new Error(`API key no configurada para ${providerKey}`);

  const response = await fetch(`${provider.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${provider.apiKey}`,
      ...provider.headers,
    },
    body: JSON.stringify({
      model:    provider.model,
      messages,
      stream,
      temperature: 0.8,
      max_tokens:  2048,
    }),
    signal: AbortSignal.timeout(30_000), // 30s timeout
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`${providerKey} error ${response.status}: ${err}`);
  }

  return response;
}

// Chat sin streaming — devuelve el texto completo
export async function chat(messages) {
  const order = [AI_PROVIDERS.OPENROUTER, AI_PROVIDERS.DEEPSEEK];
  let lastError;

  for (const providerKey of order) {
    try {
      logger.info(`Intentando proveedor: ${providerKey}`);
      const response  = await callProvider(providerKey, messages, false);
      const data      = await response.json();
      const content   = data.choices?.[0]?.message?.content ?? '';
      const tokens    = data.usage?.total_tokens ?? 0;

      logger.info(`Respuesta OK desde ${providerKey} (${tokens} tokens)`);
      return { content, provider: providerKey, tokens };
    } catch (err) {
      logger.warn(`Proveedor ${providerKey} falló: ${err.message}`);
      lastError = err;
    }
  }

  throw new Error(`Todos los proveedores fallaron. Último error: ${lastError?.message}`);
}

// Chat con streaming — devuelve la respuesta fetch para que el controller la pipe
export async function chatStream(messages) {
  const order = [AI_PROVIDERS.OPENROUTER, AI_PROVIDERS.DEEPSEEK];
  let lastError;

  for (const providerKey of order) {
    try {
      logger.info(`Streaming desde: ${providerKey}`);
      const response = await callProvider(providerKey, messages, true);
      return { response, provider: providerKey };
    } catch (err) {
      logger.warn(`Stream ${providerKey} falló: ${err.message}`);
      lastError = err;
    }
  }

  throw new Error(`Streaming no disponible. Último error: ${lastError?.message}`);
}
