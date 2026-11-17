// ============================================================
// COMENTARIOS GUARDADOS LOCALMENTE
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const f = $("form-comentario");
  const lista = $("lista-comentarios");
  if (!f) return;

  const base = [
    {
      nombre: "Laura",
      estrellas: 5,
      texto: "Mi laptop funciona muy bien para estudiar.",
    },
    {
      nombre: "Carlos",
      estrellas: 4,
      texto: "Buen catálogo de componentes.",
    },
  ];

  function pintar() {
    lista.replaceChildren();

    const nuevos = leerJSON("tecnotienda_comentarios", []).slice().reverse();
    [...nuevos, ...base].forEach((c) => {
      const a = document.createElement("article");
      a.className = "comentario";

      const h = document.createElement("h3");
      h.textContent = c.nombre + " · " + "★".repeat(c.estrellas);

      const p = document.createElement("p");
      p.textContent = c.texto;

      a.append(h, p);
      lista.append(a);
    });
  }

  f.onsubmit = (e) => {
    e.preventDefault();

    const c = leerJSON("tecnotienda_comentarios", []);
    c.push({
      nombre: $("com-nombre").value.trim(),
      estrellas: Number($("com-estrellas").value),
      texto: $("com-texto").value.trim(),
    });

    guardarJSON("tecnotienda_comentarios", c);
    f.reset();
    $("comentario-mensaje").textContent =
      "Comentario publicado en este navegador.";
    pintar();
  };

  pintar();
});