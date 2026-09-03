<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import apiGimnasio from "../../services/api-gimnasio.js";
import GimnasioNav from "./GimnasioNav.vue";

const route = useRoute();

const METODOS = ["EFECTIVO", "TARJETA", "TRANSFERENCIA", "QR"];

const clientes = ref([]);
const planes = ref([]);
const activas = ref([]); // todas las membresías activas, de todos los clientes
const cargandoBase = ref(false);

const clienteId = ref(route.query.clienteId ?? "");
const membresiasCliente = ref([]);
const cargandoCliente = ref(false);

const error = ref("");
const exito = ref("");
const procesando = ref(false);

// La más reciente es la "actual" — solo puede haber una vigente por cliente
const membresiaActual = computed(() => membresiasCliente.value[0] ?? null);
const membresiaVigente = computed(() => {
  const m = membresiaActual.value;
  if (!m) return null;
  const noVencida = new Date(m.fechaVencimiento) >= new Date();
  return (m.estado === "ACTIVA" || m.estado === "CONGELADA") && noVencida ? m : null;
});

// Formulario para vender una membresía nueva
const planIdNuevo = ref("");
const montoNuevo = ref("");
const metodoNuevo = ref("EFECTIVO");

const planSeleccionadoNuevo = computed(() =>
  planes.value.find((p) => p.id === planIdNuevo.value)
);
watch(planSeleccionadoNuevo, (p) => {
  montoNuevo.value = p ? String(p.precio) : "";
});

// Formulario para completar el saldo de la membresía vigente
const montoPago = ref("");
const metodoPago = ref("EFECTIVO");
watch(membresiaVigente, (m) => {
  montoPago.value = m && m.saldo > 0 ? String(m.saldo) : "";
});

async function cargarBase() {
  cargandoBase.value = true;
  error.value = "";
  try {
    const [resClientes, resPlanes, resActivas] = await Promise.all([
      apiGimnasio.get("/clientes", { params: { activo: true } }),
      apiGimnasio.get("/planes", { params: { activo: true } }),
      apiGimnasio.get("/membresias", { params: { estado: "ACTIVA" } }),
    ]);
    clientes.value = resClientes.data;
    planes.value = resPlanes.data;
    activas.value = resActivas.data;
  } catch (e) {
    error.value = "No se pudo cargar la información de membresías.";
  } finally {
    cargandoBase.value = false;
  }
}

async function cargarMembresiasCliente() {
  if (!clienteId.value) {
    membresiasCliente.value = [];
    return;
  }
  cargandoCliente.value = true;
  error.value = "";
  try {
    const { data } = await apiGimnasio.get("/membresias", {
      params: { clienteId: clienteId.value },
    });
    membresiasCliente.value = data;
  } catch (e) {
    error.value = "No se pudo cargar la membresía de este cliente.";
  } finally {
    cargandoCliente.value = false;
  }
}

// Crea la membresía y, si se dejó un monto, la cobra en el mismo paso
async function crearYCobrar() {
  if (!planIdNuevo.value) {
    error.value = "Selecciona un plan.";
    return;
  }
  procesando.value = true;
  error.value = "";
  exito.value = "";
  try {
    const { data: nueva } = await apiGimnasio.post("/membresias", {
      clienteId: clienteId.value,
      planId: planIdNuevo.value,
    });

    if (Number(montoNuevo.value) > 0) {
      await apiGimnasio.post("/pagos", {
        membresiaId: nueva.id,
        monto: Number(montoNuevo.value),
        metodo: metodoNuevo.value,
      });
    }

    exito.value = "Membresía creada.";
    planIdNuevo.value = "";
    await Promise.all([cargarMembresiasCliente(), cargarBase()]);
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo crear la membresía.";
  } finally {
    procesando.value = false;
  }
}

async function pagarSaldo() {
  if (!membresiaVigente.value) return;
  procesando.value = true;
  error.value = "";
  exito.value = "";
  try {
    await apiGimnasio.post("/pagos", {
      membresiaId: membresiaVigente.value.id,
      monto: Number(montoPago.value),
      metodo: metodoPago.value,
    });
    exito.value = "Pago registrado.";
    await Promise.all([cargarMembresiasCliente(), cargarBase()]);
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo registrar el pago.";
  } finally {
    procesando.value = false;
  }
}

