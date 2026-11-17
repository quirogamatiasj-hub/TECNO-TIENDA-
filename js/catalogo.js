
async function cargarProductos() {
  try {
    const productos = await obtenerProductos();
    if (!productos.length) throw Error("Catálogo vacío");

    const zona = $("lista-productos");
    const destacados = $("productos-destacados");

    if (zona) {
      const pintar = () => {
        let l = productos.filter((p) => p.categoria === zona.dataset.categoria);
        const q = $("buscar-producto").value.trim().toLowerCase();
        const orden = $("orden-productos").value;

        l = l.filter((p) =>
          (p.nombre + " " + p.descripcion).toLowerCase().includes(q)
        );

        if (orden === "menor") l.sort((a, b) => a.precio - b.precio);
        if (orden === "mayor") l.sort((a, b) => b.precio - a.precio);
        if (orden === "nombre")
          l.sort((a, b) => a.nombre.localeCompare(b.nombre));

        zona.replaceChildren(...l.map(crearTarjeta));
        $("sin-resultados").hidden = l.length > 0;
      };

      $("buscar-producto").addEventListener("input", pintar);
      $("orden-productos").addEventListener("change", pintar);
      pintar();
    }

    if (destacados) {
      destacados.replaceChildren(
        ...productos
          .filter((p) => p.destacado)
          .slice(0, 4)
          .map(crearTarjeta)
      );
    }
  } catch (e) {
    const z = $("lista-productos") || $("productos-destacados");
    if (z) {
      z.textContent =
        "No se pudo cargar el catálogo. Abre el proyecto con Live Server.";
    }
    console.error(e);
  }
}

function crearTarjeta(p) {
  const a = document.createElement("article");
  a.className = "tarjeta";

  const img = document.createElement("img");
  img.src = p.imagen;
  img.alt = p.nombre;
  img.loading = "lazy";
  img.onerror = () => (img.src = "img/rtx.png");

  const info = document.createElement("div");
  info.className = "info";

  const h = document.createElement("h3");
  h.textContent = p.nombre;

  const d = document.createElement("p");
  d.textContent = p.descripcion;

  const price = document.createElement("p");
  price.className = "precio";
  price.textContent = formatoPrecio(p.precio);

  const stock = document.createElement("p");
  stock.className = "stock";
  stock.textContent = `Disponibles: ${p.stock}`;

  const b = document.createElement("button");
  b.className = "boton";
  b.textContent = "Agregar al carrito";
  b.type = "button";
  b.disabled = p.stock < 1;
  b.onclick = () => agregarAlCarrito(p.id, p.stock);

  info.append(h, d, price, stock, b);
  a.append(img, info);

  return a;
}

document.addEventListener("DOMContentLoaded", cargarProductos);