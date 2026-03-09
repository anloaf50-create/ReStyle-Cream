// ===================== STATE =====================
let cart = JSON.parse(localStorage.getItem('restyle-cart') || '[]');
let currentUser = JSON.parse(localStorage.getItem('restyle-user') || 'null');
let orders = JSON.parse(localStorage.getItem('restyle-orders') || '[]');
let currentCategory = 'all';
let currentSearch = '';
let currentPage = 1;
const ITEMS_PER_PAGE = 8;
let checkoutData = { courier: null, courierPrice: 15000, step: 1, orderData: null };
let activeModal = null;

const COURIER_PRICES = { jne: 15000, jnt: 13000, sicepat: 12000, pos: 10000 };

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initCursorGlow();
  renderCategories();
  renderProducts();
  updateCartBadge();
  initNavHighlight();
  initHamburger();
});

// ===================== THEME =====================
function initTheme() {
  const saved = localStorage.getItem('restyle-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeBtn(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('restyle-theme', next);
  updateThemeBtn(next);
}

function updateThemeBtn(theme) {
  const btn = document.getElementById('theme-btn');
  if (btn) btn.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// ===================== CURSOR GLOW =====================
function initCursorGlow() {
  const glow = document.getElementById('cursor-glow');
  if (!glow) return;
  document.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  });
  document.addEventListener('mouseleave', () => { glow.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { glow.style.opacity = '1'; });
}

// ===================== HAMBURGER =====================
function initHamburger() {
  const btn = document.getElementById('hamburger');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    menu.classList.toggle('open');
  });
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => menu.classList.remove('open'));
  });
}

// ===================== NAV HIGHLIGHT =====================
function initNavHighlight() {
  const links = document.querySelectorAll('.nav-links a, .mobile-menu a');
  links.forEach(a => {
    if (a.href === window.location.href) a.classList.add('active');
  });
}

// ===================== CATEGORIES =====================
const CATEGORIES = [
  { id: 'all', icon: '🛍️', name: 'Semua Produk' },
  { id: 'wanita', icon: '👩', name: 'Pakaian Wanita' },
  { id: 'pria', icon: '🧑', name: 'Pakaian Pria' },
  { id: 'anak', icon: '👶', name: 'Bayi & Anak' },
  { id: 'aksesoris', icon: '💍', name: 'Aksesoris' }
];

function renderCategories() {
  const container = document.getElementById('cat-grid');
  if (!container) return;
  container.innerHTML = CATEGORIES.map(c => {
    const count = c.id === 'all' ? products.length : products.filter(p => p.kategori === c.id).length;
    return `<div class="cat-card ${currentCategory === c.id ? 'active' : ''}" onclick="selectCategory('${c.id}')">
      <span class="cat-icon">${c.icon}</span>
      <span class="cat-name">${c.name}</span>
      <span class="cat-count">${count} item</span>
    </div>`;
  }).join('');
}

function selectCategory(cat) {
  currentCategory = cat;
  currentPage = 1;
  renderCategories();
  renderProducts();
}

// ===================== SEARCH =====================
function handleSearch(val) {
  currentSearch = val.toLowerCase();
  currentPage = 1;
  renderProducts();
}

// ===================== FILTER & SORT =====================
function getFilteredProducts() {
  let filtered = products;
  if (currentCategory !== 'all') filtered = filtered.filter(p => p.kategori === currentCategory);
  if (currentSearch) {
    filtered = filtered.filter(p =>
      p.nama.toLowerCase().includes(currentSearch) ||
      p.deskripsi.toLowerCase().includes(currentSearch) ||
      p.kategori.toLowerCase().includes(currentSearch)
    );
  }
  const sort = document.getElementById('sort-select');
  if (sort) {
    switch (sort.value) {
      case 'price-asc': filtered.sort((a, b) => a.harga - b.harga); break;
      case 'price-desc': filtered.sort((a, b) => b.harga - a.harga); break;
      case 'rating': filtered.sort((a, b) => b.rating - a.rating); break;
      case 'terjual': filtered.sort((a, b) => b.terjual - a.terjual); break;
    }
  }
  return filtered;
}

