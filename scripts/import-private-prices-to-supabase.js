'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const privatePath = path.join(root, 'private-data', 'product-prices.json');
const catalogPath = path.join(root, 'src', 'data', 'productos_relive.json');
const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function importPrices() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY solo en el entorno local.');
  }
  if (!fs.existsSync(privatePath)) {
    throw new Error('No existe private-data/product-prices.json. Ejecuta primero la migración de precios.');
  }

  const data = JSON.parse(fs.readFileSync(privatePath, 'utf8'));
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const publishedIds = new Set((catalog.productos || [])
    .filter((product) => product.publicado !== false && product.visible !== false)
    .map((product) => String(product.id || product.codigo || '').trim()));
  const products = Array.isArray(data.products) ? data.products : [];
  const rows = products.map((product) => {
    const price = Number(product.price);
    const name = String(product.nombre || '');
    const isSpecialOffer = /\bmibro\b/i.test(name) || /\bx[- ]?lizzard\b/i.test(name);
    const previousPrice = product.previous_price == null && isSpecialOffer
      ? Math.round(price * 1.15 * 100) / 100
      : product.previous_price == null ? null : Number(product.previous_price);
    const productId = String(product.product_id || '').trim();
    return {
      product_id: productId,
      price,
      previous_price: previousPrice,
      is_published: publishedIds.has(productId),
      updated_at: new Date().toISOString()
    };
  });

  if (!rows.length || rows.some((row) => !row.product_id || !Number.isFinite(row.price) || row.price < 0)) {
    throw new Error('El archivo privado contiene precios inválidos o productos sin ID.');
  }

  for (let index = 0; index < rows.length; index += 100) {
    const response = await fetch(supabaseUrl + '/rest/v1/product_prices?on_conflict=product_id', {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: 'Bearer ' + serviceRoleKey,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(rows.slice(index, index + 100))
    });
    if (!response.ok) {
      throw new Error(`Supabase rechazó el lote ${Math.floor(index / 100) + 1}: HTTP ${response.status}`);
    }
  }

  console.log(`Precios importados a Supabase: ${rows.length}.`);
}

importPrices().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});