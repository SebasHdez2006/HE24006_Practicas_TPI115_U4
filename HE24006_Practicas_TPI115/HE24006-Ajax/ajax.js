function objetoAjax(met,url,procesador) {
this.url=url;
this.met=met;
this.xmlobj=crearObj();
this.procesador=procesador;
//alert(this.xmlobj.readyState);
this.ejecutar=ejecutar;
}

function crearObj() {
  // Obtener la instancia del objeto XMLHttpRequest
  if(window.XMLHttpRequest) {
    return new XMLHttpRequest();
  }
  else if(window.ActiveXObject) {
    return new ActiveXObject("Microsoft.XMLHTTP");
  }
}

function ejecutar() {
// Preparar la funcion de respuesta
this.xmlobj.onreadystatechange = this.procesador;

// Realizar peticion HTTP
this.xmlobj.open(this.met, this.url, true);
this.xmlobj.send(null);
//alert(this.xmlobj.readyState);
//this.xmlobj.onreadystatechange();
}
