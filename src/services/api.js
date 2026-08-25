// src/services/api.js

const API_URL = "https://script.google.com/macros/s/AKfycbw0I6cJqNlIVbwMsRjNSDF1ecWbUIMzG7FXxuPwxm1wKSK-L0HYiBqhCH-Ttzd6JN9csQ/exec";

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
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ accion: "registrar_movimiento", ...movimiento }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
}

async function crearProducto(producto) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ accion: "crear_producto", ...producto }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
}

async function editarProducto(producto_id, cambios) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ accion: "editar_producto", producto_id, ...cambios }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
}

async function desactivarProducto(producto_id) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ accion: "desactivar_producto", producto_id }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
}

async function activarProducto(producto_id) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ accion: "activar_producto", producto_id }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
}

export default {
  getProductos, getMovimientos, registrarMovimiento,
  crearProducto, editarProducto, desactivarProducto,
  activarProducto, // nuevo
};