// dist/js/scripts.js

document.addEventListener('DOMContentLoaded', () => {
  const contenedor = document.getElementById('grid-productos');
  if (!contenedor) {
    console.error('No se encontró el contenedor de productos (id="grid-productos")');
    return;
  }

  // 1. Obtenemos el JSON agrupado
  fetch('productos_agrupados.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error al cargar productos_agrupados.json (status ${response.status})`);
      }
      return response.json();
    })
    .then(productos => {
      // 2. Por cada objeto-producto, generamos su tarjeta
      productos.forEach(prod => {
        // 2.1. Creamos el <div class="col mb-5">
        const col = document.createElement('div');
        col.classList.add('col', 'mb-5');

        // 2.2. Seleccionamos la primera imagen como portada (si existe)
        const primeraImagen =
          Array.isArray(prod.imagenes) && prod.imagenes.length > 0
            ? prod.imagenes[0]
            : 'img/placeholder.png'; // placeholder si no hay imágenes

        // 2.3. Montamos el HTML del card
        col.innerHTML = `
          <div class="card h-100">
            <!-- Foto de portada -->
            <img
              class="card-img-top"
              src="${primeraImagen}"
              alt="${prod.nombre}"
              style="object-fit: cover; height: 200px;"
            />
            <!-- Cuerpo con nombre y precio -->
            <div class="card-body p-4">
              <div class="text-center">
                <h5 class="fw-bolder">${prod.nombre}</h5>
                ${
                  prod.precio != null
                    ? `<span class="text-success fw-bold">$${prod.precio.toFixed(2)}</span>`
                    : ''
                }
              </div>
            </div>
            <!-- Pie con botón -->
            <div class="card-footer p-4 pt-0 border-top-0 bg-transparent">
              <div class="text-center">
                <a class="btn btn-outline-dark mt-auto" href="#">Añadir</a>
              </div>
            </div>
          </div>
        `;

        // 2.4. Lo agregamos al contenedor principal
        contenedor.appendChild(col);
      });
    })
    .catch(err => {
      console.error('No se pudieron cargar los productos agrupados:', err);
      contenedor.innerHTML = `
        <div class="col-12">
          <p class="text-center text-muted">No se encontraron productos disponibles.</p>
        </div>
      `;
    });
});