// ===================== PRODUCTS RENDER =====================
function renderProducts() {
  const grid = document.getElementById('products-grid');
  const count = document.getElementById('products-count');
  const pagContainer = document.getElementById('pagination');
  if (!grid) return;

  const filtered = getFilteredProducts();
  const total = filtered.length;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  currentPage = Math.min(currentPage, Math.max(1, totalPages));

  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (count) count.textContent = `${total} produk ditemukan`;

  if (paged.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <i class="fas fa-search" style="font-size:2.5rem;margin-bottom:12px;opacity:0.4;"></i>
      <p>Produk tidak ditemukan</p>
    </div>`;
  } else {
    grid.innerHTML = paged.map(p => productCard(p)).join('');
  }

  if (pagContainer) renderPagination(totalPages, pagContainer);
}

function productCard(p) {
  const diskon = Math.round((1 - p.harga / p.hargaAsli) * 100);
  return `<div class="product-card" onclick="openDetail(${p.id})">
    <div class="product-img">
      <img src="${p.gambar}" alt="${p.nama}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x400/e8e0d8/c8502a?text=ReStyle'">
      <span class="product-kondisi">${p.kondisi}</span>
      <span class="product-diskon">-${diskon}%</span>
      <div class="product-wish" onclick="event.stopPropagation();addToWishlist(${p.id})">❤️</div>
    </div>
    <div class="product-info">
      <div class="product-cat">${getCatName(p.kategori)}</div>
      <div class="product-name">${p.nama}</div>
      <div class="product-meta">
        <span class="product-rating">${'★'.repeat(Math.round(p.rating))}${'☆'.repeat(5-Math.round(p.rating))}</span>
        <span>${p.rating} · ${p.terjual} terjual</span>
        <span>Ukuran: ${p.ukuran}</span>
      </div>
      <div class="product-prices">
        <div>
          <div class="product-price">${formatRp(p.harga)}</div>
          <div class="product-price-ori">${formatRp(p.hargaAsli)}</div>
        </div>
        <button class="product-add-btn" onclick="event.stopPropagation();addToCart(${p.id})" title="Tambah Keranjang">
          <i class="fas fa-cart-plus"></i>
        </button>
      </div>
    </div>
  </div>`;
}

function getCatName(cat) {
  const map = { wanita: 'Pakaian Wanita', pria: 'Pakaian Pria', anak: 'Bayi & Anak', aksesoris: 'Aksesoris' };
  return map[cat] || cat;
}

// ===================== PAGINATION =====================
function renderPagination(total, container) {
  if (total <= 1) { container.innerHTML = ''; return; }
  let html = '';
  if (currentPage > 1) html += `<button class="page-btn" onclick="goPage(${currentPage-1})"><i class="fas fa-chevron-left"></i></button>`;
  for (let i = 1; i <= total; i++) {
    html += `<button class="page-btn ${i===currentPage?'active':''}" onclick="goPage(${i})">${i}</button>`;
  }
  if (currentPage < total) html += `<button class="page-btn" onclick="goPage(${currentPage+1})"><i class="fas fa-chevron-right"></i></button>`;
  container.innerHTML = html;
}

function goPage(n) {
  currentPage = n;
  renderProducts();
  document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===================== PRODUCT DETAIL =====================
function openDetail(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const diskon = Math.round((1 - p.harga / p.hargaAsli) * 100);
  const stars = '★'.repeat(Math.round(p.rating)) + '☆'.repeat(5 - Math.round(p.rating));

  document.getElementById('modal-detail-content').innerHTML = `
    <div class="detail-grid">
      <div class="detail-img">
        <img src="${p.gambar}" alt="${p.nama}" onerror="this.src='https://via.placeholder.com/400x400/e8e0d8/c8502a?text=ReStyle'">
      </div>
      <div>
        <div class="detail-badge-row">
          <span class="badge badge-cat">${getCatName(p.kategori)}</span>
          <span class="badge badge-kondisi">${p.kondisi}</span>
          <span class="badge badge-size">${p.ukuran}</span>
        </div>
        <div class="detail-name">${p.nama}</div>
        <div class="detail-rating">
          <span style="color:var(--gold)">${stars}</span>
          <span>${p.rating} · ${p.terjual} terjual</span>
        </div>
        <div class="detail-price-row">
          <div class="detail-price">${formatRp(p.harga)}</div>
          <div class="detail-price-ori">${formatRp(p.hargaAsli)}</div>
          <span class="badge" style="background:var(--accent);color:white;">-${diskon}%</span>
        </div>
        <div class="detail-desc">${p.deskripsi}</div>
        <div class="detail-actions">
          <button class="btn-secondary" onclick="addToCart(${p.id});closeModal('detail-modal')">
            <i class="fas fa-cart-plus"></i> Keranjang
          </button>
          <button class="btn-primary" onclick="buyNow(${p.id})">
            <i class="fas fa-bolt"></i> Beli Sekarang
          </button>
        </div>
      </div>
    </div>`;
  openModal('detail-modal');
}

// ===================== CART =====================
function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...p, qty: 1 });
  }
  saveCart();
  updateCartBadge();
  showToast(`✅ ${p.nama} ditambahkan ke keranjang!`, 'success');
  animateCartBounce();
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  saveCart();
  updateCartBadge();
  renderCart();
}

function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) return removeFromCart(id);
  saveCart();
  renderCart();
}

function saveCart() {
  localStorage.setItem('restyle-cart', JSON.stringify(cart));
}

function updateCartBadge() {
  const badges = document.querySelectorAll('.cart-badge');
  const total = cart.reduce((s, c) => s + c.qty, 0);
  badges.forEach(b => {
    b.textContent = total;
    b.style.display = total > 0 ? 'flex' : 'none';
  });
}

function animateCartBounce() {
  const btn = document.querySelector('[onclick="openCartModal()"]');
  if (!btn) return;
  btn.style.transform = 'scale(1.3)';
  setTimeout(() => btn.style.transform = '', 300);
}

function renderCart() {
  const container = document.getElementById('cart-list');
  const summary = document.getElementById('cart-summary');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <i class="fas fa-shopping-cart"></i>
      <p>Keranjang kosong</p>
    </div>`;
    if (summary) summary.style.display = 'none';
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.gambar}" alt="${item.nama}" onerror="this.src='https://via.placeholder.com/60x60'">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.nama}</div>
        <div class="cart-item-price">${formatRp(item.harga)}</div>
      </div>
      <div class="cart-qty">
        <button class="qty-btn" onclick="changeQty(${item.id},-1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id},1)">+</button>
      </div>
      <button class="cart-remove" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i></button>
    </div>`).join('');

  const subtotal = cart.reduce((s, c) => s + c.harga * c.qty, 0);
  if (summary) {
    summary.style.display = 'flex';
    summary.innerHTML = `
      <div class="summary-row"><span>Subtotal (${cart.reduce((s,c)=>s+c.qty,0)} item)</span><span>${formatRp(subtotal)}</span></div>
      <div class="summary-row total"><span>Total</span><span>${formatRp(subtotal)}</span></div>
      <button class="btn-primary" style="margin-top:8px;width:100%;justify-content:center" onclick="openCheckout()">
        <i class="fas fa-lock"></i> Lanjut Checkout
      </button>`;
  }
}

function openCartModal() {
  renderCart();
  openModal('cart-modal');
}

// ===================== CHECKOUT =====================
function openCheckout() {
  if (cart.length === 0) { showToast('❌ Keranjang kosong!', 'info'); return; }
  checkoutData.step = 1;
  closeModal('cart-modal');
  renderCheckoutStep(1);
  openModal('checkout-modal');
}

function buyNow(id) {
  addToCart(id);
  closeModal('detail-modal');
  openCheckout();
}

function renderCheckoutStep(step) {
  checkoutData.step = step;
  document.querySelectorAll('.step-nav-item').forEach((el, i) => {
    el.classList.remove('active', 'done');
    if (i + 1 === step) el.classList.add('active');
    else if (i + 1 < step) el.classList.add('done');
  });
  document.querySelectorAll('.checkout-step').forEach(el => el.classList.remove('active'));
  const stepEl = document.getElementById(`step-${step}`);
  if (stepEl) stepEl.classList.add('active');

  if (step === 2 && currentUser) {
    setTimeout(() => {
      const nameEl = document.getElementById('buyer-name');
      const emailEl = document.getElementById('buyer-email');
      if (nameEl && currentUser.name) nameEl.value = currentUser.name;
      if (emailEl && currentUser.email) emailEl.value = currentUser.email;
    }, 50);
  }

  if (step === 4) renderOrderSummary();
}

function loginWithGoogle() {
  currentUser = {
    name: "Pengguna ReStyle",
    email: "user@restyle.id",
    photo: "https://ui-avatars.com/api/?name=User+ReStyle&background=c8502a&color=fff"
  };
  localStorage.setItem('restyle-user', JSON.stringify(currentUser));
  document.getElementById('login-result').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;padding:14px;background:var(--surface2);border-radius:8px;border:1px solid var(--accent3);margin-top:12px;">
      <img src="${currentUser.photo}" style="width:40px;height:40px;border-radius:50%;" alt="">
      <div>
        <strong style="display:block">${currentUser.name}</strong>
        <span style="font-size:0.8rem;color:var(--text3)">${currentUser.email}</span>
      </div>
      <i class="fas fa-check-circle" style="color:var(--accent3);margin-left:auto;font-size:1.2rem;"></i>
    </div>`;
  showToast('✅ Login berhasil!', 'success');
  setTimeout(() => renderCheckoutStep(2), 800);
}

