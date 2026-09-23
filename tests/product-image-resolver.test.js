const assert = require('assert');
const resolver = require('../src/js/scripts.js');

const product = {
  codigo: 'ACC123',
  imagen: 'Accesorios/fundas y estuches/imgi_3_productos31_75652.jpg',
  imagen_url: 'https://example.com/remote.jpg'
};

assert.strictEqual(resolver.getProductCode(product), 'ACC123');
assert.strictEqual(resolver.resolveProductImage(product), 'assets/productos/ACC123.jpg');
assert.strictEqual(resolver.resolveProductImage({ codigo: '', imagen: 'Accesorios/test.png' }), 'assets/productos/test.png');
assert.strictEqual(resolver.resolveProductImage(null), 'assets/placeholder.svg');

console.log('product-image-resolver tests passed');
