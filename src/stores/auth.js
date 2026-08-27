// src/stores/auth.js
import { defineStore } from "pinia";
import api from "../services/api.js";
import { getToken, getUsername, limpiarSesion } from "../services/token.js";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: getToken(),
    username: getUsername() || "",
  }),

  getters: {
    autenticado: (state) => !!state.token,
  },

  actions: {
    async login(username, password) {
      const res = await api.login(username, password);
      this.token = res.token;
      this.username = res.username;
      return res;
    },

    async logout() {
      try {
        await api.logout();
      } catch (e) {
        // Si la sesión ya había expirado, el backend rechaza el logout con
        // "Sesión inválida" — no es un error real para el usuario, solo
        // significa que ya no había nada que cerrar en el servidor.
        // Igual limpiamos el estado local en el finally.
      } finally {
        this.limpiarLocal();
      }
    },

    // Limpia solo el estado local/reactivo. Se llama tanto desde logout()
    // como desde el listener de "sesion-expirada" en main.ts (cuando el
    // backend rechaza el token sin que el usuario haya pedido salir).
    limpiarLocal() {
      limpiarSesion();
      this.token = null;
      this.username = "";
    },
  },
});