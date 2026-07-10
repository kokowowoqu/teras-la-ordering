// =============================================================
// KONFIGURASI
// =============================================================
const API_BASE = 'http://localhost:3001';

// =============================================================
// DATA MENU – SEMUA PAKAI GAMBAR
// =============================================================
const MENU_DATA = [
  { id: 'nasi-goreng', name: 'Nasi Goreng TERAS LA', category: 'main', price: 15000, emoji: '🍛', image: '../images/nasi-goreng.jpg', desc: 'Nasi goreng khas dengan bumbu rempah TERAS LA.', stock: true, hasOptions: true },
  { id: 'nasi-goreng-special', name: 'Nasi Goreng Special', category: 'main', price: 18000, emoji: '🍛', image: '../images/nasi-goreng-special.jpg', desc: 'Nasi goreng dengan topping spesial dan telur mata sapi.', stock: true, hasOptions: true },
  { id: 'mie-goreng', name: 'Mie Goreng TERAS LA', category: 'main', price: 16000, emoji: '🍜', image: '../images/mie-goreng.jpg', desc: 'Mie goreng dengan sayuran segar dan bumbu pilihan.', stock: true, hasOptions: true },
  { id: 'sate-ayam', name: 'Sate Ayam Madura', category: 'main', price: 22000, emoji: '🍢', image: '../images/sate-ayam.jpg', desc: 'Sate ayam dengan bumbu kacang khas Madura.', stock: true, hasOptions: true },
  { id: 'gado-gado', name: 'Gado-Gado', category: 'main', price: 19000, emoji: '🥗', image: '../images/gado-gado.jpg', desc: 'Sayuran segar dengan bumbu kacang dan kerupuk.', stock: true, hasOptions: true },
  { id: 'rendang', name: 'Rendang Daging Sapi', category: 'main', price: 28000, emoji: '🍖', image: '../images/rendang.jpg', desc: 'Rendang daging sapi dengan bumbu rempah yang kaya.', stock: true, hasOptions: true },
  { id: 'nasi-uduk', name: 'Nasi Uduk', category: 'main', price: 14000, emoji: '🍚', image: '../images/nasi-uduk.jpg', desc: 'Nasi uduk dengan lauk pilihan dan sambal.', stock: true, hasOptions: true },
  { id: 'es-teh', name: 'Es Teh Manis', category: 'beverage', price: 7000, emoji: '🧊', image: '../images/es-teh.jpg', desc: 'Teh manis dingin dengan es batu.', stock: true, hasOptions: true },
  { id: 'es-jeruk', name: 'Es Jeruk Peras', category: 'beverage', price: 9000, emoji: '🍊', image: '../images/es-jeruk.jpg', desc: 'Jeruk peras segar dengan es batu.', stock: true, hasOptions: true },
  { id: 'kopi-hitam', name: 'Kopi Hitam', category: 'drink', price: 10000, emoji: '☕', image: '../images/kopi-hitam.jpg', desc: 'Kopi hitam khas TERAS LA.', stock: true, hasOptions: true },
  { id: 'kopi-susu', name: 'Kopi Susu', category: 'drink', price: 12000, emoji: '☕', image: '../images/kopi-susu.jpg', desc: 'Kopi dengan susu kental manis.', stock: true, hasOptions: true },
  { id: 'air-mineral', name: 'Air Mineral', category: 'drink', price: 5000, emoji: '💧', image: '../images/air-mineral.jpg', desc: 'Air mineral dalam kemasan.', stock: true, hasOptions: false },
  { id: 'jus-alpukat', name: 'Jus Alpukat', category: 'beverage', price: 13000, emoji: '🥑', image: '../images/jus-alpukat.jpg', desc: 'Jus alpukat dengan susu kental manis.', stock: true, hasOptions: true },
  { id: 'teh-tarik', name: 'Teh Tarik', category: 'drink', price: 11000, emoji: '🍵', image: '../images/teh-tarik.jpg', desc: 'Teh tarik khas dengan rasa yang gurih.', stock: true, hasOptions: true }
];

const SPICE_LABELS = ['Tidak Pedas', 'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'];

// =============================================================
// STATE
// =============================================================
const state = {
  tableNumber: 13,
  customerName: '',
  customerPhone: '',
  orderItems: [],
  currentScreen: 'login',
  selectedMenuId: null,
  spice: 1,
  notes: '',
  quantity: 1,
  sweet: 'normal',
  temp: 'panas',
  selectedBank: null,
  orderId: null,
  statusStep: 0,
  feedbackRating: 0,
  isPaid: false,
  paymentTimer: null,
  socket: null,
  tenantOrders: [],
};

// =============================================================
// DOM REFS
// =============================================================
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const screens = {
  login: $('#screenLogin'),
  menu: $('#screenMenu'),
  summary: $('#screenSummary'),
  qris: $('#screenQris'),
  processing: $('#screenProcessing'),
  success: $('#screenSuccess'),
  status: $('#screenStatus'),
  completed: $('#screenCompleted'),
  tenant: $('#screenTenant'),
};

// =============================================================
// FUNGSI BANTUAN
// =============================================================
function fmtPrice(v) { return 'Rp ' + v.toLocaleString('id-ID'); }
function calcTotal(items) { return items.reduce((s,it) => s + it.price * it.quantity, 0); }
function calcTax(st) { return Math.round(st * 0.11); }
function calcService(st) { return Math.round(st * 0.05); }
function countItems(items) { return items.reduce((s,it) => s + it.quantity, 0); }
function getItemQty(menuId) { const f = state.orderItems.find(it => it.menuId === menuId); return f ? f.quantity : 0; }
function getMenuItem(id) { return MENU_DATA.find(m => m.id === id); }
function calculateDrinkPrice(item, sweet, temp) {
  let p = item.price;
  if (item.hasOptions && (item.category === 'beverage' || item.category === 'drink')) {
    if (temp === 'dingin') p += 1000;
    if (sweet === 'kurang') p -= 500;
    else if (sweet === 'tanpa') p -= 1000;
    if (p < 0) p = 0;
  }
  return p;
}

