'use strict';
const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const src=path.join(root,'src','data');
const dist=path.join(root,'dist');

function copyRecursive(from,to){
  fs.mkdirSync(to,{recursive:true});
  for(const entry of fs.readdirSync(from,{withFileTypes:true})){
    const a=path.join(from,entry.name),b=path.join(to,entry.name);
    if(entry.isDirectory()) copyRecursive(a,b);
    else fs.copyFileSync(a,b);
  }
}

copyRecursive(src,path.join(dist,'catalogo'));
fs.copyFileSync(path.join(src,'productos_relive.json'),path.join(dist,'productos_relive.json'));
console.log('Catálogo generado desde src/data');
