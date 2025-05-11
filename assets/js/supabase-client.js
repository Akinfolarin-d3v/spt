

// ── Initialize Supabase ────────────────────────────────────
export const supabase = createClient(
  'https://qmuildxqrhizxcwoospq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtdWlsZHhxcmhpenhjd29vc3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4NDUxMTMsImV4cCI6MjA2MjQyMTExM30.LFqZY0fS8NMgzU5_G5tOxQS4pu3Ka72ZNXeJvBuC2RE'  
);

// ── Authentication ──────────────────────────────────────────
export const signUp    = (email, pass) => supabase.auth.signUp({ email, password: pass });
export const signIn    = (email, pass) => supabase.auth.signIn({ email, password: pass });
export const signOut   = ()            => supabase.auth.signOut();
export const getUser   = ()            => supabase.auth.user();

// ── Products Table ─────────────────────────────────────────
export const fetchProducts = () =>
  supabase.from('products').select('*').order('title', { ascending: true });

export const addProduct = product =>
  supabase.from('products').insert([product]);

export const deleteProduct = id =>
  supabase.from('products').delete().eq('id', id);

// ── Cart Table ─────────────────────────────────────────────
export const fetchCart = () =>
  supabase.from('cart').select('id,product_id').eq('user_id', getUser().id);

export const addToCart = productId =>
  supabase.from('cart').insert([{
    user_id:    getUser().id,
    product_id: productId,
    added_at:   new Date().toISOString()
  }]);

export const removeFromCart = cartId =>
  supabase.from('cart').delete().eq('id', cartId);

// ── Purchases Log ──────────────────────────────────────────
export const logPurchase = entries =>
  supabase.from('purchases').insert(entries);

// ── File Storage ───────────────────────────────────────────
export async function uploadFile(bucket, path, file) {
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { publicURL } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicURL;
}

// ── Checkout & Purchase Workflow ───────────────────────────
export async function checkoutAndLog() {
  // 1) grab cart rows
  const { data: cartRows, error } = await supabase
    .from('cart')
    .select('id,product_id,added_at')
    .eq('user_id', getUser().id);
  if (error) throw error;

  // 2) build purchase entries
  const purchases = cartRows.map(c => ({
    user_id:      getUser().id,
    product_id:   c.product_id,
    purchased_at: c.added_at
  }));

  // 3) insert into purchases table
  await logPurchase(purchases);

  // 4) clear user’s cart
  await supabase.from('cart').delete().eq('user_id', getUser().id);
}