// =============================================================
// SOCKET.IO
// =============================================================
let socket = null;

function connectSocket() {
  if (socket && socket.connected) return;
  
  socket = io(API_BASE, {
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('✅ Terhubung ke server real-time');
    socket.emit('request-orders');
  });

  socket.on('orders-list', (orders) => {
    state.tenantOrders = orders;
    if (state.currentScreen === 'tenant') {
      renderTenantOrders();
    }
  });

  socket.on('order-update', (data) => {
    console.log('📢 Update pesanan:', data);
    localStorage.setItem('orderStatus_' + data.orderId, JSON.stringify({ status: data.status, history: data.history }));
    
    if (state.currentScreen === 'status' && state.orderId === data.orderId) {
      state.statusStep = data.status;
      updateStatusUI();
      if (data.history) renderHistory(data.history);
      if (data.status === 3) {
        $('#btnCompleteOrder').style.display = 'block';
        $('#statusMessage').textContent = '✅ Pesanan selesai! Silakan ambil.';
        $('#statusTime').textContent = '';
      }
    }
    if (state.currentScreen === 'tenant') {
      renderTenantOrders();
    }
  });

  socket.on('new-order', (order) => {
    console.log('📢 Pesanan baru:', order);
    if (state.currentScreen === 'tenant') {
      playNotificationSound();
      renderTenantOrders();
      alert(`🔔 Pesanan baru dari meja ${order.table} (${order.customerName})`);
    }
    const orders = JSON.parse(localStorage.getItem('tenantOrders') || '[]');
    if (!orders.find(o => o.orderId === order.orderId)) {
      orders.push(order);
      localStorage.setItem('tenantOrders', JSON.stringify(orders));
    }
  });

  socket.on('disconnect', () => {
    console.warn('⚠️ Koneksi ke server terputus. Mencoba reconnect...');
  });

  socket.on('connect', () => {
    socket.emit('request-orders');
  });
}

function playNotificationSound() {
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoAAACBhYqFhYWGhoaJiYuMjY6OjpCPkZGSkpKSlZWVlpaWlpaWlpaYl5eYl5eYmJmampqcnJ2dnZ6en56fn5+goKCgoQAAAA==');
    audio.play().catch(() => {});
  } catch(e) {}
}

// =============================================================
// NAVIGASI
// =============================================================
let isTenantMode = false;

function showScreen(name) {
  Object.keys(screens).forEach(key => {
    screens[key].classList.toggle('active', key === name);
  });
  state.currentScreen = name;
  updateHeader(name);
  document.getElementById('mainScroll').scrollTop = 0;

  if (name === 'qris') {
    $('#qrcode').innerHTML = '';
    $('#qrcode').classList.add('hidden');
    $('#qrInstruction').textContent = 'Pilih bank/dompet digital di bawah';
    document.querySelectorAll('#bankGrid .bank-item').forEach(el => el.classList.remove('selected'));
    state.selectedBank = null;
    const total = calcTotal(state.orderItems) + calcTax(calcTotal(state.orderItems)) + calcService(calcTotal(state.orderItems));
    $('#qrisAmount').textContent = fmtPrice(total);
    if (state.paymentTimer) { clearTimeout(state.paymentTimer); state.paymentTimer = null; }
  }
  if (name === 'success') renderStruk();
  if (name === 'login') $('#headerIndicator').textContent = '1/7';
  if (name === 'tenant') {
    connectSocket();
    renderTenantOrders();
  }
  if (name === 'status' && state.orderId) {
    if (!socket || !socket.connected) {
      startStatusPolling(state.orderId);
    } else {
      fetch(`${API_BASE}/api/order/${state.orderId}/status`)
        .then(res => res.json())
        .then(data => {
          if (data.status !== undefined) {
            state.statusStep = data.status;
            updateStatusUI();
            if (data.history) renderHistory(data.history);
            if (data.status === 3) {
              $('#btnCompleteOrder').style.display = 'block';
              $('#statusMessage').textContent = '✅ Pesanan selesai!';
              $('#statusTime').textContent = '';
            }
          }
        })
        .catch(() => {
          updateStatusHistory(state.orderId);
        });
    }
  }
}

function updateHeader(name) {
  const labels = { login:'Selamat Datang', menu:'Menu', summary:'Ringkasan Pesanan', qris:'Pembayaran QRIS', processing:'Memproses', success:'Berhasil', status:'Status Pesanan', completed:'Selesai', tenant:'Restoran' };
  const steps = { login:1, menu:2, summary:3, qris:4, processing:5, success:6, status:7, completed:8, tenant:9 };
  $('#headerStep').textContent = labels[name] || name;
  $('#headerIndicator').textContent = `${steps[name] || '?'}/7`;
  $('#headerTable').textContent = `Meja ${state.tableNumber}`;
}

// =============================================================
// LOGIN
// =============================================================
function initLogin() {
  const urlParams = new URLSearchParams(window.location.search);
  const table = parseInt(urlParams.get('table')) || 13;
  state.tableNumber = table;
  $('#loginTableNumber').textContent = `Meja ${table}`;
  $('#headerTable').textContent = `Meja ${table}`;
  connectSocket();
}

$('#btnStartOrder').addEventListener('click', () => {
  const name = $('#inputName').value.trim();
  const phone = $('#inputPhone').value.trim();
  if (!name) { alert('Masukkan nama.'); $('#inputName').focus(); return; }
  if (!phone) { alert('Masukkan nomor telepon.'); $('#inputPhone').focus(); return; }
  if (!/^\d+$/.test(phone)) { alert('Nomor telepon hanya angka.'); $('#inputPhone').focus(); return; }
  state.customerName = name;
  state.customerPhone = phone;
  showScreen('menu');
  renderMenu();
  updateOrderFloat();
});

$('#inputPhone').addEventListener('keydown', e => { if (e.key === 'Enter') $('#btnStartOrder').click(); });
$('#inputName').addEventListener('keydown', e => { if (e.key === 'Enter') $('#inputPhone').focus(); });

// =============================================================
// MENU – RENDER DENGAN GAMBAR
// =============================================================
let currentCategory = 'all';

