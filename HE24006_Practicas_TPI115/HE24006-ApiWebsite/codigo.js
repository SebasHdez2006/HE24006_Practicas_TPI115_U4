"use strict";

const API_URL = "https://fakestoreapi.com/products";
const estudiante = Object.freeze({
  nombre: "David Sebastián Hernández Elías",
  carnet: "HE24006",
  asignatura: "Técnicas de Programación en Internet",
  guia: "61b",
});

let productos = [];
let direccionOrden = 0;
const elementos = {};

document.addEventListener("DOMContentLoaded", () => {
  Object.assign(elementos, {
    botonCarga: document.querySelector("#obtener-productos"),
    estado: document.querySelector("#estado"),
    controles: document.querySelector("#controles"),
    listado: document.querySelector("#listado"),
    cuerpoTabla: document.querySelector("#tbody"),
    botonOrden: document.querySelector("#ordenar-precio"),
    filtros: [...document.querySelectorAll('#controles input[type="checkbox"]')],
    visor: document.querySelector("#visor-imagen"),
    tituloVisor: document.querySelector("#titulo-visor"),
    imagenAmpliada: document.querySelector("#imagen-ampliada"),
    cerrarVisor: document.querySelector("#cerrar-visor"),
  });

  elementos.botonCarga.addEventListener("click", obtenerProductos);
  elementos.botonOrden.addEventListener("click", alternarOrden);
  elementos.filtros.forEach((filtro) => filtro.addEventListener("change", renderizarProductos));
  elementos.cerrarVisor.addEventListener("click", cerrarVisor);
  elementos.visor.addEventListener("click", (evento) => {
    if (evento.target === elementos.visor) cerrarVisor();
  });

  console.info("Práctica API REST", estudiante);
});

async function obtenerProductos() {
  elementos.botonCarga.disabled = true;
  elementos.botonCarga.textContent = "Cargando productos…";
  mostrarEstado("Consultando Fake Store API…");

  try {
    const respuesta = await fetch(API_URL, { headers: { Accept: "application/json" } });
    if (!respuesta.ok) throw new Error(`El servidor respondió con HTTP ${respuesta.status}.`);

    const datos = await respuesta.json();
    if (!Array.isArray(datos)) throw new Error("La respuesta recibida no contiene una lista de productos.");

    productos = datos;
    direccionOrden = 0;
    elementos.controles.hidden = false;
    elementos.listado.hidden = false;
    elementos.botonCarga.hidden = true;
    mostrarEstado(`${productos.length} productos cargados correctamente.`);
    renderizarProductos();
  } catch (error) {
    console.error(error);
    mostrarEstado("No fue posible obtener los productos. Revisa tu conexión a Internet e inténtalo nuevamente.", true);
    elementos.botonCarga.disabled = false;
    elementos.botonCarga.textContent = "Reintentar consulta";
  }
}

function alternarOrden() {
  direccionOrden = direccionOrden === 1 ? -1 : direccionOrden === -1 ? 0 : 1;
  renderizarProductos();
}

function productosVisibles() {
  const categoriasActivas = new Set(
    elementos.filtros.filter((filtro) => filtro.checked).map((filtro) => filtro.value),
  );
  const resultado = productos.filter((producto) => categoriasActivas.has(producto.category));
  if (direccionOrden !== 0) resultado.sort((a, b) => direccionOrden * (Number(a.price) - Number(b.price)));
  return resultado;
}

function renderizarProductos() {
  const visibles = productosVisibles();
  elementos.cuerpoTabla.replaceChildren();
  visibles.forEach((producto) => elementos.cuerpoTabla.append(crearFilaProducto(producto)));
  actualizarEtiquetaOrden();
  mostrarEstado(
    visibles.length === productos.length
      ? `${productos.length} productos visibles.`
      : `${visibles.length} de ${productos.length} productos visibles.`,
  );
}

function crearFilaProducto(producto) {
  const fila = document.createElement("tr");
  const imagen = document.createElement("img");
  imagen.className = "foto-producto";
  imagen.src = producto.image;
  imagen.alt = `Imagen de ${producto.title}`;
  imagen.loading = "lazy";

  const botonImagen = document.createElement("button");
  botonImagen.className = "boton-imagen";
  botonImagen.type = "button";
  botonImagen.title = "Ver imagen ampliada";
  botonImagen.append(imagen);
  botonImagen.addEventListener("click", () => abrirVisor(producto));

  const celdaImagen = document.createElement("td");
  celdaImagen.append(botonImagen);
  const celdaCategoria = document.createElement("td");
  const etiquetaCategoria = document.createElement("span");
  etiquetaCategoria.className = "categoria";
  etiquetaCategoria.textContent = producto.category;
  celdaCategoria.append(etiquetaCategoria);

  const celdaRating = document.createElement("td");
  const rating = document.createElement("span");
  rating.className = "rating";
  rating.textContent = `★ ${Number(producto.rating?.rate ?? 0).toFixed(1)}/5`;
  const cantidad = document.createElement("small");
  cantidad.textContent = `${producto.rating?.count ?? 0} valoraciones`;
  rating.append(cantidad);
  celdaRating.append(rating);

  const precio = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(producto.price);
  fila.append(
    crearCelda(producto.id),
    celdaImagen,
    crearCelda(producto.title),
    celdaCategoria,
    crearCelda(precio),
    celdaRating,
  );
  return fila;
}

function crearCelda(texto) {
  const celda = document.createElement("td");
  celda.textContent = texto;
  return celda;
}

function actualizarEtiquetaOrden() {
  const texto = direccionOrden === 1 ? "Precio ↑" : direccionOrden === -1 ? "Precio ↓" : "Precio ↕";
  elementos.botonOrden.textContent = texto;
  elementos.botonOrden.setAttribute(
    "aria-label",
    direccionOrden === 1
      ? "Orden actual ascendente. Haz clic para ordenar de forma descendente"
      : direccionOrden === -1
        ? "Orden actual descendente. Haz clic para quitar el orden"
        : "Ordenar por precio de forma ascendente",
  );
}

function abrirVisor(producto) {
  elementos.tituloVisor.textContent = producto.title;
  elementos.imagenAmpliada.src = producto.image;
  elementos.imagenAmpliada.alt = `Imagen ampliada de ${producto.title}`;
  if (typeof elementos.visor.showModal === "function") elementos.visor.showModal();
  else window.open(producto.image, "_blank", "noopener");
}

function cerrarVisor() {
  if (elementos.visor.open) elementos.visor.close();
}

function mostrarEstado(mensaje, esError = false) {
  elementos.estado.textContent = mensaje;
  elementos.estado.classList.toggle("error", esError);
}
