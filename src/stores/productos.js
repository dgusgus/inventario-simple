// src/stores/productos.js
import { defineStore } from "pinia";
import api from "../services/api.js";

export const useProductosStore = defineStore("productos", {
  state: () => ({
    lista: [],
    cargando: false,
    cargado: false, // ya se cargó al menos una vez: evita refetch al cambiar de vista
    error: null,
  }),

  getters: {
    activos: (state) => state.lista.filter((p) => p.activo),
    porId: (state) => (id) => state.lista.find((p) => String(p.id) === String(id)),
  },

  actions: {
    async cargar({ forzar = false } = {}) {
      if (this.cargado && !forzar) return; // ya está en memoria, no repetimos la llamada a Sheets
      this.cargando = true;
      this.error = null;
      try {
        this.lista = await api.getProductos();
        this.cargado = true;
      } catch (e) {
        this.error = e.message;
      } finally {
        this.cargando = false;
      }
    },

    async crear(datos) {
      const res = await api.crearProducto(datos);
      await this.cargar({ forzar: true });
      return res;
    },

    async editar(id, cambios) {
      const res = await api.editarProducto(id, cambios);
      await this.cargar({ forzar: true });
      return res;
    },

    async desactivar(id) {
      await api.desactivarProducto(id);
      const p = this.porId(id);
      if (p) p.activo = false; // actualización local inmediata, sin esperar un refetch completo
    },

    async activar(id) {
      await api.activarProducto(id);
      const p = this.porId(id);
      if (p) p.activo = true;
    },

    // Ajusta el stock en memoria tras un movimiento (lo llama stores/movimientos.js),
    // así el Dashboard y la lista de Productos se actualizan solos sin ir de nuevo a Sheets.
    aplicarMovimientoLocal(producto_id, delta) {
      const p = this.porId(producto_id);
      if (p) p.stock_actual = Number(p.stock_actual) + delta;
    },
  },
});