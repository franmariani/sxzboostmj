# 🚀 SXZBOOST — Landing Page E-commerce & Servicios Técnicos

<p align="center">
  <img src="logo.png" alt="SXZBOOST Logo" width="200">
</p>

<p align="center">
  <b>Landing Page profesional con carrito de compras, pasarela de pagos y sistema de contacto integrado.</b><br>
  Proyecto full-stack orientado a servicios de optimización, mantenimiento de PCs y venta de hardware en Buenos Aires.
</p>

<p align="center">
  <a href="#-stack-tecnológico"><img src="https://img.shields.io/badge/Stack-Vanilla%20JS%20%7C%20HTML5%20%7C%20CSS3-00ffcc?style=for-the-badge&logo=javascript&logoColor=black"></a>
  <a href="#-demo"><img src="https://img.shields.io/badge/Demo-Live-00aaff?style=for-the-badge"></a>
  <a href="#-características"><img src="https://img.shields.io/badge/Features-8-ff00cc?style=for-the-badge"></a>
</p>

---

## 📌 Descripción

**SXZBOOST** es una solución web completa desarrollada desde cero para un emprendimiento de soporte técnico y optimización de equipos informáticos. El proyecto demuestra competencias en desarrollo frontend, integración de pasarelas de pago, diseño responsive, accesibilidad (a11y) y despliegue serverless.

Incluye flujo de compra real con **MercadoPago**, **PayPal**, **transferencia bancaria** y **criptomonedas (USDT)**, además de un carrito persistente en `localStorage` y contacto directo vía WhatsApp.

> 🔗 **Ideal para mostrar en LinkedIn / CV** como ejemplo de proyecto end-to-end con impacto comercial real.

---

## 🛠 Stack Tecnológico

| Capa | Tecnología | Uso |
|------|-----------|-----|
| **Frontend** | Vanilla JavaScript (ES6+) | Lógica del carrito, interactividad, validaciones |
| **Markup** | HTML5 Semántico | SEO, accesibilidad, estructura semántica |
| **Estilos** | CSS3 + Variables CSS | Glassmorphism, Grid, Flexbox, responsive design |
| **Backend** | Cloudflare Workers | Serverless functions para preferencias de pago |
| **Pagos** | MercadoPago SDK + PayPal Smart Buttons | Checkout seguro con múltiples métodos |
| **Deploy** | Cloudflare Pages | Hosting estático con edge caching |
| **Herramientas** | Git, Figma (UI), Lighthouse | Control de versiones, diseño UI, métricas de performance |

---

## ✨ Características

### 🛒 E-commerce
- **Carrito de compras dinámico** con persistencia en `localStorage`
- **Gestión de cantidades** (incrementar/decrementar/eliminar)
- **Toast notifications** y estados vacíos
- **Panel lateral deslizable** (slide-over) con overlay y focus trap

### 💳 Pasarela de Pagos
- **MercadoPago**: checkout redirect con preferencias generadas vía API
- **PayPal**: Smart Buttons integrados (fallback a contacto si no hay config)
- **Transferencia bancaria**: alias copiable + botón de envío de comprobante por WhatsApp
- **Crypto (USDT BEP20)**: dirección de wallet copiable + advertencias de red

### 📱 UX / UI
- **Diseño responsive**: mobile-first, breakpoints en 768px y 480px
- **Glassmorphism + gradientes**: estética gaming profesional
- **Scroll reveal animations** con Intersection Observer
- **Parallax sutil** en hero (desktop)
- **Skip links** y atributos ARIA para accesibilidad
- **Reduced motion** respetado (`prefers-reduced-motion`)

### 🔒 Seguridad & Performance
- **Headers de seguridad** configurados (CSP, HSTS, X-Frame-Options)
- **API keys ocultas** en Cloudflare Workers (nunca expuestas en frontend)
- **Lazy loading** de imágenes
- **Preconnect** a fuentes y dominios críticos

---

## 📁 Estructura del Proyecto

```
sxzboost/
├── assets/
│   ├── css/
│   │   └── style.css          # Estilos globales, carrito, responsive
│   └── js/
│       ├── cart.js            # Módulo del carrito (add/remove/checkout)
│       └── main.js            # Animaciones, formulario, scroll reveal
├── functions/
│   └── create-preference.js   # Cloudflare Worker: integración MP & PayPal
├── img/                       # Productos, logos, métodos de pago
├── index.html                 # Home: servicios, hardware, contacto, carrito
├── checkout.html              # Pasarela de pagos (4 métodos)
├── success.html               # Pago aprobado + limpieza de carrito
├── pending.html               # Pago pendiente
├── failure.html               # Pago rechazado + CTA WhatsApp
├── _headers                   # Configuración de seguridad HTTP
└── README.md
```

---

## 🚀 Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/tuusuario/sxzboost.git
cd sxzboost

# Servir localmente (cualquier servidor estático)
python -m http.server 8080
# o
npx serve .

# Abrir en navegador
http://localhost:8080
```

> ⚠️ Para el funcionamiento completo de pagos, configurar las variables de entorno en Cloudflare Dashboard (ver sección **Variables**).

---

## 🔐 Variables de Entorno (Cloudflare Workers)

| Variable | Descripción |
|----------|-------------|
| `MP_ACCESS_TOKEN` | Access Token de MercadoPago (prod/sandbox) |
| `PAYPAL_CLIENT_ID` | Client ID de aplicación PayPal |
| `PAYPAL_CURRENCY` | Moneda PayPal (default: `USD`) |

---

## 📸 Vista Previa

| Home | Checkout | Carrito |
|------|----------|---------|
| Hero con CTA, servicios y hardware | Pasarela con 4 métodos de pago | Panel lateral con gestión de items |

<p align="center">
  <img src="img/optimizacion-gaming.png" alt="Preview" width="600" style="border-radius:12px">
</p>

---

## 🎯 Habilidades Demostradas

- ✅ **Frontend Engineering**: JavaScript vanilla modular, manipulación del DOM, event delegation
- ✅ **UI/UX Design**: Glassmorphism, animaciones performantes, responsive design, a11y
- ✅ **Integración de APIs**: REST (MercadoPago), serverless functions, manejo de errores y fallbacks
- ✅ **E-commerce**: Flujo completo de compra, persistencia de estado, múltiples pasarelas
- ✅ **DevOps/Deploy**: Cloudflare Pages + Workers, CI/CD implícito, headers de seguridad
- ✅ **SEO Técnico**: Meta tags, Open Graph, semantic HTML, performance optimization

---

## 📬 Contacto

¿Te interesa mi trabajo o querés charlar sobre tecnología?

- 💼 **LinkedIn**: [linkedin.com/in/franco-mariani01](https://linkedin.com/in/franco-mariani01)
- 📧 **Email**: francoenriquebs@gmail.com
- 💬 **WhatsApp**: [+54 9 11 3171-8772](https://wa.me/5491131718772)

---

<p align="center">
  <b>© 2026 SXZBOOST · Buenos Aires, Argentina</b><br>
  Desarrollado con 💻 y ☕ por <a href="https://github.com/franmariani">Franco Mariani</a>
</p>
