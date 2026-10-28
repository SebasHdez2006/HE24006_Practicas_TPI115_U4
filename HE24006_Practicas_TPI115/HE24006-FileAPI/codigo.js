"use strict";

const archivoInput = document.querySelector("#archivo");
const metadatos = document.querySelector("#metadatos");
const vistaPrevia = document.querySelector("#vistaPrevia");
const estado = document.querySelector("#estado");
const mensaje = document.querySelector("#mensaje");

archivoInput.addEventListener("change", manejarArchivoSeleccionado);
document.querySelectorAll("[data-download]").forEach((boton) => {
  boton.addEventListener("click", () => generarDescarga(boton.dataset.download));
});

function manejarArchivoSeleccionado() {
  const [archivo] = archivoInput.files;
  if (!archivo) {
    return;
  }

  mostrarMetadatos(archivo);
  vistaPrevia.replaceChildren();
  actualizarEstado(`Leyendo “${archivo.name}”…`);

  if (archivo.type.startsWith("image/")) {
    leerImagen(archivo);
    return;
  }

  if (esArchivoDeTexto(archivo)) {
    leerTexto(archivo);
    return;
  }

  actualizarEstado("Este tipo de archivo no puede mostrarse como texto o imagen.", true);
  mostrarMensajePrevisualizacion("Seleccione un archivo TXT, CSV, JSON, XML o una imagen para obtener una vista previa.");
}

function mostrarMetadatos(archivo) {
  const valores = [
    archivo.name,
    archivo.type || "Tipo MIME no informado",
    formatearTamano(archivo.size),
    new Intl.DateTimeFormat("es-SV", { dateStyle: "medium", timeStyle: "short" }).format(archivo.lastModified),
  ];

  metadatos.querySelectorAll("dd").forEach((elemento, indice) => {
    elemento.textContent = valores[indice];
  });
}

function esArchivoDeTexto(archivo) {
  const extension = archivo.name.split(".").pop().toLowerCase();
  return archivo.type.startsWith("text/") || ["txt", "csv", "json", "xml"].includes(extension);
}

function leerTexto(archivo) {
  const lector = new FileReader();
  lector.onerror = () => {
    actualizarEstado("No fue posible leer el archivo seleccionado.", true);
    mostrarMensajePrevisualizacion("El navegador informó un error durante la lectura.");
  };
  lector.onload = () => {
    const contenido = String(lector.result);
    const extension = archivo.name.split(".").pop().toLowerCase();
    let salida = contenido;

    if (extension === "json" || archivo.type === "application/json") {
      salida = formatearJson(contenido);
    } else if (extension === "xml" || /xml/.test(archivo.type)) {
      salida = formatearXml(contenido);
    }

    const pre = document.createElement("pre");
    pre.textContent = salida;
    vistaPrevia.replaceChildren(pre);
    actualizarEstado(`Lectura terminada: ${archivo.name}.`, false, true);
  };
  lector.readAsText(archivo, "UTF-8");
}

function leerImagen(archivo) {
  const lector = new FileReader();
  lector.onerror = () => {
    actualizarEstado("No fue posible cargar la imagen seleccionada.", true);
    mostrarMensajePrevisualizacion("El navegador informó un error durante la lectura de la imagen.");
  };
  lector.onload = () => {
    const imagen = document.createElement("img");
    imagen.src = String(lector.result);
    imagen.alt = `Vista previa de ${archivo.name}`;
    const pie = document.createElement("p");
    pie.className = "image-caption";
    pie.textContent = archivo.name;
    vistaPrevia.replaceChildren(imagen, pie);
    actualizarEstado(`Vista previa de imagen disponible: ${archivo.name}.`, false, true);
  };
  lector.readAsDataURL(archivo);
}

function formatearJson(contenido) {
  try {
    return JSON.stringify(JSON.parse(contenido), null, 2);
  } catch {
    actualizarEstado("El archivo se leyó, pero no contiene JSON válido. Se muestra el texto original.", true);
    return contenido;
  }
}

function formatearXml(contenido) {
  const documento = new DOMParser().parseFromString(contenido, "application/xml");
  if (documento.querySelector("parsererror")) {
    actualizarEstado("El archivo se leyó, pero no contiene XML válido. Se muestra el texto original.", true);
    return contenido;
  }
  return new XMLSerializer().serializeToString(documento);
}

function mostrarMensajePrevisualizacion(texto) {
  const parrafo = document.createElement("p");
  parrafo.textContent = texto;
  vistaPrevia.replaceChildren(parrafo);
}

function actualizarEstado(texto, esError = false, exitoso = false) {
  estado.textContent = texto;
  estado.className = `status${esError ? " error" : exitoso ? " success" : ""}`;
}

function formatearTamano(bytes) {
  if (bytes === 0) return "0 B";
  const unidades = ["B", "KB", "MB", "GB"];
  const indice = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), unidades.length - 1);
  return `${(bytes / 1024 ** indice).toFixed(indice ? 2 : 0)} ${unidades[indice]}`;
}

function generarDescarga(formato) {
  const fecha = new Date().toISOString();
  const contenidos = {
    txt: {
      tipo: "text/plain;charset=utf-8",
      nombre: "practica-file-api-HE24006.txt",
      datos: mensaje.value.trim() || "Práctica de File API - HE24006",
    },
    json: {
      tipo: "application/json;charset=utf-8",
      nombre: "practica-file-api-HE24006.json",
      datos: JSON.stringify({
        guia: "44d - File API, FileReader y Blob",
        estudiante: "David Sebastián Hernández Elías",
        carnet: "HE24006",
        asignatura: "Técnicas de Programación en Internet",
        generadoEn: fecha,
      }, null, 2),
    },
    csv: {
      tipo: "text/csv;charset=utf-8",
      nombre: "archivos-procesables-HE24006.csv",
      datos: [
        ["Formato", "Tipo MIME", "Método de lectura"],
        ["TXT", "text/plain", "FileReader.readAsText"],
        ["JSON", "application/json", "FileReader.readAsText + JSON.parse"],
        ["XML", "application/xml", "FileReader.readAsText + DOMParser"],
        ["Imagen", "image/*", "FileReader.readAsDataURL"],
      ].map((fila) => fila.map(escaparCsv).join(",")).join("\r\n"),
    },
  };

  const descarga = contenidos[formato];
  const blob = new Blob([descarga.datos], { type: descarga.tipo });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = descarga.nombre;
  enlace.hidden = true;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  actualizarEstado(`Se generó la descarga “${descarga.nombre}”.`, false, true);
}

function escaparCsv(valor) {
  return `"${String(valor).replaceAll('"', '""')}"`;
}