function renderMenu() {
  const filtered = currentCategory === 'all' ? MENU_DATA : MENU_DATA.filter(m => m.category === currentCategory);
  if (filtered.length === 0) {
    $('#menuItems').innerHTML = `<div class="text-center text-muted" style="padding:30px 0;">Tidak ada menu</div>`;
    return;
  }
  let html = '';
  filtered.forEach(item => {
    const qty = getItemQty(item.id);
    const imgHtml = `<img src="${item.image}" alt="${item.name}" style="width:48px;height:48px;object-fit:cover;border-radius:8px;" onerror="this.style.display='none';this.parentNode.innerHTML='${item.emoji}';">`;
    html += `
      <div class="menu-item-card" data-id="${item.id}">
        <div class="icon-box">
          ${imgHtml}
        </div>
        <div class="info">
          <div class="name">${item.name}</div>
          <div class="desc">${item.desc || ''}</div>
          <div class="price-stock">
            <span class="price">${fmtPrice(item.price)}</span>
            <span class="stock">${item.stock ? '✅ Tersedia' : '❌ Habis'}</span>
          </div>
        </div>
        ${qty > 0 ? `<span class="qty-pill">${qty}x</span>` : ''}
        <button class="add-btn" data-id="${item.id}" ${!item.stock ? 'disabled style="opacity:0.4;"' : ''}>
          ${qty > 0 ? '➕' : '+ Add'}
        </button>
      </div>
    `;
  });
  $('#menuItems').innerHTML = html;
  $('#menuItems').querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', () => openAddModal(btn.dataset.id));
  });
}

document.querySelectorAll('#categoryTabs .tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('#categoryTabs .tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentCategory = tab.dataset.cat;
    renderMenu();
  });
});

// =============================================================
// ORDER FLOAT
// =============================================================
function updateOrderFloat() {
  const total = calcTotal(state.orderItems);
  const count = countItems(state.orderItems);
  $('#floatTotal').textContent = fmtPrice(total);
  $('#floatCount').textContent = count + ' item' + (count !== 1 ? 's' : '');
  $('#cartCount').textContent = count;
  $('#orderFloat').style.display = count > 0 ? 'flex' : 'none';
}

