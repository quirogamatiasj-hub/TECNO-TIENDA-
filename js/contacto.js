

document.addEventListener("DOMContentLoaded", () => {
  const f = $("form-contacto");
  if (!f) return;

  f.onsubmit = (e) => {
    e.preventDefault();

    const m = leerJSON("tecnotienda_mensajes", []);
    m.push({
      nombre: $("con-nombre").value.trim(),
      correo: $("con-correo").value.trim(),
      asunto: $("con-asunto").value.trim(),
      mensaje: $("con-mensaje").value.trim(),
      fecha: new Date().toISOString(),
    });

    guardarJSON("tecnotienda_mensajes", m);
    f.reset();
    $("contacto-estado").textContent = "Consulta guardada en este navegador.";
  };
});