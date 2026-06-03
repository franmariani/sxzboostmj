# SXZBOOST - Landing Page E-commerce & Servicios Tecnicos

<p align="center">
  <img src="logo.png" alt="SXZBOOST Logo" width="200">
</p>

<p align="center">
  <b>Landing Page profesional con carrito de compras, pasarela de pagos y sistema de contacto integrado.</b><br>
  Proyecto full-stack orientado a servicios de optimizacion, mantenimiento de PCs y venta de hardware en Buenos Aires.
</p>

<p align="center">
  <a href="#-stack-tecnologico"><img src="https://img.shields.io/badge/Stack-Vanilla%20JS%20%7C%20HTML5%20%7C%20CSS3-00ffcc?style=for-the-badge&logo=javascript&logoColor=black"></a>
  <a href="#-seguridad"><img src="https://img.shields.io/badge/Seguridad-Mejorada-00aaff?style=for-the-badge"></a>
  <a href="#-caracteristicas"><img src="https://img.shields.io/badge/Features-8-ff00cc?style=for-the-badge"></a>
</p>

---

## Descripcion

**SXZBOOST** es una solucion web completa desarrollada desde cero para un emprendimiento de soporte tecnico y optimizacion de equipos informaticos. El proyecto demuestra competencias en desarrollo frontend, integracion de pasarelas de pago, diseno responsive, accesibilidad (a11y) y despliegue serverless.

Incluye flujo de compra real con **MercadoPago**, **PayPal**, **transferencia bancaria** y **criptomonedas (USDT)**, ademas de un carrito persistente en `localStorage` y contacto directo via WhatsApp.

> **Ideal para mostrar en LinkedIn / CV** como ejemplo de proyecto end-to-end con impacto comercial real.

---

## Stack Tecnologico

| Capa | Tecnologia | Uso |
|------|-----------|-----|
| **Frontend** | Vanilla JavaScript (ES6+) | Logica del carrito, interactividad, validaciones |
| **Markup** | HTML5 Semantico | SEO, accesibilidad, estructura semantica |
| **Estilos** | CSS3 + Variables CSS | Glassmorphism, Grid, Flexbox, responsive design |
| **Backend** | Cloudflare Workers | Serverless functions para preferencias de pago |
| **Pagos** | MercadoPago SDK + PayPal Smart Buttons | Checkout seguro con multiples metodos |
| **Deploy** | Cloudflare Pages | Hosting estatico con edge caching |
| **Herramientas** | Git, Lighthouse | Control de versiones, metricas de performance |

---

## Caracteristicas

### E-commerce
- **Carrito de compras dinamico** con persistencia en `localStorage`
- **Gestion de cantidades** (incrementar/decrementar/eliminar)
- **Toast notifications** y estados vacios
- **Panel lateral deslizable** (slide-over) con overlay y focus trap

### Pasarela de Pagos
- **MercadoPago**: checkout redirect con preferencias generadas via API
- **PayPal**: Smart Buttons integrados (fallback a contacto si no hay config)
- **Transferencia bancaria**: alias copiable + boton de envio de comprobante por WhatsApp
- **Crypto (USDT BEP20)**: direccion de wallet copiable + advertencias de red

### UX / UI
- **Diseno responsive**: mobile-first, breakpoints en 768px y 480px
- **Glassmorphism + gradientes**: estetica gaming profesional
- **Scroll reveal animations** con Intersection Observer
- **Parallax sutil** en hero (desktop)
- **Skip links** y atributos ARIA para accesibilidad
- **Reduced motion** respetado (`prefers-reduced-motion`)

---

## Seguridad

Esta version incluye **mejoras significativas de seguridad** respecto a versiones anteriores:

