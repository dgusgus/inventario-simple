<script setup>
import { ref, computed, onMounted } from "vue";
import apiGimnasio from "../../services/api-gimnasio.js";
import GimnasioNav from "./GimnasioNav.vue";

const pagos = ref([]);
const clientes = ref([]);
const cargando = ref(false);
const error = ref("");
const exito = ref("");

const clienteSeleccionadoId = ref("");
const monto = ref("");
const metodo = ref("EFECTIVO");
const guardando = ref(false);

const METODOS = ["EFECTIVO", "TARJETA", "TRANSFERENCIA", "QR"];

const clienteSeleccionado = computed(() =>
  clientes.value.find((c) => c.id === clienteSeleccionadoId.value)
);

// La membresía más reciente del cliente (así viene el /clientes: 1 sola, la última)
const membresiaActual = computed(() => clienteSeleccionado.value?.membresias?.[0]);

async function cargarTodo() {
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
    error.value = "No se pudo cargar la información de pagos.";
  } finally {
    cargando.value = false;
  }
}

async function registrarPago() {
  if (!membresiaActual.value) {
    error.value = "Este cliente no tiene una membresía para cobrar.";
    return;
  }
  guardando.value = true;
  error.value = "";
  exito.value = "";
  try {
    await apiGimnasio.post("/pagos", {
      membresiaId: membresiaActual.value.id,
      monto: Number(monto.value),
      metodo: metodo.value,
    });
    exito.value = "Pago registrado y membresía reactivada.";
    monto.value = "";
    await cargarTodo();
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo registrar el pago.";
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
    <!-- Registrar pago -->
    <section class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title">Registrar pago</h2>

        <form @submit.prevent="registrarPago" class="flex flex-wrap gap-3 items-end">
          <label class="form-control">
            <span class="label-text mb-1">Cliente</span>
            <select
              v-model="clienteSeleccionadoId"
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
            <span class="label-text mb-1">Monto</span>
            <input
              v-model="monto"
              type="number"
              step="0.01"
              min="0"
              required
              class="input input-bordered w-28"
            />
          </label>

          <label class="form-control">
            <span class="label-text mb-1">Método</span>
            <select v-model="metodo" class="select select-bordered">
              <option v-for="m in METODOS" :key="m" :value="m">{{ m }}</option>
            </select>
          </label>

          <button type="submit" class="btn btn-primary" :disabled="guardando">
            {{ guardando ? "Registrando..." : "Registrar pago" }}
          </button>
        </form>

        <p v-if="clienteSeleccionado && !membresiaActual" class="text-warning text-sm mt-2">
          Este cliente no tiene ninguna membresía todavía — créala primero en la sección
          Membresías.
        </p>
        <p v-if="exito" class="text-success text-sm mt-2">{{ exito }}</p>
        <p v-if="error" class="text-error text-sm mt-2">{{ error }}</p>
      </div>
    </section>

    <!-- Historial -->
    <section>
      <h2 class="text-lg font-semibold mb-3">Historial de pagos</h2>

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
    </section>
  </div>
</template>