// =============================================================
// MODAL ADD ITEM
// =============================================================
function openAddModal(menuId) {
  const item = getMenuItem(menuId);
  if (!item) return;
  state.selectedMenuId = menuId;
  state.spice = 1;
  state.notes = '';
  state.quantity = 1;
  state.sweet = 'normal';
  state.temp = 'panas';

  $('#modalItemName').textContent = item.name;
  const initialPrice = calculateDrinkPrice(item, state.sweet, state.temp);
  $('#modalPriceDisplay').textContent = fmtPrice(initialPrice);
  $('#modalNotes').value = '';
  $('#qtyNumber').textContent = '1';

  const isMain = item.category === 'main';
  const isDrink = item.category === 'beverage' || item.category === 'drink';
  const hasOptions = item.hasOptions !== false;

  $('#modalSpiceGroup').style.display = isMain ? 'block' : 'none';
  $('#modalDrinkOptions').style.display = (isDrink && hasOptions) ? 'block' : 'none';

  if (isMain) {
    document.querySelectorAll('#spiceGroup .spice-btn').forEach(b => b.classList.remove('active'));
    const def = document.querySelector('#spiceGroup .spice-btn[data-spice="1"]');
    if (def) def.classList.add('active');
  }
  if (isDrink && hasOptions) {
    document.querySelectorAll('#sweetGroup .opt-btn').forEach(b => b.classList.remove('active'));
    const defSweet = document.querySelector('#sweetGroup .opt-btn[data-opt="normal"]');
    if (defSweet) defSweet.classList.add('active');
    document.querySelectorAll('#tempGroup .opt-btn').forEach(b => b.classList.remove('active'));
    const defTemp = document.querySelector('#tempGroup .opt-btn[data-opt="panas"]');
    if (defTemp) defTemp.classList.add('active');
  }

  const updatePrice = () => {
    const newPrice = calculateDrinkPrice(item, state.sweet, state.temp);
    $('#modalPriceDisplay').textContent = fmtPrice(newPrice);
  };

  document.querySelectorAll('#sweetGroup .opt-btn').forEach(btn => {
    btn.onclick = function() {
      document.querySelectorAll('#sweetGroup .opt-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      state.sweet = this.dataset.opt;
      updatePrice();
    };
  });
  document.querySelectorAll('#tempGroup .opt-btn').forEach(btn => {
    btn.onclick = function() {
      document.querySelectorAll('#tempGroup .opt-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      state.temp = this.dataset.opt;
      updatePrice();
    };
  });
  document.querySelectorAll('#spiceGroup .spice-btn').forEach(btn => {
    btn.onclick = function() {
      document.querySelectorAll('#spiceGroup .spice-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      state.spice = parseInt(this.dataset.spice);
    };
  });

  $('#addModal').classList.add('open');
}

function closeModal() { $('#addModal').classList.remove('open'); }

$('#qtyMinus').addEventListener('click', () => { if (state.quantity > 1) { state.quantity--; $('#qtyNumber').textContent = state.quantity; } });
$('#qtyPlus').addEventListener('click', () => { if (state.quantity < 20) { state.quantity++; $('#qtyNumber').textContent = state.quantity; } });
$('#modalNotes').addEventListener('input', () => { state.notes = $('#modalNotes').value; });

$('#btnAddToOrder').addEventListener('click', () => {
  const menuId = state.selectedMenuId;
  if (!menuId) return;
  const item = getMenuItem(menuId);
  if (!item) return;
  const hasOptions = item.hasOptions !== false;
  const finalPrice = calculateDrinkPrice(item, state.sweet, state.temp);

  const existing = state.orderItems.find(
    it => it.menuId === menuId &&
      it.spice === state.spice &&
      it.notes === state.notes &&
      it.sweet === state.sweet &&
      it.temp === state.temp
  );
  if (existing) {
    existing.quantity += state.quantity;
  } else {
    state.orderItems.push({
      menuId: item.id,
      name: item.name,
      price: finalPrice,
      category: item.category,
      emoji: item.emoji,
      image: item.image,
      spice: state.spice,
      notes: state.notes,
      quantity: state.quantity,
      sweet: hasOptions ? state.sweet : null,
      temp: hasOptions ? state.temp : null,
      hasOptions: hasOptions,
    });
  }
  closeModal();
  renderMenu();
  updateOrderFloat();
  if (state.currentScreen === 'summary') renderSummary();
});

$('#btnCloseModal').addEventListener('click', closeModal);
$('#addModal').addEventListener('click', e => { if (e.target === $('#addModal')) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#addModal').classList.contains('open')) closeModal(); });

// =============================================================
// VIEW ORDER → SUMMARY
// =============================================================
$('#viewOrderBtn').addEventListener('click', () => { showScreen('summary'); renderSummary(); });
$('#cartBadge').addEventListener('click', () => { if (state.orderItems.length > 0) { showScreen('summary'); renderSummary(); } });
$('#backToMenuBtn').addEventListener('click', () => { showScreen('menu'); renderMenu(); updateOrderFloat(); });

// =============================================================
// SUMMARY – DENGAN GAMBAR KECIL
// =============================================================
function renderSummary() {
  if (state.orderItems.length === 0) {
    $('#summaryItemsList').innerHTML = `<div class="text-muted text-center" style="padding:20px 0;">Belum ada pesanan</div>`;
    $('#summarySubtotal').textContent = 'Rp 0';
    $('#summaryTax').textContent = 'Rp 0';
    $('#summaryService').textContent = 'Rp 0';
    $('#summaryTotal').textContent = 'Rp 0';
    $('#summaryGrandTotal').textContent = 'Rp 0';
    $('#btnPayNow').disabled = true;
    return;
  }

  let html = '';
  state.orderItems.forEach((it, index) => {
    const spiceLabel = (it.category === 'main') ? (SPICE_LABELS[it.spice] || `Level ${it.spice}`) : '';
    let opts = [];
    if (it.hasOptions !== false && (it.category === 'drink' || it.category === 'beverage')) {
      if (it.sweet) opts.push(it.sweet === 'normal' ? 'Manis Normal' : it.sweet === 'kurang' ? 'Kurang Manis' : 'Tanpa Gula');
      if (it.temp) opts.push(it.temp === 'panas' ? 'Panas' : 'Dingin');
    }
    const meta = [spiceLabel, ...opts, it.notes].filter(Boolean).join(' · ');
    const itemTotal = it.price * it.quantity;
    
    const imgHtml = it.image ? 
      `<img src="${it.image}" alt="${it.name}" style="width:28px;height:28px;object-fit:cover;border-radius:6px;vertical-align:middle;margin-right:8px;" onerror="this.style.display='none';">` : 
      (it.emoji || '🍽️');
    
    html += `
      <div class="summary-item" data-index="${index}">
        <div class="left">
          <div class="name">${imgHtml} ${it.name}</div>
          <div class="meta">${meta || '—'}</div>
        </div>
        <div class="right">
          <button class="btn-qty minus-btn" data-index="${index}">−</button>
          <span class="qty">${it.quantity}</span>
          <button class="btn-qty plus-btn" data-index="${index}">+</button>
          <span class="price">${fmtPrice(itemTotal)}</span>
          <button class="btn-qty danger delete-btn" data-index="${index}">✕</button>
        </div>
      </div>
    `;
  });
  $('#summaryItemsList').innerHTML = html;

  $('#summaryItemsList').querySelectorAll('.minus-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index);
      const item = state.orderItems[idx];
      if (item.quantity > 1) item.quantity--;
      else state.orderItems.splice(idx, 1);
      renderSummary(); updateOrderFloat(); renderMenu();
    });
  });
  $('#summaryItemsList').querySelectorAll('.plus-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index);
      const item = state.orderItems[idx];
      if (item.quantity < 20) item.quantity++;
      renderSummary(); updateOrderFloat(); renderMenu();
    });
  });
  $('#summaryItemsList').querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index);
      state.orderItems.splice(idx, 1);
      renderSummary(); updateOrderFloat(); renderMenu();
    });
  });

  const subtotal = calcTotal(state.orderItems);
  const tax = calcTax(subtotal);
  const service = calcService(subtotal);
  const total = subtotal + tax + service;

  $('#summarySubtotal').textContent = fmtPrice(subtotal);
  $('#summaryTax').textContent = fmtPrice(tax);
  $('#summaryService').textContent = fmtPrice(service);
  $('#summaryTotal').textContent = fmtPrice(total);
  $('#summaryGrandTotal').textContent = fmtPrice(total);
  $('#btnPayNow').disabled = false;
}

// =============================================================
// PAY NOW → QRIS
// =============================================================
$('#btnPayNow').addEventListener('click', () => {
  if (state.orderItems.length === 0) return;
  showScreen('qris');
});

// =============================================================
// QR CODE & AUTO PAYMENT
// =============================================================
let qrCodeInstance = null;

