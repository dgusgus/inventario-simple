<script setup>
import { ref, onMounted } from "vue";
import apiGimnasio from "../../services/api-gimnasio.js";
import { useGimnasioAuthStore } from "../../stores/gimnasioAuth.js";
import GimnasioNav from "./GimnasioNav.vue";

const auth = useGimnasioAuthStore();

const instructores = ref([]);
const cargando = ref(false);
const error = ref("");

const modalInstructorAbierto = ref(false);
const guardandoInstructor = ref(false);
const esEdicion = ref(false);
const instructorEditandoId = ref(null);
const formInstructor = ref({
  nombre: "",
  email: "",
  password: "",
  especialidad: "",
  telefono: "",
  sueldoBase: "",
});

const modalEliminarAbierto = ref(false);
const instructorParaEliminar = ref(null);
const eliminando = ref(false);

const instructorExpandidoId = ref(null);
const bonosPorInstructor = ref({});
const descuentosPorInstructor = ref({});
const cargandoDetalle = ref(false);

const modalMovimientoAbierto = ref(false);
const guardandoMovimiento = ref(false);
const instructorParaMovimiento = ref(null);
const tipoMovimiento = ref("bono");
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

function abrirModalCrear() {
  esEdicion.value = false;
  instructorEditandoId.value = null;
  formInstructor.value = {
    nombre: "",
    email: "",
    password: "",
    especialidad: "",
    telefono: "",
    sueldoBase: "",
  };
  modalInstructorAbierto.value = true;
}

function abrirModalEditar(instructor) {
  esEdicion.value = true;
  instructorEditandoId.value = instructor.id;
  formInstructor.value = {
    nombre: instructor.usuario.nombre,
    email: instructor.usuario.email || "",
    password: "",
    especialidad: instructor.especialidad || "",
    telefono: instructor.telefono || "",
    sueldoBase: instructor.sueldoBase || "",
  };
  modalInstructorAbierto.value = true;
}

async function guardarInstructor() {
  guardandoInstructor.value = true;
  error.value = "";
  try {
    const payload = { ...formInstructor.value };
    if (payload.sueldoBase) {
      payload.sueldoBase = Number(payload.sueldoBase);
    } else {
      delete payload.sueldoBase;
    }
    if (esEdicion.value) {
      if (!payload.password) delete payload.password;
      await apiGimnasio.patch(`/instructores/${instructorEditandoId.value}`, payload);
    } else {
      if (!payload.password) {
        error.value = "La contraseña es requerida para nuevos instructores.";
        return;
      }
      await apiGimnasio.post("/instructores", payload);
    }
    modalInstructorAbierto.value = false;
    await cargarInstructores();
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo guardar el instructor.";
  } finally {
    guardandoInstructor.value = false;
  }
}

function abrirModalEliminar(instructor) {
  instructorParaEliminar.value = instructor;
  modalEliminarAbierto.value = true;
}

async function eliminarInstructor() {
  if (!instructorParaEliminar.value) return;
  eliminando.value = true;
  error.value = "";
  try {
    await apiGimnasio.delete(`/instructores/${instructorParaEliminar.value.id}`);
    modalEliminarAbierto.value = false;
    instructorParaEliminar.value = null;
    await cargarInstructores();
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo eliminar el instructor.";
  } finally {
    eliminando.value = false;
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
        @click="abrirModalCrear"
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
                <button class="btn btn-ghost btn-sm" @click="abrirModalEditar(ins)">
                  Editar
                </button>
                <button class="btn btn-ghost btn-sm text-error" @click="abrirModalEliminar(ins)">
                  Eliminar
                </button>
                <button class="btn btn-outline btn-sm" @click="abrirModalMovimiento(ins, 'bono')">
                  + Bono
                </button>
                <button class="btn btn-outline btn-sm" @click="abrirModalMovimiento(ins, 'descuento')">
                  + Descuento
                </button>
              </template>
            </div>
          </div>

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

  <!-- Modal: crear/editar instructor -->
  <dialog class="modal" :open="modalInstructorAbierto">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-3">{{ esEdicion ? "Editar instructor" : "Nuevo instructor" }}</h3>
      <form @submit.prevent="guardarInstructor" class="flex flex-col gap-3">
        <input
          v-model="formInstructor.nombre"
          required
          placeholder="Nombre completo"
          class="input input-bordered w-full"
        />
        <input
          v-model="formInstructor.email"
          type="email"
          required
          placeholder="Email (para su login)"
          class="input input-bordered w-full"
        />
        <input
          v-model="formInstructor.password"
          type="password"
          :required="!esEdicion"
          :minlength="esEdicion ? 0 : 6"
          :placeholder="esEdicion ? 'Dejar vacío para no cambiar' : 'Contraseña inicial (mín. 6 caracteres)'"
          class="input input-bordered w-full"
        />
        <input
          v-model="formInstructor.especialidad"
          placeholder="Especialidad (opcional)"
          class="input input-bordered w-full"
        />
        <input
          v-model="formInstructor.telefono"
          placeholder="Teléfono (opcional)"
          class="input input-bordered w-full"
        />
        <label class="form-control">
          <span class="label-text mb-1">Sueldo base (opcional, en Bs)</span>
          <input
            v-model="formInstructor.sueldoBase"
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

  <!-- Modal: confirmar eliminación -->
  <dialog class="modal" :open="modalEliminarAbierto">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-3">Eliminar instructor</h3>
      <p class="mb-4">
        ¿Estás seguro de eliminar a <strong>{{ instructorParaEliminar?.usuario?.nombre }}</strong>?
        Esta acción desactivará al instructor del sistema.
      </p>
      <div class="modal-action">
        <button type="button" class="btn" @click="modalEliminarAbierto = false" :disabled="eliminando">
          Cancelar
        </button>
        <button type="button" class="btn btn-error" @click="eliminarInstructor" :disabled="eliminando">
          {{ eliminando ? "Eliminando..." : "Eliminar" }}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop" @click="modalEliminarAbierto = false">
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
