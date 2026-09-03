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
  sueldoBase: "",
});

// Panel expandible: cuál instructor está abierto + sus bonos/descuentos
const instructorExpandidoId = ref(null);
const bonosPorInstructor = ref({}); // { [instructorId]: Bono[] }
const descuentosPorInstructor = ref({}); // { [instructorId]: Descuento[] }
const cargandoDetalle = ref(false);

// Modal: nuevo bono/descuento (solo ADMIN) — mismo modal para ambos,
// "tipo" decide a qué endpoint pega
const modalMovimientoAbierto = ref(false);
const guardandoMovimiento = ref(false);
const instructorParaMovimiento = ref(null);
const tipoMovimiento = ref("bono"); // "bono" | "descuento"
const nuevoMovimiento = ref({ monto: "", motivo: "" });

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

async function cargarDetalle(instructorId) {
  cargandoDetalle.value = true;
  try {
    const [resBonos, resDescuentos] = await Promise.all([
      apiGimnasio.get(`/instructores/${instructorId}/bonos`),
      apiGimnasio.get(`/instructores/${instructorId}/descuentos`),
    ]);
    bonosPorInstructor.value[instructorId] = resBonos.data;
    descuentosPorInstructor.value[instructorId] = resDescuentos.data;
  } catch (e) {
    error.value = "No se pudo cargar el historial de bonos/descuentos.";
  } finally {
    cargandoDetalle.value = false;
  }
}

function toggleDetalle(instructor) {
  if (instructorExpandidoId.value === instructor.id) {
    instructorExpandidoId.value = null;
    return;
  }
  instructorExpandidoId.value = instructor.id;
  if (!bonosPorInstructor.value[instructor.id]) {
    cargarDetalle(instructor.id);
  }
}

async function crearInstructor() {
  guardandoInstructor.value = true;
  error.value = "";
  try {
    const payload = { ...nuevoInstructor.value };
    if (payload.sueldoBase) {
      payload.sueldoBase = Number(payload.sueldoBase);
    } else {
      delete payload.sueldoBase;
    }
    await apiGimnasio.post("/instructores", payload);
    modalInstructorAbierto.value = false;
    nuevoInstructor.value = {
      nombre: "",
      email: "",
      password: "",
      especialidad: "",
      telefono: "",
      sueldoBase: "",
    };
    await cargarInstructores();
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo crear el instructor.";
  } finally {
    guardandoInstructor.value = false;
  }
}

function abrirModalMovimiento(instructor, tipo) {
  instructorParaMovimiento.value = instructor;
  tipoMovimiento.value = tipo;
  nuevoMovimiento.value = { monto: "", motivo: "" };
  modalMovimientoAbierto.value = true;
}

async function crearMovimiento() {
  guardandoMovimiento.value = true;
  error.value = "";
  try {
    const ruta = tipoMovimiento.value === "bono" ? "bonos" : "descuentos";
    await apiGimnasio.post(`/instructores/${instructorParaMovimiento.value.id}/${ruta}`, {
      monto: Number(nuevoMovimiento.value.monto),
      motivo: nuevoMovimiento.value.motivo,
    });
    modalMovimientoAbierto.value = false;
    await cargarDetalle(instructorParaMovimiento.value.id);
  } catch (e) {
    const etiqueta = tipoMovimiento.value === "bono" ? "el bono" : "el descuento";
    error.value = e.response?.data?.error ?? `No se pudo registrar ${etiqueta}.`;
  } finally {
    guardandoMovimiento.value = false;
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
                <span v-if="ins.sueldoBase"> · Sueldo base: Bs {{ ins.sueldoBase }}</span>
              </p>
            </div>
            <div class="flex gap-2">
              <button class="btn btn-ghost btn-sm" @click="toggleDetalle(ins)">
                {{ instructorExpandidoId === ins.id ? "Ocultar" : "Ver bonos/descuentos" }}
              </button>
              <template v-if="auth.rol === 'ADMIN'">
                <button class="btn btn-outline btn-sm" @click="abrirModalMovimiento(ins, 'bono')">
                  + Bono
                </button>
                <button class="btn btn-outline btn-sm" @click="abrirModalMovimiento(ins, 'descuento')">
                  + Descuento
                </button>
              </template>
            </div>
          </div>

          <!-- Bonos y descuentos, expandible -->
          <div v-if="instructorExpandidoId === ins.id" class="mt-3 border-t pt-3 flex flex-col gap-4">
            <div v-if="cargandoDetalle" class="flex justify-center py-4">
              <span class="loading loading-spinner loading-sm"></span>
            </div>
            <template v-else>
              <div>
                <p class="text-sm font-medium opacity-70 mb-1">Bonos</p>
                <table class="table table-sm">
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
                      <td class="text-success">+Bs {{ b.monto }}</td>
                      <td>{{ b.motivo }}</td>
                    </tr>
                    <tr v-if="(bonosPorInstructor[ins.id] ?? []).length === 0">
                      <td colspan="3" class="text-center opacity-60 py-3">Sin bonos registrados.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <p class="text-sm font-medium opacity-70 mb-1">Descuentos</p>
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Monto</th>
                      <th>Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="d in descuentosPorInstructor[ins.id]" :key="d.id">
                      <td>{{ formatearFecha(d.fecha) }}</td>
                      <td class="text-error">-Bs {{ d.monto }}</td>
                      <td>{{ d.motivo }}</td>
                    </tr>
                    <tr v-if="(descuentosPorInstructor[ins.id] ?? []).length === 0">
                      <td colspan="3" class="text-center opacity-60 py-3">Sin descuentos registrados.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
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
        <label class="form-control">
          <span class="label-text mb-1">Sueldo base (opcional, en Bs)</span>
          <input
            v-model="nuevoInstructor.sueldoBase"
            type="number"
            step="0.01"
            min="0"
            placeholder="Necesario para generar su planilla de sueldo después"
            class="input input-bordered w-full"
          />
        </label>
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

  <!-- Modal: nuevo bono o descuento -->
  <dialog class="modal" :open="modalMovimientoAbierto">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-1">
        {{ tipoMovimiento === "bono" ? "Nuevo bono" : "Nuevo descuento" }}
      </h3>
      <p class="text-sm opacity-70 mb-3">
        Para {{ instructorParaMovimiento?.usuario?.nombre }}
      </p>
      <form @submit.prevent="crearMovimiento" class="flex flex-col gap-3">
        <input
          v-model="nuevoMovimiento.monto"
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="Monto"
          class="input input-bordered w-full"
        />
        <input
          v-model="nuevoMovimiento.motivo"
          required
          :placeholder="tipoMovimiento === 'bono' ? 'Motivo (ej. cubrió clase extra)' : 'Motivo (ej. falta, adelanto)'"
          class="input input-bordered w-full"
        />
        <div class="modal-action">
          <button type="button" class="btn" @click="modalMovimientoAbierto = false">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="guardandoMovimiento">
            {{ guardandoMovimiento ? "Guardando..." : "Guardar" }}
          </button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop" @click="modalMovimientoAbierto = false">
      <button>cerrar</button>
    </form>
  </dialog>
</template>