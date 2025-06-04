// main.js

document.addEventListener('DOMContentLoaded', () => {
  const contenedor = document.getElementById('grid-productos');
  const buscador = document.getElementById('buscador');
  if (!contenedor) {
    console.error('No se encontró el contenedor de productos (id="grid-productos")');
    return;
  }

  function crearTarjeta(prod) {
    if (!prod.nombre || !Array.isArray(prod.imagenes)) {
      console.warn('Producto mal definido:', prod);
      return null;
    }
    const col = document.createElement('div');
    col.classList.add('col', 'mb-5');
    col.dataset.nombre = prod.nombre.toLowerCase();
    const primeraImagen = prod.imagenes.length > 0 ? prod.imagenes[0] : 'img/placeholder.png';
    col.innerHTML = `
      <div class="card h-100">
        <img class="card-img-top" loading="lazy" src="${primeraImagen}" alt="${prod.nombre}" style="object-fit:cover;width:100%;height:200px;" />
        <div class="card-body p-4">
          <div class="text-center">
            <h5 class="fw-bolder">${prod.nombre}</h5>
            ${prod.precio != null ? `<span class="text-success fw-bold">$${prod.precio.toFixed(2)}</span>` : ''}
          </div>
        </div>
        <div class="card-footer p-4 pt-0 border-top-0 bg-transparent">
          <div class="text-center">
            <a class="btn btn-outline-dark mt-auto" href="#">Añadir</a>
          </div>
        </div>
      </div>`;
    return col;
  }

  fetch('productos_agrupados.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error al cargar productos_agrupados.json (status ${response.status})`);
      }
      return response.json();
    })
    .then(productos => {
      productos.forEach(prod => {
        const tarjeta = crearTarjeta(prod);
        if (tarjeta) contenedor.appendChild(tarjeta);
      });
      if (buscador) {
        buscador.addEventListener('input', e => {
          const texto = e.target.value.toLowerCase();
          contenedor.querySelectorAll('[data-nombre]').forEach(card => {
            card.style.display = card.dataset.nombre.includes(texto) ? '' : 'none';
          });
        });
      }
    })
    .catch(err => {
      console.error('No se pudieron cargar los productos agrupados:', err);
      contenedor.innerHTML = `<div class="col-12"><p class="text-center text-muted">No se encontraron productos disponibles.</p></div>`;
    });
});