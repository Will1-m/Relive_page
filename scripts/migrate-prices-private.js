'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'src', 'data');
const privateDir = path.join(root, 'private-data');
const privatePath = path.join(privateDir, 'product-prices.json');
const applyChanges = process.argv.includes('--apply');
const files = [
  path.join(dataDir, 'productos_relive.json'),
  path.join(dataDir, 'catalogo-index.json'),
  ...fs.readdirSync(path.join(dataDir, 'catalogo', 'pages'))
    .filter((fileName) => /^page-\d+\.json$/i.test(fileName))
    .map((fileName) => path.join(dataDir, 'catalogo', 'pages', fileName))
];
const sensitiveFields = ['precio', 'precio_anterior', 'precio_costo', 'margen_porcentaje'];
const priceById = new Map();
const parsedFiles = files.map((filePath) => ({
  filePath,
  data: JSON.parse(fs.readFileSync(filePath, 'utf8'))
}));

function productId(product) {
  return String(product.id || product.codigo || '').trim();
}

for (const entry of parsedFiles) {
  for (const product of entry.data.productos || []) {
    const id = productId(product);
    if (!id) continue;
    const previous = priceById.get(id) || {
      product_id: id,
      codigo: String(product.codigo || ''),
      nombre: String(product.nombre || product.descripcion || ''),
      price: null,
      previous_price: null
    };
    if (previous.price == null && product.precio != null) previous.price = Number(product.precio);
    if (previous.previous_price == null && product.precio_anterior != null) previous.previous_price = Number(product.precio_anterior);
    priceById.set(id, previous);
  }
}

if (fs.existsSync(privatePath)) {
  const existing = JSON.parse(fs.readFileSync(privatePath, 'utf8'));
  for (const product of existing.products || []) {
    const id = String(product.product_id || product.codigo || '').trim();
    if (!id) continue;
    const current = priceById.get(id);
    if (!current) {
      priceById.set(id, product);
      continue;
    }
    if (current.price == null && Number.isFinite(Number(product.price))) current.price = Number(product.price);
    if (current.previous_price == null && product.previous_price != null) current.previous_price = Number(product.previous_price);
    if (!current.codigo) current.codigo = String(product.codigo || '');
    if (!current.nombre) current.nombre = String(product.nombre || '');
  }
}

const pricedProducts = [...priceById.values()].filter((product) => Number.isFinite(product.price));
if (!pricedProducts.length) throw new Error('No se encontraron precios para migrar.');

for (const entry of parsedFiles) {
  for (const product of entry.data.productos || []) {
    for (const field of sensitiveFields) delete product[field];
  }
}

if (!applyChanges) {
  console.log(`Modo de prueba: ${pricedProducts.length} precios encontrados en ${files.length} archivos.`);
  console.log('Ejecuta node scripts/migrate-prices-private.js --apply para guardarlos localmente y quitar los precios de los JSON fuente.');
  process.exit(0);
}

fs.mkdirSync(privateDir, { recursive: true });
const existingData = fs.existsSync(privatePath) ? JSON.parse(fs.readFileSync(privatePath, 'utf8')) : {};
fs.writeFileSync(privatePath, JSON.stringify({
  updated_at: new Date().toISOString(),
  products: pricedProducts.map((product) => ({
    product_id: String(product.product_id),
    codigo: String(product.codigo || ''),
    nombre: String(product.nombre || ''),
    price: Number(product.price),
    previous_price: product.previous_price == null ? null : Number(product.previous_price)
  }))
}, null, 2) + '\n');

for (const entry of parsedFiles) {
  fs.writeFileSync(entry.filePath, JSON.stringify(entry.data, null, 2) + '\n');
}

console.log(`Migrados ${pricedProducts.length} precios a ${path.relative(root, privatePath)}.`);
console.log(`Se quitaron campos de precio de ${files.length} JSON fuente.`);
if (existingData.updated_at) console.log('Se conservó la copia privada preexistente como fuente de referencia.');