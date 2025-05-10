// assets/js/admin.js
import {
  supabase,
  fetchProducts,
  addProduct,
  deleteProduct,
  uploadFile
} from './supabase-client.js';

'use strict';

// Elements
const loginForm       = document.getElementById('login-form');
const logoutBtn       = document.getElementById('logout-btn');
const loginSection    = document.getElementById('login-section');
const productSection  = document.getElementById('product-section');
const productForm     = document.getElementById('product-form');
const productListBody = document.getElementById('product-list-body');
const loginError      = document.getElementById('login-error');
const productError    = document.getElementById('product-error');

// UI Helpers
function showLoginUI() {
  loginSection.classList.remove('hidden');
  productSection.classList.add('hidden');
  logoutBtn.classList.add('hidden');
}
function showAdminUI() {
  loginSection.classList.add('hidden');
  productSection.classList.remove('hidden');
  logoutBtn.classList.remove('hidden');
}
// Initial UI
showLoginUI();

// Load & render products
let products = [];
async function loadProducts() {
  const { data, error } = await fetchProducts();
  if (error) {
    productError.textContent = error.message;
    return;
  }
  products = data;
  renderTable();
}

function renderTable() {
  productListBody.innerHTML = products.map(p => `
    <tr>
      <td>${p.section}</td>
      <td>${p.title}</td>
      <td>${p.badge}</td>
      <td>$${p.price}</td>
      <td>${p.demos.length}</td>
      <td><button class="btn-admin delete-btn" data-id="${p.id}">Delete</button></td>
    </tr>
  `).join('');
  productListBody.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = +e.currentTarget.dataset.id;
      const { error } = await deleteProduct(id);
      if (error) productError.textContent = error.message;
      else loadProducts();
    });
  });
}

// Admin Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = e.target['admin-username'].value;
  const password = e.target['admin-password'].value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    loginError.textContent = error.message;
  } else {
    loginError.textContent = '';
    showAdminUI();
    loadProducts();
  }
});

// Logout
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  showLoginUI();
});

// Product Form Submission
productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  productError.textContent = '';
  const section = e.target['product-section-select'].value;
  const title   = e.target['product-title'].value;
  const badge   = e.target['product-badge'].value;
  const price   = parseFloat(e.target['product-price'].value);
  const imgF    = e.target['product-image'].files[0];
  const zipF    = e.target['pack-zip'].files[0];
  const demoInputs = e.target.querySelectorAll('input[name="demoFiles[]"]');

  if (!section || !title || isNaN(price) || !imgF || !zipF || demoInputs.length === 0) {
    productError.textContent = 'Please fill in all fields';
    return;
  }

  try {
    const image_url = await uploadFile('media', `images/${Date.now()}_${imgF.name}`, imgF);
    const zip_url   = await uploadFile('media', `zips/${Date.now()}_${zipF.name}`, zipF);
    const demos = [];
    for (let inp of demoInputs) {
      if (inp.files[0]) {
        const df = inp.files[0];
        const url = await uploadFile('media', `demos/${Date.now()}_${df.name}`, df);
        demos.push({ name: df.name.replace(/\.[^/.]+$/, ''), url });
      }
    }
    const { error } = await addProduct({ section, title, badge, price, image_url, zip_url, demos });
    if (error) throw error;
    productForm.reset();
    loadProducts();
  } catch (err) {
    productError.textContent = err.message;
  }
});
