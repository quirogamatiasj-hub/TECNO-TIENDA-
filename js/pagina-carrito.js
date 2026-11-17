// ============================================================
// VISTA Y EDICIÓN DEL CARRITO
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const zona = $("contenido-carrito");
  const productos = await obtenerProductos();

  if (!productos.length) {
    zona.textContent = "No se pudo leer el catálogo. Usa Live Server.";
    return;
  }

  function pintar() {
    const c = obtenerCarrito();
    zona.replaceChildren();

    if (!c.length) {
      zona.textContent = "Tu carrito está vacío.";
      $("continuar-pago").hidden = true;
      return;
    }

    $("continuar-pago").hidden = false;
    let total = 0;

    const tabla = document.createElement("div");
    tabla.className = "tabla-carrito";

    c.forEach((x) => {
      const p = productos.find((y) => y.id === x.id);
      if (!p) return;

      total += p.precio * x.cantidad;

      const f = document.createElement("div");
      f.className = "fila-carrito";

      const n = document.createElement("div");
      const strong = document.createElement("strong");
      const small = document.createElement("small");
      strong.textContent = p.nombre;
      small.textContent = formatoPrecio(p.precio) + " unidad";
      n.append(strong, small);

      const cant = document.createElement("div");
      cant.className = "control-cantidad";

      const menos = document.createElement("button");
      menos.textContent = "−";
      menos.setAttribute("aria-label", "Quitar una unidad");

      const numero = document.createElement("span");
      numero.textContent = x.cantidad;

      const mas = document.createElement("button");
      mas.textContent = "+";
      mas.setAttribute("aria-label", "Añadir una unidad");

      menos.onclick = () => cambiar(x.id, -1);
      mas.onclick = () => cambiar(x.id, 1);

      cant.append(menos, numero, mas);

      const sub = document.createElement("strong");
      sub.textContent = formatoPrecio(p.precio * x.cantidad);

      const quitar = document.createElement("button");
      quitar.className = "boton-peligro";
      quitar.textContent = "Quitar";
      quitar.onclick = () => {
        guardarCarrito(obtenerCarrito().filter((y) => y.id !== x.id));
        pintar();
      };

      f.append(n, cant, sub, quitar);
      tabla.append(f);
    });

    zona.append(tabla);

    const t = document.createElement("h2");
    t.className = "total-carrito";
    t.textContent = "Total: " + formatoPrecio(total);
    zona.append(t);
  }

  function cambiar(id, n) {
    const c = obtenerCarrito();
    const x = c.find((y) => y.id === id);
    const p = productos.find((y) => y.id === id);
    if (!x || !p) return;

    const nueva = x.cantidad + n;

    if (n > 0 && nueva > p.stock) {
      alert(`Solo hay ${p.stock} unidades disponibles.`);
      return;
    }

    x.cantidad = nueva;
    guardarCarrito(c.filter((y) => y.cantidad > 0));
    pintar();
  }

  $("vaciar-carrito").onclick = () => {
    if (confirm("¿Vaciar todos los productos?")) {
      guardarCarrito([]);
      pintar();
    }
  };

  pintar();
});