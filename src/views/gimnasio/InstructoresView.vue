<script setup>
import { ref, onMounted } from "vue";
import apiGimnasio from "../../services/api-gimnasio.js";
import { useGimnasioAuthStore } from "../../stores/gimnasioAuth.js";
import GimnasioNav from "./GimnasioNav.vue";

const auth = useGimnasioAuthStore();

const instructores = ref([]);
const cargando = ref(false);
const error = ref("");

// Modal: nuevo instructor (solo ADMIN)
const modalInstructorAbierto = ref(false);
const guardandoInstructor = ref(false);
const nuevoInstructor = ref({
  nombre: "",
  email: "",
  password: "",
  especialidad: "",
  telefono: "",
});

// Panel de bonos: cuál instructor está expandido + su historial
const instructorExpandidoId = ref(null);
const bonosPorInstructor = ref({}); // { [instructorId]: Bono[] }
const cargandoBonos = ref(false);

// Modal: nuevo bono (solo ADMIN)
const modalBonoAbierto = ref(false);
const guardandoBono = ref(false);
const instructorParaBono = ref(null);
const nuevoBono = ref({ monto: "", motivo: "" });

async function cargarInstructores() {
  cargando.value = true;
  error.value = "";
  try {
    const { data } = await apiGimnasio.get("/instructores");
    instructores.value = data;
  } catch (e) {
    error.value = "No se pudo cargar la lista de instructores.";
  } finally {
    cargando.value = false;
  }
}

async function toggleBonos(instructor) {
  if (instructorExpandidoId.value === instructor.id) {
    instructorExpandidoId.value = null;
    return;
  }
  instructorExpandidoId.value = instructor.id;

  if (!bonosPorInstructor.value[instructor.id]) {
    cargandoBonos.value = true;
    try {
      const { data } = await apiGimnasio.get(`/instructores/${instructor.id}/bonos`);
      bonosPorInstructor.value[instructor.id] = data;
    } catch (e) {
      error.value = "No se pudo cargar el historial de bonos.";
    } finally {
      cargandoBonos.value = false;
    }
  }
}

async function crearInstructor() {
  guardandoInstructor.value = true;
  error.value = "";
  try {
    await apiGimnasio.post("/instructores", nuevoInstructor.value);
    modalInstructorAbierto.value = false;
    nuevoInstructor.value = {
      nombre: "",
      email: "",
      password: "",
      especialidad: "",
      telefono: "",
    };
    await cargarInstructores();
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo crear el instructor.";
  } finally {
    guardandoInstructor.value = false;
  }
}

function abrirModalBono(instructor) {
  instructorParaBono.value = instructor;
  nuevoBono.value = { monto: "", motivo: "" };
  modalBonoAbierto.value = true;
}

async function crearBono() {
  guardandoBono.value = true;
  error.value = "";
  try {
    await apiGimnasio.post(`/instructores/${instructorParaBono.value.id}/bonos`, {
      monto: Number(nuevoBono.value.monto),
      motivo: nuevoBono.value.motivo,
    });
    modalBonoAbierto.value = false;
    // Refresca el historial de ese instructor si estaba expandido
    const { data } = await apiGimnasio.get(
      `/instructores/${instructorParaBono.value.id}/bonos`
    );
    bonosPorInstructor.value[instructorParaBono.value.id] = data;
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo registrar el bono.";
  } finally {
    guardandoBono.value = false;
  }
}

