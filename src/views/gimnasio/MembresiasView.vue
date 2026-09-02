<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import apiGimnasio from "../../services/api-gimnasio.js";
import GimnasioNav from "./GimnasioNav.vue";

const route = useRoute();

const vencimientos = ref([]);
const clientes = ref([]);
const cargando = ref(false);
const error = ref("");
const exito = ref("");

const nuevaMembresia = ref({
  clienteId: route.query.clienteId ?? "",
  tipo: "MENSUAL",
});
const guardando = ref(false);

const TIPOS = ["MENSUAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"];

async function cargarTodo() {
  cargando.value = true;
  error.value = "";
  try {
    const [resVencimientos, resClientes] = await Promise.all([
      apiGimnasio.get("/membresias/vencimientos", { params: { dias: 7 } }),
      apiGimnasio.get("/clientes", { params: { activo: true } }),
    ]);
    vencimientos.value = resVencimientos.data;
    clientes.value = resClientes.data;
  } catch (e) {
    error.value = "No se pudo cargar la información de membresías.";
  } finally {
    cargando.value = false;
  }
}

async function crearMembresia() {
  if (!nuevaMembresia.value.clienteId) {
    error.value = "Selecciona un cliente.";
    return;
  }
  guardando.value = true;
  error.value = "";
  exito.value = "";
  try {
    await apiGimnasio.post("/membresias", nuevaMembresia.value);
    exito.value = "Membresía creada. Recuerda registrar el pago en la sección Pagos.";
    await cargarTodo();
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo crear la membresía.";
  } finally {
    guardando.value = false;
  }
}

function formatearFecha(iso) {
  return new Date(iso).toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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
        <form @submit.prevent="crearMembresia" class="flex flex-wrap gap-3 items-end">
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
            <span class="label-text mb-1">Tipo</span>
            <select v-model="nuevaMembresia.tipo" class="select select-bordered">
              <option v-for="t in TIPOS" :key="t" :value="t">{{ t }}</option>
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
              <th>Tipo</th>
              <th>Vence</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in vencimientos" :key="m.id">
              <td>{{ m.cliente.nombre }}</td>
              <td>{{ m.tipo }}</td>
              <td>{{ formatearFecha(m.fechaVencimiento) }}</td>
            </tr>
            <tr v-if="vencimientos.length === 0">
              <td colspan="3" class="text-center opacity-60 py-6">
                No hay vencimientos próximos.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
