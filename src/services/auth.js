// src/services/auth.js
import { ref } from "vue";

export const sesionActiva = ref(!!localStorage.getItem("token"));
export const usuarioActual = ref(localStorage.getItem("username") || "");

export function guardarSesion(token, username) {
  localStorage.setItem("token", token);
  localStorage.setItem("username", username);
  sesionActiva.value = true;
  usuarioActual.value = username;
}

export function limpiarSesion() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  sesionActiva.value = false;
  usuarioActual.value = "";
}

export function getToken() {
  return localStorage.getItem("token");
}