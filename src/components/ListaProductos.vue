<script setup>
import { ref, onMounted } from "vue";
import api from "../services/api.js";
import ProductoForm from "./ProductoForm.vue";

const productos = ref([]);
const cargando = ref(true);
const error = ref(null);

const mostrarModal = ref(false);
const productoEditando = ref(null); // null = modo crear

async function cargarProductos() {
  cargando.value = true;
  error.value = null;
  try {
    productos.value = await api.getProductos();
  } catch (e) {
    error.value = e.message;
  } finally {
    cargando.value = false;
  }
}

function abrirCrear() {
  productoEditando.value = null;
  mostrarModal.value = true;
}

function abrirEditar(producto) {
  productoEditando.value = producto;
  mostrarModal.value = true;
}

function onGuardado() {
  mostrarModal.value = false;
  cargarProductos();
}

async function desactivar(producto) {
  if (!confirm(`¿Desactivar "${producto.nombre}"? Ya no aparecerá disponible para movimientos.`)) return;
  try {
    await api.desactivarProducto(producto.id);
    cargarProductos();
  } catch (e) {
    alert(e.message);
  }
}

async function activar(producto) {
  try {
    await api.activarProducto(producto.id);
    cargarProductos();
  } catch (e) {
    alert(e.message);
  }
}

onMounted(cargarProductos);
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">Productos</h2>
      <button class="btn btn-primary btn-sm" @click="abrirCrear">+ Nuevo producto</button>
    </div>

    <div v-if="cargando" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="error" class="alert alert-error">
      <span>{{ error }}</span>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Stock</th>
            <th>Precio venta</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in productos" :key="p.id">
            <td>{{ p.nombre }}</td>
            <td>
              <span class="badge" :class="p.stock_actual <= p.stock_minimo ? 'badge-error' : 'badge-success'">
                {{ p.stock_actual }}
              </span>
            </td>
            <td>{{ p.precio_venta }}</td>
            <td>
              <span class="badge" :class="p.activo ? 'badge-success' : 'badge-neutral'">
                {{ p.activo ? "Activo" : "Inactivo" }}
              </span>
            </td>
<td class="flex gap-1">
  <button class="btn btn-xs" @click="abrirEditar(p)">Editar</button>
  <button v-if="p.activo" class="btn btn-xs btn-error" @click="desactivar(p)">Desactivar</button>
  <button v-else class="btn btn-xs btn-success" @click="activar(p)">Activar</button>
</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal daisyUI -->
    <dialog class="modal" :open="mostrarModal">
      <div class="modal-box">
        <ProductoForm
          :producto="productoEditando"
          @guardado="onGuardado"
          @cerrar="mostrarModal = false"
        />
      </div>
      <form method="dialog" class="modal-backdrop" @click="mostrarModal = false">
        <button>cerrar</button>
      </form>
    </dialog>
  </div>
</template>