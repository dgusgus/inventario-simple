<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import apiGimnasio from "../../services/api-gimnasio.js";
import GimnasioNav from "./GimnasioNav.vue";

const route = useRoute();

const DIAS_LABEL = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miércoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

const ESTADOS = [
  { valor: "PRESENTE", label: "Presente", clase: "btn-success" },
  { valor: "TARDANZA", label: "Tardanza", clase: "btn-warning" },
  { valor: "AUSENTE", label: "Ausente", clase: "btn-error" },
  { valor: "JUSTIFICADO", label: "Justificado", clase: "btn-info" },
];

function hoyISO() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

const horarios = ref([]);
const clientes = ref([]);
const horarioId = ref("");
const fecha = ref(hoyISO());
const roster = ref([]); // [{ inscripcionId, cliente, asistencia }]

const cargandoHorarios = ref(false);
const cargandoRoster = ref(false);
const marcandoId = ref(null); // inscripcionId que está guardando su asistencia
const error = ref("");

const modalInscribirAbierto = ref(false);
const clienteAInscribir = ref("");
const inscribiendo = ref(false);

const horarioSeleccionado = computed(() =>
  horarios.value.find((h) => h.id === horarioId.value)
);

// Clientes que aún no están en el roster de este horario
const clientesDisponibles = computed(() => {
  const idsEnRoster = new Set(roster.value.map((r) => r.cliente.id));
  return clientes.value.filter((c) => !idsEnRoster.has(c.id));
});

function etiquetaHorario(h) {
  const partes = [DIAS_LABEL[h.diaSemana], `${h.horaInicio}-${h.horaFin}`];
  if (h.nombre) partes.push(h.nombre);
  return partes.join(" · ");
}

async function cargarHorarios() {
  cargandoHorarios.value = true;
  error.value = "";
  try {
    const [resHorarios, resClientes] = await Promise.all([
      apiGimnasio.get("/horarios"),
      apiGimnasio.get("/clientes", { params: { activo: true } }),
    ]);
    horarios.value = resHorarios.data;
    clientes.value = resClientes.data;
    if (!horarioId.value && horarios.value.length > 0) {
      horarioId.value = horarios.value[0].id;
    }

    // Se llegó desde "Inscribir a horario" en la ficha de un cliente:
    // precarga ese alumno y abre el modal directo, solo falta elegir el horario.
    if (route.query.clienteId) {
      clienteAInscribir.value = route.query.clienteId;
      modalInscribirAbierto.value = true;
    }
  } catch (e) {
    error.value = "No se pudo cargar la lista de horarios.";
  } finally {
    cargandoHorarios.value = false;
  }
}

async function cargarRoster() {
  if (!horarioId.value) {
    roster.value = [];
    return;
  }
  cargandoRoster.value = true;
  error.value = "";
  try {
    const { data } = await apiGimnasio.get("/asistencia", {
      params: { horarioId: horarioId.value, fecha: fecha.value },
    });
    roster.value = data;
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo cargar el roster de este horario.";
  } finally {
    cargandoRoster.value = false;
  }
}

async function marcar(item, estado) {
  marcandoId.value = item.inscripcionId;
  error.value = "";
  try {
    const { data } = await apiGimnasio.post("/asistencia", {
      inscripcionId: item.inscripcionId,
      fecha: fecha.value,
      estado,
    });
    item.asistencia = data; // actualiza en el sitio, sin recargar todo el roster
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo marcar la asistencia.";
  } finally {
    marcandoId.value = null;
  }
}

async function inscribir() {
  if (!clienteAInscribir.value) return;
  inscribiendo.value = true;
  error.value = "";
  try {
    await apiGimnasio.post("/inscripciones", {
      clienteId: clienteAInscribir.value,
      horarioId: horarioId.value,
    });
    modalInscribirAbierto.value = false;
    clienteAInscribir.value = "";
    await cargarRoster();
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo inscribir al alumno.";
  } finally {
    inscribiendo.value = false;
  }
}

