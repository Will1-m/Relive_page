'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sensitiveFields = ['precio', 'precio_anterior', 'precio_costo', 'margen_porcentaje'];
const sourceRoot = path.join(root, 'src', 'data');
const publicRoot = path.join(root, 'dist');

function catalogFiles(base) {
  return [
    path.join(base, 'productos_relive.json'),
    path.join(base, 'catalogo-index.json'),
    ...fs.readdirSync(path.join(base, 'catalogo', 'pages'))
      .filter((fileName) => /^page-\d+\.json$/i.test(fileName))
      .map((fileName) => path.join(base, 'catalogo', 'pages', fileName))
  ];
}

function readProducts(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return Array.isArray(data.productos) ? data.productos : [];
}

const sourceFiles = catalogFiles(sourceRoot);
const publicFiles = catalogFiles(publicRoot);
const hiddenIds = new Set();
const publishedIds = new Set();
let recordsChecked = 0;

for (const filePath of sourceFiles) {
  for (const product of readProducts(filePath)) {
    for (const field of sensitiveFields) {
      assert(!Object.prototype.hasOwnProperty.call(product, field), `${filePath} publica el campo ${field}`);
    }
    if (product.publicado === false || product.visible === false) {
      hiddenIds.add(String(product.id || product.codigo || ''));
    }
  }
}

for (const filePath of publicFiles) {
  for (const product of readProducts(filePath)) {
    recordsChecked += 1;
    publishedIds.add(String(product.id || product.codigo || ''));
    for (const field of sensitiveFields) {
      assert(!Object.prototype.hasOwnProperty.call(product, field), `${filePath} publica el campo ${field}`);
    }
  }
}

for (const productId of hiddenIds) {
  assert(!publishedIds.has(productId), `El producto oculto ${productId} aparece en dist`);
}

console.log(`Pruebas de privacidad del catálogo aprobadas (${recordsChecked} registros comprobados).`);
