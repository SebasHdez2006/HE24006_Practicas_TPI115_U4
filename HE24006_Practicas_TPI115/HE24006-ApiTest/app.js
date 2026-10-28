"use strict";

const PUBLIC_ENDPOINTS = {
  randomUser: "https://randomuser.me/api/",
  publicIp: "https://api.ipify.org/?format=json",
  bitcoin: "https://api.coinlore.net/api/ticker/?id=90",
};

const EMPLOYEES_ENDPOINT = "https://retoolapi.dev/JevzJv/empleados";

const elements = {
  status: document.querySelector("#request-status"),
  console: document.querySelector("#visual-console"),
  randomUserResult: document.querySelector("#random-user-result"),
  publicIpResult: document.querySelector("#public-ip-result"),
  bitcoinResult: document.querySelector("#bitcoin-result"),
  employeeId: document.querySelector("#employee-id"),
  employeeForm: document.querySelector("#employee-form"),
  employeesBody: document.querySelector("#employees-table-body"),
};

function now() {
  return new Intl.DateTimeFormat("es-SV", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
}

function setStatus(message, isError = false) {
  elements.status.textContent = message;
  elements.status.style.color = isError ? "#ffb4ab" : "";
}

function writeLog(label, details) {
  const entry = `[${now()}] ${label}\n${details}`;
  elements.console.textContent = `${entry}\n\n${elements.console.textContent}`.trimEnd();
}

function pretty(value) {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function setButtonBusy(button, busy) {
  if (!button) return;
  if (busy) {
    button.dataset.label = button.textContent;
    button.textContent = "Consultando…";
    button.disabled = true;
  } else {
    button.textContent = button.dataset.label || button.textContent;
    button.disabled = false;
  }
}

async function fetchData(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const rawData = await response.text();
  const data = contentType.includes("application/json") && rawData.trim()
    ? JSON.parse(rawData)
    : rawData;

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status} ${response.statusText}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return { response, data };
}

function clearNode(node) {
  node.replaceChildren();
}

function addText(parent, tag, text, className = "") {
  const child = document.createElement(tag);
  child.textContent = text;
  if (className) child.className = className;
  parent.append(child);
  return child;
}

function renderRandomUser(user) {
  clearNode(elements.randomUserResult);
  const wrapper = document.createElement("div");
  wrapper.className = "user-result";

  const image = document.createElement("img");
  image.src = user.picture.medium;
  image.alt = `Fotografía de ${user.name.first} ${user.name.last}`;
  wrapper.append(image);

  const text = document.createElement("div");
  addText(text, "strong", `${user.name.first} ${user.name.last}`);
  addText(text, "span", user.email);
  wrapper.append(text);
  elements.randomUserResult.append(wrapper);
}

function renderMetric(target, label, value) {
  clearNode(target);
  const wrapper = document.createElement("div");
  wrapper.className = "metric-result";
  addText(wrapper, "strong", label);
  addText(wrapper, "p", value, "metric");
  target.append(wrapper);
}

function renderEmployees(records) {
  const employees = Array.isArray(records) ? records : [records];
  clearNode(elements.employeesBody);

  if (!employees.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "placeholder";
    cell.textContent = "La API no devolvió empleados para esta consulta.";
    row.append(cell);
    elements.employeesBody.append(row);
    return;
  }

  employees.forEach((employee) => {
    const row = document.createElement("tr");
    ["id", "name", "email", "company", "jobtitle"].forEach((property) => {
      const cell = document.createElement("td");
      cell.textContent = employee[property] ?? "—";
      row.append(cell);
    });
    elements.employeesBody.append(row);
  });
}

function getEmployeeId() {
  const id = elements.employeeId.value.trim();
  if (!id) {
    throw new Error("Escriba el ID del empleado antes de realizar esta operación.");
  }
  return encodeURIComponent(id);
}

function getEmployeePayload({ partial = false } = {}) {
  const formData = new FormData(elements.employeeForm);
  const payload = {};
  ["name", "email", "company", "jobtitle"].forEach((field) => {
    const value = String(formData.get(field) || "").trim();
    if (value || !partial) payload[field] = value;
  });

  if (partial && Object.keys(payload).length === 0) {
    throw new Error("Para PATCH escriba al menos un dato que desea actualizar.");
  }
  if (!partial && Object.values(payload).some((value) => !value)) {
    throw new Error("Complete nombre, correo, empresa y cargo antes de enviar esta operación.");
  }
  return payload;
}

function confirmMutation(action, id = "") {
  const target = id ? ` para el empleado con ID ${id}` : "";
  return window.confirm(`Confirmar ${action}${target}. Esta acción enviará una petición de escritura a la API de práctica.`);
}

async function runPublicExercise(action, button) {
  const labels = {
    "random-user": "GET Random User",
    "public-ip": "GET IPify",
    bitcoin: "GET Coinlore",
  };

  setButtonBusy(button, true);
  setStatus(`Ejecutando ${labels[action]}…`);
  try {
    let endpoint;
    let renderer;

    if (action === "random-user") {
      endpoint = PUBLIC_ENDPOINTS.randomUser;
      renderer = (data) => renderRandomUser(data.results[0]);
    } else if (action === "public-ip") {
      endpoint = PUBLIC_ENDPOINTS.publicIp;
      renderer = (data) => renderMetric(elements.publicIpResult, "IP pública", data.ip);
    } else {
      endpoint = PUBLIC_ENDPOINTS.bitcoin;
      renderer = (data) => {
        const bitcoin = data[0];
        renderMetric(elements.bitcoinResult, "Bitcoin (USD)", `$${bitcoin.price_usd}`);
      };
    }

    const { response, data } = await fetchData(endpoint);
    renderer(data);
    setStatus(`${labels[action]} finalizado correctamente: HTTP ${response.status}.`);
    writeLog(`${labels[action]} · HTTP ${response.status}`, pretty(data));
  } catch (error) {
    setStatus(`No fue posible completar ${labels[action]}: ${error.message}`, true);
    writeLog(`${labels[action]} · error`, `${error.message}\n${pretty(error.data || "")}`);
  } finally {
    setButtonBusy(button, false);
  }
}

async function listEmployees(button) {
  setButtonBusy(button, true);
  setStatus("Consultando la lista de empleados…");
  try {
    const { response, data } = await fetchData(EMPLOYEES_ENDPOINT);
    renderEmployees(data);
    setStatus(`Lista recibida correctamente: ${data.length} empleado(s), HTTP ${response.status}.`);
    writeLog(`GET empleados · HTTP ${response.status}`, pretty(data));
  } catch (error) {
    setStatus(`No fue posible listar empleados: ${error.message}`, true);
    writeLog("GET empleados · error", `${error.message}\n${pretty(error.data || "")}`);
  } finally {
    setButtonBusy(button, false);
  }
}

async function findEmployee(button) {
  setButtonBusy(button, true);
  try {
    const id = getEmployeeId();
    setStatus(`Consultando el empleado ${id}…`);
    const { response, data } = await fetchData(`${EMPLOYEES_ENDPOINT}/${id}`);
    renderEmployees(data);
    setStatus(`Empleado ${id} recibido correctamente: HTTP ${response.status}.`);
    writeLog(`GET empleado ${id} · HTTP ${response.status}`, pretty(data));
  } catch (error) {
    setStatus(`No fue posible consultar el empleado: ${error.message}`, true);
    writeLog("GET empleado · error", `${error.message}\n${pretty(error.data || "")}`);
  } finally {
    setButtonBusy(button, false);
  }
}

async function runMutation(action, button) {
  const config = {
    create: { method: "POST", label: "crear un empleado", requiresId: false, partial: false },
    replace: { method: "PUT", label: "reemplazar un empleado", requiresId: true, partial: false },
    update: { method: "PATCH", label: "actualizar parcialmente un empleado", requiresId: true, partial: true },
    delete: { method: "DELETE", label: "eliminar un empleado", requiresId: true, partial: true },
  }[action];

  setButtonBusy(button, true);
  try {
    const id = config.requiresId ? getEmployeeId() : "";
    if (!confirmMutation(config.label, id)) {
      setStatus("La operación de escritura fue cancelada por el usuario.");
      return;
    }

    const options = { method: config.method };
    if (action !== "delete") {
      const payload = getEmployeePayload({ partial: config.partial });
      options.headers = { "Content-Type": "application/json; charset=UTF-8" };
      options.body = JSON.stringify(payload);
    }

    setStatus(`Enviando ${config.method} a la API de práctica…`);
    const url = id ? `${EMPLOYEES_ENDPOINT}/${id}` : EMPLOYEES_ENDPOINT;
    const { response, data } = await fetchData(url, options);
    if (data && typeof data === "object" && data.id != null) {
      elements.employeeId.value = data.id;
    }
    if (data && typeof data === "object" && Object.keys(data).length) renderEmployees(data);
    setStatus(`${config.method} completado: HTTP ${response.status}. Revise el resultado en la consola visual.`);
    writeLog(`${config.method} ${url} · HTTP ${response.status}`, pretty(data));
  } catch (error) {
    setStatus(`No fue posible completar la operación: ${error.message}`, true);
    writeLog(`${config.method} empleados · error`, `${error.message}\n${pretty(error.data || "")}`);
  } finally {
    setButtonBusy(button, false);
  }
}

document.querySelectorAll("[data-public-action]").forEach((button) => {
  button.addEventListener("click", () => runPublicExercise(button.dataset.publicAction, button));
});

document.querySelector("#load-employees").addEventListener("click", (event) => listEmployees(event.currentTarget));
document.querySelector("#load-employee").addEventListener("click", (event) => findEmployee(event.currentTarget));

document.querySelectorAll("[data-crud-action]").forEach((button) => {
  button.addEventListener("click", () => runMutation(button.dataset.crudAction, button));
});

document.querySelector("#clear-console").addEventListener("click", () => {
  elements.console.textContent = "[Limpieza] Consola visual reiniciada.";
  setStatus("Consola visual limpia. No se realizaron peticiones durante esta acción.");
});
