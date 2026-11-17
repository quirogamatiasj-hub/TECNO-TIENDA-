
// ===== UTILIDADES =====
const $ = (id) => document.getElementById(id);

const leer = (clave, defecto) =>
  JSON.parse(localStorage.getItem(clave) || defecto);


// ===== REGISTRO =====
if ($("form-registro")) {
  $("form-registro").addEventListener("submit", (e) => {
    e.preventDefault();

    // Solo se guarda nombre y correo
    const usuario = {
      nombre: $("reg-nombre").value,
      correo: $("reg-correo").value
    };

    localStorage.setItem("usuario", JSON.stringify(usuario));

    $("reg-mensaje").textContent =
      "Bienvenido, " + usuario.nombre + ". Cuenta creada.";

    e.target.reset();
  });
}


// ===== COMENTARIOS =====
if ($("form-comentario")) {

  const base = [
    {
      nombre: "Laura",
      estrellas: 5,
      texto: "Mi laptop gamer llegó rápido y funciona perfecto."
    },
    {
      nombre: "Carlos",
      estrellas: 4,
      texto: "Buen precio en la GPU. Recomendado."
    }
  ];

  const mostrar = () => {
    const lista = $("lista-comentarios");
    lista.innerHTML = "";

    const todos = base.concat(leer("comentarios", "[]"));

    todos.forEach((c) => {
      const caja = document.createElement("div");
      caja.className = "comentario";

      const t = document.createElement("h4");
      t.textContent = c.nombre + " " + "★".repeat(c.estrellas);

      const p = document.createElement("p");
      p.textContent = c.texto;

      caja.append(t, p);
      lista.append(caja);
    });
  };

  $("form-comentario").addEventListener("submit", (e) => {
    e.preventDefault();

    const nuevos = leer("comentarios", "[]");

    nuevos.push({
      nombre: $("com-nombre").value,
      estrellas: Number($("com-estrellas").value),
      texto: $("com-texto").value
    });

    localStorage.setItem("comentarios", JSON.stringify(nuevos));

    e.target.reset();
    mostrar();
  });

  mostrar();
}


// ===== GENERAR RECIBO =====
function generarRecibo(producto, precio, metodo) {

  const numero = Math.floor(Math.random() * 90000) + 10000;
  const fecha = new Date().toLocaleString();

  const usuario = leer("usuario", "{}");

  const nombre = usuario.nombre || "Cliente";

  $("pago-mensaje").innerHTML = `
    <div class="recibo">

      <h2>ASTRA</h2>
      <h3>RECIBO DE COMPRA</h3>

      <hr>

      <p><b>Número:</b> ${numero}</p>
      <p><b>Cliente:</b> ${nombre}</p>
      <p><b>Fecha:</b> ${fecha}</p>

      <hr>

      <p><b>Producto:</b> ${producto}</p>
      <p><b>Precio:</b> ${precio}</p>
      <p><b>Método:</b> ${metodo}</p>

      <hr>

      <h3>ESTADO: PAGADO</h3>

      <p>¡Gracias por comprar en ASTRA!</p>

      <button onclick="window.print()">
        Imprimir recibo
      </button>

    </div>
  `;
}


// ===== PAGO =====
if ($("form-tarjeta")) {

  const datos = new URLSearchParams(location.search);

  // Cargar producto y precio
  if (datos.get("producto")) {
    $("pago-producto").textContent = datos.get("producto");
    $("pago-precio").textContent = datos.get("precio");
  }


  // CAMBIAR ENTRE QR Y TARJETA
  document.querySelectorAll("[data-tab]").forEach((b) => {

    b.addEventListener("click", () => {

      document.querySelectorAll("[data-tab]").forEach((x) =>
        x.classList.toggle("activa", x === b)
      );

      $("tab-qr").hidden = b.dataset.tab !== "qr";
      $("tab-tarjeta").hidden = b.dataset.tab !== "tarjeta";

    });

  });


  // FORMATO DEL NÚMERO DE TARJETA
  $("tar-numero").addEventListener("input", (e) => {

    e.target.value = e.target.value
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();

  });


  // FORMATO DE VENCIMIENTO
  $("tar-vence").addEventListener("input", (e) => {

    const n = e.target.value
      .replace(/\D/g, "")
      .slice(0, 4);

    e.target.value = n.length > 2
      ? n.slice(0, 2) + "/" + n.slice(2)
      : n;

  });


  // PAGO CON TARJETA
  $("form-tarjeta").addEventListener("submit", (e) => {

    e.preventDefault();

    if ($("tar-numero").value.replace(/\s/g, "").length < 16) {

      $("pago-mensaje").textContent =
        "El número de tarjeta debe tener 16 dígitos.";

      return;
    }

    generarRecibo(
      $("pago-producto").textContent,
      $("pago-precio").textContent,
      "Tarjeta"
    );

    e.target.reset();

  });


  // PAGO CON QR
  const botonQR = $("btn-pago-qr");

  if (botonQR) {

    botonQR.addEventListener("click", () => {

      generarRecibo(
        $("pago-producto").textContent,
        $("pago-precio").textContent,
        "QR"
      );

    });

  }

}
