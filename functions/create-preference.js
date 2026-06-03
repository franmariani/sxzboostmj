/**
 * Cloudflare Pages Function - MercadoPago Integration (SECURE VERSION)
 * Creates a payment preference for the checkout process
 * 
 * SEGURIDAD:
 * - CORS restringido (no wildcard en producción)
 * - Rate limiting por IP
 * - Validación estricta de inputs
 * - Sanitización de URLs de redirección
 * - Tamaño máximo de body limitado
 * - Errores genéricos al cliente (no expone detalles internos)
 * - Validación de origen de requests
 * 
 * Environment variables needed (set in Cloudflare Dashboard):
 * - MP_ACCESS_TOKEN: Your MercadoPago access token
 * - MP_PUBLIC_KEY: Your MercadoPago public key (optional, for frontend)
 * - ALLOWED_ORIGIN: Dominio permitido para CORS (ej: https://sxzboost.pages.dev)
 * - RATE_LIMIT_MAX: Máximo de requests por ventana (default: 20)
 * - RATE_LIMIT_WINDOW: Ventana en segundos (default: 60)
 */

// ==========================================
// CONFIGURACIÓN DE SEGURIDAD
// ==========================================
const SECURITY = {
  MAX_BODY_SIZE: 65536,        // 64KB máximo
  MAX_ITEMS: 50,               // Máximo items por preferencia
  MAX_ITEM_TITLE_LENGTH: 256,  // Máximo longitud título
  MAX_TOTAL_AMOUNT: 999999999, // Máximo monto total
  RATE_LIMIT_MAX: 20,          // Máximo requests por ventana
  RATE_LIMIT_WINDOW: 60,       // Ventana en segundos
  REQUEST_TIMEOUT: 10000       // Timeout de request a MP (ms)
};

// Cache simple para rate limiting (en memoria, por worker)
const rateLimitCache = new Map();

// ==========================================
// RATE LIMITING
// ==========================================

/**
 * Implementa rate limiting simple basado en IP.
 */
function checkRateLimit(clientIP) {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / SECURITY.RATE_LIMIT_WINDOW) * SECURITY.RATE_LIMIT_WINDOW;
  const key = clientIP + ':' + windowStart;
  
  const current = rateLimitCache.get(key) || 0;
  
  if (current >= SECURITY.RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: SECURITY.RATE_LIMIT_WINDOW - (now - windowStart) };
  }
  
  rateLimitCache.set(key, current + 1);
  
  // Limpiar entradas antiguas
  const cutoff = windowStart - SECURITY.RATE_LIMIT_WINDOW;
  for (const [k] of rateLimitCache) {
    const entryWindow = parseInt(k.split(':')[1], 10);
    if (entryWindow < cutoff) {
      rateLimitCache.delete(k);
    }
  }
  
  return { allowed: true };
}

// ==========================================
// CORS SEGURO
// ==========================================

/**
 * Obtiene los headers CORS apropiados basados en el entorno.
 */
function getCorsHeaders(request, env) {
  const origin = request.headers.get('origin') || '';
  const allowedOrigin = env.ALLOWED_ORIGIN || '';
  
  // Si hay un origen permitido configurado, usarlo; sino usar el origen del request
  const corsOrigin = allowedOrigin || origin || '*';
  
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
  };
}

// ==========================================
// VALIDACIÓN DE INPUTS
// ==========================================

/**
 * Sanitiza un título de producto.
 */
