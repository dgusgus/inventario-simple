<script setup>
import { ref, computed, onMounted } from "vue";
import apiGimnasio from "../../services/api-gimnasio.js";
import GimnasioNav from "./GimnasioNav.vue";

const METODOS = ["EFECTIVO", "TARJETA", "TRANSFERENCIA", "QR"];

const pagos = ref([]);
const clientes = ref([]);
const cargando = ref(false);
const error = ref("");

const filtroFechaDesde = ref("");
const filtroFechaHasta = ref("");
const filtroClienteId = ref("");
const filtroMetodo = ref("");

const pagosFiltrados = computed(() => {
  return pagos.value.filter((p) => {
    if (filtroFechaDesde.value) {
      const fechaPago = p.fecha.slice(0, 10);
      if (fechaPago < filtroFechaDesde.value) return false;
    }
    if (filtroFechaHasta.value) {
      const fechaPago = p.fecha.slice(0, 10);
      if (fechaPago > filtroFechaHasta.value) return false;
    }
    if (filtroClienteId.value && p.membresia.cliente.id !== filtroClienteId.value) {
      return false;
    }
    if (filtroMetodo.value && p.metodo !== filtroMetodo.value) {
      return false;
    }
    return true;
  });
});

const totalFiltrado = computed(() =>
  pagosFiltrados.value.reduce((sum, p) => sum + Number(p.monto), 0)
);

async function cargarPagos() {
  cargando.value = true;
  error.value = "";
  try {
    const [resPagos, resClientes] = await Promise.all([
      apiGimnasio.get("/pagos"),
      apiGimnasio.get("/clientes", { params: { activo: true } }),
    ]);
    pagos.value = resPagos.data;
    clientes.value = resClientes.data;
  } catch (e) {
    error.value = "No se pudo cargar el historial de pagos.";
  } finally {
    cargando.value = false;
  }
}

function limpiarFiltros() {
  filtroFechaDesde.value = "";
  filtroFechaHasta.value = "";
  filtroClienteId.value = "";
  filtroMetodo.value = "";
}

function formatearFecha(iso) {
  return new Date(iso).toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function exportarCSV() {
  const encabezados = ["Fecha", "Cliente", "Monto", "Método", "Registrado por"];
  const filas = pagosFiltrados.value.map((p) => [
    formatearFecha(p.fecha),
    p.membresia.cliente.nombre,
    p.monto,
    p.metodo,
    p.registradoPor?.nombre ?? "",
  ]);
  const csv = [encabezados, ...filas].map((f) => f.join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pagos_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

onMounted(cargarPagos);
</script>

<template>
  <GimnasioNav />

  <div class="max-w-5xl mx-auto px-4 pb-20 md:pb-10">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <h1 class="text-xl font-semibold">Historial de pagos</h1>
      <div class="flex gap-2">
        <button class="btn btn-soft btn-sm" @click="exportarCSV" :disabled="pagosFiltrados.length === 0">
          Exportar CSV
        </button>
        <router-link :to="{ name: 'gimnasio-membresias' }" class="btn btn-primary btn-sm">
          Cobrar una membresía
        </router-link>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card bg-base-100 shadow mb-4">
      <div class="card-body py-4">
        <div class="flex flex-wrap gap-3 items-end">
          <label class="form-control">
            <span class="label-text mb-1">Desde</span>
            <input v-model="filtroFechaDesde" type="date" class="input input-bordered input-sm" />
          </label>
          <label class="form-control">
            <span class="label-text mb-1">Hasta</span>
            <input v-model="filtroFechaHasta" type="date" class="input input-bordered input-sm" />
          </label>
          <label class="form-control">
            <span class="label-text mb-1">Cliente</span>
            <select v-model="filtroClienteId" class="select select-bordered select-sm">
              <option value="">Todos</option>
              <option v-for="c in clientes" :key="c.id" :value="c.id">{{ c.nombre }}</option>
            </select>
          </label>
          <label class="form-control">
            <span class="label-text mb-1">Método</span>
            <select v-model="filtroMetodo" class="select select-bordered select-sm">
              <option value="">Todos</option>
              <option v-for="m in METODOS" :key="m" :value="m">{{ m }}</option>
            </select>
          </label>
          <button class="btn btn-ghost btn-sm" @click="limpiarFiltros">Limpiar</button>
        </div>
      </div>
    </div>

    <p v-if="error" class="text-error text-sm mb-3">{{ error }}</p>

    <div v-if="cargando" class="flex justify-center py-10">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <template v-else>
      <!-- Resumen -->
      <div class="flex gap-4 mb-4 text-sm">
        <span class="opacity-70">{{ pagosFiltrados.length }} pago{{ pagosFiltrados.length === 1 ? "" : "s" }}</span>
        <span class="font-medium">Total: Bs {{ totalFiltrado.toFixed(2) }}</span>
      </div>

      <!-- Móvil: tarjetas -->
      <div class="md:hidden flex flex-col gap-3">
        <div v-for="p in pagosFiltrados" :key="p.id" class="card bg-base-100 shadow border border-base-200">
          <div class="card-body p-4 gap-1">
            <div class="flex items-start justify-between gap-2">
              <h3 class="font-semibold leading-tight">{{ p.membresia.cliente.nombre }}</h3>
              <span class="font-medium shrink-0">Bs {{ p.monto }}</span>
            </div>
            <p class="text-sm opacity-70">
              {{ formatearFecha(p.fecha) }} · {{ p.metodo }}
            </p>
            <p class="text-xs opacity-50">
              Registrado por {{ p.registradoPor?.nombre ?? "—" }}
            </p>
          </div>
        </div>

        <p v-if="pagosFiltrados.length === 0" class="text-center opacity-60 py-10">
          No hay pagos {{ (filtroFechaDesde || filtroFechaHasta || filtroClienteId || filtroMetodo) ? "que coincidan con los filtros" : "registrados todavía" }}.
        </p>
      </div>

      <!-- Escritorio: tabla -->
      <div class="hidden md:block overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Monto</th>
              <th>Método</th>
              <th>Registrado por</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in pagosFiltrados" :key="p.id">
              <td>{{ formatearFecha(p.fecha) }}</td>
              <td>{{ p.membresia.cliente.nombre }}</td>
              <td>Bs {{ p.monto }}</td>
              <td>{{ p.metodo }}</td>
              <td>{{ p.registradoPor?.nombre ?? "—" }}</td>
            </tr>
            <tr v-if="pagosFiltrados.length === 0">
              <td colspan="5" class="text-center opacity-60 py-6">
                No hay pagos {{ (filtroFechaDesde || filtroFechaHasta || filtroClienteId || filtroMetodo) ? "que coincidan con los filtros" : "registrados todavía" }}.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>