async function pausar(membresia) {
  procesando.value = true;
  error.value = "";
  try {
    await apiGimnasio.patch(`/membresias/${membresia.id}/pausar`);
    await Promise.all([cargarMembresiasCliente(), cargarBase()]);
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo pausar la membresía.";
  } finally {
    procesando.value = false;
  }
}

async function reanudar(membresia) {
  procesando.value = true;
  error.value = "";
  try {
    await apiGimnasio.patch(`/membresias/${membresia.id}/reanudar`);
    await Promise.all([cargarMembresiasCliente(), cargarBase()]);
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo reanudar la membresía.";
  } finally {
    procesando.value = false;
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
  const duracion = plan.duracionDias === 1 ? "1 día" : `${plan.duracionDias} días`;
  return `${plan.nombre} — Bs ${plan.precio} (${duracion})`;
}

onMounted(async () => {
  await cargarBase();
  if (clienteId.value) await cargarMembresiasCliente();
});
watch(clienteId, cargarMembresiasCliente);
</script>

<template>
  <GimnasioNav />

  <div class="max-w-4xl mx-auto px-4 pb-20 md:pb-10 flex flex-col gap-8">
    <!-- Selección de cliente -->
    <section class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title">Membresía del cliente</h2>

        <label class="form-control max-w-xs">
          <span class="label-text mb-1">Cliente</span>
          <select v-model="clienteId" class="select select-bordered">
            <option value="">Selecciona...</option>
            <option v-for="c in clientes" :key="c.id" :value="c.id">{{ c.nombre }}</option>
          </select>
        </label>

        <div v-if="cargandoCliente" class="py-4">
          <span class="loading loading-spinner loading-sm"></span>
        </div>

        <template v-else-if="clienteId">
          <!-- Ya tiene una membresía vigente: cobrar saldo / pausar -->
          <div v-if="membresiaVigente" class="mt-3 flex flex-col gap-2">
            <p>
              <span class="font-medium">{{ membresiaVigente.plan.nombre }}</span>
              — vence el {{ formatearFecha(membresiaVigente.fechaVencimiento) }}
              <span
                class="badge badge-soft ml-2"
                :class="membresiaVigente.estado === 'CONGELADA' ? 'badge-warning' : 'badge-success'"
              >
                {{ membresiaVigente.estado === "CONGELADA" ? "Pausada" : "Activa" }}
              </span>
            </p>
            <p class="text-sm opacity-70">
              Precio: Bs {{ membresiaVigente.precioPagado }} · pagado: Bs
              {{ membresiaVigente.totalPagado.toFixed(2) }}
              · saldo: <strong>Bs {{ membresiaVigente.saldo.toFixed(2) }}</strong>
            </p>

            <form
              v-if="membresiaVigente.saldo > 0"
              @submit.prevent="pagarSaldo"
              class="flex flex-wrap gap-3 items-end mt-2"
            >
              <label class="form-control">
                <span class="label-text mb-1">Monto a pagar</span>
                <input
                  v-model="montoPago"
                  type="number"
                  step="0.01"
                  min="0.01"
                  :max="membresiaVigente.saldo"
                  required
                  class="input input-bordered w-32"
                />
              </label>
              <label class="form-control">
                <span class="label-text mb-1">Método</span>
                <select v-model="metodoPago" class="select select-bordered">
                  <option v-for="m in METODOS" :key="m" :value="m">{{ m }}</option>
                </select>
              </label>
              <button type="submit" class="btn btn-primary" :disabled="procesando">
                Cobrar
              </button>
            </form>

            <div class="mt-2">
              <button
                v-if="membresiaVigente.estado === 'ACTIVA'"
                class="btn btn-soft btn-warning btn-sm"
                :disabled="procesando"
                @click="pausar(membresiaVigente)"
              >
                Pausar
              </button>
              <button
                v-else
                class="btn btn-soft btn-success btn-sm"
                :disabled="procesando"
                @click="reanudar(membresiaVigente)"
              >
                Reanudar
              </button>
            </div>
          </div>

          <!-- No tiene membresía vigente: vender una nueva -->
          <div v-else class="mt-3">
            <p class="text-sm opacity-70 mb-2">
              Este cliente no tiene una membresía vigente. Puedes venderle una:
            </p>
            <form @submit.prevent="crearYCobrar" class="flex flex-wrap gap-3 items-end">
              <label class="form-control">
                <span class="label-text mb-1">Plan</span>
                <select v-model="planIdNuevo" class="select select-bordered" required>
                  <option disabled value="">Selecciona...</option>
                  <option v-for="p in planes" :key="p.id" :value="p.id">
                    {{ formatearPlan(p) }}
                  </option>
                </select>
              </label>

              <label class="form-control" v-if="planIdNuevo">
                <span class="label-text mb-1">Cobrar ahora (Bs)</span>
                <input
                  v-model="montoNuevo"
                  type="number"
                  step="0.01"
                  min="0"
                  :max="planSeleccionadoNuevo?.precio"
                  class="input input-bordered w-32"
                />
              </label>
              <label class="form-control" v-if="planIdNuevo">
                <span class="label-text mb-1">Método</span>
                <select v-model="metodoNuevo" class="select select-bordered">
                  <option v-for="m in METODOS" :key="m" :value="m">{{ m }}</option>
                </select>
              </label>

              <button type="submit" class="btn btn-primary" :disabled="procesando">
                {{ procesando ? "Guardando..." : "Crear membresía" }}
              </button>
            </form>
            <p class="text-xs opacity-60 mt-1">
              Deja "Cobrar ahora" en 0 si va a pagar después — la membresía queda registrada
              con saldo pendiente.
            </p>
          </div>
        </template>

        <p v-if="exito" class="text-success text-sm mt-2">{{ exito }}</p>
        <p v-if="error" class="text-error text-sm mt-2">{{ error }}</p>
      </div>
    </section>

    <!-- Todas las membresías activas -->
    <section>
      <h2 class="text-lg font-semibold mb-3">Membresías activas</h2>

      <div v-if="cargandoBase" class="flex justify-center py-10">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <template v-else>
        <!-- Móvil: tarjetas -->
        <div class="md:hidden flex flex-col gap-3">
          <div v-for="m in activas" :key="m.id" class="card bg-base-100 shadow border border-base-200">
            <div class="card-body p-4 gap-1.5">
              <div class="flex items-start justify-between gap-2">
                <h3 class="font-semibold leading-tight">{{ m.cliente.nombre }}</h3>
                <span v-if="m.saldo > 0" class="badge badge-soft badge-warning shrink-0">
                  Bs {{ m.saldo.toFixed(2) }}
                </span>
                <span v-else class="badge badge-soft badge-success shrink-0">Pagada</span>
              </div>
              <p class="text-sm opacity-70">
                {{ m.plan.nombre }} · vence {{ formatearFecha(m.fechaVencimiento) }}
              </p>
              <button
                class="btn btn-sm btn-soft btn-primary mt-2 self-start"
                @click="clienteId = m.clienteId"
              >
                Ver
              </button>
            </div>
          </div>

          <p v-if="activas.length === 0" class="text-center opacity-60 py-10">
            No hay membresías activas ahora mismo.
          </p>
        </div>

        <!-- Escritorio: tabla -->
        <div class="hidden md:block overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Plan</th>
                <th>Vence</th>
                <th>Saldo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in activas" :key="m.id">
                <td>{{ m.cliente.nombre }}</td>
                <td>{{ m.plan.nombre }}</td>
                <td>{{ formatearFecha(m.fechaVencimiento) }}</td>
                <td>
                  <span v-if="m.saldo > 0" class="text-warning">Bs {{ m.saldo.toFixed(2) }}</span>
                  <span v-else class="text-success">Pagada</span>
                </td>
                <td>
                  <button class="btn btn-ghost btn-xs" @click="clienteId = m.clienteId">
                    Ver
                  </button>
                </td>
              </tr>
              <tr v-if="activas.length === 0">
                <td colspan="5" class="text-center opacity-60 py-6">
                  No hay membresías activas ahora mismo.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </section>
  </div>
</template>