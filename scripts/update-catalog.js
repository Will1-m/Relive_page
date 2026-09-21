'use strict';
const fs=require('fs');
const path=require('path');
const https=require('https');

const target=path.resolve(__dirname,'../src/data/productos_relive.json');
const source=process.argv[2]||process.env.CATALOG_SOURCE_URL;

function download(url){
  return new Promise((resolve,reject)=>{
    https.get(url,res=>{
      if(res.statusCode>=300&&res.statusCode<400&&res.headers.location)
        return resolve(download(res.headers.location));
      if(res.statusCode!==200)return reject(new Error('HTTP '+res.statusCode));
      let body='';res.setEncoding('utf8');
      res.on('data',c=>body+=c);res.on('end',()=>resolve(body));
    }).on('error',reject);
  });
}

async function main(){
  if(!source){
    console.log('Sin CATALOG_SOURCE_URL: se conserva el catálogo actual.');
    return;
  }
  const raw=source.startsWith('http')?await download(source):fs.readFileSync(path.resolve(source),'utf8');
  const data=JSON.parse(raw);
  if(!Array.isArray(data.productos)||!data.productos.length)throw new Error('Fuente inválida: falta productos[]');
  data.version=data.version||'2.0';
  data.actualizado=new Date().toISOString();
  data.total_productos=data.productos.length;
  fs.writeFileSync(target,JSON.stringify(data,null,2));
  console.log('Catálogo actualizado: '+data.productos.length+' productos');
}
main().catch(e=>{console.error(e);process.exit(1)});
