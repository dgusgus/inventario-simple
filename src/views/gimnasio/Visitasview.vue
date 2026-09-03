<script setup>
import { ref, computed, onMounted } from "vue";
import apiGimnasio from "../../services/api-gimnasio.js";
import GimnasioNav from "./GimnasioNav.vue";

const clientes = ref([]);
const visitas = ref([]);
const busqueda = ref("");
const cargando = ref(false);
const registrando = ref(false);
const error = ref("");
const resultado = ref(null); // último check-in: { visita, membresiaVigente }

const clientesFiltrados = computed(() => {
  if (!busqueda.value.trim()) return [];
  const q = busqueda.value.trim().toLowerCase();
  return clientes.value.filter((c) => c.nombre.toLowerCase().includes(q)).slice(0, 8);
});

async function cargarTodo() {
  cargando.value = true;
  error.value = "";
  try {
    const [resClientes, resVisitas] = await Promise.all([
      apiGimnasio.get("/clientes", { params: { activo: true } }),
      apiGimnasio.get("/visitas"),
    ]);
    clientes.value = resClientes.data;
    visitas.value = resVisitas.data.slice(0, 20); // últimas 20, alcanza para el día
  } catch (e) {
    error.value = "No se pudo cargar la información de visitas.";
  } finally {
    cargando.value = false;
  }
}

async function registrarIngreso(cliente) {
  registrando.value = true;
  error.value = "";
  resultado.value = null;
  try {
    const { data } = await apiGimnasio.post("/visitas", { clienteId: cliente.id });
    resultado.value = { ...data, clienteNombre: cliente.nombre };
    busqueda.value = "";
    await cargarTodo();
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo registrar el ingreso.";
  } finally {
    registrando.value = false;
  }
}

function formatearHora(iso) {
  return new Date(iso).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });
}

onMounted(cargarTodo);
</script>

<template>
  <GimnasioNav />

  <div class="max-w-2xl mx-auto px-4 pb-10 flex flex-col gap-6">
    <h1 class="text-xl font-semibold">Check-in</h1>

    <!-- Buscador + resultado -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <label class="form-control">
          <span class="label-text mb-1">Buscar cliente por nombre</span>
          <input
            v-model="busqueda"
            type="text"
            placeholder="Escribe para buscar..."
            class="input input-bordered w-full"
            autofocus
          />
        </label>

        <ul v-if="clientesFiltrados.length > 0" class="menu bg-base-200 rounded-box mt-2">
          <li v-for="c in clientesFiltrados" :key="c.id">
            <button type="button" :disabled="registrando" @click="registrarIngreso(c)">
              {{ c.nombre }}
            </button>
          </li>
        </ul>

        <p v-if="error" class="text-error text-sm mt-2">{{ error }}</p>

        <div v-if="resultado" class="alert mt-3" :class="resultado.membresiaVigente ? 'alert-success' : 'alert-warning'">
          <div>
            <p class="font-medium">Ingreso registrado: {{ resultado.clienteNombre }}</p>
            <p v-if="resultado.membresiaVigente" class="text-sm">
              Membresía vigente hasta {{ new Date(resultado.membresiaVigente.fechaVencimiento).toLocaleDateString("es-BO") }}.
            </p>
            <p v-else class="text-sm">
              No tiene membresía vigente — cobrar pase diario en recepción.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Últimos ingresos -->
    <div>
      <h2 class="text-lg font-semibold mb-3">Últimos ingresos</h2>

      <div v-if="cargando" class="flex justify-center py-10">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Hora</th>
              <th>Cliente</th>
              <th>Cubierto con</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in visitas" :key="v.id">
              <td>{{ formatearHora(v.fechaHora) }}</td>
              <td>{{ v.cliente.nombre }}</td>
              <td>
                <span v-if="v.membresiaId" class="badge badge-success badge-sm">Membresía</span>
                <span v-else class="badge badge-warning badge-sm">Pase diario / sin cubrir</span>
              </td>
            </tr>
            <tr v-if="visitas.length === 0">
              <td colspan="3" class="text-center opacity-60 py-6">Todavía no hay ingresos registrados.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>