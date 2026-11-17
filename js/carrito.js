

const obtenerCarrito = () => leerJSON("tecnotienda_carrito", []);

const guardarCarrito = (c) => {
  guardarJSON("tecnotienda_carrito", c);
  actualizarContadorCarrito();
};

function agregarAlCarrito(id, stock = null) {
  const c = obtenerCarrito();
  const linea = c.find((x) => x.id === id);

  if (linea) {
    if (stock !== null && linea.cantidad >= stock) {
      alert(`Solo hay ${stock} unidades disponibles.`);
      return;
    }
    linea.cantidad++;
  } else {
    if (stock !== null && stock < 1) {
      alert("Producto sin stock.");
      return;
    }
    c.push({ id, cantidad: 1 });
  }

  guardarCarrito(c);
  alert("Producto agregado al carrito.");
}

function actualizarContadorCarrito() {
  const n = obtenerCarrito().reduce((s, x) => s + x.cantidad, 0);
  document
    .querySelectorAll("#contador-carrito")
    .forEach((e) => (e.textContent = n));
}

document.addEventListener("DOMContentLoaded", actualizarContadorCarrito);

// Sincroniza entre pestañas abiertas
window.addEventListener("storage", (e) => {
  if (e.key === "tecnotienda_carrito") actualizarContadorCarrito();
});