| Medida | Descripcion |
|--------|-------------|
| **CSP (Content Security Policy)** | Previene ejecucion de scripts no autorizados |
| **X-Frame-Options: DENY** | Proteccion contra clickjacking |
| **X-Content-Type-Options: nosniff** | Previene MIME sniffing |
| **HSTS** | Fuerza conexion HTTPS |
| **XSS Protection** | Proteccion adicional en navegadores legacy |
| **Anti-XSS en DOM** | Uso de `createElement` y `textContent` en lugar de `innerHTML` |
| **Sanitizacion de inputs** | Validacion y escape de todos los datos de usuario |
| **Validacion de IDs** | Solo IDs de productos permitidos en el carrito |
| **Rate Limiting** | Limite de requests por IP en API |
| **Validacion de URLs** | Prevencion de Open Redirect en redirecciones de pago |
| **CORS restringido** | Solo origenes permitidos en API |
| **Errores genericos** | No se exponen detalles internos del servidor al cliente |
| **CSP meta tags** | Fallback de seguridad si _headers no esta disponible |
| **Limites de datos** | Maximos en longitud de inputs, cantidad de items, montos |

### Headers HTTP de Seguridad (via `_headers`)

El archivo `_headers` configura automaticamente en Cloudflare Pages:
- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `Strict-Transport-Security` (HSTS)
- `X-XSS-Protection: 1; mode=block`
- `Cross-Origin-Embedder-Policy`
- `Cross-Origin-Opener-Policy`
- `Cross-Origin-Resource-Policy`

---

## Estructura del Proyecto

```
sxzboost/
├── assets/
│   ├── css/
│   │   └── style.css          # Estilos globales, carrito, responsive
│   └── js/
│       ├── cart.js            # Modulo del carrito (createElement, sanitizado)
│       └── main.js            # Animaciones, formulario, scroll reveal
├── functions/
│   └── create-preference.js   # Cloudflare Worker (CORS, rate limiting, validacion)
├── img/                       # Productos, logos, metodos de pago
├── _headers                   # Headers de seguridad HTTP (Cloudflare Pages)
├── index.html                 # Home: servicios, hardware, contacto, carrito
├── checkout.html              # Pasarela de pagos (render seguro, validacion)
├── success.html               # Pago aprobado + sanitizacion URL
├── pending.html               # Pago pendiente
├── failure.html               # Pago rechazado + CTA WhatsApp
└── README.md
```

---

## Instalacion Local

```bash
# Clonar repositorio
git clone https://github.com/tuusuario/sxzboost.git
cd sxzboost

# Servir localmente (cualquier servidor estatico)
python -m http.server 8080
# o
npx serve .

# Abrir en navegador
http://localhost:8080
```

> **Para el funcionamiento completo de pagos**, configurar las variables de entorno en Cloudflare Dashboard.

---

## Variables de Entorno (Cloudflare Workers)

| Variable | Descripcion | Requerido |
|----------|-------------|-----------|
| `MP_ACCESS_TOKEN` | Access Token de MercadoPago (prod/sandbox) | Si (para pagos reales) |
| `PAYPAL_CLIENT_ID` | Client ID de aplicacion PayPal | No |
| `ALLOWED_ORIGIN` | Dominio permitido para CORS (ej: `https://tu-dominio.com`) | Recomendado |
| `RATE_LIMIT_MAX` | Maximo de requests por ventana (default: 20) | No |
| `RATE_LIMIT_WINDOW` | Ventana de rate limit en segundos (default: 60) | No |

---

## Vista Previa

| Home | Checkout | Carrito |
|------|----------|---------|
| Hero con CTA, servicios y hardware | Pasarela con 4 metodos de pago | Panel lateral con gestion de items |

---

## Habilidades Demostradas

- **Frontend Engineering**: JavaScript vanilla modular, DOM seguro, event delegation
- **UI/UX Design**: Glassmorphism, animaciones performantes, responsive design, a11y
- **Integracion de APIs**: REST (MercadoPago), serverless functions, manejo de errores
- **E-commerce**: Flujo completo de compra, persistencia de estado, multiples pasarelas
- **DevOps/Deploy**: Cloudflare Pages + Workers, headers de seguridad
- **SEO Tecnico**: Meta tags, Open Graph, semantic HTML, performance optimization
- **Seguridad**: Sanitizacion, CSP, headers HTTP, prevencion XSS/CSRF/Open Redirect

---

## Contacto

- **WhatsApp**: [+54 9 11 2398-1806](https://wa.me/5491123981806)

---

<p align="center">
  <b>&copy; 2026 SXZBOOST &middot; Buenos Aires, Argentina</b>
</p>
