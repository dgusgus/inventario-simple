// src/stores/movimientos.js
import { defineStore } from "pinia";
import api from "../services/api.js";
import { useProductosStore } from "./productos.js";

export const useMovimientosStore = defineStore("movimientos", {
  state: () => ({
    lista: [],
    cargando: false,
    cargado: false,
    error: null,
  }),

  actions: {
    async cargar({ forzar = false } = {}) {
      if (this.cargado && !forzar) return;
      this.cargando = true;
      this.error = null;
      try {
        this.lista = await api.getMovimientos();
        this.cargado = true;
      } catch (e) {
        this.error = e.message;
      } finally {
        this.cargando = false;
      }
    },

    async registrar(movimiento) {
      const res = await api.registrarMovimiento(movimiento);

      // En vez de recargar productos y movimientos completos desde Sheets,
      // actualizamos el estado en memoria: el Dashboard y la lista de
      // Productos reaccionan solos porque leen del mismo store.
      const productosStore = useProductosStore();
      const delta = movimiento.tipo === "entrada" ? movimiento.cantidad : -movimiento.cantidad;
      productosStore.aplicarMovimientoLocal(movimiento.producto_id, delta);

      this.lista.unshift({
        id: res.movimiento_id,
        ...movimiento,
        fecha: new Date().toISOString(),
      });

      return res;
    },
  },
});