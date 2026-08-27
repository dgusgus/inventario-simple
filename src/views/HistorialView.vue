<script setup>
import { ref, computed, onMounted } from "vue";
import { useProductosStore } from "../stores/productos.js";
import { useMovimientosStore } from "../stores/movimientos.js";

const productosStore = useProductosStore();
const movimientosStore = useMovimientosStore();

// Filtros simples
const filtroTipo = ref("todos");
const filtroProducto = ref("");

function refrescar() {
  movimientosStore.cargar({ forzar: true });
  productosStore.cargar({ forzar: true });
}

// Lookup id -> nombre, calculado una vez cuando cambian los productos
const nombrePorId = computed(() => {
  const map = new Map();
  productosStore.lista.forEach((p) => map.set(String(p.id), p.nombre));
  return map;
});

function nombreProducto(id) {
  return nombrePorId.value.get(String(id)) || `#${id} (eliminado)`;
}

// Lista filtrada y ordenada del más reciente al más antiguo
const movimientosFiltrados = computed(() => {
  let lista = [...movimientosStore.lista];

  if (filtroTipo.value !== "todos") {
    lista = lista.filter((m) => m.tipo === filtroTipo.value);
  }
  if (filtroProducto.value) {
    lista = lista.filter((m) => String(m.producto_id) === filtroProducto.value);
  }

  return lista.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
});

onMounted(() => {
  movimientosStore.cargar();
  productosStore.cargar();
});
</script>

<template>
  <div class="p-6">
    <h2 class="text-xl font-bold mb-4">Historial de movimientos</h2>

    <div class="flex flex-col sm:flex-row gap-3 mb-4">
      <select v-model="filtroTipo" class="select select-bordered select-sm w-full sm:w-auto">
        <option value="todos">Todos los tipos</option>
        <option value="entrada">Entradas</option>
        <option value="salida">Salidas</option>
      </select>

      <select v-model="filtroProducto" class="select select-bordered select-sm w-full sm:w-auto">
        <option value="">Todos los productos</option>
        <option v-for="p in productosStore.lista" :key="p.id" :value="String(p.id)">{{ p.nombre }}</option>
      </select>

      <button class="btn btn-sm btn-ghost self-start" @click="refrescar">Refrescar</button>
    </div>

    <div v-if="movimientosStore.cargando" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="movimientosStore.error" class="alert alert-error">
      <span>{{ movimientosStore.error }}</span>
    </div>

    <div v-else-if="movimientosFiltrados.length === 0" class="alert">
      <span>No hay movimientos que coincidan con el filtro.</span>
    </div>

    <div v-else>
      <!-- Mobile: cards -->
      <div class="md:hidden flex flex-col gap-2">
        <div v-for="m in movimientosFiltrados" :key="m.id" class="card bg-base-200 shadow-sm">
          <div class="card-body p-4 gap-1">
            <div class="flex justify-between items-start gap-2">
              <h3 class="font-semibold leading-tight">{{ nombreProducto(m.producto_id) }}</h3>
              <span class="badge shrink-0" :class="m.tipo === 'entrada' ? 'badge-success' : 'badge-warning'">
                {{ m.tipo }}
              </span>
            </div>
            <p class="text-xs text-base-content/60">{{ new Date(m.fecha).toLocaleString() }}</p>
            <div class="flex justify-between text-sm mt-1">
              <span class="text-base-content/70">Cantidad</span>
              <span>{{ m.cantidad }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-base-content/70">Motivo</span>
              <span>{{ m.motivo }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-base-content/70">Usuario</span>
              <span>{{ m.usuario || "—" }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop: tabla -->
      <div class="hidden md:block overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Motivo</th>
              <th>Usuario</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in movimientosFiltrados" :key="m.id">
              <td>{{ new Date(m.fecha).toLocaleString() }}</td>
              <td>{{ nombreProducto(m.producto_id) }}</td>
              <td>
                <span class="badge" :class="m.tipo === 'entrada' ? 'badge-success' : 'badge-warning'">
                  {{ m.tipo }}
                </span>
              </td>
              <td>{{ m.cantidad }}</td>
              <td>{{ m.motivo }}</td>
              <td>{{ m.usuario || "—" }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>