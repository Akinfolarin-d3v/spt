// assets/js/auth.js

const SUPABASE_URL = 'https://qmuildxqrhizxcwoospq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtdWlsZHhxcmhpenhjd29vc3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4NDUxMTMsImV4cCI6MjA2MjQyMTExM30.LFqZY0fS8NMgzU5_G5tOxQS4pu3Ka72ZNXeJvBuC2RE';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// — DOM references —
const authBtn         = document.getElementById('auth-btn');
const authModal       = document.getElementById('auth-modal');
const profileModal    = document.getElementById('profile-modal');
const closeAuthBtn    = document.getElementById('close-auth-modal');
const closeProfileBtn = document.getElementById('close-profile-modal');
const loginForm       = document.getElementById('login-form');
const signupForm      = document.getElementById('signup-form');
const tabs            = document.querySelectorAll('.tab-btn');
const userNameEl      = document.getElementById('user-name');
const userEmailEl     = document.getElementById('user-email');
const purchasesEl     = document.getElementById('purchases-list');
const signoutBtn      = document.getElementById('signout-btn');

// — Helpers —
function showModal(modal) { modal.classList.remove('hidden'); }
function hideModal(modal) { modal.classList.add('hidden'); }
function toggleForms(tab) {
  document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
  document.getElementById(`${tab}-form`).classList.remove('hidden');
  tabs.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
}

// — Header Sign‑In / Profile button —
authBtn.addEventListener('click', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await loadUserProfile();
    showModal(profileModal);
  } else {
    showModal(authModal);
  }
});

// — Close buttons —
closeAuthBtn.addEventListener('click', () => {
  hideModal(authModal);
});
closeProfileBtn.addEventListener('click', () => {
  hideModal(profileModal);
});

// — Tab switching —
tabs.forEach(btn =>
  btn.addEventListener('click', () => toggleForms(btn.dataset.tab))
);

// — Sign Up flow —
signupForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name     = document.getElementById('signup-name').value.trim();
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const { error } = await supabase.auth.signUp(
    { email, password },
    { data: { full_name: name } }
  );
  if (error) {
    alert(error.message);
  } else {
    alert('Registered! Check your email to confirm.');
    toggleForms('login');
  }
});

// — Log In flow —
loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    alert(error.message);
  } else {
    hideModal(authModal);
    authBtn.textContent = 'View Profile';
  }
});

// — Sign Out —
signoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  hideModal(profileModal);
  authBtn.textContent = 'Sign In';
});

// — Load & render user profile —
async function loadUserProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  userNameEl.textContent  = user.user_metadata.full_name || 'User';
  userEmailEl.textContent = user.email;
  authBtn.textContent      = 'View Profile';

  const { data: purchases, error } = await supabase
    .from('purchases')
    .select('product_id')
    .eq('user_id', user.id);

  if (error) {
    console.error(error);
    return;
  }

  purchasesEl.innerHTML = purchases.map(p => `
    <li class="cart-item">
      <div class="item-info">
        <p>Beat ID: ${p.product_id}</p>
      </div>
    </li>
  `).join('');
}