function useAutoLocation() {
  if (!navigator.geolocation) { showToast('❌ Geolocation tidak didukung', 'info'); return; }
  showToast('📍 Mendapatkan lokasi...', 'info');
  navigator.geolocation.getCurrentPosition(
    async pos => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
        const data = await res.json();
        const addr = data.address;
        const alamatEl = document.getElementById('buyer-alamat');
        const kotaEl = document.getElementById('buyer-kota');
        const provEl = document.getElementById('buyer-provinsi');
        const posEl = document.getElementById('buyer-pos');
        if (alamatEl) alamatEl.value = `${addr.road || ''} ${addr.suburb || ''}`.trim();
        if (kotaEl) kotaEl.value = addr.city || addr.town || addr.village || '';
        if (provEl) provEl.value = addr.state || '';
        if (posEl) posEl.value = addr.postcode || '';
        showToast('✅ Lokasi berhasil diisi!', 'success');
      } catch {
        showToast('❌ Gagal mendapat detail lokasi', 'info');
      }
    },
    () => showToast('❌ Akses lokasi ditolak', 'info')
  );
}

function selectCourier(name) {
  checkoutData.courier = name;
  checkoutData.courierPrice = COURIER_PRICES[name] || 15000;
  document.querySelectorAll('.kurir-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.kurir === name);
  });
}

