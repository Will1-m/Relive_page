'use strict';
const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const src=path.join(root,'src','data');
const dist=path.join(root,'dist');
const sourceCatalog=JSON.parse(fs.readFileSync(path.join(src,'productos_relive.json'),'utf8'));
const hiddenProductIds=new Set((sourceCatalog.productos||[]).filter(product=>product.publicado===false||product.visible===false).map(product=>String(product.id||product.codigo||'')));

function cleanCode(value){
  return String(value || '').trim().replace(/[^A-Za-z0-9._-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').toUpperCase();
}

function cleanFolderName(value){
  return String(value || '').trim().replace(/[\\/]+/g,' ').replace(/[^A-Za-z0-9._ -]+/g,'-').replace(/\s+/g,' ').replace(/^-+|-+$/g,'').trim();
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

  const parts=[product.categoria, product.subcategoria].map(cleanFolderName).filter(Boolean);
  const folderPath=parts.length ? parts.join('/') : '';
  if(code) return 'assets/productos/' + (folderPath ? folderPath + '/' : '') + code + ext;
  if(product.imagen && typeof product.imagen === 'string') {
    const basename=product.imagen.split(/[\\/]/).pop();
    if(basename) return 'assets/productos/' + (folderPath ? folderPath + '/' : '') + basename;
  }
  return null;
}

function copyRecursive(from,to){
  fs.mkdirSync(to,{recursive:true});
  for(const entry of fs.readdirSync(from,{withFileTypes:true})){
    const a=path.join(from,entry.name),b=path.join(to,entry.name);
    if(entry.isDirectory()) copyRecursive(a,b);
    else if(path.extname(entry.name).toLowerCase()==='.json') writeJson(a,b,applyCatalogData);
    else fs.copyFileSync(a,b);
  }
}

function applyCatalogData(data){
  if(!data||!Array.isArray(data.productos)) return data;
  data.productos=data.productos.filter(function(product){
    return !hiddenProductIds.has(String(product.id||product.codigo||''));
  });
  applySpecialOffers(data);
  data.productos.forEach(function(product){
    delete product.precio;
    delete product.precio_anterior;
    delete product.precio_costo;
    delete product.margen_porcentaje;
  });
  if(Array.isArray(data.categorias)){
    const categories=new Map();
    data.productos.forEach(function(product){
      if(!product.categoria) return;
      if(!categories.has(product.categoria)) categories.set(product.categoria,new Map());
      const subcategories=categories.get(product.categoria);
      if(product.subcategoria) subcategories.set(product.subcategoria,(subcategories.get(product.subcategoria)||0)+1);
    });
    data.categorias=Array.from(categories.entries()).map(function(entry){
      const subcategories=Array.from(entry[1].entries()).map(function(subcategory){
        return {nombre:subcategory[0],cantidad_productos:subcategory[1]};
      });
      return {nombre:entry[0],cantidad_productos:subcategories.reduce((total,subcategory)=>total+subcategory.cantidad_productos,0),subcategorias:subcategories};
    });
    data.total_categorias=data.categorias.length;
    data.total_subcategorias=data.categorias.reduce((total,category)=>total+category.subcategorias.length,0);
  }
  const pageCount=data.productos.reduce((total,product)=>Math.max(total,Number(product.page)||0),0);
  if('total_paginas' in data) data.total_paginas=pageCount;
  if('total_productos' in data) data.total_productos=data.productos.length;
  return data;
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
writeJson(path.join(src,'catalogo-index.json'),path.join(dist,'catalogo-index.json'),applyCatalogData);
copyRecursive(path.join(src,'catalogo'),catalogDir);
writeJson(path.join(src,'productos_relive.json'),path.join(dist,'productos_relive.json'),applyCatalogData);
console.log('Catálogo generado desde src/data');
