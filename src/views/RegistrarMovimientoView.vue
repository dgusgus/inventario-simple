<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useProductosStore } from "../stores/productos.js";
import { useMovimientosStore } from "../stores/movimientos.js";

const router = useRouter();
const productosStore = useProductosStore();
const movimientosStore = useMovimientosStore();

const producto_id = ref("");
const tipo = ref("entrada");
const cantidad = ref(1);
const motivo = ref("compra");
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
    // Nota: ya no mandamos "usuario" — el backend siempre lo sobreescribe
    // con el usuario de la sesión (body.usuario = username en doPost),
    // así que el campo de texto libre que había antes no servía para nada.
    await movimientosStore.registrar({
      producto_id: producto_id.value,
      tipo: tipo.value,
      cantidad: Number(cantidad.value),
      motivo: motivo.value,
      observacion: observacion.value,
    });

    exito.value = true;
    producto_id.value = "";
    cantidad.value = 1;
    observacion.value = "";

    router.push({ name: "productos" });
  } catch (e) {
    error.value = e.message;
  } finally {
    enviando.value = false;
  }
}

onMounted(() => productosStore.cargar());
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
        <option v-for="p in productosStore.activos" :key="p.id" :value="p.id">
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
      <span class="label-text">Observación (opcional)</span>
      <textarea v-model="observacion" class="textarea textarea-bordered"></textarea>
    </label>

    <button type="submit" class="btn btn-primary" :disabled="enviando">
      <span v-if="enviando" class="loading loading-spinner"></span>
      {{ enviando ? "Enviando..." : "Registrar" }}
    </button>
  </form>
</template>