import { defineStore } from "pinia";
import { ref, computed } from "vue";
import apiGimnasio from "../services/api-gimnasio";

// Token y usuario propios, guardados con otra key para no chocar con el
// login de Apps Script (inventario).
const TOKEN_KEY = "gimnasio_token";
const USUARIO_KEY = "gimnasio_usuario";

export const useGimnasioAuthStore = defineStore("gimnasioAuth", () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || null);
  const usuario = ref(JSON.parse(localStorage.getItem(USUARIO_KEY) || "null"));

  const estaAutenticado = computed(() => !!token.value);
  const rol = computed(() => usuario.value?.rol ?? null);

  async function login(email, password) {
    const { data } = await apiGimnasio.post("/auth/login", {
      email,
      password,
    });
    token.value = data.token;
    usuario.value = data.usuario;
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(data.usuario));
  }

  function logout() {
    token.value = null;
    usuario.value = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
  }

  return { token, usuario, estaAutenticado, rol, login, logout };
});
