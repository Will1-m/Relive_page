'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const inputPath = path.join(root, 'src', 'data', 'productos_relive.json');

function cleanToken(value) {
  return String(value || '')
    .trim()
    .replace(/[\\/]+/g, ' ')
    .replace(/[^A-Za-z0-9._ -]+/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/^-+|-+$/g, '')
    .trim();
}

function cleanCode(value) {
  return String(value || '')
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase();
}

function extFromUrl(value) {
  if (!value || typeof value !== 'string') return '.jpg';
  try {
    const url = new URL(value);
    const ext = path.extname(url.pathname).toLowerCase();
    return ext || '.jpg';
  } catch (error) {
    const ext = path.extname(value).toLowerCase();
    return ext || '.jpg';
  }
}

function moveFlatImageToLocalPath(product, localPath) {
  const sourcePath = path.join(root, 'src', 'assets', 'productos', path.basename(localPath));
  const targetPath = path.join(root, 'src', localPath);

  if (!fs.existsSync(sourcePath) || fs.existsSync(targetPath)) return;
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
}

function localPathForProduct(product) {
  const code = cleanCode(product && (product.codigo || product.id || 'producto'));
  const categoria = cleanToken(product && product.categoria);
  const subcategoria = cleanToken(product && product.subcategoria);
  const segments = [categoria, subcategoria].filter(Boolean);
  const ext = extFromUrl(product && (product.imagen_local || product.imagen_url || product.imagen || ''));
  const filename = `${code}${ext}`;
  const rel = segments.length ? `assets/productos/${segments.join('/')}/${filename}` : `assets/productos/${filename}`;
  return rel.replace(/\\/g, '/');
}

function normalizeCatalog() {
  const raw = fs.readFileSync(inputPath, 'utf8');
  const data = JSON.parse(raw);

  if (!data || !Array.isArray(data.productos)) {
    throw new Error('El archivo no tiene la estructura esperada de productos');
  }

  data.productos = data.productos.map((product) => {
    const next = { ...product };
    next.codigo = next.codigo || next.id || 'PRODUCTO';
    next.imagen_local = localPathForProduct(next);
    moveFlatImageToLocalPath(next, next.imagen_local);
    if (!fs.existsSync(path.join(root, 'src', next.imagen_local))) {
      next.imagen_local = 'assets/placeholder.svg';
    }
    next.imagen_url = null;
    next.imagen = null;
    return next;
  });

  data.total_con_imagen_local = data.productos.filter((product) => !!product.imagen_local).length;
  fs.writeFileSync(inputPath, JSON.stringify(data, null, 2) + '\n');
  console.log(`Normalizado: ${data.productos.length} productos; ${data.total_con_imagen_local} rutas locales.`);
}

normalizeCatalog();
