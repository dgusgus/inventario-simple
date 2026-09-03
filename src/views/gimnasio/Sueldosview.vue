<script setup>
import { ref, onMounted } from "vue";
import apiGimnasio from "../../services/api-gimnasio.js";
import GimnasioNav from "./GimnasioNav.vue";

function periodoActual() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  return `${hoy.getFullYear()}-${mes}`;
}

const instructores = ref([]);
const pagos = ref([]);
const cargando = ref(false);
const generando = ref(false);
const error = ref("");
const exito = ref("");

const instructorId = ref("");
const periodo = ref(periodoActual());

async function cargarTodo() {
  cargando.value = true;
  error.value = "";
  try {
    const [resInstructores, resPagos] = await Promise.all([
      apiGimnasio.get("/instructores"),
      apiGimnasio.get("/sueldos"),
    ]);
    instructores.value = resInstructores.data;
    pagos.value = resPagos.data;
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo cargar la planilla de sueldos.";
  } finally {
    cargando.value = false;
  }
}

async function generar() {
  if (!instructorId.value) {
    error.value = "Selecciona un instructor.";
    return;
  }
  generando.value = true;
  error.value = "";
  exito.value = "";
  try {
    await apiGimnasio.post("/sueldos/generar", {
      instructorId: instructorId.value,
      periodo: periodo.value,
    });
    exito.value = "Planilla generada/actualizada.";
    await cargarTodo();
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo generar la planilla.";
  } finally {
    generando.value = false;
  }
}

async function marcarPagado(pago) {
  error.value = "";
  try {
    await apiGimnasio.patch(`/sueldos/${pago.id}/pagar`);
    await cargarTodo();
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo marcar como pagado.";
  }
}

function formatearFecha(iso) {
  if (!iso) return "—";
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

  <div class="max-w-4xl mx-auto px-4 pb-20 md:pb-10 flex flex-col gap-8">
    <!-- Generar planilla -->
    <section class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title">Generar planilla</h2>
        <p class="text-sm opacity-70 -mt-2">
          Suma el sueldo base del instructor más sus bonos y descuentos registrados dentro del mes elegido.
          Puedes volver a correrlo para el mismo periodo si algo cambió — recalcula en vez de duplicar.
        </p>

        <form @submit.prevent="generar" class="flex flex-wrap gap-3 items-end">
          <label class="form-control">
            <span class="label-text mb-1">Instructor</span>
            <select v-model="instructorId" class="select select-bordered" required>
              <option disabled value="">Selecciona...</option>
              <option v-for="i in instructores" :key="i.id" :value="i.id">
                {{ i.usuario.nombre }}
              </option>
            </select>
          </label>

          <label class="form-control">
            <span class="label-text mb-1">Periodo</span>
            <input v-model="periodo" type="month" required class="input input-bordered" />
          </label>

          <button type="submit" class="btn btn-primary" :disabled="generando">
            {{ generando ? "Generando..." : "Generar / recalcular" }}
          </button>
        </form>

        <p v-if="exito" class="text-success text-sm mt-2">{{ exito }}</p>
        <p v-if="error" class="text-error text-sm mt-2">{{ error }}</p>
      </div>
    </section>

    <!-- Historial -->
    <section>
      <h2 class="text-lg font-semibold mb-3">Planillas generadas</h2>

      <div v-if="cargando" class="flex justify-center py-10">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <template v-else>
        <!-- Móvil: tarjetas -->
        <div class="md:hidden flex flex-col gap-3">
          <div v-for="p in pagos" :key="p.id" class="card bg-base-100 shadow border border-base-200">
            <div class="card-body p-4 gap-2">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h2 class="font-semibold leading-tight">{{ p.instructor.usuario.nombre }}</h2>
                  <p class="text-xs opacity-60">{{ p.periodo }}</p>
                </div>
                <span class="badge badge-soft" :class="p.estado === 'PAGADO' ? 'badge-success' : 'badge-warning'">
                  {{ p.estado === "PAGADO" ? "Pagado" : "Pendiente" }}
                </span>
              </div>

              <div class="text-sm flex flex-col gap-0.5">
                <span class="opacity-70">Base: Bs {{ p.montoBase }}</span>
                <span class="text-success">Bonos: +Bs {{ p.totalBonos }}</span>
                <span class="text-error">Descuentos: -Bs {{ p.totalDescuentos }}</span>
                <span class="font-medium">Total: Bs {{ p.montoTotal }}</span>
                <span v-if="p.fechaPago" class="text-xs opacity-60">Pagado el {{ formatearFecha(p.fechaPago) }}</span>
              </div>

              <button
                v-if="p.estado === 'PENDIENTE'"
                class="btn btn-sm btn-soft btn-success mt-2 self-start"
                @click="marcarPagado(p)"
              >
                Marcar pagado
              </button>
            </div>
          </div>

          <p v-if="pagos.length === 0" class="text-center opacity-60 py-10">
            No se ha generado ninguna planilla todavía.
          </p>
        </div>

        <!-- Escritorio: tabla -->
        <div class="hidden md:block overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Periodo</th>
                <th>Instructor</th>
                <th>Base</th>
                <th>Bonos</th>
                <th>Descuentos</th>
                <th>Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in pagos" :key="p.id">
                <td>{{ p.periodo }}</td>
                <td>{{ p.instructor.usuario.nombre }}</td>
                <td>Bs {{ p.montoBase }}</td>
                <td class="text-success">+Bs {{ p.totalBonos }}</td>
                <td class="text-error">-Bs {{ p.totalDescuentos }}</td>
                <td class="font-medium">Bs {{ p.montoTotal }}</td>
                <td>
                  <span class="badge" :class="p.estado === 'PAGADO' ? 'badge-success' : 'badge-warning'">
                    {{ p.estado === "PAGADO" ? "Pagado" : "Pendiente" }}
                  </span>
                  <span v-if="p.fechaPago" class="text-xs opacity-60 block">{{ formatearFecha(p.fechaPago) }}</span>
                </td>
                <td>
                  <button
                    v-if="p.estado === 'PENDIENTE'"
                    class="btn btn-ghost btn-xs"
                    @click="marcarPagado(p)"
                  >
                    Marcar pagado
                  </button>
                </td>
              </tr>
              <tr v-if="pagos.length === 0">
                <td colspan="8" class="text-center opacity-60 py-6">
                  No se ha generado ninguna planilla todavía.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </section>
  </div>
</template>