<script setup>
import { ref, onMounted } from "vue";
import api from "../services/api.js";

const emit = defineEmits(["movimiento-registrado"]);

const producto_id = ref("");
const tipo = ref("entrada");
const cantidad = ref(1);
const motivo = ref("compra");
const usuario = ref("");
const observacion = ref("");

const enviando = ref(false);
const error = ref(null);
const exito = ref(false);

const MOTIVOS = ["compra", "venta", "ajuste", "devolución"];

async function enviar() {
  enviando.value = true;
  error.value = null;
  exito.value = false;

  try {
    await api.registrarMovimiento({
      producto_id: producto_id.value,
      tipo: tipo.value,
      cantidad: Number(cantidad.value),
      motivo: motivo.value,
      usuario: usuario.value,
      observacion: observacion.value,
    });

    exito.value = true;
    // Reset del formulario tras éxito
    producto_id.value = "";
    cantidad.value = 1;
    observacion.value = "";

    // Avisa al padre para que recargue la lista de productos
    emit("movimiento-registrado");
  } catch (e) {
    error.value = e.message;
  } finally {
    enviando.value = false;
  }
}
const productos = ref([]);
onMounted(async () => {
  productos.value = await api.getProductos();
});
</script>

<template>
  <form @submit.prevent="enviar" class="flex flex-col gap-3 p-6 max-w-md">
    <h2 class="text-xl font-bold">Registrar movimiento</h2>

    <div v-if="error" class="alert alert-error">
      <span>{{ error }}</span>
    </div>
    <div v-if="exito" class="alert alert-success">
      <span>Movimiento registrado correctamente.</span>
    </div>

<label class="form-control">
  <span class="label-text">Producto</span>
  <select v-model="producto_id" required class="select select-bordered">
    <option value="" disabled>Selecciona un producto</option>
    <option v-for="p in productos.filter(p => p.activo)" :key="p.id" :value="p.id">
      {{ p.nombre }} (stock: {{ p.stock_actual }})
    </option>
  </select>
</label>

    <label class="form-control">
      <span class="label-text">Tipo</span>
      <select v-model="tipo" class="select select-bordered">
        <option value="entrada">Entrada</option>
        <option value="salida">Salida</option>
      </select>
    </label>

    <label class="form-control">
      <span class="label-text">Cantidad</span>
      <input
        v-model="cantidad"
        type="number"
        min="1"
        required
        class="input input-bordered"
      />
    </label>

    <label class="form-control">
      <span class="label-text">Motivo</span>
      <select v-model="motivo" class="select select-bordered">
        <option v-for="m in MOTIVOS" :key="m" :value="m">{{ m }}</option>
      </select>
    </label>

    <label class="form-control">
      <span class="label-text">Usuario (opcional)</span>
      <input v-model="usuario" type="text" class="input input-bordered" />
    </label>

    <label class="form-control">
      <span class="label-text">Observación (opcional)</span>
      <textarea v-model="observacion" class="textarea textarea-bordered"></textarea>
    </label>

    <button type="submit" class="btn btn-primary" :disabled="enviando">
      <span v-if="enviando" class="loading loading-spinner"></span>
      {{ enviando ? "Enviando..." : "Registrar" }}
    </button>
  </form>
</template>