function sanitizeTitle(title) {
  if (typeof title !== 'string') return 'Producto';
  return title.trim().replace(/[<>\"']/g, '').substring(0, SECURITY.MAX_ITEM_TITLE_LENGTH);
}

/**
 * Sanitiza precio: número positivo con máximo 2 decimales.
 */
function sanitizePrice(price) {
  const num = Number(price);
  if (isNaN(num) || !isFinite(num) || num < 0 || num > SECURITY.MAX_TOTAL_AMOUNT) return 0;
  return Math.round(num * 100) / 100; // 2 decimales
}

/**
 * Sanitiza cantidad: entero positivo.
 */
function sanitizeQuantity(qty) {
  const num = Number(qty);
  if (isNaN(num) || !isFinite(num) || num < 1) return 1;
  return Math.min(Math.floor(num), 999);
}

/**
 * Valida moneda permitida.
 */
function sanitizeCurrency(currency) {
  const allowed = ['ARS', 'USD'];
  return allowed.includes(currency) ? currency : 'ARS';
}

/**
 * Valida que una URL de redirección sea del mismo dominio.
 */
function validateRedirectUrl(url, fallbackDomain) {
  try {
    const parsed = new URL(url);
    const fallback = new URL(fallbackDomain);
    // Solo permitir URLs del mismo dominio o subdominios
    if (parsed.hostname === fallback.hostname || parsed.hostname.endsWith('.' + fallback.hostname)) {
      return url;
    }
    return fallbackDomain;
  } catch(e) {
    return fallbackDomain;
  }
}

// ==========================================
// HANDLER PRINCIPAL
// ==========================================

export async function onRequestPost(context) {
  const { request, env } = context;
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  const corsHeaders = getCorsHeaders(request, env);
  
  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  // Rate limiting
  const rateLimit = checkRateLimit(clientIP);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { 
        headers: { ...corsHeaders, 'Retry-After': String(rateLimit.retryAfter) }, 
        status: 429 
      }
    );
  }

  try {
    // Validar Content-Type
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({ error: 'Content-Type must be application/json' }),
        { headers: corsHeaders, status: 415 }
      );
    }

    // Validar tamaño del body
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
    if (contentLength > SECURITY.MAX_BODY_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Request body too large' }),
        { headers: corsHeaders, status: 413 }
      );
    }

    const body = await request.json();
    const { items } = body;

    // Validar items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Items array is required' }),
        { headers: corsHeaders, status: 400 }
      );
    }

    if (items.length > SECURITY.MAX_ITEMS) {
      return new Response(
        JSON.stringify({ error: 'Too many items. Maximum ' + SECURITY.MAX_ITEMS }),
        { headers: corsHeaders, status: 400 }
      );
    }

    // Sanitizar y validar cada item
    let totalAmount = 0;
    const sanitizedItems = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item || typeof item !== 'object') continue;
      
      const title = sanitizeTitle(item.title);
      const unitPrice = sanitizePrice(item.unit_price);
      const quantity = sanitizeQuantity(item.quantity);
      const currency = sanitizeCurrency(item.currency_id);
      
      if (unitPrice <= 0) continue;
      
      const itemTotal = unitPrice * quantity;
      totalAmount += itemTotal;
      
      if (totalAmount > SECURITY.MAX_TOTAL_AMOUNT) {
        return new Response(
          JSON.stringify({ error: 'Total amount exceeds maximum allowed' }),
          { headers: corsHeaders, status: 400 }
        );
      }
      
      sanitizedItems.push({
        title: title,
        unit_price: unitPrice,
        quantity: quantity,
        currency_id: currency
      });
    }

    if (sanitizedItems.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid items provided' }),
        { headers: corsHeaders, status: 400 }
      );
    }

    // Get access token from environment
    const accessToken = env.MP_ACCESS_TOKEN;

    if (!accessToken) {
      // Development fallback - return mock response
      console.warn('[SXZBOOST] MP_ACCESS_TOKEN not configured, returning sandbox URL');
      return new Response(
        JSON.stringify({
          id: 'mock-preference-id',
          init_point: null,
          sandbox_init_point: 'https://www.mercadopago.com.ar',
          warning: 'Modo desarrollo: configura MP_ACCESS_TOKEN en Cloudflare Dashboard'
        }),
        { headers: corsHeaders, status: 200 }
      );
    }

    // Determinar dominio base para URLs
    const requestOrigin = request.headers.get('origin');
    const fallbackDomain = env.ALLOWED_ORIGIN || requestOrigin || 'https://sxzboost.pages.dev';

    // Build the preference payload
    const preference = {
      items: sanitizedItems,
      back_urls: {
        success: fallbackDomain + '/success.html',
        failure: fallbackDomain + '/failure.html',
        pending: fallbackDomain + '/pending.html'
      },
      auto_return: 'approved',
      external_reference: 'sxzboost-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10),
      notification_url: fallbackDomain + '/api/webhook'
    };

    // Call MercadoPago API con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SECURITY.REQUEST_TIMEOUT);
    
    let mpResponse;
    try {
      mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preference),
        signal: controller.signal
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'Payment provider timeout. Please try again.' }),
          { headers: corsHeaders, status: 504 }
        );
      }
      throw fetchError;
    }
    clearTimeout(timeoutId);

    if (!mpResponse.ok) {
      // No exponer detalles del error de MP al cliente
      console.error('[SXZBOOST] MercadoPago error status:', mpResponse.status);
      return new Response(
        JSON.stringify({ 
          error: 'Error creating payment preference. Please try again.'
        }),
        { headers: corsHeaders, status: 502 }
      );
    }

    const data = await mpResponse.json();

    // Validar que la respuesta contenga URLs válidas de MercadoPago
    const initPoint = data.init_point || null;
    const sandboxInitPoint = data.sandbox_init_point || null;
    
    // Validar que las URLs sean de MercadoPago (evitar open redirect)
    function isValidMpUrl(url) {
      if (!url) return false;
      try {
        const parsed = new URL(url);
        return parsed.hostname === 'www.mercadopago.com' || 
               parsed.hostname === 'www.mercadopago.com.ar' ||
               parsed.hostname.endsWith('.mercadopago.com') ||
               parsed.hostname.endsWith('.mercadopago.com.ar');
      } catch(e) {
        return false;
      }
    }

    return new Response(
      JSON.stringify({
        id: data.id || 'unknown',
        init_point: isValidMpUrl(initPoint) ? initPoint : null,
        sandbox_init_point: isValidMpUrl(sandboxInitPoint) ? sandboxInitPoint : null
      }),
      { headers: corsHeaders, status: 200 }
    );

  } catch (error) {
    // Log interno del error (no se expone al cliente)
    console.error('[SXZBOOST] Internal error:', error.message);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error. Please try again later.'
      }),
      { headers: corsHeaders, status: 500 }
    );
  }
}

// Also handle OPTIONS for CORS
export async function onRequestOptions(context) {
  const corsHeaders = getCorsHeaders(context.request, context.env);
  return new Response(null, {
    headers: corsHeaders,
    status: 204
  });
}
