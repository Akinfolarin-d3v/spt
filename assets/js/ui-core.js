'use strict';

const navOpenBtn  = document.querySelector('[data-menu-open-btn]');
const navCloseBtn = document.querySelector('[data-menu-close-btn]');
const navbar      = document.querySelector('[data-navbar]');
const overlay     = document.querySelector('[data-overlay]');
const header      = document.querySelector('[data-header]');
const goTopBtn    = document.querySelector('[data-go-top]');

[navOpenBtn, navCloseBtn, overlay].forEach(el => {
  if (!el) return;
  el.addEventListener('click', () => {
    navbar.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.classList.toggle('active');
  });
});

window.addEventListener('scroll', () => {
  header?.classList.toggle('active', window.scrollY >= 10);
  goTopBtn?.classList.toggle('active', window.scrollY >= 500);
});

document.getElementById('close-product-modal')?.addEventListener('click', () => {
  document.getElementById('product-modal').classList.add('hidden');
});

document.getElementById('close-cart-modal')?.addEventListener('click', () => {
  document.getElementById('cart-modal').classList.add('hidden');
});

document.getElementById('logout-btn')?.addEventListener('click', () => {
 
  
  supabase.auth.signOut().then(() => location.reload());
});

document.getElementById('auth-btn').addEventListener('click', () => {
  document.getElementById('auth-modal').classList.remove('hidden');
});


document.getElementById('close-auth-modal').addEventListener('click', () => {
  document.getElementById('auth-modal').classList.add('hidden');
});

