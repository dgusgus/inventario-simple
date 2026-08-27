// src/services/api.js
import { limpiarSesion, guardarSesion, getToken } from "./token.js";

const API_URL = "https://script.google.com/macros/s/AKfycbw0I6cJqNlIVbwMsRjNSDF1ecWbUIMzG7FXxuPwxm1wKSK-L0HYiBqhCH-Ttzd6JN9csQ/exec";

// Wrapper central para peticiones autenticadas: detecta sesión inválida en un solo lugar
async function postAutenticado(body) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ ...body, token: getToken() }),
  });
  const json = await res.json();

  if (json.error && json.error.includes("Sesión inválida")) {
    limpiarSesion();
    // Evento global: el store de Pinia (stores/auth.js) escucha esto en main.ts
    // para actualizar su estado reactivo, ya que api.js no depende de Vue/Pinia.
    window.dispatchEvent(new Event("sesion-expirada"));
    throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
  }
  if (json.error) throw new Error(json.error);
  return json;
}

async function login(username, password) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ accion: "login", username, password }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  guardarSesion(json.token, json.username);
  return json;
}

async function logout() {
  try {
    await postAutenticado({ accion: "logout" });
  } finally {
    limpiarSesion();
  }
}

async function getProductos() {
  const res = await fetch(`${API_URL}?tipo=productos`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

async function getMovimientos() {
  const res = await fetch(`${API_URL}?tipo=movimientos`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

async function registrarMovimiento(movimiento) {
  return postAutenticado({ accion: "registrar_movimiento", ...movimiento });
}
async function crearProducto(producto) {
  return postAutenticado({ accion: "crear_producto", ...producto });
}
async function editarProducto(producto_id, cambios) {
  return postAutenticado({ accion: "editar_producto", producto_id, ...cambios });
}
async function desactivarProducto(producto_id) {
  return postAutenticado({ accion: "desactivar_producto", producto_id });
}
async function activarProducto(producto_id) {
  return postAutenticado({ accion: "activar_producto", producto_id });
}
async function crearUsuario(username, password) {
  return postAutenticado({ accion: "crear_usuario", username, password });
}

export default {
  getProductos, getMovimientos, registrarMovimiento,
  crearProducto, editarProducto, desactivarProducto, activarProducto,
  login, logout, crearUsuario,
};