function generateQRCode() {
  $('#qrcode').innerHTML = '';
  const total = calcTotal(state.orderItems) + calcTax(calcTotal(state.orderItems)) + calcService(calcTotal(state.orderItems));
  const data = `TERASLA|${state.orderId || 'ORD' + Date.now()}|${total}|MEJA${state.tableNumber}|${state.customerName}|${state.selectedBank || 'QRIS'}`;
  try {
    qrCodeInstance = new QRCode($('#qrcode'), {
      text: data,
      width: 180,
      height: 180,
      colorDark: '#2d1f14',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
    $('#qrcode').classList.remove('hidden');
    $('#qrInstruction').textContent = '✅ QR Code siap di-scan. Pembayaran otomatis...';
    if (state.paymentTimer) clearTimeout(state.paymentTimer);
    state.paymentTimer = setTimeout(() => { processPayment(); }, 3000);
  } catch(e) {
    $('#qrcode').innerHTML = '<p style="color:red;">Gagal generate QR</p>';
  }
}

function processPayment() {
  if (state.paymentTimer) { clearTimeout(state.paymentTimer); state.paymentTimer = null; }
  showScreen('processing');
  $('#processingBar').style.width = '0%';
  $('#processingText').textContent = 'Verifikasi pembayaran...';
  let p = 0;
  const interval = setInterval(() => {
    p += Math.random() * 5 + 2;
    if (p >= 100) {
      p = 100;
      clearInterval(interval);
      $('#processingBar').style.width = '100%';
      $('#processingText').textContent = '✅ Pembayaran berhasil!';
      setTimeout(async () => {
        state.isPaid = true;
        state.orderId = '#' + String(Math.floor(Math.random() * 9000) + 1000);
        state.statusStep = 0;
        const total = calcTotal(state.orderItems) + calcTax(calcTotal(state.orderItems)) + calcService(calcTotal(state.orderItems));

        try {
          const res = await fetch(`${API_BASE}/api/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: state.orderId,
              table: state.tableNumber,
              customerName: state.customerName,
              items: state.orderItems.map(it => ({ ...it })),
              total: total,
              createdAt: new Date().toISOString()
            })
          });
          if (!res.ok) throw new Error('Gagal');
        } catch(err) {
          console.warn('Backend tidak merespon, simpan lokal:', err);
          const orderData = {
            orderId: state.orderId,
            table: state.tableNumber,
            customerName: state.customerName,
            items: state.orderItems.map(it => ({ ...it })),
            total: total,
            status: 0,
            createdAt: new Date().toISOString(),
            statusHistory: [{ label: 'Pesanan Masuk', time: new Date().toISOString() }]
          };
          const orders = JSON.parse(localStorage.getItem('tenantOrders') || '[]');
          orders.push(orderData);
          localStorage.setItem('tenantOrders', JSON.stringify(orders));
          localStorage.setItem('orderStatus_' + state.orderId, JSON.stringify({ status: 0, history: orderData.statusHistory }));
        }

        showScreen('success');
        $('#successOrderId').textContent = state.orderId;
        $('#successTable').textContent = `Meja ${state.tableNumber}`;
        $('#successTotal').textContent = fmtPrice(total);
        renderStruk();
      }, 500);
    }
    $('#processingBar').style.width = Math.min(p, 100) + '%';
    if (p > 30 && p < 70) $('#processingText').textContent = 'Memproses transaksi...';
    if (p >= 70) $('#processingText').textContent = 'Hampir selesai...';
  }, 160);
}

// =============================================================
// QRIS BANK SELECTION (tetap pakai emoji)
// =============================================================
document.querySelectorAll('#bankGrid .bank-item').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('#bankGrid .bank-item').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    state.selectedBank = el.dataset.bank;
    generateQRCode();
  });
});

$('#backToSummaryBtn').addEventListener('click', () => {
  if (state.paymentTimer) { clearTimeout(state.paymentTimer); state.paymentTimer = null; }
  showScreen('summary');
  renderSummary();
});

// =============================================================
// STRUK
// =============================================================
function renderStruk() {
  const orderId = state.orderId || '#0000';
  const table = state.tableNumber;
  const name = state.customerName || 'Pelanggan';
  const items = state.orderItems;
  const subtotal = calcTotal(items);
  const tax = calcTax(subtotal);
  const service = calcService(subtotal);
  const total = subtotal + tax + service;

  let itemsHtml = '';
  items.forEach(it => {
    const spiceLabel = (it.category === 'main') ? (SPICE_LABELS[it.spice] || `Level ${it.spice}`) : '';
    let opts = [];
    if (it.hasOptions !== false && (it.category === 'drink' || it.category === 'beverage')) {
      if (it.sweet) opts.push(it.sweet === 'normal' ? 'Manis Normal' : it.sweet === 'kurang' ? 'Kurang Manis' : 'Tanpa Gula');
      if (it.temp) opts.push(it.temp === 'panas' ? 'Panas' : 'Dingin');
    }
    const meta = [spiceLabel, ...opts, it.notes].filter(Boolean).join(' · ');
    itemsHtml += `
      <div class="row-struk">
        <span class="label">${it.emoji} ${it.name} ${meta ? ' ('+meta+')' : ''} ×${it.quantity}</span>
        <span class="value">${fmtPrice(it.price * it.quantity)}</span>
      </div>
    `;
  });

  const strukHtml = `
    <div class="struk-card">
      <div class="header-struk">TERAS LA</div>
      <div class="row-struk"><span class="label">Order ID</span><span class="value">${orderId}</span></div>
      <div class="row-struk"><span class="label">Meja</span><span class="value">${table}</span></div>
      <div class="row-struk"><span class="label">Pelanggan</span><span class="value">${name}</span></div>
      <div class="row-struk"><span class="label">Tanggal</span><span class="value">${new Date().toLocaleString('id-ID')}</span></div>
      <hr class="divider-struk" />
      ${itemsHtml}
      <hr class="divider-struk" />
      <div class="row-struk"><span class="label">Subtotal</span><span class="value">${fmtPrice(subtotal)}</span></div>
      <div class="row-struk"><span class="label">Tax 11%</span><span class="value">${fmtPrice(tax)}</span></div>
      <div class="row-struk"><span class="label">Service 5%</span><span class="value">${fmtPrice(service)}</span></div>
      <div class="total-struk"><span>Total</span><span>${fmtPrice(total)}</span></div>
      <div class="footer-struk">Terima kasih telah berkunjung!</div>
    </div>
  `;
  $('#strukContainer').innerHTML = strukHtml;
}

// =============================================================
// DOWNLOAD STRUK
// =============================================================
$('#btnDownloadStruk').addEventListener('click', () => {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = '#8B5E3C';
  ctx.lineWidth = 4;
  ctx.strokeRect(10,10,canvas.width-20,canvas.height-20);

  ctx.fillStyle = '#6B4226';
  ctx.font = 'bold 24px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TERAS LA', canvas.width/2, 50);

  ctx.font = '14px Inter, sans-serif';
  ctx.fillStyle = '#2d1f14';
  ctx.textAlign = 'left';
  let y = 80;
  const lines = [
    `Order ID: ${state.orderId || '#0000'}`,
    `Meja: ${state.tableNumber}`,
    `Pelanggan: ${state.customerName || '-'}`,
    `Tanggal: ${new Date().toLocaleString('id-ID')}`,
  ];
  lines.forEach(line => { ctx.fillText(line, 30, y); y += 22; });

  ctx.beginPath();
  ctx.setLineDash([5,5]);
  ctx.moveTo(30, y);
  ctx.lineTo(canvas.width-30, y);
  ctx.strokeStyle = '#ccc';
  ctx.stroke();
  ctx.setLineDash([]);
  y += 20;

  state.orderItems.forEach(it => {
    const spiceLabel = (it.category === 'main') ? (SPICE_LABELS[it.spice] || `Level ${it.spice}`) : '';
    let opts = [];
    if (it.hasOptions !== false && (it.category === 'drink' || it.category === 'beverage')) {
      if (it.sweet) opts.push(it.sweet === 'normal' ? 'Manis Normal' : it.sweet === 'kurang' ? 'Kurang Manis' : 'Tanpa Gula');
      if (it.temp) opts.push(it.temp === 'panas' ? 'Panas' : 'Dingin');
    }
    const meta = [spiceLabel, ...opts, it.notes].filter(Boolean).join(' ');
    let label = `${it.emoji} ${it.name}`;
    if (meta) label += ` (${meta})`;
    label += ` ×${it.quantity}`;
    ctx.fillStyle = '#2d1f14';
    ctx.font = '13px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, 30, y);
    ctx.textAlign = 'right';
    ctx.fillText(fmtPrice(it.price * it.quantity), canvas.width-30, y);
    ctx.textAlign = 'left';
    y += 22;
  });

  ctx.beginPath();
  ctx.setLineDash([5,5]);
  ctx.moveTo(30, y);
  ctx.lineTo(canvas.width-30, y);
  ctx.strokeStyle = '#ccc';
  ctx.stroke();
  ctx.setLineDash([]);
  y += 18;

  const subtotal = calcTotal(state.orderItems);
  const tax = calcTax(subtotal);
  const service = calcService(subtotal);
  const total = subtotal + tax + service;

  ctx.font = '14px Inter, sans-serif';
  ctx.fillStyle = '#2d1f14';
  ctx.textAlign = 'left';
  ctx.fillText('Subtotal', 30, y);
  ctx.textAlign = 'right';
  ctx.fillText(fmtPrice(subtotal), canvas.width-30, y);
  y += 22;
  ctx.textAlign = 'left';
  ctx.fillText('Tax 11%', 30, y);
  ctx.textAlign = 'right';
  ctx.fillText(fmtPrice(tax), canvas.width-30, y);
  y += 22;
  ctx.textAlign = 'left';
  ctx.fillText('Service 5%', 30, y);
  ctx.textAlign = 'right';
  ctx.fillText(fmtPrice(service), canvas.width-30, y);
  y += 26;

  ctx.font = 'bold 18px Inter, sans-serif';
  ctx.fillStyle = '#6B4226';
  ctx.textAlign = 'left';
  ctx.fillText('Total', 30, y);
  ctx.textAlign = 'right';
  ctx.fillText(fmtPrice(total), canvas.width-30, y);

  ctx.font = '12px Inter, sans-serif';
  ctx.fillStyle = '#8a7a6a';
  ctx.textAlign = 'center';
  ctx.fillText('Terima kasih telah berkunjung!', canvas.width/2, canvas.height-30);

  const link = document.createElement('a');
  link.download = `struk_${state.orderId || 'order'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
});

// =============================================================
// COPY DETAIL
// =============================================================
function getDetailText() {
  const orderId = state.orderId || '#0000';
  const table = state.tableNumber;
  const name = state.customerName || 'Pelanggan';
  const items = state.orderItems;
  const subtotal = calcTotal(items);
  const tax = calcTax(subtotal);
  const service = calcService(subtotal);
  const total = subtotal + tax + service;

  let detail = `🍽️ *TERAS LA - Detail Pesanan*\n`;
  detail += `Order ID: ${orderId}\nMeja: ${table}\nPelanggan: ${name}\nTanggal: ${new Date().toLocaleString('id-ID')}\n───────────────────\n`;
  items.forEach(it => {
    const spiceLabel = (it.category === 'main') ? (SPICE_LABELS[it.spice] || `Level ${it.spice}`) : '';
    let opts = [];
    if (it.hasOptions !== false && (it.category === 'drink' || it.category === 'beverage')) {
      if (it.sweet) opts.push(it.sweet === 'normal' ? 'Manis Normal' : it.sweet === 'kurang' ? 'Kurang Manis' : 'Tanpa Gula');
      if (it.temp) opts.push(it.temp === 'panas' ? 'Panas' : 'Dingin');
    }
    const meta = [spiceLabel, ...opts, it.notes].filter(Boolean).join(' · ');
    detail += `${it.emoji} ${it.name} ${meta ? '('+meta+')' : ''} ×${it.quantity} = ${fmtPrice(it.price * it.quantity)}\n`;
  });
  detail += `───────────────────\nSubtotal: ${fmtPrice(subtotal)}\nTax 11%: ${fmtPrice(tax)}\nService 5%: ${fmtPrice(service)}\n*Total: ${fmtPrice(total)}*\n───────────────────\nTerima kasih!`;
  return detail;
}

$('#btnCopyDetail').addEventListener('click', () => {
  const detail = getDetailText();
  navigator.clipboard.writeText(detail).then(() => alert('✅ Detail disalin.')).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = detail;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    alert('✅ Detail disalin.');
  });
});

// =============================================================
// SEND WHATSAPP
// =============================================================
$('#btnSendWhatsApp').addEventListener('click', () => {
  const phone = state.customerPhone.trim();
  if (!phone) { alert('Nomor telepon tidak ditemukan.'); return; }
  let formatted = phone.replace(/\s/g, '');
  if (formatted.startsWith('0')) formatted = '62' + formatted.substring(1);
  else if (!formatted.startsWith('62')) formatted = '62' + formatted;
  formatted = formatted.replace(/\D/g, '');
  if (formatted.length < 10) { alert('Nomor tidak valid.'); return; }
  window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(getDetailText())}`, '_blank');
});

// =============================================================
// STATUS
// =============================================================
let statusPollInterval = null;

function startStatusPolling(orderId) {
  if (statusPollInterval) clearInterval(statusPollInterval);
  statusPollInterval = setInterval(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/order/${orderId}/status`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      if (data.status !== undefined && data.status !== state.statusStep) {
        state.statusStep = data.status;
        updateStatusUI();
        if (data.history) renderHistory(data.history);
        if (data.status === 3) {
          $('#btnCompleteOrder').style.display = 'block';
          $('#statusMessage').textContent = '✅ Pesanan selesai! Silakan ambil.';
          $('#statusTime').textContent = '';
          clearInterval(statusPollInterval);
          statusPollInterval = null;
        }
      }
      if (data.history) renderHistory(data.history);
    } catch(e) {
      const local = localStorage.getItem('orderStatus_' + orderId);
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.status !== undefined && parsed.status !== state.statusStep) {
          state.statusStep = parsed.status;
          updateStatusUI();
          if (parsed.history) renderHistory(parsed.history);
          if (parsed.status === 3) {
            $('#btnCompleteOrder').style.display = 'block';
            $('#statusMessage').textContent = '✅ Pesanan selesai!';
            $('#statusTime').textContent = '';
            clearInterval(statusPollInterval);
            statusPollInterval = null;
          }
        }
        if (parsed.history) renderHistory(parsed.history);
      }
    }
  }, 5000);
}

function updateStatusUI() {
  const idx = state.statusStep;
  const messages = ['Pesanan diterima oleh dapur', 'Sedang dimasak', 'Siap saji', '✅ Selesai!'];
  $('#statusMessage').textContent = messages[idx] || messages[0];
  $('#statusTime').textContent = '';
  document.querySelectorAll('#statusSteps .step').forEach((el,i) => {
    el.classList.remove('done','active');
    if (i < idx) el.classList.add('done');
    if (i === idx) el.classList.add('active');
  });
}

function renderHistory(history) {
  if (!history || history.length === 0) {
    $('#statusHistoryList').innerHTML = '<div class="text-muted">Belum ada riwayat</div>';
    return;
  }
  let html = '';
  history.forEach(h => {
    const time = new Date(h.time).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
    html += `<div class="history-item"><span class="h-label">${h.label}</span><span class="h-time">${time}</span></div>`;
  });
  $('#statusHistoryList').innerHTML = html;
}

function updateStatusHistory(orderId) {
  const local = localStorage.getItem('orderStatus_' + orderId);
  if (local) {
    const parsed = JSON.parse(local);
    if (parsed.history) renderHistory(parsed.history);
  } else {
    const orders = JSON.parse(localStorage.getItem('tenantOrders') || '[]');
    const order = orders.find(o => o.orderId === orderId);
    if (order && order.statusHistory) renderHistory(order.statusHistory);
  }
}

// =============================================================
// TOMBOL "LIHAT STATUS PESANAN"
// =============================================================
$('#btnViewStatus').addEventListener('click', function(e) {
  e.preventDefault();
  if (!state.orderId) {
    alert('Belum ada pesanan aktif.');
    return;
  }
  showScreen('status');
  $('#statusOrderId').textContent = state.orderId || '#215';
  $('#statusTable').textContent = `Meja ${state.tableNumber}`;
  $('#btnCompleteOrder').style.display = 'none';
  updateStatusUI();
  updateStatusHistory(state.orderId);
  if (state.orderId) {
    startStatusPolling(state.orderId);
  }
});

// =============================================================
// TOMBOL KEMBALI KE MENU (Status → Menu)
// =============================================================
$('#backFromStatusBtn').addEventListener('click', function(e) {
  e.preventDefault();
  if (statusPollInterval) {
    clearInterval(statusPollInterval);
    statusPollInterval = null;
  }
  state.statusStep = 0;
  $('#statusHistoryList').innerHTML = '';
  $('#statusMessage').textContent = 'Pesanan diterima oleh dapur';
  $('#statusTime').textContent = '';
  document.querySelectorAll('#statusSteps .step').forEach(el => {
    el.classList.remove('done', 'active');
  });
  showScreen('menu');
  renderMenu();
  updateOrderFloat();
});

// =============================================================
// TOMBOL PESANAN SELESAI
// =============================================================
$('#btnCompleteOrder').addEventListener('click', function() {
  if (statusPollInterval) {
    clearInterval(statusPollInterval);
    statusPollInterval = null;
  }
  showScreen('completed');
  state.feedbackRating = 0;
  document.querySelectorAll('#feedbackStars span').forEach(el => el.classList.remove('active'));
  $('#feedbackLabel').textContent = 'Klik bintang untuk memberi rating';
  $('#feedbackText').value = '';
});

// =============================================================
// FEEDBACK
// =============================================================
document.querySelectorAll('#feedbackStars span').forEach(el => {
  el.addEventListener('click', () => {
    const star = parseInt(el.dataset.star);
    state.feedbackRating = star;
    document.querySelectorAll('#feedbackStars span').forEach(s => {
      s.classList.toggle('active', parseInt(s.dataset.star) <= star);
    });
    $('#feedbackLabel').textContent = `⭐ ${star} bintang — Terima kasih!`;
  });
});

$('#btnSubmitFeedback').addEventListener('click', () => {
  const text = $('#feedbackText').value.trim();
  if (state.feedbackRating === 0) { alert('Beri rating dulu.'); return; }
  alert(`✅ Feedback terkirim!\nRating: ${state.feedbackRating} bintang\n${text ? 'Catatan: ' + text : ''}`);
  resetOrder();
  showScreen('menu');
  renderMenu();
  updateOrderFloat();
});

$('#btnOrderAgain').addEventListener('click', () => {
  resetOrder();
  showScreen('menu');
  renderMenu();
  updateOrderFloat();
});

function resetOrder() {
  if (statusPollInterval) { clearInterval(statusPollInterval); statusPollInterval = null; }
  if (state.paymentTimer) { clearTimeout(state.paymentTimer); state.paymentTimer = null; }
  state.orderItems = [];
  state.orderId = null;
  state.statusStep = 0;
  state.isPaid = false;
  state.feedbackRating = 0;
  state.selectedBank = null;
}

// =============================================================
// TENANT
// =============================================================
function getTenantOrders() {
  try { return JSON.parse(localStorage.getItem('tenantOrders')) || []; } catch { return []; }
}
function saveTenantOrders(orders) {
  localStorage.setItem('tenantOrders', JSON.stringify(orders));
}

async function renderTenantOrders() {
  let orders = [];
  if (socket && socket.connected) {
    orders = state.tenantOrders;
  } else {
    try {
      const res = await fetch(`${API_BASE}/api/orders`);
      if (res.ok) orders = await res.json();
      else throw new Error('Gagal');
    } catch {
      orders = getTenantOrders();
    }
  }

  if (orders.length === 0) {
    $('#tenantOrderList').innerHTML = '';
    $('#tenantEmpty').style.display = 'block';
    return;
  }
  $('#tenantEmpty').style.display = 'none';

  let html = '';
  const statusLabels = ['Diterima', 'Dimasak', 'Siap Saji', 'Selesai'];
  const statusColors = ['#2e7d5e', '#f5a623', '#4a90d9', '#6c757d'];

  orders.forEach(order => {
    const status = order.status || 0;
    const history = order.statusHistory || [];
    let historyHtml = history.map(h =>
      `<div>${h.label}: ${new Date(h.time).toLocaleTimeString('id-ID')}</div>`
    ).join('');

    html += `
      <div class="tenant-order-card">
        <div class="order-meta">
          <div>
            <span style="font-weight:700;font-size:16px;">${order.orderId}</span>
            <span style="font-size:13px;color:var(--text-muted);margin-left:8px;">Meja ${order.table}</span>
            <span style="font-size:13px;color:var(--text-muted);margin-left:8px;">${order.customerName}</span>
          </div>
          <div>
            <span style="background:${statusColors[status]};color:#fff;padding:2px 12px;border-radius:20px;font-size:12px;font-weight:600;">${statusLabels[status]}</span>
          </div>
        </div>
        <div class="order-items">
          ${order.items.map(it => `${it.emoji} ${it.name} ×${it.quantity}`).join(', ')}
          <span style="font-weight:700;margin-left:8px;">${fmtPrice(order.total)}</span>
        </div>
        <div class="order-history">${historyHtml}</div>
        <div class="actions">
          ${status === 0 ? `<button class="btn btn-sm btn-primary tenant-action" data-orderid="${order.orderId}" data-action="cook">🔥 Masak</button>` : ''}
          ${status === 1 ? `<button class="btn btn-sm btn-success tenant-action" data-orderid="${order.orderId}" data-action="ready">✅ Siap</button>` : ''}
          ${status === 2 ? `<button class="btn btn-sm btn-success tenant-action" data-orderid="${order.orderId}" data-action="complete">🎉 Selesai</button>` : ''}
          ${status === 3 ? `<span style="font-size:12px;color:var(--text-muted);">Selesai</span>` : ''}
        </div>
      </div>
    `;
  });
  $('#tenantOrderList').innerHTML = html;

  document.querySelectorAll('.tenant-action').forEach(btn => {
    btn.addEventListener('click', async () => {
      const orderId = btn.dataset.orderid;
      const action = btn.dataset.action;
      await handleTenantAction(orderId, action);
    });
  });
}

async function handleTenantAction(orderId, action) {
  try {
    const res = await fetch(`${API_BASE}/api/order/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    if (!res.ok) throw new Error('Gagal');
    const data = await res.json();
    const orders = getTenantOrders();
    const order = orders.find(o => o.orderId === orderId);
    if (order) {
      order.status = data.status;
      order.statusHistory = data.history;
      saveTenantOrders(orders);
      localStorage.setItem('orderStatus_' + orderId, JSON.stringify({ status: data.status, history: data.history }));
    }
    renderTenantOrders();
    if (state.currentScreen === 'status' && state.orderId === orderId) {
      state.statusStep = data.status;
      updateStatusUI();
      renderHistory(data.history);
    }
  } catch(e) {
    const orders = getTenantOrders();
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return;
    let newStatus = order.status;
    const now = new Date().toISOString();
    if (action === 'cook' && order.status === 0) { newStatus = 1; order.statusHistory.push({ label:'Mulai Dimasak', time:now }); }
    else if (action === 'ready' && order.status === 1) { newStatus = 2; order.statusHistory.push({ label:'Siap Saji', time:now }); }
    else if (action === 'complete' && order.status === 2) { newStatus = 3; order.statusHistory.push({ label:'Selesai', time:now }); }
    else return;
    order.status = newStatus;
    saveTenantOrders(orders);
    localStorage.setItem('orderStatus_' + orderId, JSON.stringify({ status: newStatus, history: order.statusHistory }));
    renderTenantOrders();
    if (state.currentScreen === 'status' && state.orderId === orderId) {
      state.statusStep = newStatus;
      updateStatusUI();
      renderHistory(order.statusHistory);
    }
  }
}

$('#btnToggleTenant').addEventListener('click', () => {
  isTenantMode = !isTenantMode;
  if (isTenantMode) {
    showScreen('tenant');
    renderTenantOrders();
    $('#btnToggleTenant').textContent = '👤 Customer';
    if (statusPollInterval) { clearInterval(statusPollInterval); statusPollInterval = null; }
  } else {
    $('#btnToggleTenant').textContent = '🏢 Tenant';
    showScreen('menu');
    renderMenu();
    updateOrderFloat();
  }
});

$('#btnRefreshTenant').addEventListener('click', () => {
  if (socket && socket.connected) {
    socket.emit('request-orders');
  } else {
    renderTenantOrders();
  }
});

// =============================================================
// INIT
// =============================================================
initLogin();
showScreen('login');
updateOrderFloat();

console.log('🍽️ TERAS LA Ordering System ready!');
console.log('📍 Meja', state.tableNumber);
console.log('🔗 Backend di', API_BASE);
console.log('🔊 Real-time dengan Socket.IO');