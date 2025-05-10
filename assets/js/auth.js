const SUPABASE_URL = 'https://qmuildxqrhizxcwoospq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtdWlsZHhxcmhpenhjd29vc3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4NDUxMTMsImV4cCI6MjA2MjQyMTExM30.LFqZY0fS8NMgzU5_G5tOxQS4pu3Ka72ZNXeJvBuC2RE';
const supabase     = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const authBtn      = document.getElementById('auth-btn');
const authModal    = document.getElementById('auth-modal');
const profileModal = document.getElementById('profile-modal');

// Form elements
const loginForm  = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const tabs       = document.querySelectorAll('.tab-btn');

// Profile fields
const userNameEl  = document.getElementById('user-name');
const userEmailEl = document.getElementById('user-email');
const purchasesEl = document.getElementById('purchases-list');

// --- Helpers ---
function showModal(modal) {
  modal.classList.remove('hidden');
}
function hideModal(modal) {
  modal.classList.add('hidden');
}
function toggleForms(tab) {
  document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
  document.getElementById(`${tab}-form`).classList.remove('hidden');
  tabs.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
}

// --- Event Wiring ---

// Header button click
authBtn.addEventListener('click', async () => {
  const user = supabase.auth.user();
  if (user) {
    // Already logged in → show profile
    await loadUserProfile();
    showModal(profileModal);
  } else {
    // Not logged in → show auth
    showModal(authModal);
  }
});

// Close buttons
document.getElementById('close-auth-modal')
  .addEventListener('click', () => hideModal(authModal));
document.getElementById('close-profile-modal')
  .addEventListener('click', () => hideModal(profileModal));

// Tab buttons
tabs.forEach(b => b.addEventListener('click', () => toggleForms(b.dataset.tab)));

// --- Auth Flows ---

// Sign Up
signupForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name     = document.getElementById('signup-name').value;
  const email    = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  const { user, error } = await supabase.auth.signUp({ email, password }, {
    data: { full_name: name }
  });
  if (error) return alert(error.message);
  alert('Registration successful! Please check your email to confirm.');
  toggleForms('login');
});

// Log In
loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const email    = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const { user, error } = await supabase.auth.signIn({ email, password });
  if (error) return alert(error.message);

  hideModal(authModal);
  authBtn.textContent = 'View Profile';
});

// Sign Out
document.getElementById('signout-btn').addEventListener('click', async () => {
  await supabase.auth.signOut();
  hideModal(profileModal);
  authBtn.textContent = 'Sign In';
});

// --- Profile Loading ---

async function loadUserProfile() {
  const user = supabase.auth.user();
  if (!user) return;

  userNameEl.textContent  = user.user_metadata.full_name || 'User';
  userEmailEl.textContent = user.email;
  authBtn.textContent      = 'View Profile';

  // Fetch purchases from your `purchases` table
  const { data: purchases, error } = await supabase
    .from('purchases')
    .select('product_id')
    .eq('user_id', user.id);

  if (error) return console.error(error);

  purchasesEl.innerHTML = purchases.map(p => `
    <li class="cart-item">
      <div class="item-info">
        <p>Beat ID: ${p.product_id}</p>
      </div>
    </li>
  `).join('');
}