function validateStep(step) {
  if (step === 1) {
    if (!currentUser) { showToast('❌ Silakan login terlebih dahulu!', 'info'); return false; }
    return true;
  }
  if (step === 2) {
    const fields = ['buyer-name', 'buyer-phone', 'buyer-email', 'buyer-alamat', 'buyer-kota', 'buyer-provinsi', 'buyer-pos'];
    for (const f of fields) {
      const el = document.getElementById(f);
      if (!el || !el.value.trim()) {
        showToast('❌ Lengkapi semua data pembeli!', 'info');
        el?.focus();
        return false;
      }
    }
    checkoutData.orderData = {
      nama: document.getElementById('buyer-name').value,
      phone: document.getElementById('buyer-phone').value,
      email: document.getElementById('buyer-email').value,
      alamat: document.getElementById('buyer-alamat').value,
      kota: document.getElementById('buyer-kota').value,
      provinsi: document.getElementById('buyer-provinsi').value,
      pos: document.getElementById('buyer-pos').value
    };
    return true;
  }
  if (step === 3) {
    if (!checkoutData.courier) { showToast('❌ Pilih kurir pengiriman!', 'info'); return false; }
    return true;
  }
  return true;
}

function nextStep() {
  if (!validateStep(checkoutData.step)) return;
  if (checkoutData.step < 5) renderCheckoutStep(checkoutData.step + 1);
}

function prevStep() {
  if (checkoutData.step > 1) renderCheckoutStep(checkoutData.step - 1);
}

function renderOrderSummary() {
  const container = document.getElementById('order-summary-list');
  if (!container) return;
  const subtotal = cart.reduce((s, c) => s + c.harga * c.qty, 0);
  const total = subtotal + checkoutData.courierPrice;
  const kurirLabels = { jne: 'JNE Reguler', jnt: 'J&T Express', sicepat: 'SiCepat REG', pos: 'POS Indonesia' };

  container.innerHTML = `
    ${cart.map(item => `<div class="summary-row">
      <span>${item.nama} x${item.qty}</span>
      <span>${formatRp(item.harga * item.qty)}</span>
    </div>`).join('')}
    <div class="summary-row"><span>Ongkir (${kurirLabels[checkoutData.courier] || '-'})</span><span>${formatRp(checkoutData.courierPrice)}</span></div>
    <div class="summary-row total"><span>Total Pembayaran</span><span>${formatRp(total)}</span></div>`;
}

