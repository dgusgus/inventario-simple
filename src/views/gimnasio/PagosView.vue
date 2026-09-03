<script setup>
import { ref, onMounted } from "vue";
import apiGimnasio from "../../services/api-gimnasio.js";
import GimnasioNav from "./GimnasioNav.vue";

const pagos = ref([]);
const cargando = ref(false);
const error = ref("");

async function cargarPagos() {
  cargando.value = true;
  error.value = "";
  try {
    const { data } = await apiGimnasio.get("/pagos");
    pagos.value = data;
  } catch (e) {
    error.value = "No se pudo cargar el historial de pagos.";
  } finally {
    cargando.value = false;
  }
}

function formatearFecha(iso) {
  return new Date(iso).toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

onMounted(cargarPagos);
</script>

<template>
  <GimnasioNav />

  <div class="max-w-4xl mx-auto px-4 pb-10">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-semibold">Historial de pagos</h1>
      <router-link :to="{ name: 'gimnasio-membresias' }" class="btn btn-primary btn-sm">
        Cobrar una membresía
      </router-link>
    </div>

    <p v-if="error" class="text-error text-sm mb-3">{{ error }}</p>

    <div v-if="cargando" class="flex justify-center py-10">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else class="overflow-x-auto">
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
          <tr v-for="p in pagos" :key="p.id">
            <td>{{ formatearFecha(p.fecha) }}</td>
            <td>{{ p.membresia.cliente.nombre }}</td>
            <td>Bs {{ p.monto }}</td>
            <td>{{ p.metodo }}</td>
            <td>{{ p.registradoPor?.nombre ?? "—" }}</td>
          </tr>
          <tr v-if="pagos.length === 0">
            <td colspan="5" class="text-center opacity-60 py-6">
              No hay pagos registrados todavía.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>