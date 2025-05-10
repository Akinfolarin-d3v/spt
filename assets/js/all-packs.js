// assets/js/all‑packs.js
'use strict';

/**
 * ── FETCH / CART HELPERS VIA SUPABASE ─────────────────────────────────────────
 */
async function fetchAllProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, title, badge, price, image_url, demos ( name, url ), zip_url');
  if (error) throw error;
  return data;
}

/**
 * ── PRODUCT MODAL ────────────────────────────────────────────────────────────
 */
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
    // Add to cart table
    const { error } = await supabase
      .from('cart')
      .insert({ product_id: p.id });
    if (error) {
      alert('Could not add to cart: ' + error.message);
    } else {
      alert(`"${p.title}" added to cart!`);
      document.getElementById('product-modal').classList.add('hidden');
    }
  };

  document.getElementById('product-modal').classList.remove('hidden');
}

document.getElementById('close-product-modal').onclick = () =>
  document.getElementById('product-modal').classList.add('hidden');

/**
 * ── RENDER “ALL PACKS” GRID ───────────────────────────────────────────────────
 */
async function renderAllPacks() {
  // 1) fetch all products
  const prods = await fetchAllProducts();

  // 2) sort alphabetically
  prods.sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
  );

  // 3) render into UL#all-packs-list
  const listEl = document.getElementById('all-packs-list');
  listEl.innerHTML = prods.map(p => `
    <li>
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
      </div>
    </li>
  `).join('');

  // 4) attach click → modal
  listEl.querySelectorAll('.movie-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = +card.dataset.id;
      const prod = prods.find(x => x.id === id);
      openProductModal(prod);
    });
  });
}

/**
 * ── INIT ─────────────────────────────────────────────────────────────────────
 */
window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('all-packs-list')) {
    renderAllPacks();
  }
});
