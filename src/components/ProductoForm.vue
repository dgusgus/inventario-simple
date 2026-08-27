<script setup>
import { ref, watch } from "vue";
import { useProductosStore } from "../stores/productos.js";

const props = defineProps({
  producto: { type: Object, default: null }, // null = modo crear, objeto = modo editar
});
const emit = defineEmits(["guardado", "cerrar"]);

const store = useProductosStore();
const esEdicion = ref(!!props.producto);

const form = ref({
  nombre: "",
  descripcion: "",
  codigo: "",
  unidad: "",
  stock_actual: 0,
  stock_minimo: 0,
  precio_compra: 0,
  precio_venta: 0,
});

// Si llega un producto (modo edición), precargamos el form
watch(
  () => props.producto,
  (p) => {
    if (p) {
      esEdicion.value = true;
      form.value = { ...form.value, ...p };
    }
  },
  { immediate: true }
);

const enviando = ref(false);
const error = ref(null);

async function guardar() {
  enviando.value = true;
  error.value = null;
  try {
    if (esEdicion.value) {
      // No mandamos stock_actual: ese campo no es editable, como definimos en el backend
      const { stock_actual, ...cambios } = form.value;
      await store.editar(props.producto.id, cambios);
    } else {
      await store.crear(form.value);
    }
    emit("guardado");
  } catch (e) {
    error.value = e.message;
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="guardar" class="flex flex-col gap-3">
    <h3 class="text-lg font-bold">{{ esEdicion ? "Editar producto" : "Nuevo producto" }}</h3>

    <div v-if="error" class="alert alert-error">
      <span>{{ error }}</span>
    </div>

    <label class="form-control">
      <span class="label-text">Nombre</span>
      <input v-model="form.nombre" type="text" required class="input input-bordered" />
    </label>

    <label class="form-control">
      <span class="label-text">Descripción</span>
      <input v-model="form.descripcion" type="text" class="input input-bordered" />
    </label>

    <label class="form-control">
      <span class="label-text">Código</span>
      <input v-model="form.codigo" type="text" class="input input-bordered" />
    </label>

    <label class="form-control">
      <span class="label-text">Unidad</span>
      <input v-model="form.unidad" type="text" required class="input input-bordered" placeholder="kg, unidad, caja..." />
    </label>

    <!-- Solo se muestra al crear: en edición, el stock se maneja por movimientos -->
    <label v-if="!esEdicion" class="form-control">
      <span class="label-text">Stock inicial</span>
      <input v-model="form.stock_actual" type="number" min="0" class="input input-bordered" />
    </label>

    <label class="form-control">
      <span class="label-text">Stock mínimo</span>
      <input v-model="form.stock_minimo" type="number" min="0" class="input input-bordered" />
    </label>

    <label class="form-control">
      <span class="label-text">Precio compra</span>
      <input v-model="form.precio_compra" type="number" min="0" step="0.01" required class="input input-bordered" />
    </label>

    <label class="form-control">
      <span class="label-text">Precio venta</span>
      <input v-model="form.precio_venta" type="number" min="0" step="0.01" required class="input input-bordered" />
    </label>

    <div class="flex gap-2 mt-2">
      <button type="submit" class="btn btn-primary" :disabled="enviando">
        <span v-if="enviando" class="loading loading-spinner"></span>
        {{ enviando ? "Guardando..." : "Guardar" }}
      </button>
      <button type="button" class="btn btn-ghost" @click="emit('cerrar')">Cancelar</button>
    </div>
  </form>
</template>