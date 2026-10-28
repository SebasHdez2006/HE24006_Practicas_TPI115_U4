function objetoAjax(met,url,procesador) {
this.url=url;
this.curl="";//complemento de la url
this.met=met;
this.xmlobj=crearObj();
this.procesador=procesador;
this.ejecutar=ejecutar;
this.completar=completar;
}

function completar(n) {
//crear complemento de la url
this.curl='?valor='+n;

this.ejecutar();
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
this.xmlobj.open(this.met, this.url+this.curl, true);
this.xmlobj.send(null);
}