function formatearFecha(iso) {
  return new Date(iso).toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

onMounted(cargarInstructores);
</script>

<template>
  <GimnasioNav />

  <div class="max-w-4xl mx-auto px-4 pb-10">
    <div class="flex flex-wrap gap-3 items-center justify-between mb-4">
      <h1 class="text-xl font-semibold">Instructores</h1>
      <button
        v-if="auth.rol === 'ADMIN'"
        class="btn btn-primary btn-sm"
        @click="modalInstructorAbierto = true"
      >
        + Nuevo instructor
      </button>
    </div>

    <p v-if="error" class="text-error text-sm mb-3">{{ error }}</p>

    <div v-if="cargando" class="flex justify-center py-10">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else class="flex flex-col gap-2">
      <div
        v-for="ins in instructores"
        :key="ins.id"
        class="card bg-base-100 shadow"
      >
        <div class="card-body py-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p class="font-medium">{{ ins.usuario.nombre }}</p>
              <p class="text-sm opacity-70">
                {{ ins.especialidad || "Sin especialidad" }}
                <span v-if="ins.telefono"> · {{ ins.telefono }}</span>
              </p>
            </div>
            <div class="flex gap-2">
              <button class="btn btn-ghost btn-sm" @click="toggleBonos(ins)">
                {{ instructorExpandidoId === ins.id ? "Ocultar bonos" : "Ver bonos" }}
              </button>
              <button
                v-if="auth.rol === 'ADMIN'"
                class="btn btn-outline btn-sm"
                @click="abrirModalBono(ins)"
              >
                + Bono
              </button>
            </div>
          </div>

          <!-- Historial de bonos, expandible -->
          <div v-if="instructorExpandidoId === ins.id" class="mt-3 border-t pt-3">
            <div v-if="cargandoBonos" class="flex justify-center py-4">
              <span class="loading loading-spinner loading-sm"></span>
            </div>
            <table v-else class="table table-sm">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Monto</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="b in bonosPorInstructor[ins.id]" :key="b.id">
                  <td>{{ formatearFecha(b.fecha) }}</td>
                  <td>Bs {{ b.monto }}</td>
                  <td>{{ b.motivo }}</td>
                </tr>
                <tr v-if="(bonosPorInstructor[ins.id] ?? []).length === 0">
                  <td colspan="3" class="text-center opacity-60 py-3">
                    Sin bonos registrados.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <p v-if="instructores.length === 0" class="text-center opacity-60 py-10">
        No hay instructores registrados.
      </p>
    </div>
  </div>

  <!-- Modal: nuevo instructor -->
  <dialog class="modal" :open="modalInstructorAbierto">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-3">Nuevo instructor</h3>
      <form @submit.prevent="crearInstructor" class="flex flex-col gap-3">
        <input
          v-model="nuevoInstructor.nombre"
          required
          placeholder="Nombre completo"
          class="input input-bordered w-full"
        />
        <input
          v-model="nuevoInstructor.email"
          type="email"
          required
          placeholder="Email (para su login)"
          class="input input-bordered w-full"
        />
        <input
          v-model="nuevoInstructor.password"
          type="password"
          required
          minlength="6"
          placeholder="Contraseña inicial (mín. 6 caracteres)"
          class="input input-bordered w-full"
        />
        <input
          v-model="nuevoInstructor.especialidad"
          placeholder="Especialidad (opcional)"
          class="input input-bordered w-full"
        />
        <input
          v-model="nuevoInstructor.telefono"
          placeholder="Teléfono (opcional)"
          class="input input-bordered w-full"
        />
        <div class="modal-action">
          <button type="button" class="btn" @click="modalInstructorAbierto = false">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="guardandoInstructor">
            {{ guardandoInstructor ? "Guardando..." : "Guardar" }}
          </button>
        </div>
      </form>
    </div>
    <form
      method="dialog"
      class="modal-backdrop"
      @click="modalInstructorAbierto = false"
    >
      <button>cerrar</button>
    </form>
  </dialog>

  <!-- Modal: nuevo bono -->
  <dialog class="modal" :open="modalBonoAbierto">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-1">Nuevo bono</h3>
      <p class="text-sm opacity-70 mb-3">
        Para {{ instructorParaBono?.usuario?.nombre }}
      </p>
      <form @submit.prevent="crearBono" class="flex flex-col gap-3">
        <input
          v-model="nuevoBono.monto"
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="Monto"
          class="input input-bordered w-full"
        />
        <input
          v-model="nuevoBono.motivo"
          required
          placeholder="Motivo"
          class="input input-bordered w-full"
        />
        <div class="modal-action">
          <button type="button" class="btn" @click="modalBonoAbierto = false">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="guardandoBono">
            {{ guardandoBono ? "Guardando..." : "Guardar" }}
          </button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop" @click="modalBonoAbierto = false">
      <button>cerrar</button>
    </form>
  </dialog>
</template>
