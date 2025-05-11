// assets/js/auth.js

const supabase = window.supabase.createClient(
  'https://qmuildxqrhizxcwoospq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtdWlsZHhxcmhpenhjd29vc3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4NDUxMTMsImV4cCI6MjA2MjQyMTExM30.LFqZY0fS8NMgzU5_G5tOxQS4pu3Ka72ZNXeJvBuC2RE'
);

// DOM References
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

// Helpers
function showModal(modal) { modal.classList.remove('hidden'); }
function hideModal(modal) { modal.classList.add('hidden'); }
function toggleForms(tab) {
  document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
  document.getElementById(`${tab}-form`).classList.remove('hidden');
  tabs.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
}

// Header Sign‑In / Profile Logic
console.log('Binding authBtn:', !!document.getElementById('auth-btn'));
authBtn.addEventListener('click', async () => {
const { data: { user }, error } = await supabase.auth.getUser();
if (user && user.user_metadata.is_admin) {
  window.location.href = 'admin.html';
  return;
}

  if (user) {
    await loadUserProfile();
    showModal(profileModal);
  } else {
    showModal(authModal);
  }
});

// Close modals
console.log('Binding closeAuthBtn:', !!document.getElementById('close-auth-modal'));

closeAuthBtn.addEventListener('click', async () => {
   await supabase.auth.signOut();
   hideModal(authModal);
 });
closeProfileBtn.addEventListener('click', () => hideModal(profileModal));

// Tab switching
tabs.forEach(btn => btn.addEventListener('click', () => toggleForms(btn.dataset.tab)));

// Sign Up flow (with profile insert)
signupForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name     = document.getElementById('signup-name').value.trim();
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;

  const { data: { user }, error: signUpError } = await supabase.auth.signUp(
    { email, password },
    { data: { full_name: name } }
  );
  if (signUpError) {
    return alert(signUpError.message);
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: user.id, full_name: name });
  if (profileError) {
    console.error('Profile insert failed:', profileError);
    return alert('Couldn’t save your profile—please contact support.');
  }

  alert('Registration successful! Please check your email to confirm.');
  toggleForms('login');
});

// Log In flow
loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return alert(error.message);
  }
  hideModal(authModal);
  authBtn.textContent = 'View Profile';
});

// Sign Out flow
signoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  hideModal(profileModal);
  authBtn.textContent = 'Sign In';
});

// Load & render user profile\async function loadUserProfile() {
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
