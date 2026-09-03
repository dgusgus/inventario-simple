<script setup>
import { ref, computed, onMounted } from "vue";
import apiGimnasio from "../../services/api-gimnasio.js";
import { useGimnasioAuthStore } from "../../stores/gimnasioAuth.js";
import GimnasioNav from "./GimnasioNav.vue";

const auth = useGimnasioAuthStore();

const DIAS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];
const DIAS_LABEL = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miércoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

const horarios = ref([]);
const instructores = ref([]);
const cargando = ref(false);
const error = ref("");
const filtroDia = ref("");

const modalAbierto = ref(false);
const guardando = ref(false);
const nuevoHorario = ref({
  nombre: "",
  diaSemana: "LUNES",
  horaInicio: "06:00",
  horaFin: "07:00",
  cupoMaximo: "",
  instructorIds: [],
});

// Agrupa los horarios por día para pintarlos en columnas/secciones
const horariosPorDia = computed(() => {
  const grupos = {};
  for (const d of DIAS) grupos[d] = [];
  for (const h of horarios.value) {
    if (grupos[h.diaSemana]) grupos[h.diaSemana].push(h);
  }
  return grupos;
});

async function cargarTodo() {
  cargando.value = true;
  error.value = "";
  try {
    const [resHorarios, resInstructores] = await Promise.all([
      apiGimnasio.get("/horarios", {
        params: filtroDia.value ? { diaSemana: filtroDia.value } : {},
      }),
      apiGimnasio.get("/instructores"),
    ]);
    horarios.value = resHorarios.data;
    instructores.value = resInstructores.data;
  } catch (e) {
    error.value = "No se pudo cargar la lista de horarios.";
  } finally {
    cargando.value = false;
  }
}

function abrirModal() {
  nuevoHorario.value = {
    nombre: "",
    diaSemana: filtroDia.value || "LUNES",
    horaInicio: "06:00",
    horaFin: "07:00",
    cupoMaximo: "",
    instructorIds: [],
  };
  modalAbierto.value = true;
}

async function crearHorario() {
  if (nuevoHorario.value.instructorIds.length === 0) {
    error.value = "Selecciona al menos un instructor.";
    return;
  }
  guardando.value = true;
  error.value = "";
  try {
    const payload = {
      diaSemana: nuevoHorario.value.diaSemana,
      horaInicio: nuevoHorario.value.horaInicio,
      horaFin: nuevoHorario.value.horaFin,
      instructorIds: nuevoHorario.value.instructorIds,
    };
    if (nuevoHorario.value.nombre) payload.nombre = nuevoHorario.value.nombre;
    if (nuevoHorario.value.cupoMaximo) {
      payload.cupoMaximo = Number(nuevoHorario.value.cupoMaximo);
    }

    await apiGimnasio.post("/horarios", payload);
    modalAbierto.value = false;
    await cargarTodo();
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo crear el horario.";
  } finally {
    guardando.value = false;
  }
}

async function desactivar(horario) {
  error.value = "";
  try {
    await apiGimnasio.delete(`/horarios/${horario.id}`);
    await cargarTodo();
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo desactivar el horario.";
  }
}

function nombresInstructores(horario) {
  return horario.instructores.map((hi) => hi.instructor.usuario.nombre).join(", ");
}

onMounted(cargarTodo);
</script>

