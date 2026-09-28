'use strict';

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const root = path.resolve(__dirname, '..');
const excelDir = path.join(root, 'src', 'data', 'excel');
const catalogPath = path.join(root, 'src', 'data', 'productos_relive.json');
const privatePath = path.join(root, 'private-data', 'product-prices.json');

function normalizeCode(value) {
  return String(value || '').trim().toUpperCase();
}

function parsePrice(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = String(value || '').trim().replace(',', '.');
  if (!/^\d+(?:\.\d+)?$/.test(text)) return null;
  const price = Number(text);
  return Number.isFinite(price) ? price : null;
}

function isProductCode(value) {
  return /^(?:ACC|SACC|RELIVE)[A-Z0-9-]*\d[A-Z0-9-]*$/i.test(normalizeCode(value));
}

function priceColumnIndex(headers) {
  const normalized = headers.map((header) => String(header || '').trim().toLowerCase());
  const exact = normalized.findIndex((header) => header === 'price');
  if (exact >= 0) return exact;
  return normalized.findIndex((header) => /precio.*(descuento|uyu)|precio/.test(header));
}

function readWorkbook(fileName) {
  const filePath = path.join(excelDir, fileName);
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const headers = rows[0] || [];
  const priceIndex = priceColumnIndex(headers);

  if (priceIndex < 0) throw new Error(`No se encontró columna de precio en ${fileName}`);

  const prices = [];
  for (const row of rows.slice(1)) {
    const code = normalizeCode(row.find(isProductCode));
    const price = parsePrice(row[priceIndex]);
    if (code && price !== null) prices.push({ code, price, fileName });
  }
  return prices;
}

function collectPrices() {
  const files = fs.readdirSync(excelDir).filter((fileName) => /\.xlsx$/i.test(fileName));
  const prices = new Map();

  for (const fileName of files) {
    for (const entry of readWorkbook(fileName)) {
      const entries = prices.get(entry.code) || [];
      entries.push(entry);
      prices.set(entry.code, entries);
    }
  }
  return prices;
}

function updateCatalog() {
  const data = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const products = Array.isArray(data.productos) ? data.productos : [];
  const prices = collectPrices();
  const catalogCodes = new Set(products.map((product) => normalizeCode(product.codigo || product.id)));
  const productsByCode = new Map(products.map((product) => [normalizeCode(product.codigo || product.id), product]));
  const conflicts = [];
  const privateData = fs.existsSync(privatePath) ? JSON.parse(fs.readFileSync(privatePath, 'utf8')) : { products: [] };
  const privatePrices = new Map((privateData.products || []).map((product) => [normalizeCode(product.codigo), product]));
  let updated = 0;

  for (const [code, entries] of prices) {
    const distinctPrices = [...new Set(entries.map((entry) => entry.price))];
    if (distinctPrices.length > 1) conflicts.push({ code, entries });
  }

  if (conflicts.length) {
    throw new Error(`Hay ${conflicts.length} códigos con precios contradictorios: ${conflicts.map((item) => item.code).join(', ')}`);
  }

  for (const [code, entries] of prices) {
    const product = productsByCode.get(code);
    if (!product || !entries.length) continue;
    const existing = privatePrices.get(code) || {};
    privatePrices.set(code, {
      product_id: String(product.id || product.codigo),
      codigo: code,
      nombre: product.nombre || existing.nombre || '',
      price: entries[0].price,
      previous_price: existing.previous_price == null ? null : existing.previous_price
    });
    updated += 1;
  }

  fs.mkdirSync(path.dirname(privatePath), { recursive: true });
  fs.writeFileSync(privatePath, JSON.stringify({ updated_at: new Date().toISOString(), products: [...privatePrices.values()] }, null, 2) + '\n');

  const unmatched = [...prices.keys()].filter((code) => !catalogCodes.has(code));
  console.log(`Precios privados actualizados: ${updated}/${products.length}`);
  console.log(`Archivo local ignorado por Git: ${path.relative(root, privatePath)}`);
  console.log(`Registros Excel: ${[...prices.keys()].length}`);
  console.log(`Códigos Excel sin producto: ${unmatched.length}`);
  if (unmatched.length) console.log(unmatched.join(', '));
}

updateCatalog();