// src/services/token.js
//
// Acceso al token de sesión, SIN reactividad de Vue.
// api.js depende de este archivo (no de Pinia) para poder usarse
// fuera de componentes/stores si hace falta, y para que la capa de
// red no dependa del framework de UI.
//
// El estado reactivo (para mostrar el usuario en pantalla, etc.)
// vive en stores/auth.js, que envuelve estas mismas funciones.

const TOKEN_KEY = "token";
const USERNAME_KEY = "username";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUsername() {
  return localStorage.getItem(USERNAME_KEY);
}

export function guardarSesion(token, username) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
}

export function limpiarSesion() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}