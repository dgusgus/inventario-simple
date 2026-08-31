import { defineStore } from "pinia";
import { ref, computed } from "vue";
import apiGimnasio from "../services/api-gimnasio";

// Token propio, guardado con otra key para no chocar con el
// token del login de Apps Script (inventario).
const STORAGE_KEY = "gimnasio_token";

export const useGimnasioAuthStore = defineStore("gimnasioAuth", () => {
  const token = ref(localStorage.getItem(STORAGE_KEY) || null);
  const usuario = ref(null);

  const estaAutenticado = computed(() => !!token.value);
  const rol = computed(() => usuario.value?.rol ?? null);

  async function login(email, password) {
    const { data } = await apiGimnasio.post("/auth/login", {
      email,
      password,
    });
    token.value = data.token;
    usuario.value = data.usuario;
    localStorage.setItem(STORAGE_KEY, data.token);
  }

  function logout() {
    token.value = null;
    usuario.value = null;
    localStorage.removeItem(STORAGE_KEY);
  }

  return { token, usuario, estaAutenticado, rol, login, logout };
});