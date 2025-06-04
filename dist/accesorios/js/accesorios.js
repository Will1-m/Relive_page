// accesorios/js/accesorios.js

document.addEventListener("DOMContentLoaded", () => {
  fetch("../productos.json")
    .then((res) => res.json())
    .then((productos) => {
      const grid = document.getElementById("grid-accesorios");
      productos.forEach((item) => {
        const col = document.createElement("div");
        col.className = "col";

        col.innerHTML = `
          <div class="card h-100">
            <img
              src="../dist/img/${item.codigo}.webp"
              class="card-img-top"
              alt="${item.nombre}"
            />
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${item.nombre}</h5>
              <p class="card-text">Categoría: ${item.categoria}</p>
              <a href="producto-${item.codigo}.html" class="mt-auto btn btn-primary">Ver más</a>
            </div>
          </div>
        `;

        grid.appendChild(col);
      });
    })
    .catch((err) => console.error("Error cargando JSON:", err));
});
