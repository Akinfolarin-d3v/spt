import {
  fetchProducts,
  addToCart,
  fetchCart,
  removeFromCart,
  checkoutAndLog
} from './supabase-client.js';

'use strict';

// ── RENDER PRODUCTS (Home + All‑Packs) ───────────────────────────
export async function renderProducts() {
  const { data: prods, error } = await fetchProducts();
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  // Clear each section
  ['upcoming','top-rated','tv-series'].forEach(sec => {
    const ul = document.querySelector(`#${sec} .movies-list`);
    if (ul) ul.innerHTML = '';
  });

  // Populate
  prods.forEach(p => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="movie-card" data-id="${p.id}">
        <figure class="card-banner">
          <img src="${p.image_url}" alt="${p.title}">
        </figure>
        <div class="title-wrapper">
          <h3 class="card-title">${p.title}</h3>
        </div>
        <div class="card-meta">
          <div class="badge badge-outline">${p.badge}</div>
          <div class="duration">
            <ion-icon name="pricetag-outline"></ion-icon>
            $${p.price.toFixed(2)}
          </div>
        </div>
      </div>`;
    document.querySelector(`#${p.section} .movies-list`)?.append(li);
  });

  // Attach modal openers
  document.querySelectorAll('.movie-card').forEach(card => {
    card.addEventListener('click', () => {
      const id   = +card.dataset.id;
      const prod = prods.find(x => x.id === id);
      openProductModal(prod);
    });
  });
}

// ── PRODUCT PREVIEW MODAL ────────────────────────────────────────
function openProductModal(p) {
  document.getElementById('modal-product-image').src         = p.image_url;
  document.getElementById('modal-product-title').textContent = p.title;
  document.getElementById('modal-product-badge').textContent = p.badge;
  document.getElementById('modal-product-price').textContent = p.price.toFixed(2);

  const list = document.getElementById('modal-audio-list');
  list.innerHTML = p.demos.map(d => `
    <div class="modal-audio-wrapper">
      <p>${d.name}</p>
      <audio controls src="${d.url}"></audio>
    </div>
  `).join('');

  document.getElementById('modal-add-to-cart').onclick = async () => {
    await addToCart(p.id);
    alert(`"${p.title}" added to cart!`);
    document.getElementById('product-modal').classList.add('hidden');
  };

  document.getElementById('product-modal').classList.remove('hidden');
}

// ── CART MODAL ────────────────────────────────────────────────
export async function renderCart() {
  const { data: cartRows, error: cartError } = await fetchCart();
  if (cartError) {
    console.error('Error fetching cart:', cartError);
    return;
  }

  const ct      = document.getElementById('cart-items');
  const cc      = document.getElementById('cart-count');
  const totalEl = document.getElementById('cart-total');
  const dlBtn   = document.getElementById('download-btn');

  if (!cartRows.length) {
    ct.innerHTML        = '<p>Your cart is empty.</p>';
    cc.textContent      = '0 items';
    totalEl.textContent = '0.00';
    dlBtn.disabled      = true;
    document.getElementById('cart-modal').classList.remove('hidden');
    return;
  }

  // Get product details
  const { data: products } = await fetchProducts();

  // Build cart HTML
  ct.innerHTML = cartRows.map(c => {
    const p = products.find(x => x.id === c.product_id);
    return `
      <div class="cart-item" data-id="${c.id}">
        <h4>
          <span class="item-title">${p.title}</span>
          <button class="remove-item-btn">&times;</button>
        </h4>
        <div class="demo-list">
          ${p.demos.map(d => `
            <div class="audio-player">
              <button class="btn btn-primary play-btn">
                <ion-icon name="play-circle-outline"></ion-icon>
              </button>
              <audio src="${d.url}"></audio>
            </div>
          `).join('')}
        </div>
      </div>`;
  }).join('');

  // Remove item handlers
  ct.querySelectorAll('.remove-item-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      const id = +e.currentTarget.closest('.cart-item').dataset.id;
      await removeFromCart(id);
      renderCart();
    });
  });

  // Play/pause handlers
  ct.querySelectorAll('.audio-player').forEach(player => {
    const btn   = player.querySelector('.play-btn');
    const audio = player.querySelector('audio');
    btn.addEventListener('click', () => {
      ct.querySelectorAll('audio').forEach(a => a !== audio && a.pause());
      if (audio.paused) {
        audio.play();
        btn.querySelector('ion-icon').name = 'pause-circle-outline';
      } else {
        audio.pause();
        btn.querySelector('ion-icon').name = 'play-circle-outline';
      }
    });
    audio.addEventListener('ended', () =>
      btn.querySelector('ion-icon').name = 'play-circle-outline'
    );
  });

  // Totals
  cc.textContent      = `${cartRows.length} item${cartRows.length!==1?'s':''}`;
  totalEl.textContent = cartRows
    .reduce((sum,c) => {
      const p = products.find(x => x.id === c.product_id);
      return sum + (p?.price || 0);
    }, 0)
    .toFixed(2);
  dlBtn.disabled      = true;

  document.getElementById('cart-modal').classList.remove('hidden');
}

// ── CHECKOUT & DOWNLOAD ─────────────────────────────────────
document.getElementById('checkout-btn').onclick = () => {
  document.getElementById('payment-modal').classList.remove('hidden');
};
document.querySelectorAll('#payment-modal .payment-btn')
  .forEach(btn => btn.addEventListener('click', async () => {
    document.getElementById('payment-modal').classList.add('hidden');
    await checkoutAndLog();
    document.getElementById('download-btn').disabled = false;
  }));
document.getElementById('download-btn').onclick = async () => {
  const { data: cartRows } = await fetchCart();
  const { data: products } = await fetchProducts();
  cartRows.forEach(c => {
    const p = products.find(x => x.id === c.product_id);
    const a = document.createElement('a');
    a.href     = p.zip_url;
    a.download = `${p.title}.zip`;
    a.click();
  });
};

// ── INIT ───────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // If on All‑Packs page
  if (document.getElementById('all-packs-list')) {
    renderProducts();
  } else {
    renderProducts();
  }
});
