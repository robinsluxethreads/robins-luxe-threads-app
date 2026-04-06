// Run this with: node supabase/migrate-products.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://oasnzxipceuiriljhftz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrate() {
  // Load products from existing JSON
  const productsPath = path.join(__dirname, '../../RobinsLuxeThreads/data/products.json');

  if (!fs.existsSync(productsPath)) {
    console.log('products.json not found at:', productsPath);
    // Try category files
    const dataDir = path.join(__dirname, '../../RobinsLuxeThreads/data');
    const catFiles = fs.readdirSync(dataDir).filter(f => f.startsWith('products-') && f.endsWith('.json'));
    if (catFiles.length === 0) {
      console.log('No product files found!');
      return;
    }
    let allProducts = [];
    for (const file of catFiles) {
      const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8'));
      allProducts = allProducts.concat(data);
      console.log(`Loaded ${data.length} products from ${file}`);
    }
    await insertProducts(allProducts);
    return;
  }

  const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
  console.log(`Loaded ${products.length} products from products.json`);
  await insertProducts(products);
}

async function insertProducts(products) {
  // Convert to DB format
  const dbProducts = products.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    old_price: p.oldPrice || null,
    category: p.category,
    description: p.description || '',
    sizes: p.sizes || ['M'],
    badge: p.badge || null,
    emoji: p.emoji || '👗',
    images: p.images || [],
    is_active: true
  }));

  // Insert in batches of 100
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < dbProducts.length; i += batchSize) {
    const batch = dbProducts.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('products')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`Error inserting batch ${i}-${i + batchSize}:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`Inserted ${inserted}/${dbProducts.length} products...`);
    }
  }

  console.log(`\nDone! ${inserted} products migrated to Supabase.`);

  // Verify
  const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
  console.log(`Verified: ${count} products in database.`);
}

migrate().catch(console.error);