async function cancelarInscripcion(item) {
  error.value = "";
  try {
    await apiGimnasio.patch(`/inscripciones/${item.inscripcionId}/cancelar`);
    await cargarRoster();
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo dar de baja al alumno.";
  }
}

onMounted(cargarHorarios);
watch([horarioId, fecha], cargarRoster);
</script>

<template>
  <GimnasioNav />

  <div class="max-w-4xl mx-auto px-4 pb-10 flex flex-col gap-4">
    <h1 class="text-xl font-semibold">Inscripciones y asistencia</h1>

    <div class="flex flex-wrap gap-3 items-end">
      <label class="form-control">
        <span class="label-text mb-1">Horario</span>
        <select v-model="horarioId" class="select select-bordered" :disabled="cargandoHorarios">
          <option v-for="h in horarios" :key="h.id" :value="h.id">
            {{ etiquetaHorario(h) }}
          </option>
        </select>
      </label>

      <label class="form-control">
        <span class="label-text mb-1">Fecha</span>
        <input v-model="fecha" type="date" class="input input-bordered" />
      </label>

      <button
        class="btn btn-primary btn-sm"
        :disabled="!horarioId"
        @click="modalInscribirAbierto = true"
      >
        + Inscribir alumno
      </button>
    </div>

    <p v-if="error" class="text-error text-sm">{{ error }}</p>

    <p v-if="horarios.length === 0 && !cargandoHorarios" class="opacity-60 py-6 text-center">
      No hay horarios creados todavía.
      <router-link :to="{ name: 'gimnasio-horarios' }" class="link link-primary">
        Crea uno primero
      </router-link>.
    </p>

    <div v-else-if="cargandoRoster" class="flex justify-center py-10">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Alumno</th>
            <th>Asistencia de {{ fecha }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in roster" :key="item.inscripcionId">
            <td>{{ item.cliente.nombre }}</td>
            <td>
              <div class="flex flex-wrap gap-1">
                <button
                  v-for="e in ESTADOS"
                  :key="e.valor"
                  class="btn btn-xs"
                  :class="item.asistencia?.estado === e.valor ? e.clase : 'btn-outline'"
                  :disabled="marcandoId === item.inscripcionId"
                  @click="marcar(item, e.valor)"
                >
                  {{ e.label }}
                </button>
              </div>
            </td>
            <td>
              <button class="btn btn-ghost btn-xs" @click="cancelarInscripcion(item)">
                Dar de baja
              </button>
            </td>
          </tr>
          <tr v-if="roster.length === 0">
            <td colspan="3" class="text-center opacity-60 py-6">
              No hay alumnos inscritos en este horario.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Modal: inscribir alumno -->
  <dialog class="modal" :open="modalInscribirAbierto">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-3">Inscribir alumno en {{ horarioSeleccionado ? etiquetaHorario(horarioSeleccionado) : "" }}</h3>
      <form @submit.prevent="inscribir" class="flex flex-col gap-3">
        <select v-model="clienteAInscribir" class="select select-bordered w-full" required>
          <option disabled value="">Selecciona un alumno...</option>
          <option v-for="c in clientesDisponibles" :key="c.id" :value="c.id">
            {{ c.nombre }}
          </option>
        </select>
        <p v-if="clientesDisponibles.length === 0" class="text-sm opacity-60">
          Todos los clientes activos ya están inscritos en este horario.
        </p>
        <div class="modal-action">
          <button type="button" class="btn" @click="modalInscribirAbierto = false">Cancelar</button>
          <button type="submit" class="btn btn-primary" :disabled="inscribiendo || !clienteAInscribir">
            {{ inscribiendo ? "Inscribiendo..." : "Inscribir" }}
          </button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop" @click="modalInscribirAbierto = false">
      <button>cerrar</button>
    </form>
  </dialog>
</template>