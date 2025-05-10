// assets/js/admin.js
const supabase = window.supabase.createClient(
  'https://qmuildxqrhizxcwoospq.supabase.co',
  'PUBLIC_ANON_KEY'
);

'use strict';

const loginForm       = document.getElementById('login-form');
const logoutBtn       = document.getElementById('logout-btn');
const loginSection    = document.getElementById('login-section');
const productSection  = document.getElementById('product-section');
const productForm     = document.getElementById('product-form');
const productListBody = document.getElementById('product-list-body');
const loginError      = document.getElementById('login-error');
const productError    = document.getElementById('product-error');

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

showLoginUI();

async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function addProduct(pack) {
  const { data, error } = await supabase
    .from('products')
    .insert([pack])
    .single();
  return { data, error };
}

async function deleteProduct(id) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  return { error };
}

async function loadProducts() {
  try {
    const products = await fetchProducts();
    productListBody.innerHTML = products.map(p => `
      <tr>
        <td>${p.section}</td>
        <td>${p.title}</td>
        <td>${p.badge}</td>
        <td>$${p.price}</td>
        <td>${JSON.parse(p.demos).length}</td>
        <td>
          <button class="btn-admin delete-btn" data-id="${p.id}">
            Delete
          </button>
        </td>
      </tr>
    `).join('');
    productListBody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async e => {
        const id = +e.currentTarget.dataset.id;
        const { error } = await deleteProduct(id);
        if (error) productError.textContent = error.message;
        else loadProducts();
      });
    });
  } catch (err) {
    productError.textContent = err.message;
  }
}

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  loginError.textContent = '';
  const email = e.target['admin-username'].value.trim();
  const password = e.target['admin-password'].value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    loginError.textContent = error.message;
  } else {
    const user = data.user;
    if (user.user_metadata?.is_admin) {
      showAdminUI();
      loadProducts();
    } else {
      await supabase.auth.signOut();
      loginError.textContent = 'Not authorized';
    }
  }
});

logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  showLoginUI();
});

productForm.addEventListener('submit', async e => {
  e.preventDefault();
  productError.textContent = '';
  const section = e.target['product-section-select'].value;
  const title   = e.target['product-title'].value.trim();
  const badge   = e.target['product-badge'].value.trim();
  const price   = parseFloat(e.target['product-price'].value);
  const imgF    = e.target['product-image'].files[0];
  const zipF    = e.target['pack-zip'].files[0];
  const demoInputs = Array.from(e.target.querySelectorAll('input[name="demoFiles[]"]'));

  if (!section || !title || isNaN(price) || !imgF || !zipF || demoInputs.length === 0) {
    productError.textContent = 'Please fill in all fields';
    return;
  }

  try {
    const storage = supabase.storage.from('media');
    const imgPath = `images/${Date.now()}_${imgF.name}`;
    const zipPath = `zips/${Date.now()}_${zipF.name}`;
    await storage.upload(imgPath, imgF);
    await storage.upload(zipPath, zipF);
    const image_url = storage.getPublicUrl(imgPath).publicURL;
    const zip_url   = storage.getPublicUrl(zipPath).publicURL;
    const demos = [];
    for (let inp of demoInputs) {
      const file = inp.files[0];
      const demoPath = `demos/${Date.now()}_${file.name}`;
      await storage.upload(demoPath, file);
      demos.push({
        name: file.name.replace(/\.[^/.]+$/, ''),
        url: storage.getPublicUrl(demoPath).publicURL
      });
    }
    const { error } = await addProduct({ section, title, badge, price, image_url, zip_url, demos: JSON.stringify(demos) });
    if (error) throw error;
    e.target.reset();
    loadProducts();
  } catch (err) {
    productError.textContent = err.message;
  }
});
