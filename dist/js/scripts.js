/*!
* Start Bootstrap - Shop Homepage v5.0.6 (undefined)
* Copyright 2013-2026 undefined
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-shop-homepage/blob/master/LICENSE)
*/
document.addEventListener('DOMContentLoaded', function () {
  var cartKey = 'relive_cart';

  function safeNumber(v) {
    var n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function safeText(v) {
    return String(v == null ? '' : v);
  }

  function isValidBrandName(value) {
    var text = safeText(value).trim();
    return text !== '' && /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(text) && !/^\d+(?:-\d+)+$/.test(text);
  }

  function debounce(fn, delay) {
    var timer;
    return function () {
      var context = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
  }

  function esc(v) {
    return safeText(v).replace(/[&<>"']/g, function (c) {
      return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'}[c];
    });
  }

  function money(v) {
    if (v == null || v === '') return 'Consultar';
    var n = safeNumber(v);
    if (!Number.isFinite(Number(v))) return 'Consultar';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(n);
  }

  function image(p) {
    if (!p) return 'img/placeholder.png';
    return p.imagen_url || (p.imagen ? 'img/' + p.imagen : 'img/placeholder.png');
  }

  function load(u) {
    return fetch(u, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw Error(u + ' HTTP ' + r.status);
      return r.json();
    });
  }

  function getCart() {
    try {
      var raw = localStorage.getItem(cartKey);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(c) {
    var safe = Array.isArray(c) ? c.filter(Boolean) : [];
    try {
      localStorage.setItem(cartKey, JSON.stringify(safe));
    } catch (e) {}
  }

  var badge = function () {
    var n = getCart().reduce(function (s, x) {
      var q = Number(x && x.cantidad);
      return s + (Number.isFinite(q) ? q : 0);
    }, 0);
    document.querySelectorAll('.relive-cart-count').forEach(function (e) {
      e.textContent = n;
    });
  };

  var add = function (p) {
    if (!p || !p.id) return;
    if (p.stock === 0) {
      alert('Este producto no tiene stock disponible.');
      return;
    }
    var c = getCart();
    var x = c.find(function (i) {
      return i && i.id === p.id;
    });
    if (x) {
      x.cantidad = Math.max(1, Number(x.cantidad) || 1);
      x.cantidad++;
    } else {
      c.push({
        id: p.id,
        nombre: p.nombre,
        precio: p.precio,
        imagen: p.imagen,
        imagen_url: p.imagen_url,
        stock: p.stock == null ? null : p.stock,
        cantidad: 1
      });
    }
    saveCart(c);
    badge();
  };

  var cache = {};
  var page = function (n) {
    if (!cache[n]) cache[n] = load('catalogo/pages/page-' + String(n).padStart(3, '0') + '.json');
    return cache[n];
  };

  function initCatalog() {
    var grid = document.getElementById('grid-productos');
    if (!grid) return Promise.resolve();

    return load('catalogo-index.json').then(function (ix) {
      var search = document.getElementById('buscador');
      var searchButton = document.getElementById('buscar-btn');
      var brand = document.getElementById('filtro-marca');
      var sort = document.getElementById('orden');
      var per = document.getElementById('por-pagina');
      var cats = document.getElementById('categorias-nav');
      var subs = document.getElementById('subcategorias-nav');
      var pager = document.getElementById('paginacion');
      var info = document.getElementById('resultado-info');
      var offersPanel = document.getElementById('ofertas-panel');
      var offersInfo = document.getElementById('ofertas-info');
      var offersBrands = document.getElementById('ofertas-marcas');
      var clearOffers = document.getElementById('limpiar-ofertas');
      var offersProducts = document.getElementById('ofertas-productos');
      var offersPagination = document.getElementById('ofertas-paginacion');
      var offersPrevious = document.getElementById('ofertas-anterior');
      var offersNext = document.getElementById('ofertas-siguiente');
      var suggestions = document.getElementById('sugerencias-busqueda');

      if (!ix || !Array.isArray(ix.productos)) {
        if (info) info.textContent = 'No hay productos disponibles.';
        return Promise.resolve();
      }

      var counter = document.getElementById('contador-catalogo');
      if (counter) counter.textContent = ix.total_productos || ix.productos.length;

      if (brand) {
        Array.from(new Set(ix.productos.map(function (p) { return p.marca; }).filter(isValidBrandName))).sort(function (a, b) {
          return String(a).localeCompare(String(b), 'es');
        }).forEach(function (v) {
          brand.add(new Option(v, v));
        });
      }

      var cat = '';
      var sub = '';
      var offerOnly = false;
      var current = 1;
      var size = per ? Number(per.value) || 12 : 12;
      var offersTimer;

      function updateSuggestions() {
        if (!search || !suggestions) return;
        var q = search.value.trim().toLowerCase();
        suggestions.innerHTML = '';
        if (!q) {
          suggestions.hidden = true;
          search.setAttribute('aria-expanded', 'false');
          return;
        }

        var matches = ix.productos.filter(function (p) {
          var text = [p.nombre, p.codigo, p.marca, p.categoria, p.subcategoria].filter(Boolean).join(' ').toLowerCase();
          return text.indexOf(q) >= 0;
        }).slice(0, 8);

        if (!matches.length) {
          suggestions.hidden = true;
          search.setAttribute('aria-expanded', 'false');
          return;
        }

        matches.forEach(function (p, index) {
          var item = document.createElement('button');
          item.type = 'button';
          item.className = 'search-suggestion';
          item.setAttribute('role', 'option');
          item.setAttribute('id', 'sugerencia-' + index);
          item.innerHTML = '<span class="search-suggestion-name"></span><small class="search-suggestion-meta"></small>';
          item.querySelector('.search-suggestion-name').textContent = p.nombre || p.codigo || 'Producto';
          item.querySelector('.search-suggestion-meta').textContent = [p.marca, p.codigo].filter(Boolean).join(' · ');
          item.onclick = function () {
            suggestions.hidden = true;
            search.setAttribute('aria-expanded', 'false');
            window.location.href = 'producto.html?id=' + encodeURIComponent(p.id);
          };
          suggestions.appendChild(item);
        });

        suggestions.hidden = false;
        search.setAttribute('aria-expanded', 'true');
      }

      function btn(t, a, f) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn btn-sm ' + (a ? 'btn-dark' : 'btn-outline-dark');
        b.textContent = t;
        b.onclick = f;
        return b;
      }

      function filters() {
        if (cats) {
          cats.innerHTML = '';
          cats.appendChild(btn('Todas', !cat, function () {
            cat = '';
            sub = '';
            current = 1;
            filters();
            render();
          }));
          ix.categorias.forEach(function (c) {
            cats.appendChild(btn(c.nombre + ' (' + c.cantidad_productos + ')', cat === c.nombre, function () {
              cat = c.nombre;
              sub = '';
              current = 1;
              filters();
              render();
            }));
          });
        }

        if (subs) {
          subs.innerHTML = '';
          if (cat) {
            var c = ix.categorias.find(function (x) { return x.nombre === cat; });
            if (c) {
              subs.appendChild(btn('Todas', !sub, function () {
                sub = '';
                current = 1;
                filters();
                render();
              }));
              c.subcategorias.forEach(function (s) {
                subs.appendChild(btn(s.nombre + ' (' + s.cantidad_productos + ')', sub === s.nombre, function () {
                  sub = s.nombre;
                  current = 1;
                  filters();
                  render();
                }));
              });
            }
          }
        }
      }

      function setupOffers() {
        var offers = ix.productos.filter(function (p) {
          return p.oferta === true;
        });
        var brands = Array.from(new Set(offers.map(function (p) { return p.marca; }).filter(isValidBrandName))).sort(function (a, b) {
          return String(a).localeCompare(String(b), 'es');
        });

        if (!offersPanel || !offersInfo || !offersBrands || !offersProducts) return;
        offersBrands.innerHTML = '';
        offersProducts.innerHTML = '';
        if (offersTimer) clearInterval(offersTimer);

        if (!offers.length) {
          offersInfo.textContent = 'No hay promociones activas en este momento.';
          return;
        }

        offersInfo.textContent = offers.length + ' producto' + (offers.length === 1 ? '' : 's') + ' con precio especial';

        var offerPage = 0;
        var offersPerPage = 3;
        var totalOfferPages = Math.ceil(offers.length / offersPerPage);

        function renderOfferPage() {
          var start = offerPage * offersPerPage;
          var visibleOffers = offers.slice(start, start + offersPerPage);
          offersProducts.innerHTML = '';
          visibleOffers.forEach(function (p) {
            var col = document.createElement('div');
            col.className = 'col-md-4';
            var previousPrice = p.precio_anterior != null ? '<del class="small me-2 offer-previous-price">' + money(p.precio_anterior) + '</del>' : '';
            col.innerHTML = '<article class="offer-card h-100"><span class="offer-badge">Oferta</span><a href="producto.html?id=' + encodeURIComponent(p.id) + '"><img src="' + esc(image(p)) + '" alt="' + esc(p.nombre) + '" loading="lazy" onerror="this.onerror=null;this.src=\'img/placeholder.png\'"></a><div class="offer-card-body"><small>' + esc(p.marca || '') + '</small><h3>' + esc(p.nombre) + '</h3><div>' + previousPrice + '<strong>' + money(p.precio) + '</strong></div><button class="btn btn-sm btn-light offer-add">Agregar</button></div></article>';
            col.querySelector('.offer-add').onclick = function () { add(p); };
            offersProducts.appendChild(col);
          });

          offersPagination.innerHTML = '';
          for (var i = 0; i < totalOfferPages; i++) {
            var dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'offer-dot' + (i === offerPage ? ' active' : '');
            dot.setAttribute('aria-label', 'Página de ofertas ' + (i + 1));
            dot.onclick = (function (pageNumber) {
              return function () {
                offerPage = pageNumber;
                renderOfferPage();
              };
            })(i);
            offersPagination.appendChild(dot);
          }
        }

        function moveOfferPage(step) {
          offerPage = (offerPage + step + totalOfferPages) % totalOfferPages;
          renderOfferPage();
        }

        if (offersPrevious) offersPrevious.onclick = function () { moveOfferPage(-1); };
        if (offersNext) offersNext.onclick = function () { moveOfferPage(1); };
        renderOfferPage();
        offersTimer = setInterval(function () { moveOfferPage(1); }, 5000);

        offersBrands.appendChild(btn('Todas las ofertas', offerOnly && !brand.value, function () {
          offerOnly = true;
          if (brand) brand.value = '';
          current = 1;
          render().then(function () {
            grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        }));
        brands.forEach(function (name) {
          offersBrands.appendChild(btn(name, offerOnly && brand.value === name, function () {
            offerOnly = true;
            if (brand) brand.value = name;
            current = 1;
            render().then(function () {
              grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
          }));
        });
        clearOffers.hidden = false;
      }

      function filtered() {
        var q = (search && search.value || '').trim().toLowerCase();
        var a = ix.productos.filter(function (p) {
          var text = [p.nombre, p.codigo, p.marca, p.categoria, p.subcategoria].filter(Boolean).join(' ').toLowerCase();
          return (!offerOnly || p.oferta === true) && (!cat || p.categoria === cat) && (!sub || p.subcategoria === sub) && (!brand || !brand.value || p.marca === brand.value) && (!q || text.indexOf(q) >= 0);
        });

        if (sort && sort.value === 'precio-asc') a.sort(function (x, y) { return safeNumber(x.precio) - safeNumber(y.precio); });
        if (sort && sort.value === 'precio-desc') a.sort(function (x, y) { return safeNumber(y.precio) - safeNumber(x.precio); });
        if (sort && sort.value === 'nombre') a.sort(function (x, y) { return String(x.nombre || '').localeCompare(String(y.nombre || ''), 'es'); });
        return a;
      }

      function paginate(total) {
        if (!pager) return;
        pager.innerHTML = '';
        var pages = Math.max(1, Math.ceil(total / size));
        for (var i = 1; i <= pages; i++) {
          var li = document.createElement('li');
          li.className = 'page-item ' + (i === current ? 'active' : '');
          var b = document.createElement('button');
          b.className = 'page-link';
          b.textContent = i;
          b.onclick = function () {
            current = Number(this.textContent);
            render();
            window.scrollTo({ top: 250, behavior: 'smooth' });
          };
          li.appendChild(b);
          pager.appendChild(li);
        }
      }

      function render() {
        var all = filtered();
        var pages = Math.max(1, Math.ceil(all.length / size));
        if (current > pages) current = pages;

        var visible = all.slice((current - 1) * size, current * size);
        var groups = {};

        visible.forEach(function (p) {
          (groups[p.page] || (groups[p.page] = [])).push(p.id);
        });

        return Promise.all(Object.keys(groups).map(function (n) {
          return page(Number(n));
        })).then(function (ds) {
          var full = [];
          ds.forEach(function (d) {
            full = full.concat(d.productos);
          });

          var by = new Map(full.map(function (p) { return [p.id, p]; }));
          grid.innerHTML = '';

          if (!all.length) {
            grid.innerHTML = '<div class="col-12"><div class="alert alert-light border">No se encontraron productos con esos filtros.</div></div>';
            if (info) info.textContent = '0 productos';
            paginate(0);
            return;
          }

          visible.forEach(function (s) {
            var p = by.get(s.id) || s;
            var col = document.createElement('div');
            col.className = 'col';
            var previousPrice = p.oferta && p.precio_anterior != null ? '<del class="text-muted small me-2">' + money(p.precio_anterior) + '</del>' : '';
            var offerBadge = p.oferta ? '<span class="offer-badge">Oferta</span>' : '';
            col.innerHTML = '<div class="card product-card h-100">' + offerBadge + '<a href="producto.html?id=' + encodeURIComponent(p.id) + '"><img class="card-img-top product-card-image" loading="lazy" src="' + esc(image(p)) + '" alt="' + esc(p.nombre) + '" onerror="this.onerror=null;this.src=\'img/placeholder.png\'"></a><div class="card-body product-card-body"><small class="text-muted">' + esc(p.categoria || '') + ' · ' + esc(p.subcategoria || '') + '</small><h5 class="mt-2">' + esc(p.nombre) + '</h5><div class="mb-3">' + previousPrice + '<strong class="fw-bold fs-5">' + money(p.precio) + '</strong></div><div class="product-card-actions"><a class="btn btn-outline-dark flex-fill" href="producto.html?id=' + encodeURIComponent(p.id) + '">Ver</a><button class="btn btn-dark flex-fill add">Agregar</button></div></div></div>';
            col.querySelector('.add').onclick = function () { add(p); };
            grid.appendChild(col);
          });

          if (info) info.textContent = all.length + ' producto' + (all.length === 1 ? '' : 's') + ' · página ' + current + ' de ' + pages;
          paginate(all.length);
        });
      }

      if (search) {
        search.addEventListener('input', debounce(function () {
          updateSuggestions();
          current = 1;
          render();
        }, 300));
        search.addEventListener('keydown', function (event) {
          if (event.key === 'Escape' && suggestions) {
            suggestions.hidden = true;
            search.setAttribute('aria-expanded', 'false');
          }
        });
      }

      if (searchButton) {
        searchButton.onclick = function () {
          if (suggestions) suggestions.hidden = true;
          if (search) search.setAttribute('aria-expanded', 'false');
          current = 1;
          render();
        };
      }

      document.addEventListener('click', function (event) {
        if (suggestions && search && !search.contains(event.target) && !suggestions.contains(event.target)) {
          suggestions.hidden = true;
          search.setAttribute('aria-expanded', 'false');
        }
      });

      [brand, sort].forEach(function (control) {
        if (control) {
          control.addEventListener('change', function () {
            current = 1;
            if (control === brand) offerOnly = false;
            var update = render();
            if (control === brand) {
              update.then(function () {
                grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
              });
            }
          });
        }
      });

      if (per) {
        per.onchange = function () {
          size = Number(per.value) || 12;
          current = 1;
          render();
        };
      }

      if (clearOffers) {
        clearOffers.onclick = function () {
          offerOnly = true;
          current = 1;
          render().then(function () {
            grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        };
      }

      setupOffers();
      filters();
      return render();
    }).catch(function (err) {
      console.error(err);
      var info = document.getElementById('resultado-info');
      if (info) info.textContent = 'No se pudieron cargar los productos.';
      var grid = document.getElementById('grid-productos');
      if (grid) grid.innerHTML = '<div class="col-12"><div class="alert alert-warning">No se pudieron cargar los productos.</div></div>';
    });
  }

  function initProduct() {
    var root = document.getElementById('producto');
    if (!root) return Promise.resolve();

    var id = new URLSearchParams(location.search).get('id');
    if (!id) {
      root.innerHTML = '<div class="alert alert-warning">No se indicó un producto.</div>';
      return Promise.resolve();
    }

    return load('catalogo-index.json').then(function (ix) {
      if (!ix || !Array.isArray(ix.productos)) {
        root.innerHTML = '<div class="alert alert-warning">No se pudo cargar el producto.</div>';
        return;
      }

      var s = ix.productos.find(function (p) { return p.id === id; });
      if (!s) {
        root.innerHTML = '<div class="alert alert-warning">Producto no encontrado.</div>';
        return;
      }

      return page(s.page).then(function (d) {
        var p = d.productos.find(function (x) { return x.id === id; }) || s;
        if (!p) {
          root.innerHTML = '<div class="alert alert-warning">Producto no encontrado.</div>';
          return;
        }

        document.title = 'Relive — ' + p.nombre;
        root.innerHTML = '<div class="row g-5"><div class="col-md-6"><div class="border rounded p-3 text-center"><img src="' + esc(image(p)) + '" class="img-fluid" style="max-height:500px;object-fit:contain" alt="' + esc(p.nombre) + '" onerror="this.onerror=null;this.src=\'img/placeholder.png\'"></div></div><div class="col-md-6"><small class="text-muted">' + esc(p.categoria || '') + ' · ' + esc(p.subcategoria || '') + '</small><h1 class="display-6 mt-2">' + esc(p.nombre) + '</h1><p class="lead">' + esc(p.descripcion || '') + '</p>' + (p.marca ? '<p><strong>Marca:</strong> ' + esc(p.marca) + '</p>' : '') + (p.codigo ? '<p><strong>Código:</strong> ' + esc(p.codigo) + '</p>' : '') + '<div class="fs-2 fw-bold mb-3">' + money(p.precio) + '</div><p class="text-muted">' + (p.stock === 0 ? 'Sin stock' : p.stock != null ? 'Stock disponible' : 'Consultar disponibilidad') + '</p><button id="add-product" class="btn btn-dark btn-lg" ' + (p.stock === 0 ? 'disabled' : '') + '>Agregar al carrito</button></div></div>';

        var addButton = document.getElementById('add-product');
        if (addButton) {
          addButton.onclick = function () { add(p); };
        }
      });
    }).catch(function (err) {
      console.error(err);
      root.innerHTML = '<div class="alert alert-warning">No se pudo cargar el producto.</div>';
    });
  }

  function initCart() {
    var root = document.getElementById('carrito');
    if (!root) return;

    function render() {
      var c = getCart();
      if (!Array.isArray(c) || !c.length) {
        root.innerHTML = '<div class="alert alert-info">Tu carrito está vacío.</div>';
        return;
      }

      var total = 0;
      root.innerHTML = c.map(function (x, i) {
        var price = safeNumber(x.precio);
        total += price * (Number(x.cantidad) || 1);
        return '<div class="card mb-3"><div class="card-body d-flex align-items-center gap-3"><img src="' + esc(image(x)) + '" style="width:80px;height:80px;object-fit:contain" alt="' + esc(x.nombre) + '" onerror="this.onerror=null;this.src=\'img/placeholder.png\'"><div class="flex-grow-1"><h5>' + esc(x.nombre) + '</h5>' + money(x.precio) + ' × <input data-q="' + i + '" type="number" min="1" value="' + (Number(x.cantidad) || 1) + '" class="form-control d-inline-block" style="width:80px"></div><button class="btn btn-outline-danger del" data-i="' + i + '">Eliminar</button></div></div>';
      }).join('') + '<div class="text-end"><h3>Total: ' + money(total) + '</h3><button id="empty" class="btn btn-outline-danger me-2">Vaciar</button><button id="order" class="btn btn-dark">Preparar pedido</button></div>';

      root.querySelectorAll('.del').forEach(function (b) {
        b.onclick = function () {
          var index = Number(b.dataset.i);
          c.splice(index, 1);
          saveCart(c);
          render();
          badge();
        };
      });

      root.querySelectorAll('[data-q]').forEach(function (i) {
        i.onchange = function () {
          var idx = Number(i.dataset.q);
          var next = Number(i.value) || 1;
          if (!c[idx]) return;
          c[idx].cantidad = Math.max(1, next);
          saveCart(c);
          render();
          badge();
        };
      });

      var empty = document.getElementById('empty');
      if (empty) {
        empty.onclick = function () {
          saveCart([]);
          render();
          badge();
        };
      }

      var order = document.getElementById('order');
      if (order) {
        order.onclick = function () {
          var t = c.map(function (x) {
            return (x.nombre || 'Producto') + ' x' + (Number(x.cantidad) || 1) + ' — ' + money(x.precio);
          }).join('\n');
          try {
            if (navigator.clipboard) navigator.clipboard.writeText(t);
          } catch (e) {}
          alert('Pedido copiado.');
        };
      }
    }

    render();
  }

  badge();
  initCatalog().catch(function (err) { console.error(err); });
  initProduct().catch(function (err) { console.error(err); });
  initCart();
});
