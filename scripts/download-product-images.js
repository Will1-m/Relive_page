'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'src', 'data', 'productos_relive.json');
const targetDir = path.join(root, 'src', 'assets', 'productos');

function sanitizeName(value) {
  return String(value || '')
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase();
}

function getProductCode(product, fallbackIndex) {
  if (product && product.codigo) return sanitizeName(product.codigo);
  if (product && product.id) return sanitizeName(product.id);
  return 'PRODUCT-' + String(fallbackIndex + 1).padStart(4, '0');
}

function getExtensionFromUrl(url) {
  try {
    const parsed = new URL(url);
    const ext = path.extname(parsed.pathname).toLowerCase();
    return ext || '.jpg';
  } catch (error) {
    return '.jpg';
  }
}

function fileNameForProduct(product, index, url) {
  const code = getProductCode(product, index);
  const ext = getExtensionFromUrl(url);
  return {
    code,
    ext,
    localPath: 'assets/productos/' + code + ext
  };
}

function shouldSkipImageUrl(url) {
  if (!url || typeof url !== 'string') return true;
  return /nofoto|placeholder|no-image|default/i.test(url) || !/\.(jpg|jpeg|png|webp|gif|bmp|svg)(\?.*)?$/i.test(url);
}

function ensureDirectory(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function downloadImage(imageUrl, filePath) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error('HTTP ' + response.status + ' for ' + imageUrl);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

async function main() {
  ensureDirectory(targetDir);

  const raw = fs.readFileSync(sourcePath, 'utf8');
  const data = JSON.parse(raw);
  const products = Array.isArray(data.productos) ? data.productos : [];

  const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : products.length;
  const selected = products.slice(0, Number.isFinite(limit) && limit > 0 ? limit : products.length);

  let downloaded = 0;
  let skipped = 0;

  for (let index = 0; index < selected.length; index += 1) {
    const product = selected[index];
    const url = product && product.imagen_url;
    if (!url || shouldSkipImageUrl(url)) {
      if (product) {
        product.imagen_local = null;
      }
      skipped += 1;
      continue;
    }

    const naming = fileNameForProduct(product, index, url);
    const filePath = path.join(targetDir, naming.code + naming.ext);

    try {
      await downloadImage(url, filePath);
      if (product) {
        product.imagen_local = naming.localPath;
      }
      downloaded += 1;
      console.log('OK', naming.code, '->', path.relative(root, filePath));
    } catch (error) {
      console.warn('WARN', naming.code, 'No se pudo descargar:', url);
      if (product) {
        product.imagen_local = null;
      }
      skipped += 1;
    }
  }

  if (data && Array.isArray(data.productos)) {
    fs.writeFileSync(sourcePath, JSON.stringify(data, null, 2) + '\n');
  }

  console.log('\nResumen:');
  console.log('- descargadas:', downloaded);
  console.log('- omitidas:', skipped);
  console.log('- carpeta destino:', path.relative(root, targetDir));
}

main().catch((error) => {
  console.error('Error general:', error);
  process.exit(1);
});