<template>
  <GimnasioNav />

  <div class="max-w-4xl mx-auto px-4 pb-10">
    <div class="flex flex-wrap gap-3 items-center justify-between mb-4">
      <h1 class="text-xl font-semibold">Horarios</h1>
      <div class="flex gap-2">
        <select v-model="filtroDia" class="select select-bordered select-sm" @change="cargarTodo">
          <option value="">Todos los días</option>
          <option v-for="d in DIAS" :key="d" :value="d">{{ DIAS_LABEL[d] }}</option>
        </select>
        <button
          v-if="auth.rol === 'ADMIN'"
          class="btn btn-primary btn-sm"
          @click="abrirModal"
        >
          + Nuevo horario
        </button>
      </div>
    </div>

    <p v-if="error" class="text-error text-sm mb-3">{{ error }}</p>

    <div v-if="cargando" class="flex justify-center py-10">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else class="flex flex-col gap-6">
      <div v-for="d in DIAS" :key="d" v-show="horariosPorDia[d].length > 0">
        <h2 class="font-semibold opacity-70 mb-2">{{ DIAS_LABEL[d] }}</h2>
        <div class="flex flex-col gap-2">
          <div
            v-for="h in horariosPorDia[d]"
            :key="h.id"
            class="card bg-base-100 shadow"
          >
            <div class="card-body py-3 flex-row flex-wrap items-center justify-between gap-2">
              <div>
                <p class="font-medium">
                  {{ h.horaInicio }} - {{ h.horaFin }}
                  <span v-if="h.nombre" class="opacity-70">· {{ h.nombre }}</span>
                </p>
                <p class="text-sm opacity-70">
                  {{ nombresInstructores(h) || "Sin instructor" }}
                </p>
                <p class="text-xs opacity-50">
                  {{ h._count?.inscripciones ?? 0 }} inscrito{{ h._count?.inscripciones === 1 ? "" : "s" }}
                  <span v-if="h.cupoMaximo"> / {{ h.cupoMaximo }} cupos</span>
                </p>
              </div>
              <button
                v-if="auth.rol === 'ADMIN'"
                class="btn btn-ghost btn-xs"
                @click="desactivar(h)"
              >
                Desactivar
              </button>
            </div>
          </div>
        </div>
      </div>

      <p v-if="horarios.length === 0" class="text-center opacity-60 py-10">
        No hay horarios {{ filtroDia ? "para ese día" : "registrados" }}.
      </p>
    </div>
  </div>

  <!-- Modal: nuevo horario -->
  <dialog class="modal" :open="modalAbierto">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-3">Nuevo horario</h3>
      <form @submit.prevent="crearHorario" class="flex flex-col gap-3">
        <input
          v-model="nuevoHorario.nombre"
          placeholder="Nombre (opcional, ej. Funcional)"
          class="input input-bordered w-full"
        />

        <label class="form-control">
          <span class="label-text mb-1">Día</span>
          <select v-model="nuevoHorario.diaSemana" class="select select-bordered w-full">
            <option v-for="d in DIAS" :key="d" :value="d">{{ DIAS_LABEL[d] }}</option>
          </select>
        </label>

        <div class="flex gap-3">
          <label class="form-control flex-1">
            <span class="label-text mb-1">Hora inicio</span>
            <input v-model="nuevoHorario.horaInicio" type="time" required class="input input-bordered w-full" />
          </label>
          <label class="form-control flex-1">
            <span class="label-text mb-1">Hora fin</span>
            <input v-model="nuevoHorario.horaFin" type="time" required class="input input-bordered w-full" />
          </label>
        </div>

        <label class="form-control">
          <span class="label-text mb-1">Cupo máximo (opcional)</span>
          <input
            v-model="nuevoHorario.cupoMaximo"
            type="number"
            min="1"
            class="input input-bordered w-full"
          />
        </label>

        <div class="form-control">
          <span class="label-text mb-1">Instructores</span>
          <div class="flex flex-col gap-1 max-h-40 overflow-y-auto border rounded-box p-2">
            <label
              v-for="ins in instructores"
              :key="ins.id"
              class="label cursor-pointer justify-start gap-2 py-1"
            >
              <input
                type="checkbox"
                :value="ins.id"
                v-model="nuevoHorario.instructorIds"
                class="checkbox checkbox-sm"
              />
              <span class="label-text">{{ ins.usuario.nombre }}</span>
            </label>
            <p v-if="instructores.length === 0" class="text-sm opacity-60 py-2">
              No hay instructores registrados todavía.
            </p>
          </div>
        </div>

        <div class="modal-action">
          <button type="button" class="btn" @click="modalAbierto = false">Cancelar</button>
          <button type="submit" class="btn btn-primary" :disabled="guardando">
            {{ guardando ? "Guardando..." : "Guardar" }}
          </button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop" @click="modalAbierto = false">
      <button>cerrar</button>
    </form>
  </dialog>
</template>