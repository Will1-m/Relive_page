'use strict';
const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const src=path.join(root,'src','data');
const dist=path.join(root,'dist');

function cleanCode(value){
  return String(value || '').trim().replace(/[^A-Za-z0-9._-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').toUpperCase();
}

function resolveLocalImage(product){
  if(!product) return null;
  if(product.imagen_local) return product.imagen_local;
  const code=cleanCode(product.codigo || product.id);
  let ext='.jpg';
  if(product.imagen_url && typeof product.imagen_url === 'string') {
    try {
      const parsed=new URL(product.imagen_url);
      const candidate=path.extname(parsed.pathname).toLowerCase();
      if(candidate) ext=candidate;
    } catch (e) {}
  } else if(product.imagen && typeof product.imagen === 'string') {
    const basename=product.imagen.split(/[\\/]/).pop();
    if(basename) {
      const candidate=path.extname(basename).toLowerCase();
      if(candidate) ext=candidate;
    }
  }
  if(code) return 'assets/productos/' + code + ext;
  if(product.imagen && typeof product.imagen === 'string') {
    const basename=product.imagen.split(/[\\/]/).pop();
    if(basename) return 'assets/productos/' + basename;
  }
  return null;
}

function copyRecursive(from,to){
  fs.mkdirSync(to,{recursive:true});
  for(const entry of fs.readdirSync(from,{withFileTypes:true})){
    const a=path.join(from,entry.name),b=path.join(to,entry.name);
    if(entry.isDirectory()) copyRecursive(a,b);
    else if(path.extname(entry.name).toLowerCase()==='.json') writeJson(a,b,applySpecialOffers);
    else fs.copyFileSync(a,b);
  }
}

function applySpecialOffers(data){
  if(!data||!Array.isArray(data.productos)) return data;
  data.productos.forEach(function(product){
    var name=String(product.nombre||'');
    var isMibro=/\bmibro\b/i.test(name);
    var isXLizzard=/\bx[- ]?lizzard\b/i.test(name)||/^X-Lizzard$/i.test(String(product.marca||''));
    if(product.codigo == null && product.id) product.codigo = product.id.toUpperCase();
    product.imagen_local = resolveLocalImage(product);
    if(!isMibro&&!isXLizzard) return;
    var price=Number(product.precio);
    product.marca=isMibro?'Mibro':'X-Lizzard';
    product.oferta=true;
    product.precio_anterior=Number.isFinite(price)?Math.round(price*1.15*100)/100:null;
  });
  return data;
}

function writeJson(source,destination,transform){
  var data=JSON.parse(fs.readFileSync(source,'utf8'));
  fs.writeFileSync(destination,JSON.stringify(transform?transform(data):data,null,2)+'\n');
}

const catalogDir=path.join(dist,'catalogo');
fs.mkdirSync(catalogDir,{recursive:true});
writeJson(path.join(src,'catalogo-index.json'),path.join(dist,'catalogo-index.json'),applySpecialOffers);
copyRecursive(path.join(src,'catalogo'),catalogDir);
writeJson(path.join(src,'productos_relive.json'),path.join(dist,'productos_relive.json'),applySpecialOffers);
console.log('Catálogo generado desde src/data');
