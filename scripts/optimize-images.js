const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const srcDir = path.join(__dirname, '..', 'dist', 'img', 'img_accesorios');
const outDir = path.join(__dirname, '..', 'dist', 'img', 'optimized');
const jsonPath = path.join(__dirname, '..', 'dist', 'productos_agrupados.json');

async function processDir(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(dir, entry.name);
    const rel = path.relative(srcDir, srcPath);
    if (entry.isDirectory()) {
      await processDir(srcPath);
    } else if (/\.(jpe?g|png)$/i.test(entry.name)) {
      const outPath = path.join(outDir, rel).replace(/\.(jpe?g|png)$/i, '.webp');
      await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
      await sharp(srcPath).webp({ quality: 80 }).toFile(outPath);
    }
  }
}

async function updateJson() {
  if (!fs.existsSync(jsonPath)) return;
  const data = JSON.parse(await fs.promises.readFile(jsonPath, 'utf8'));
  const updated = data.map(p => {
    if (Array.isArray(p.imagenes)) {
      p.imagenes = p.imagenes.map(img =>
        img.replace('img/img_accesorios/', 'img/optimized/').replace(/\.(jpe?g|png)$/i, '.webp')
      );
    }
    return p;
  });
  await fs.promises.writeFile(jsonPath, JSON.stringify(updated, null, 2));
}

processDir(srcDir)
  .then(updateJson)
  .catch(err => {
    console.error(err);
    process.exit(1);
  });