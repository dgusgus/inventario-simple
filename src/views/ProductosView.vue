<script setup>
import { ref, onMounted } from "vue";
import { useProductosStore } from "../stores/productos.js";
import ProductoForm from "../components/ProductoForm.vue";

const store = useProductosStore();

const mostrarModal = ref(false);
const productoEditando = ref(null); // null = modo crear

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
  // No hace falta recargar acá: store.crear()/store.editar() ya refrescan la lista.
}

async function desactivar(producto) {
  if (!confirm(`¿Desactivar "${producto.nombre}"? Ya no aparecerá disponible para movimientos.`)) return;
  try {
    await store.desactivar(producto.id);
  } catch (e) {
    alert(e.message);
  }
}

async function activar(producto) {
  try {
    await store.activar(producto.id);
  } catch (e) {
    alert(e.message);
  }
}

onMounted(() => store.cargar());
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">Productos</h2>
      <button class="btn btn-primary btn-sm" @click="abrirCrear">+ Nuevo producto</button>
    </div>

    <div v-if="store.cargando" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="store.error" class="alert alert-error">
      <span>{{ store.error }}</span>
    </div>

    <div v-else>
      <!-- Mobile: cards apiladas, más fácil de tocar y leer que una tabla angosta -->
      <div class="md:hidden flex flex-col gap-3">
        <div v-for="p in store.lista" :key="p.id" class="card bg-base-200 shadow-sm">
          <div class="card-body p-4 gap-2">
            <div class="flex justify-between items-start gap-2">
              <h3 class="font-semibold leading-tight">{{ p.nombre }}</h3>
              <span class="badge shrink-0" :class="p.activo ? 'badge-success' : 'badge-neutral'">
                {{ p.activo ? "Activo" : "Inactivo" }}
              </span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-base-content/70">Stock</span>
              <span class="badge" :class="p.stock_actual <= p.stock_minimo ? 'badge-error' : 'badge-success'">
                {{ p.stock_actual }}
              </span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-base-content/70">Precio venta</span>
              <span>{{ p.precio_venta }}</span>
            </div>
            <div class="flex gap-2 mt-2">
              <button class="btn btn-sm flex-1" @click="abrirEditar(p)">Editar</button>
              <button v-if="p.activo" class="btn btn-sm btn-error flex-1" @click="desactivar(p)">Desactivar</button>
              <button v-else class="btn btn-sm btn-success flex-1" @click="activar(p)">Activar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop: tabla -->
      <div class="hidden md:block overflow-x-auto">
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
            <tr v-for="p in store.lista" :key="p.id">
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
    </div>

    <!-- Modal daisyUI: w-11/12 evita que toque los bordes en pantallas chicas -->
    <dialog class="modal" :open="mostrarModal">
      <div class="modal-box w-11/12 max-w-md">
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