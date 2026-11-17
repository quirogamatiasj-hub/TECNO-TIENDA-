

document.addEventListener("DOMContentLoaded", async () => {
  const zona       = $("resumen-pedido");
  const msgPago    = $("pago-mensaje");
  const btnConfirm = $("confirmar-pedido");
  const productos  = await obtenerProductos();

  if (!productos.length) {
    zona.textContent = "No se pudo cargar el catálogo. Usa Live Server.";
    return;
  }

  const carrito = obtenerCarrito();
  let total = 0;

  if (!carrito.length) {
    zona.textContent = "No hay productos en el carrito.";
    return;
  }

  // ===== Resumen =====
  const ul = document.createElement("ul");
  ul.className = "lista-resumen";
  carrito.forEach((x) => {
    const p = productos.find((y) => y.id === x.id);
    if (!p) return;
    total += p.precio * x.cantidad;
    const li = document.createElement("li");
    li.textContent = `${p.nombre} × ${x.cantidad} — ${formatoPrecio(p.precio * x.cantidad)}`;
    ul.append(li);
  });
  const hTotal = document.createElement("h2");
  hTotal.textContent = "Total: " + formatoPrecio(total);
  zona.replaceChildren(ul, hTotal);

  // ===== Pestañas =====
  let metodo = "QR bancario";
  const tabs = document.querySelectorAll("[data-metodo]");
  const paneles = {
    "panel-qr": $("panel-qr"),
    "panel-tarjeta": $("panel-tarjeta"),
  };

  tabs.forEach((b) => {
    b.onclick = () => {
      metodo = b.dataset.metodo;
      tabs.forEach((x) => {
        const activo = x === b;
        x.classList.toggle("activa", activo);
        x.classList.toggle("secundario", !activo);
        x.setAttribute("aria-selected", String(activo));
      });
      Object.values(paneles).forEach((p) => { if (p) p.hidden = true; });
      if (paneles[b.dataset.panel]) paneles[b.dataset.panel].hidden = false;

      $("metodo-seleccionado").textContent = "Método seleccionado: " + metodo;
      msgPago.textContent = "";
      $("qr-mensaje").textContent = "";

      if (metodo === "QR bancario") {
        btnConfirm.hidden = true;
        $("qr-verificar").hidden = false;
        iniciarRotacionQR();
      } else {
        btnConfirm.hidden = false;
        $("qr-verificar").hidden = true;
        detenerRotacionQR();
      }
    };
  });

  // ===== QR dinámico =====
  const QR_SEGUNDOS = 30;
  let qrToken = "";
  let qrCountdown = null;
  let qrSegundos = QR_SEGUNDOS;
  const qrBox      = $("qr-box");
  const qrProgress = $("qr-progress-bar");
  const qrTokenText = $("qr-token-text");

  function generarNuevoQR() {
    const ahora = Date.now();
    qrToken = "TT-" + ahora.toString(36).toUpperCase() + "-" +
              Math.random().toString(36).slice(2, 8).toUpperCase();

    const data = JSON.stringify({
      comercio: "TECNOTIENDA",
      token: qrToken,
      monto: Number(total.toFixed(2)),
      moneda: "USD",
      emitido: new Date(ahora).toISOString(),
      expira:  new Date(ahora + QR_SEGUNDOS * 1000).toISOString(),
    });

    qrBox.innerHTML = "";

    if (typeof QRCode === "function") {
      new QRCode(qrBox, {
        text: data,
        width: 240,
        height: 240,
        colorDark: "#0d0b1f",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H,
      });
    } else {
      qrBox.textContent = "No se pudo generar el QR.";
    }

    $("qr-total").textContent = formatoPrecio(total);
    if (qrTokenText) qrTokenText.textContent = qrToken;

    qrSegundos = QR_SEGUNDOS;
    actualizarTimer();
  }

  function actualizarTimer() {
    const timer = $("qr-timer");
    if (timer) {
      timer.textContent = `Válido por ${qrSegundos} s`;
      timer.classList.toggle("qr-por-vencer", qrSegundos <= 5);
    }
    if (qrProgress) {
      const pct = (qrSegundos / QR_SEGUNDOS) * 100;
      qrProgress.style.width = pct + "%";
      qrProgress.classList.toggle("qr-progress-low", qrSegundos <= 5);
    }
  }

  function iniciarRotacionQR() {
    detenerRotacionQR();
    generarNuevoQR();
    qrCountdown = setInterval(() => {
      qrSegundos--;
      if (qrSegundos <= 0) generarNuevoQR();
      else actualizarTimer();
    }, 1000);
  }

  function detenerRotacionQR() {
    if (qrCountdown) clearInterval(qrCountdown);
    qrCountdown = null;
  }

  const btnRefresh = $("qr-refresh");
  if (btnRefresh) btnRefresh.onclick = () => generarNuevoQR();
  iniciarRotacionQR();

  // ===== Verificar pago QR =====
  const btnQR = $("qr-verificar");
  if (btnQR) {
    btnQR.onclick = () => {
      const msgQR = $("qr-mensaje");
      msgQR.textContent = "Consultando con el banco...";
      btnQR.disabled = true;

      setTimeout(() => {
        crearPedido("QR bancario");
        detenerRotacionQR();
        btnQR.hidden = true;
        msgQR.textContent = "Pago verificado correctamente.";
      }, 2200);
    };
  }

  // ===== Formulario tarjeta =====
  const tarNombre = $("tar-nombre");
  const tarNumero = $("tar-numero");
  const tarVence  = $("tar-vence");
  const tarCvv    = $("tar-cvv");

  if (tarNumero) {
    tarNumero.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 16)
        .replace(/(.{4})/g, "$1 ").trim();
    });
  }

  if (tarVence) {
    tarVence.addEventListener("input", (e) => {
      const n = e.target.value.replace(/\D/g, "").slice(0, 4);
      e.target.value = n.length > 2 ? n.slice(0, 2) + "/" + n.slice(2) : n;
    });
  }

  if (tarCvv) {
    tarCvv.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
    });
  }

  function luhn(numero) {
    let sum = 0, alt = false;
    for (let i = numero.length - 1; i >= 0; i--) {
      let n = Number(numero[i]);
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
      alt = !alt;
    }
    return sum % 10 === 0;
  }

  function validarTarjeta() {
    const nombre = tarNombre.value.trim();
    const numero = tarNumero.value.replace(/\s/g, "");
    const vence  = tarVence.value;
    const cvv    = tarCvv.value;

    if (nombre.length < 3)             return "Escribe el nombre completo del titular.";
    if (numero.length !== 16)          return "El número de tarjeta debe tener 16 dígitos.";
    if (!luhn(numero))                 return "Número de tarjeta inválido.";
    if (!/^\d{2}\/\d{2}$/.test(vence)) return "Vencimiento en formato MM/AA.";

    const mm = Number(vence.slice(0, 2));
    const aa = Number(vence.slice(3, 5));
    if (mm < 1 || mm > 12)             return "Mes de vencimiento inválido.";

    const hoy = new Date();
    const exp = new Date(2000 + aa, mm, 0);
    if (exp < hoy)                     return "La tarjeta está vencida.";

    if (!/^\d{3,4}$/.test(cvv))        return "CVV inválido.";
    return null;
  }

  btnConfirm.onclick = () => {
    msgPago.textContent = "";
    const error = validarTarjeta();
    if (error) { msgPago.textContent = error; return; }
    crearPedido("Tarjeta de crédito");
  };

  // ===== Crear pedido + recibo =====
  function crearPedido(metodoUsado) {
    const pedidos = leerJSON("tecnotienda_pedidos", []);
    const u = leerJSON("tecnotienda_usuario", { nombre: "Cliente", correo: "—" });

    const numeroPedido = "TT-" + Date.now().toString().slice(-8);
    const ultimos4 = metodoUsado === "Tarjeta de crédito"
      ? tarNumero.value.replace(/\s/g, "").slice(-4)
      : null;

    const pedido = {
      numero: numeroPedido,
      fecha: new Date().toLocaleString("es-BO"),
      cliente: u.nombre,
      correo: u.correo,
      total,
      metodo: metodoUsado,
      estado: "PAGADO",
      items: carrito,
      tarjetaUltimos4: ultimos4,
      qrToken: metodoUsado === "QR bancario" ? qrToken : null,
    };

    pedidos.push(pedido);
    guardarJSON("tecnotienda_pedidos", pedidos);
    guardarCarrito([]);

    // Recibo
    const caja = document.createElement("div");
    caja.className = "recibo";

    const titulo = document.createElement("h2");
    titulo.textContent = "TECNOTIENDA · COMPROBANTE DE PAGO";

    const meta = document.createElement("p");
    meta.innerHTML =
      `<b>Pedido:</b> ${pedido.numero}<br>` +
      `<b>Cliente:</b> ${pedido.cliente}<br>` +
      `<b>Fecha:</b> ${pedido.fecha}`;

    const itemsUl = document.createElement("ul");
    itemsUl.className = "lista-resumen";
    pedido.items.forEach((x) => {
      const p = productos.find((y) => y.id === x.id);
      if (!p) return;
      const li = document.createElement("li");
      li.textContent = `${p.nombre} × ${x.cantidad} — ${formatoPrecio(p.precio * x.cantidad)}`;
      itemsUl.append(li);
    });

    const pTotal = document.createElement("p");
    pTotal.innerHTML = `<b>Total:</b> ${formatoPrecio(total)}`;

    const pMetodo = document.createElement("p");
    pMetodo.innerHTML = ultimos4
      ? `<b>Método:</b> ${metodoUsado} •••• ${ultimos4}`
      : `<b>Método:</b> ${metodoUsado}`;

    const pEstado = document.createElement("p");
    pEstado.className = "recibo-estado";
    pEstado.textContent = "PAGADO";

    const imprimir = document.createElement("button");
    imprimir.className = "boton";
    imprimir.textContent = "Imprimir comprobante";
    imprimir.onclick = () => window.print();

    caja.append(titulo, meta, itemsUl, pTotal, pMetodo, pEstado, imprimir);
    $("recibo-area").replaceChildren(caja);

    if (metodoUsado === "Tarjeta de crédito") {
      btnConfirm.disabled = true;
      [tarNombre, tarNumero, tarVence, tarCvv].forEach((i) => (i.disabled = true));
    }

    msgPago.textContent = "";
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }
});