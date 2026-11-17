// ============================================================
// UTILIDADES COMPARTIDAS
// ============================================================

// Atajo para document.getElementById
const $ = (id) => document.getElementById(id);

// Lee JSON de localStorage con fallback seguro
const leerJSON = (clave, defecto = []) => {
  try {
    return JSON.parse(localStorage.getItem(clave)) ?? defecto;
  } catch {
    return defecto;
  }
};

// Guarda un valor como JSON en localStorage
const guardarJSON = (clave, valor) =>
  localStorage.setItem(clave, JSON.stringify(valor));

// Formatea un número como moneda USD (formato Bolivia)
const formatoPrecio = (valor) =>
  new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(valor);

// ============================================================
// INVENTARIO COMPARTIDO
// ============================================================
async function obtenerProductos() {
  const cache = leerJSON("tecnotienda_inventario", null);
  if (cache) return cache;

  try {
    const r = await fetch("data/productos.json");
    const lista = await r.json();
    guardarJSON("tecnotienda_inventario", lista);
    return lista;
  } catch {
    return [];
  }
}

// ============================================================
// MENÚ MÓVIL (Con bloqueo de scroll)
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const b = $("menu-toggle");
  const m = $("menu-principal");

  if (b && m) {
    b.addEventListener("click", () => {
      const abierto = m.classList.toggle("mostrar");
      b.setAttribute("aria-expanded", String(abierto));
      b.textContent = abierto ? "✕" : "☰";
      
      // 👇 ESTA ES LA LÍNEA QUE EVITA QUE LA PÁGINA SE MUEVA 👇
      document.body.classList.toggle("menu-abierto", abierto);
    });
  }
});