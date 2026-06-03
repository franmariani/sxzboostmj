/**
 * SXZBOOST - Shopping Cart Module (SECURE VERSION)
 * Fully functional cart with localStorage persistence
 * 
 * SEGURIDAD:
 * - Uso de createElement en vez de innerHTML (previene XSS)
 * - Sanitización de datos antes de insertarlos en el DOM
 * - Validación estricta de datos provenientes de localStorage
 * - Escape de contenido dinámico
 */

(function() {
  'use strict';

  // ==========================================
  // CONFIGURACIÓN
  // ==========================================
  const CART_STORAGE_KEY = 'sxzboost_cart';
  const MAX_CART_ITEMS = 50;
  const MAX_QTY_PER_ITEM = 20;
  const ALLOWED_ITEM_IDS = [
    'limpieza_fisica_sin_gpu', 'optimizacion_so_bios', 'optimizacion_windows_gaming',
    'formateo_windows', 'limpieza_gpu', 'ensamble_pc',
    'rtx_3060', 'ram_16gb', 'ssd_1tb_nvme'
  ];

  // ==========================================
  // STATE
  // ==========================================
  let cart = [];

  // ==========================================
  // UTILIDADES DE SANITIZACIÓN
  // ==========================================

  /**
   * Escapa caracteres HTML para prevenir XSS.
   * Convierte < > " ' & en entidades HTML seguras.
   * @param {string} str - Texto a escapar
   * @returns {string} Texto escapado
   */
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Sanitiza un ID de producto permitiendo solo caracteres alfanuméricos y guiones bajos.
   * @param {string} id - ID a validar
   * @returns {string|null} ID sanitizado o null si es inválido
   */
  function sanitizeId(id) {
    if (typeof id !== 'string') return null;
    const sanitized = id.trim().replace(/[^a-zA-Z0-9_]/g, '');
    return ALLOWED_ITEM_IDS.includes(sanitized) ? sanitized : null;
  }

  /**
   * Sanitiza un nombre de producto: permite letras, números, espacios y caracteres comunes.
   * @param {string} name - Nombre a sanitizar
   * @returns {string} Nombre sanitizado
   */
  function sanitizeName(name) {
    if (typeof name !== 'string') return 'Producto';
    return name.trim().replace(/[<>\"']/g, '').substring(0, 200);
  }

  /**
   * Sanitiza una URL de imagen permitiendo solo rutas locales válidas.
   * @param {string} img - Ruta de imagen
   * @returns {string} Ruta sanitizada o imagen por defecto
   */
  function sanitizeImage(img) {
    if (typeof img !== 'string') return 'img/ram.png';
    const sanitized = img.trim();
    // Solo permitir rutas locales que empiecen con img/ o ./img/
    if (/^(\.?\/)?img\/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp|gif)$/i.test(sanitized)) {
      return sanitized;
    }
    return 'img/ram.png';
  }

  /**
   * Sanitiza un precio: debe ser un número entero positivo.
   * @param {*} price - Precio a validar
   * @returns {number} Precio sanitizado
   */
  function sanitizePrice(price) {
    const num = Number(price);
    if (isNaN(num) || !isFinite(num) || num < 0 || num > 999999999) return 0;
    return Math.floor(num);
  }

  /**
   * Sanitiza cantidad: debe ser un entero entre 1 y MAX_QTY_PER_ITEM.
   * @param {*} qty - Cantidad a validar
   * @returns {number} Cantidad sanitizada
   */
  function sanitizeQty(qty) {
    const num = Number(qty);
    if (isNaN(num) || !isFinite(num) || num < 1) return 1;
    return Math.min(Math.floor(num), MAX_QTY_PER_ITEM);
  }

  /**
   * Valida y sanitiza un item completo del carrito.
   * @param {Object} item - Item a validar
   * @returns {Object|null} Item sanitizado o null si es inválido
   */
  function validateCartItem(item) {
    if (!item || typeof item !== 'object') return null;

    const id = sanitizeId(item.id);
    if (!id) return null;

    const sanitized = {
      id: id,
      name: sanitizeName(item.name),
      price: sanitizePrice(item.price),
      img: sanitizeImage(item.img),
      qty: sanitizeQty(item.qty)
    };

    // El nombre debe tener contenido
    if (!sanitized.name) sanitized.name = 'Producto';

    return sanitized;
  }

  // ==========================================
  // DOM ELEMENTS
  // ==========================================
  const cartIcon = document.getElementById('cart-icon');
  const cartPanel = document.getElementById('cart-panel');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartClose = document.getElementById('cart-close');
  const cartItems = document.getElementById('cart-items');
  const cartEmpty = document.getElementById('cart-empty');
  const cartFooter = document.getElementById('cart-footer');
  const cartCount = document.getElementById('cart-count');
  const cartSubtotal = document.getElementById('cart-subtotal');
  const cartTotal = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');
  const clearCartBtn = document.getElementById('clear-cart-btn');
  const toast = document.getElementById('toast');
  const toastIcon = document.getElementById('toast-icon');
  const toastMessage = document.getElementById('toast-message');

  // ==========================================
  // INITIALIZATION
  // ==========================================
  function init() {
    loadCart();
    bindEvents();
    renderCart();
  }

  // ==========================================
  // EVENT BINDING
  // ==========================================
  function bindEvents() {
    // Add to cart buttons
    document.querySelectorAll('.btn-add').forEach(btn => {
      btn.addEventListener('click', handleAddToCart);
    });

    // Cart panel toggle
    if (cartIcon) {
      cartIcon.addEventListener('click', openCart);
      cartIcon.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openCart();
        }
      });
    }

    if (cartClose) cartClose.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isCartOpen()) {
        closeCart();
      }
    });

    // Checkout & clear
    if (checkoutBtn) checkoutBtn.addEventListener('click', handleCheckout);
    if (clearCartBtn) clearCartBtn.addEventListener('click', clearCart);
  }

  // ==========================================
  // CART OPERATIONS
  // ==========================================
  function handleAddToCart(e) {
    const btn = e.currentTarget;
    const item = {
      id: btn.dataset.id,
      name: btn.dataset.name,
      price: parseInt(btn.dataset.price, 10),
      img: btn.dataset.img,
      qty: 1
    };

    const sanitized = validateCartItem(item);
    if (!sanitized) {
      showToast('alert', 'Error: producto inválido');
      return;
    }

    addToCart(sanitized);
    showToast('check', escapeHtml(sanitized.name) + ' agregado al carrito');
    
    // Update form service field
    const servicioInput = document.getElementById('servicio');
    if (servicioInput) {
      servicioInput.value = sanitized.name;
    }
  }

  function addToCart(newItem) {
    // Validar límite de items
    if (cart.length >= MAX_CART_ITEMS) {
      showToast('alert', 'Carrito lleno. Máximo ' + MAX_CART_ITEMS + ' items.');
      return;
    }

    const existing = cart.find(item => item.id === newItem.id);
    if (existing) {
      existing.qty = Math.min(existing.qty + 1, MAX_QTY_PER_ITEM);
    } else {
      cart.push(newItem);
    }
    saveCart();
    renderCart();
  }

  function removeFromCart(id) {
    const sanitizedId = sanitizeId(id);
    if (!sanitizedId) return;
    cart = cart.filter(item => item.id !== sanitizedId);
    saveCart();
    renderCart();
  }

  function updateQty(id, delta) {
    const sanitizedId = sanitizeId(id);
    if (!sanitizedId) return;

    const item = cart.find(item => item.id === sanitizedId);
    if (!item) return;
    
    item.qty += delta;
    if (item.qty <= 0) {
      removeFromCart(sanitizedId);
      return;
    }
    if (item.qty > MAX_QTY_PER_ITEM) {
      item.qty = MAX_QTY_PER_ITEM;
      showToast('alert', 'Máximo ' + MAX_QTY_PER_ITEM + ' unidades por producto');
    }
    saveCart();
    renderCart();
  }

  function clearCart() {
    if (cart.length === 0) return;
    cart = [];
    saveCart();
    renderCart();
    showToast('trash', 'Carrito vaciado');
  }

  // ==========================================
  // PERSISTENCE (con validación)
  // ==========================================
  function saveCart() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('[SXZBOOST] localStorage no disponible');
    }
  }

  function loadCart() {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (!stored) {
        cart = [];
        return;
      }

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        cart = [];
        return;
      }

      // Validar y sanitizar cada item
      const validItems = [];
      for (let i = 0; i < parsed.length; i++) {
        const item = validateCartItem(parsed[i]);
        if (item) {
          validItems.push(item);
        }
      }

      cart = validItems;

      // Si se eliminaron items corruptos, limpiar localStorage
      if (validItems.length !== parsed.length) {
        console.warn('[SXZBOOST] Items corruptos eliminados del carrito');
        saveCart();
      }
    } catch (e) {
      console.warn('[SXZBOOST] Error cargando carrito:', e);
      cart = [];
      try { localStorage.removeItem(CART_STORAGE_KEY); } catch(e2) {}
    }
  }

  // ==========================================
  // RENDERING SEGURO (sin innerHTML)
  // ==========================================
  function renderCart() {
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // Update badge
    if (cartCount) {
      cartCount.textContent = totalQty;
      cartCount.style.display = totalQty > 0 ? 'flex' : 'none';
    }

    // Show/hide empty state and footer
    if (cartEmpty) cartEmpty.style.display = cart.length === 0 ? 'flex' : 'none';
    if (cartFooter) cartFooter.style.display = cart.length === 0 ? 'none' : 'block';

    // Render items usando createElement (seguro contra XSS)
    if (cartItems) {
      // Limpiar contenido previo de forma segura
      while (cartItems.firstChild) {
        cartItems.removeChild(cartItems.firstChild);
      }

      cart.forEach(item => {
        const cartItemEl = createCartItemElement(item);
        cartItems.appendChild(cartItemEl);
      });
    }

    // Update totals
    if (cartSubtotal) cartSubtotal.textContent = formatPrice(totalPrice);
    if (cartTotal) cartTotal.textContent = 'Total: ' + formatPrice(totalPrice);
  }

  /**
   * Crea un elemento de carrito de forma segura usando createElement.
   * NUNCA usa innerHTML con datos dinámicos.
   */
  function createCartItemElement(item) {
    // Contenedor principal
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.setAttribute('data-id', item.id);

    // Imagen
    const img = document.createElement('img');
    img.src = item.img;
    img.alt = item.name;
    img.loading = 'lazy';
    img.onerror = function() { this.src = 'img/ram.png'; };

    // Info container
    const infoDiv = document.createElement('div');
    infoDiv.className = 'cart-item-info';

    // Nombre del producto
    const nameDiv = document.createElement('div');
    nameDiv.className = 'cart-item-name';
    nameDiv.textContent = item.name; // textContent escapa automáticamente

    // Precio
    const priceDiv = document.createElement('div');
    priceDiv.className = 'cart-item-price';
    priceDiv.textContent = formatPrice(item.price * item.qty);

    // Controles de cantidad
    const qtyDiv = document.createElement('div');
    qtyDiv.className = 'cart-item-qty';

    const decBtn = document.createElement('button');
    decBtn.className = 'qty-btn';
    decBtn.setAttribute('data-action', 'dec');
    decBtn.setAttribute('data-id', item.id);
    decBtn.setAttribute('aria-label', 'Disminuir cantidad');
    decBtn.textContent = '-';
    decBtn.addEventListener('click', () => updateQty(item.id, -1));

    const qtySpan = document.createElement('span');
    qtySpan.textContent = item.qty;

    const incBtn = document.createElement('button');
    incBtn.className = 'qty-btn';
    incBtn.setAttribute('data-action', 'inc');
    incBtn.setAttribute('data-id', item.id);
    incBtn.setAttribute('aria-label', 'Aumentar cantidad');
    incBtn.textContent = '+';
    incBtn.addEventListener('click', () => updateQty(item.id, 1));

    qtyDiv.appendChild(decBtn);
    qtyDiv.appendChild(qtySpan);
    qtyDiv.appendChild(incBtn);

    infoDiv.appendChild(nameDiv);
    infoDiv.appendChild(priceDiv);
    infoDiv.appendChild(qtyDiv);

    // Botón eliminar
    const removeBtn = document.createElement('button');
    removeBtn.className = 'cart-item-remove';
    removeBtn.setAttribute('data-id', item.id);
    removeBtn.setAttribute('aria-label', 'Eliminar ' + item.name);
    removeBtn.addEventListener('click', () => {
      removeFromCart(item.id);
      showToast('trash', item.name + ' eliminado');
    });

    // SVG del botón eliminar
    removeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

    cartItem.appendChild(img);
    cartItem.appendChild(infoDiv);
    cartItem.appendChild(removeBtn);

    return cartItem;
  }

  // ==========================================
  // CART PANEL TOGGLE
  // ==========================================
  function openCart() {
    if (cartPanel) {
      cartPanel.setAttribute('aria-hidden', 'false');
    }
    if (cartOverlay) {
      cartOverlay.setAttribute('aria-hidden', 'false');
    }
    document.body.style.overflow = 'hidden';
    // Focus management
    if (cartClose) setTimeout(() => cartClose.focus(), 100);
  }

  function closeCart() {
    if (cartPanel) {
      cartPanel.setAttribute('aria-hidden', 'true');
    }
    if (cartOverlay) {
      cartOverlay.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
    // Return focus
    if (cartIcon) setTimeout(() => cartIcon.focus(), 100);
  }

  function isCartOpen() {
    return cartPanel && cartPanel.getAttribute('aria-hidden') === 'false';
  }

  // ==========================================
  // CHECKOUT (seguro)
  // ==========================================
  function handleCheckout() {
    if (cart.length === 0) {
      showToast('alert', 'El carrito está vacío');
      return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    // Validar que el total sea razonable
    if (total <= 0 || total > 999999999) {
      showToast('alert', 'Error en el total del carrito');
      return;
    }

    // Build checkout URL with cart data
    // Usamos solo los IDs validados para reconstruir en checkout
    const safeCart = cart.map(item => ({
      id: item.id,
      qty: item.qty
    }));

    try {
      const cartParam = encodeURIComponent(JSON.stringify(safeCart));
      // Validar que la URL no exceda el límite
      const url = 'checkout.html?cart=' + cartParam + '&total=' + total;
      if (url.length > 8000) {
        showToast('alert', 'Carrito demasiado grande. Contactanos por WhatsApp.');
        return;
      }
      window.location.href = url;
    } catch (e) {
      console.error('[SXZBOOST] Error en checkout:', e);
      showToast('alert', 'Error al procesar el checkout');
    }
  }

  // ==========================================
  // TOAST NOTIFICATION
  // ==========================================
  let toastTimeout;
  function showToast(type, message) {
    if (!toast || !toastMessage) return;
    
    clearTimeout(toastTimeout);
    
    const icons = {
      check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ffcc" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>',
      trash: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff4757" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
      alert: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffa502" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
    };
    
    if (toastIcon) toastIcon.innerHTML = icons[type] || icons.check;
    // Usar textContent para evitar XSS en mensajes
    toastMessage.textContent = message;
    
    toast.classList.add('show');
    toast.setAttribute('aria-hidden', 'false');
    
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
      toast.setAttribute('aria-hidden', 'true');
    }, 3000);
  }

  // ==========================================
  // UTILITIES
  // ==========================================
  function formatPrice(price) {
    return '$' + price.toLocaleString('es-AR');
  }

  // ==========================================
  // PUBLIC API
  // ==========================================
  window.SXZCart = {
    getCart: () => [...cart],
    getTotal: () => cart.reduce((sum, item) => sum + (item.price * item.qty), 0),
    addItem: addToCart,
    removeItem: removeFromCart,
    clear: clearCart,
    open: openCart,
    close: closeCart
  };

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