function confirmOrder() {
  const orderId = 'RST-' + Date.now().toString(36).toUpperCase();
  const order = {
    id: orderId,
    items: [...cart],
    buyer: checkoutData.orderData,
    courier: checkoutData.courier,
    courierPrice: checkoutData.courierPrice,
    total: cart.reduce((s, c) => s + c.harga * c.qty, 0) + checkoutData.courierPrice,
    status: 'diproses',
    date: new Date().toISOString()
  };
  orders.push(order);
  localStorage.setItem('restyle-orders', JSON.stringify(orders));

  cart = [];
  saveCart();
  updateCartBadge();

  document.getElementById('success-order-id').textContent = orderId;
  renderCheckoutStep(5);
  showToast('🎉 Pesanan berhasil dibuat!', 'success');
}

// ===================== TRACK ORDER =====================
function trackOrder() {
  const orderId = document.getElementById('track-order-id')?.value.trim().toUpperCase();
  const contact = document.getElementById('track-contact')?.value.trim();
  const resultEl = document.getElementById('track-result');
  if (!orderId || !contact) { showToast('❌ Isi nomor pesanan dan kontak!', 'info'); return; }

  const order = orders.find(o => o.id === orderId &&
    (o.buyer?.email === contact || o.buyer?.phone === contact));

  if (!order) {
    if (resultEl) resultEl.innerHTML = `<div class="empty-state"><i class="fas fa-search"></i><p>Pesanan tidak ditemukan. Periksa kembali nomor pesanan Anda.</p></div>`;
    resultEl?.classList.add('show');
    return;
  }

  const statuses = [
    { label: 'Pesanan Diterima', time: new Date(order.date).toLocaleString('id-ID'), done: true },
    { label: 'Menunggu Konfirmasi Toko', time: '', done: order.status !== 'dibatalkan' },
    { label: 'Sedang Dikemas', time: '', done: ['dikemas', 'dikirim', 'selesai'].includes(order.status) },
    { label: 'Dalam Pengiriman', time: '', done: ['dikirim', 'selesai'].includes(order.status) },
    { label: 'Pesanan Selesai', time: '', done: order.status === 'selesai' }
  ];

  if (resultEl) {
    resultEl.innerHTML = `
      <div style="margin-bottom:14px;">
        <strong>ID Pesanan: ${order.id}</strong><br>
        <span style="font-size:0.82rem;color:var(--text3)">Total: ${formatRp(order.total)}</span>
      </div>
      <div class="track-timeline">
        ${statuses.map(s => `<div class="track-event">
          <div class="track-dot ${s.done ? 'done' : 'pending'}">${s.done ? '✓' : '○'}</div>
          <div class="track-info"><strong>${s.label}</strong><span>${s.time}</span></div>
        </div>`).join('')}
      </div>`;
    resultEl.classList.add('show');
  }
}

// ===================== SELL PAGE =====================
function submitSell() {
  const fields = ['sell-nama', 'sell-kat', 'sell-kondisi', 'sell-harga', 'sell-desc'];
  for (const f of fields) {
    const el = document.getElementById(f);
    if (el && !el.value.trim()) { showToast('❌ Lengkapi semua data produk!', 'info'); return; }
  }
  showToast('✅ Produk berhasil didaftarkan! Tim kami akan menghubungi Anda.', 'success');
  fields.forEach(f => { const el = document.getElementById(f); if (el) el.value = ''; });
}

// ===================== MODAL SYSTEM =====================
function openModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.add('open');
  activeModal = id;
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const overlay = document.getElementById(id || activeModal);
  if (!overlay) return;
  overlay.classList.remove('open');
  activeModal = null;
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && activeModal) closeModal(activeModal);
});

document.querySelectorAll && document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.overlay').forEach(ov => {
    ov.addEventListener('click', e => { if (e.target === ov) closeModal(ov.id); });
  });
});

// ===================== WISHLIST =====================
function addToWishlist(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  showToast(`❤️ ${p.nama} ditambahkan ke wishlist!`, 'success');
}

// ===================== TOAST =====================
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ===================== UTILITY =====================
function formatRp(n) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

// ===================== EXPOSE GLOBALS =====================
window.toggleTheme = toggleTheme;
window.handleSearch = handleSearch;
window.selectCategory = selectCategory;
window.openDetail = openDetail;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeQty = changeQty;
window.openCartModal = openCartModal;
window.openCheckout = openCheckout;
window.buyNow = buyNow;
window.loginWithGoogle = loginWithGoogle;
window.useAutoLocation = useAutoLocation;
window.selectCourier = selectCourier;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.confirmOrder = confirmOrder;
window.trackOrder = trackOrder;
window.submitSell = submitSell;
window.openModal = openModal;
window.closeModal = closeModal;
window.addToWishlist = addToWishlist;
window.goPage = goPage;
window.scrollTo = scrollTo;
