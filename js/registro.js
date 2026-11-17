
document.addEventListener("DOMContentLoaded", () => {
  const f = $("form-registro");
  if (!f) return;

  const u = leerJSON("tecnotienda_usuario", null);

  if (u) {
    $("reg-nombre").value = u.nombre;
    $("reg-correo").value = u.correo;
    $("reg-mensaje").textContent =
      `Datos guardados para ${u.nombre} (${u.correo}).`;
  }

  f.onsubmit = (e) => {
    e.preventDefault();

    const nuevo = {
      nombre: $("reg-nombre").value.trim(),
      correo: $("reg-correo").value.trim().toLowerCase(),
    };

    if (nuevo.nombre.length < 2) return;

    guardarJSON("tecnotienda_usuario", nuevo);
    $("reg-mensaje").textContent =
      `¡Listo, ${nuevo.nombre}! Datos guardados en este navegador.`;
    f.reset();
  };
});