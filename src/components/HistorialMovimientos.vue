<script setup>
import { ref, computed, onMounted } from "vue";
import api from "../services/api.js";

const movimientos = ref([]);
const productos = ref([]);
const cargando = ref(true);
const error = ref(null);

// Filtros simples
const filtroTipo = ref("todos");
const filtroProducto = ref("");

async function cargar() {
  cargando.value = true;
  error.value = null;
  try {
    // Cargamos ambos en paralelo, no uno tras otro
    const [mov, prod] = await Promise.all([api.getMovimientos(), api.getProductos()]);
    movimientos.value = mov;
    productos.value = prod;
  } catch (e) {
    error.value = e.message;
  } finally {
    cargando.value = false;
  }
}

// Lookup id -> nombre, calculado una vez cuando cambian los productos
const nombrePorId = computed(() => {
  const map = new Map();
  productos.value.forEach((p) => map.set(String(p.id), p.nombre));
  return map;
});

function nombreProducto(id) {
  return nombrePorId.value.get(String(id)) || `#${id} (eliminado)`;
}

// Lista filtrada y ordenada del más reciente al más antiguo
const movimientosFiltrados = computed(() => {
  let lista = [...movimientos.value];

  if (filtroTipo.value !== "todos") {
    lista = lista.filter((m) => m.tipo === filtroTipo.value);
  }
  if (filtroProducto.value) {
    lista = lista.filter((m) => String(m.producto_id) === filtroProducto.value);
  }

  return lista.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

  );
onMounted(cargar);
</script>

<template>
  <div class="p-6">
    <h2 class="text-xl font-bold mb-4">Historial de movimientos</h2>

    <div class="flex gap-3 mb-4">
      <select v-model="filtroTipo" class="select select-bordered select-sm">
        <option value="todos">Todos los tipos</option>
        <option value="entrada">Entradas</option>
        <option value="salida">Salidas</option>
      </select>

      <select v-model="filtroProducto" class="select select-bordered select-sm">
        <option value="">Todos los productos</option>
        <option v-for="p in productos" :key="p.id" :value="String(p.id)">{{ p.nombre }}</option>
      </select>

      <button class="btn btn-sm btn-ghost" @click="cargar">Refrescar</button>
    </div>

    <div v-if="cargando" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="error" class="alert alert-error">
      <span>{{ error }}</span>
    </div>

    <div v-else-if="movimientosFiltrados.length === 0" class="alert">
      <span>No hay movimientos que coincidan con el filtro.</span>
    </div>

    <div v-else class="overflow-x-auto">
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
</template>