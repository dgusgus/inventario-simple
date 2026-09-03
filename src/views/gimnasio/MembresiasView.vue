<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import apiGimnasio from "../../services/api-gimnasio.js";
import GimnasioNav from "./GimnasioNav.vue";

const route = useRoute();

const vencimientos = ref([]);
const clientes = ref([]);
const planes = ref([]);
const cargando = ref(false);
const error = ref("");
const exito = ref("");

const nuevaMembresia = ref({
  clienteId: route.query.clienteId ?? "",
  planId: "",
});
const guardando = ref(false);

// id de la membresía sobre la que se está pausando/reanudando (para
// deshabilitar solo su botón y no toda la tabla mientras responde)
const procesandoId = ref(null);

async function cargarTodo() {
  cargando.value = true;
  error.value = "";
  try {
    const [resVencimientos, resClientes, resPlanes] = await Promise.all([
      apiGimnasio.get("/membresias/vencimientos", { params: { dias: 7 } }),
      apiGimnasio.get("/clientes", { params: { activo: true } }),
      apiGimnasio.get("/planes", { params: { activo: true } }),
    ]);
    vencimientos.value = resVencimientos.data;
    clientes.value = resClientes.data;
    planes.value = resPlanes.data;
  } catch (e) {
    error.value = "No se pudo cargar la información de membresías.";
  } finally {
    cargando.value = false;
  }
}

async function crearMembresia() {
  if (!nuevaMembresia.value.clienteId || !nuevaMembresia.value.planId) {
    error.value = "Selecciona un cliente y un plan.";
    return;
  }
  guardando.value = true;
  error.value = "";
  exito.value = "";
  try {
    await apiGimnasio.post("/membresias", nuevaMembresia.value);
    exito.value = "Membresía creada. Recuerda registrar el pago en la sección Pagos.";
    nuevaMembresia.value.planId = "";
    await cargarTodo();
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo crear la membresía.";
  } finally {
    guardando.value = false;
  }
}

async function pausar(membresia) {
  procesandoId.value = membresia.id;
  error.value = "";
  try {
    await apiGimnasio.patch(`/membresias/${membresia.id}/pausar`);
    await cargarTodo();
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo pausar la membresía.";
  } finally {
    procesandoId.value = null;
  }
}

async function reanudar(membresia) {
  procesandoId.value = membresia.id;
  error.value = "";
  try {
    await apiGimnasio.patch(`/membresias/${membresia.id}/reanudar`);
    await cargarTodo();
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo reanudar la membresía.";
  } finally {
    procesandoId.value = null;
  }
}

function formatearFecha(iso) {
  return new Date(iso).toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatearPlan(plan) {
  const precio = `Bs ${plan.precio}`;
  const duracion = plan.duracionDias === 1 ? "1 día" : `${plan.duracionDias} días`;
  return `${plan.nombre} — ${precio} (${duracion})`;
}

onMounted(cargarTodo);
</script>

<template>
  <GimnasioNav />

  <div class="max-w-4xl mx-auto px-4 pb-10 flex flex-col gap-8">
    <!-- Crear membresía -->
    <section class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title">Nueva membresía</h2>

        <p v-if="planes.length === 0 && !cargando" class="text-warning text-sm">
          Todavía no hay planes activos.
          <router-link :to="{ name: 'gimnasio-planes' }" class="link link-primary">
            Crea uno primero
          </router-link>.
        </p>

        <form v-else @submit.prevent="crearMembresia" class="flex flex-wrap gap-3 items-end">
          <label class="form-control">
            <span class="label-text mb-1">Cliente</span>
            <select
              v-model="nuevaMembresia.clienteId"
              class="select select-bordered"
              required
            >
              <option disabled value="">Selecciona...</option>
              <option v-for="c in clientes" :key="c.id" :value="c.id">
                {{ c.nombre }}
              </option>
            </select>
          </label>

          <label class="form-control">
            <span class="label-text mb-1">Plan</span>
            <select v-model="nuevaMembresia.planId" class="select select-bordered" required>
              <option disabled value="">Selecciona...</option>
              <option v-for="p in planes" :key="p.id" :value="p.id">
                {{ formatearPlan(p) }}
              </option>
            </select>
          </label>

          <button type="submit" class="btn btn-primary" :disabled="guardando">
            {{ guardando ? "Creando..." : "Crear membresía" }}
          </button>
        </form>

        <p v-if="exito" class="text-success text-sm mt-2">{{ exito }}</p>
        <p v-if="error" class="text-error text-sm mt-2">{{ error }}</p>
      </div>
    </section>

    <!-- Vencimientos próximos -->
    <section>
      <h2 class="text-lg font-semibold mb-3">Vencimientos en los próximos 7 días</h2>

      <div v-if="cargando" class="flex justify-center py-10">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Plan</th>
              <th>Vence</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in vencimientos" :key="m.id">
              <td>{{ m.cliente.nombre }}</td>
              <td>{{ m.plan?.nombre ?? "—" }}</td>
              <td>{{ formatearFecha(m.fechaVencimiento) }}</td>
              <td>
                <span
                  class="badge"
                  :class="m.estado === 'CONGELADA' ? 'badge-warning' : 'badge-success'"
                >
                  {{ m.estado === "CONGELADA" ? "Pausada" : "Activa" }}
                </span>
              </td>
              <td>
                <button
                  v-if="m.estado === 'ACTIVA'"
                  class="btn btn-ghost btn-xs"
                  :disabled="procesandoId === m.id"
                  @click="pausar(m)"
                >
                  Pausar
                </button>
                <button
                  v-else-if="m.estado === 'CONGELADA'"
                  class="btn btn-ghost btn-xs"
                  :disabled="procesandoId === m.id"
                  @click="reanudar(m)"
                >
                  Reanudar
                </button>
              </td>
            </tr>
            <tr v-if="vencimientos.length === 0">
              <td colspan="5" class="text-center opacity-60 py-6">
                No hay vencimientos próximos.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>