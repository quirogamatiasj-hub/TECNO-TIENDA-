// ============================================================
// PANEL DE ADMINISTRACIÓN
// ============================================================

const CLAVE_SESION = "tecnotienda_admin_activo";
const PASS_KEY     = "tecnotienda_admin_pass";
const DEFAULT_PASS = "admin123";

const getPass = () => localStorage.getItem(PASS_KEY) || DEFAULT_PASS;
const setPass = (p) => localStorage.setItem(PASS_KEY, p);

let inventario = [];
let editandoId = null;

document.addEventListener("DOMContentLoaded", () => {
  const login = $("admin-login");
  const panel = $("admin-panel");
  if (!login || !panel) return;

  // ===== Sesión =====
  const mostrarPanel = async () => {
    login.hidden = true;
    panel.hidden = false;
    await cargarInventario();
    renderTodo();
  };

  const mostrarLogin = () => {
    login.hidden = false;
    panel.hidden = true;
    $("admin-login-msg").textContent = "";
  };

  if (sessionStorage.getItem(CLAVE_SESION) === "1") mostrarPanel();

  $("form-admin-login").onsubmit = (e) => {
    e.preventDefault();
    if ($("admin-pass").value === getPass()) {
      sessionStorage.setItem(CLAVE_SESION, "1");
      $("admin-pass").value = "";
      mostrarPanel();
    } else {
      $("admin-login-msg").textContent = "Contraseña incorrecta.";
    }
  };

  $("admin-salir").onclick = () => {
    sessionStorage.removeItem(CLAVE_SESION);
    mostrarLogin();
  };

  // ===== Pestañas =====
  const tabs = document.querySelectorAll(".admin-tab");
  const tabPanels = document.querySelectorAll(".admin-tabpanel");

  tabs.forEach((t) => {
    t.onclick = () => {
      const destino = t.dataset.tab;
      tabs.forEach((x) => {
        const act = x === t;
        x.classList.toggle("activa", act);
        x.setAttribute("aria-selected", String(act));
      });
      tabPanels.forEach((p) => (p.hidden = p.id !== "tab-" + destino));
    };
  });

  // ===== Inventario (carga + guardado) =====
  async function cargarInventario() {
    let lista = leerJSON("tecnotienda_inventario", null);
    if (!lista) {
      try {
        const r = await fetch("data/productos.json");
        lista = await r.json();
        guardarJSON("tecnotienda_inventario", lista);
      } catch {
        lista = [];
      }
    }
    inventario = lista;
  }

  const guardarInventario = () =>
    guardarJSON("tecnotienda_inventario", inventario);

  // ===== Render general =====
  function renderTodo() {
    renderStats();
    renderStockBajo();
    renderPedidos();
    renderComentarios();
    renderInventario();
    renderMensajes();
    renderCliente();
  }

  $("admin-recargar").onclick = renderTodo;

  // ===== Dashboard =====
  function renderStats() {
    const zona = $("admin-stats");
    if (!zona) return;

    const pedidos     = leerJSON("tecnotienda_pedidos", []);
    const comentarios = leerJSON("tecnotienda_comentarios", []);
    const mensajes    = leerJSON("tecnotienda_mensajes", []);
    const totalVendido = pedidos.reduce((s, p) => s + (p.total || 0), 0);
    const stockTotal   = inventario.reduce((s, p) => s + (p.stock || 0), 0);

    const stats = [
      { v: pedidos.length,             t: "Pedidos" },
      { v: formatoPrecio(totalVendido), t: "Total facturado" },
      { v: comentarios.length,         t: "Comentarios" },
      { v: mensajes.length,            t: "Mensajes" },
      { v: inventario.length,          t: "Productos" },
      { v: stockTotal,                 t: "Unidades en stock" },
    ];

    zona.replaceChildren(...stats.map((s) => {
      const d = document.createElement("div");
      d.className = "tarjeta categoria";
      const h = document.createElement("h3");
      h.textContent = s.v;
      const p = document.createElement("p");
      p.textContent = s.t;
      d.append(h, p);
      return d;
    }));
  }

  function renderStockBajo() {
    const zona = $("admin-stock-bajo");
    if (!zona) return;

    const bajos = inventario.filter((p) => p.stock < 3);
    if (!bajos.length) {
      zona.textContent = "Todo el stock está por encima de 2 unidades.";
      return;
    }
    const ul = document.createElement("ul");
    ul.className = "lista-resumen";
    bajos.forEach((p) => {
      const li = document.createElement("li");
      li.textContent = `${p.nombre} — ${p.stock} unidades`;
      ul.append(li);
    });
    zona.replaceChildren(ul);
  }

  // ===== Pedidos =====
  function renderPedidos() {
    const zona = $("admin-pedidos");
    if (!zona) return;

    const pedidos = leerJSON("tecnotienda_pedidos", []);
    if (!pedidos.length) {
      zona.textContent = "No hay pedidos registrados.";
      return;
    }

    const tabla = document.createElement("div");
    tabla.className = "admin-tabla";

    pedidos.slice().reverse().forEach((p) => {
      const fila = document.createElement("div");
      fila.className = "admin-fila";

      const info = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = p.numero + " · " + p.cliente;
      const small = document.createElement("small");
      small.textContent =
        `${p.fecha} · ${p.metodo} · ${formatoPrecio(p.total)} · ${p.estado}`;
      info.append(strong, small);

      const del = document.createElement("button");
      del.className = "boton peligro";
      del.textContent = "Borrar";
      del.onclick = () => {
        if (!confirm(`¿Borrar pedido ${p.numero}?`)) return;
        const rest = leerJSON("tecnotienda_pedidos", [])
          .filter((x) => x.numero !== p.numero);
        guardarJSON("tecnotienda_pedidos", rest);
        renderPedidos();
        renderStats();
      };

      fila.append(info, del);
      tabla.append(fila);
    });
    zona.replaceChildren(tabla);
  }

  // ===== Comentarios =====
  function renderComentarios() {
    const zona = $("admin-comentarios");
    if (!zona) return;

    const items = leerJSON("tecnotienda_comentarios", []);
    if (!items.length) {
      zona.textContent = "No hay comentarios.";
      return;
    }

    const lista = document.createElement("div");
    lista.className = "lista";

    items.forEach((c, idx) => {
      const art = document.createElement("article");
      art.className = "comentario";

      const h = document.createElement("h3");
      h.textContent = `${c.nombre} · ${"★".repeat(c.estrellas)}`;

      const p = document.createElement("p");
      p.textContent = c.texto;

      const del = document.createElement("button");
      del.className = "boton peligro";
      del.textContent = "Eliminar";
      del.style.marginTop = ".5rem";
      del.onclick = () => {
        if (!confirm("¿Eliminar este comentario?")) return;
        const rest = leerJSON("tecnotienda_comentarios", []);
        rest.splice(idx, 1);
        guardarJSON("tecnotienda_comentarios", rest);
        renderComentarios();
        renderStats();
      };

      art.append(h, p, del);
      lista.append(art);
    });
    zona.replaceChildren(lista);
  }

  $("admin-borrar-comentarios").onclick = () => {
    if (!confirm("¿Borrar TODOS los comentarios?")) return;
    localStorage.removeItem("tecnotienda_comentarios");
    renderComentarios();
    renderStats();
  };

  // ===== Inventario (CRUD) =====
  function renderInventario() {
    const zona = $("admin-inventario");
    if (!zona) return;

    $("inv-count").textContent = inventario.length;

    if (!inventario.length) {
      zona.textContent = "No hay productos.";
      return;
    }

    const tabla = document.createElement("div");
    tabla.className = "admin-tabla";

    inventario.forEach((p) => {
      const fila = document.createElement("div");
      fila.className = "admin-fila";

      const img = document.createElement("img");
      img.className = "admin-img";
      img.src = p.imagen;
      img.alt = p.nombre;
      img.onerror = () => { img.src = "img/rtx.png"; };

      const info = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = p.nombre;
      const small = document.createElement("small");
      small.textContent =
        `${p.categoria} · ${formatoPrecio(p.precio)} · stock ${p.stock}`;
      info.append(strong, small);

      const edit = document.createElement("button");
      edit.className = "boton secundario";
      edit.textContent = "Editar";
      edit.onclick = () => editarProducto(p.id);

      const del = document.createElement("button");
      del.className = "boton peligro";
      del.textContent = "Eliminar";
      del.onclick = () => {
        if (!confirm(`¿Eliminar "${p.nombre}"?`)) return;
        inventario = inventario.filter((x) => x.id !== p.id);
        guardarInventario();
        renderInventario();
        renderStats();
        renderStockBajo();
      };

      fila.append(img, info, edit, del);
      tabla.append(fila);
    });
    zona.replaceChildren(tabla);
  }

  function editarProducto(id) {
    const p = inventario.find((x) => x.id === id);
    if (!p) return;

    editandoId = id;
    $("prod-id").value = p.id;
    $("prod-id").readOnly = true;
    $("prod-categoria").value = p.categoria;
    $("prod-nombre").value = p.nombre;
    $("prod-descripcion").value = p.descripcion;
    $("prod-precio").value = p.precio;
    $("prod-stock").value = p.stock;
    $("prod-imagen").value = p.imagen;
    $("prod-destacado").checked = Boolean(p.destacado);

    $("btn-guardar-producto").textContent = "Guardar cambios";
    $("btn-cancelar-edicion").hidden = false;
    $("inv-titulo").textContent = `Editando: ${p.nombre}`;
    $("prod-mensaje").textContent = "";

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  $("btn-cancelar-edicion").onclick = () => {
    editandoId = null;
    $("form-producto").reset();
    $("prod-id").readOnly = false;
    $("btn-guardar-producto").textContent = "Añadir producto";
    $("btn-cancelar-edicion").hidden = true;
    $("inv-titulo").textContent = "Añadir producto";
    $("prod-mensaje").textContent = "";
  };

  $("form-producto").onsubmit = (e) => {
    e.preventDefault();

    const prod = {
      id: $("prod-id").value.trim(),
      categoria: $("prod-categoria").value,
      nombre: $("prod-nombre").value.trim(),
      descripcion: $("prod-descripcion").value.trim(),
      precio: Number($("prod-precio").value),
      stock: Number($("prod-stock").value),
      imagen: $("prod-imagen").value.trim(),
      destacado: $("prod-destacado").checked ? 1 : 0,
    };

    if (editandoId) {
      const idx = inventario.findIndex((x) => x.id === editandoId);
      if (idx === -1) return;
      inventario[idx] = prod;
    } else {
      if (inventario.some((x) => x.id === prod.id)) {
        $("prod-mensaje").textContent = "Ya existe un producto con ese ID.";
        return;
      }
      inventario.push(prod);
    }

    guardarInventario();
    renderInventario();
    renderStats();
    renderStockBajo();

    $("form-producto").reset();
    $("prod-id").readOnly = false;
    editandoId = null;
    $("btn-guardar-producto").textContent = "Añadir producto";
    $("btn-cancelar-edicion").hidden = true;
    $("inv-titulo").textContent = "Añadir producto";
    $("prod-mensaje").textContent = "Producto guardado.";

    setTimeout(() => { $("prod-mensaje").textContent = ""; }, 2000);
  };

  $("admin-reset-inventario").onclick = async () => {
    if (!confirm("¿Restaurar el inventario desde productos.json? Los cambios locales se perderán."))
      return;
    localStorage.removeItem("tecnotienda_inventario");
    await cargarInventario();
    renderInventario();
    renderStats();
    renderStockBajo();
  };

  // ===== Mensajes =====
  function renderMensajes() {
    const zona = $("admin-mensajes");
    if (!zona) return;

    const items = leerJSON("tecnotienda_mensajes", []);
    if (!items.length) {
      zona.textContent = "No hay mensajes.";
      return;
    }

    const lista = document.createElement("div");
    lista.className = "lista";

    items.forEach((m, idx) => {
      const art = document.createElement("article");
      art.className = "comentario";

      const h = document.createElement("h3");
      h.textContent = `${m.nombre} · ${m.correo}`;

      const s = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = m.asunto;
      s.append(strong);

      const p = document.createElement("p");
      p.textContent = m.mensaje;

      const del = document.createElement("button");
      del.className = "boton peligro";
      del.textContent = "Eliminar";
      del.style.marginTop = ".5rem";
      del.onclick = () => {
        if (!confirm("¿Eliminar este mensaje?")) return;
        const rest = leerJSON("tecnotienda_mensajes", []);
        rest.splice(idx, 1);
        guardarJSON("tecnotienda_mensajes", rest);
        renderMensajes();
        renderStats();
      };

      art.append(h, s, p, del);
      lista.append(art);
    });
    zona.replaceChildren(lista);
  }

  $("admin-borrar-mensajes").onclick = () => {
    if (!confirm("¿Borrar TODOS los mensajes?")) return;
    localStorage.removeItem("tecnotienda_mensajes");
    renderMensajes();
    renderStats();
  };

  // ===== Cliente =====
  function renderCliente() {
    const zona = $("admin-cliente");
    if (!zona) return;

    const u = leerJSON("tecnotienda_usuario", null);
    if (!u) {
      zona.textContent = "Ningún cliente registrado.";
      return;
    }

    const div = document.createElement("div");
    div.className = "admin-fila";

    const info = document.createElement("div");
    const h = document.createElement("strong");
    h.textContent = u.nombre;
    const s = document.createElement("small");
    s.textContent = u.correo;
    info.append(h, s);

    const del = document.createElement("button");
    del.className = "boton peligro";
    del.textContent = "Eliminar cuenta";
    del.onclick = () => {
      if (!confirm("¿Eliminar los datos del cliente?")) return;
      localStorage.removeItem("tecnotienda_usuario");
      renderCliente();
    };

    div.append(info, del);
    zona.replaceChildren(div);
  }

  // ===== Cambio de contraseña =====
  $("form-cambiar-pass").onsubmit = (e) => {
    e.preventDefault();
    if ($("pass-actual").value !== getPass()) {
      $("pass-mensaje").textContent = "La contraseña actual es incorrecta.";
      return;
    }
    setPass($("pass-nueva").value);
    $("pass-mensaje").textContent = "Contraseña actualizada.";
    e.target.reset();
  };

  // ===== Importar JSON =====
  $("form-importar").onsubmit = (e) => {
    e.preventDefault();

    const file = $("import-file").files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        ["usuario", "pedidos", "comentarios", "mensajes", "carrito", "inventario"]
          .forEach((k) => {
            if (data[k] !== undefined) guardarJSON("tecnotienda_" + k, data[k]);
          });
        $("import-mensaje").textContent = "Datos importados correctamente.";
        cargarInventario().then(renderTodo);
      } catch {
        $("import-mensaje").textContent = "El archivo no es un JSON válido.";
      }
    };
    reader.readAsText(file);
  };

  // ===== Exportar =====
  $("admin-exportar").onclick = () => {
    const datos = {
      usuario:     leerJSON("tecnotienda_usuario", null),
      pedidos:     leerJSON("tecnotienda_pedidos", []),
      comentarios: leerJSON("tecnotienda_comentarios", []),
      mensajes:    leerJSON("tecnotienda_mensajes", []),
      carrito:     leerJSON("tecnotienda_carrito", []),
      inventario,
    };
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "tecnotienda-datos.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ===== Borrar pedidos =====
  $("admin-borrar-pedidos").onclick = () => {
    if (!confirm("¿Borrar TODOS los pedidos?")) return;
    localStorage.removeItem("tecnotienda_pedidos");
    renderPedidos();
    renderStats();
  };

  // ===== Borrar todo =====
  $("admin-borrar-todo").onclick = () => {
    if (!confirm("¿Borrar TODOS los datos? Esta acción es irreversible.")) return;
    ["usuario", "pedidos", "comentarios", "mensajes", "carrito", "inventario"]
      .forEach((k) => localStorage.removeItem("tecnotienda_" + k));
    sessionStorage.removeItem(CLAVE_SESION);
    location.reload();
  };
});