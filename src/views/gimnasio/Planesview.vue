<script setup>
import { ref, onMounted } from "vue";
import apiGimnasio from "../../services/api-gimnasio.js";
import { useGimnasioAuthStore } from "../../stores/gimnasioAuth.js";
import GimnasioNav from "./GimnasioNav.vue";

const auth = useGimnasioAuthStore();

const planes = ref([]);
const cargando = ref(false);
const error = ref("");

const modalAbierto = ref(false);
const guardando = ref(false);
const nuevoPlan = ref({
  nombre: "",
  duracionDias: 30,
  precio: "",
  esPromocion: false,
  fechaInicioPromo: "",
  fechaFinPromo: "",
});

async function cargarPlanes() {
  cargando.value = true;
  error.value = "";
  try {
    // trae también los inactivos, para poder reactivarlos desde aquí
    const { data } = await apiGimnasio.get("/planes");
    planes.value = data;
  } catch (e) {
    error.value = "No se pudo cargar la lista de planes.";
  } finally {
    cargando.value = false;
  }
}

function abrirModal() {
  nuevoPlan.value = {
    nombre: "",
    duracionDias: 30,
    precio: "",
    esPromocion: false,
    fechaInicioPromo: "",
    fechaFinPromo: "",
  };
  modalAbierto.value = true;
}

async function crearPlan() {
  guardando.value = true;
  error.value = "";
  try {
    const payload = {
      nombre: nuevoPlan.value.nombre,
      duracionDias: Number(nuevoPlan.value.duracionDias),
      precio: Number(nuevoPlan.value.precio),
      esPromocion: nuevoPlan.value.esPromocion,
    };
    if (nuevoPlan.value.esPromocion) {
      if (nuevoPlan.value.fechaInicioPromo) {
        payload.fechaInicioPromo = nuevoPlan.value.fechaInicioPromo;
      }
      if (nuevoPlan.value.fechaFinPromo) {
        payload.fechaFinPromo = nuevoPlan.value.fechaFinPromo;
      }
    }
    await apiGimnasio.post("/planes", payload);
    modalAbierto.value = false;
    await cargarPlanes();
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo crear el plan.";
  } finally {
    guardando.value = false;
  }
}

async function toggleActivo(plan) {
  error.value = "";
  try {
    if (plan.activo) {
      await apiGimnasio.delete(`/planes/${plan.id}`); // desactiva, no borra
    } else {
      await apiGimnasio.patch(`/planes/${plan.id}`, { activo: true });
    }
    await cargarPlanes();
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo actualizar el plan.";
  }
}

onMounted(cargarPlanes);
</script>

<template>
  <GimnasioNav />

  <div class="max-w-4xl mx-auto px-4 pb-20 md:pb-10">
    <div class="flex flex-wrap gap-3 items-center justify-between mb-4">
      <h1 class="text-xl font-semibold">Planes</h1>
      <button
        v-if="auth.rol === 'ADMIN'"
        class="btn btn-primary btn-sm"
        @click="abrirModal"
      >
        + Nuevo plan
      </button>
    </div>

    <p v-if="error" class="text-error text-sm mb-3">{{ error }}</p>

    <div v-if="cargando" class="flex justify-center py-10">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <template v-else>
      <!-- Móvil: tarjetas -->
      <div class="md:hidden flex flex-col gap-3">
        <div
          v-for="p in planes"
          :key="p.id"
          class="card bg-base-100 shadow border border-base-200"
          :class="{ 'opacity-60': !p.activo }"
        >
          <div class="card-body p-4 gap-2">
            <div class="flex items-start justify-between gap-2">
              <h2 class="font-semibold leading-tight">{{ p.nombre }}</h2>
              <div class="flex gap-1 shrink-0">
                <span v-if="p.esPromocion" class="badge badge-soft badge-accent">Promo</span>
                <span class="badge badge-soft" :class="p.activo ? 'badge-success' : 'badge-ghost'">
                  {{ p.activo ? "Activo" : "Inactivo" }}
                </span>
              </div>
            </div>
            <p class="text-sm opacity-70">
              {{ p.duracionDias === 1 ? "1 día" : `${p.duracionDias} días` }} · Bs {{ p.precio }}
            </p>
            <button
              v-if="auth.rol === 'ADMIN'"
              class="btn btn-sm btn-soft mt-2 self-start"
              @click="toggleActivo(p)"
            >
              {{ p.activo ? "Desactivar" : "Reactivar" }}
            </button>
          </div>
        </div>

        <p v-if="planes.length === 0" class="text-center opacity-60 py-10">
          No hay planes registrados.
        </p>
      </div>

      <!-- Escritorio: tabla -->
      <div class="hidden md:block overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Duración</th>
              <th>Precio</th>
              <th>Promoción</th>
              <th>Estado</th>
              <th v-if="auth.rol === 'ADMIN'"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in planes" :key="p.id">
              <td>{{ p.nombre }}</td>
              <td>{{ p.duracionDias === 1 ? "1 día" : `${p.duracionDias} días` }}</td>
              <td>Bs {{ p.precio }}</td>
              <td>
                <span v-if="p.esPromocion" class="badge badge-accent">Promo</span>
                <span v-else class="opacity-50">—</span>
              </td>
              <td>
                <span class="badge" :class="p.activo ? 'badge-success' : 'badge-ghost'">
                  {{ p.activo ? "Activo" : "Inactivo" }}
                </span>
              </td>
              <td v-if="auth.rol === 'ADMIN'">
                <button class="btn btn-ghost btn-xs" @click="toggleActivo(p)">
                  {{ p.activo ? "Desactivar" : "Reactivar" }}
                </button>
              </td>
            </tr>
            <tr v-if="planes.length === 0">
              <td colspan="6" class="text-center opacity-60 py-6">
                No hay planes registrados.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>

  <!-- Modal: nuevo plan -->
  <dialog class="modal" :open="modalAbierto">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-3">Nuevo plan</h3>
      <form @submit.prevent="crearPlan" class="flex flex-col gap-3">
        <input
          v-model="nuevoPlan.nombre"
          required
          placeholder="Nombre (ej. Mensual, Pase Diario)"
          class="input input-bordered w-full"
        />
        <div class="flex gap-3">
          <label class="form-control flex-1">
            <span class="label-text mb-1">Duración (días)</span>
            <input
              v-model="nuevoPlan.duracionDias"
              type="number"
              min="1"
              required
              class="input input-bordered w-full"
            />
          </label>
          <label class="form-control flex-1">
            <span class="label-text mb-1">Precio (Bs)</span>
            <input
              v-model="nuevoPlan.precio"
              type="number"
              step="0.01"
              min="0"
              required
              class="input input-bordered w-full"
            />
          </label>
        </div>

        <label class="label cursor-pointer justify-start gap-2">
          <input v-model="nuevoPlan.esPromocion" type="checkbox" class="checkbox checkbox-sm" />
          <span class="label-text">Es una promoción</span>
        </label>

        <div v-if="nuevoPlan.esPromocion" class="flex gap-3">
          <label class="form-control flex-1">
            <span class="label-text mb-1">Vigente desde</span>
            <input
              v-model="nuevoPlan.fechaInicioPromo"
              type="date"
              class="input input-bordered w-full"
            />
          </label>
          <label class="form-control flex-1">
            <span class="label-text mb-1">Vigente hasta</span>
            <input
              v-model="nuevoPlan.fechaFinPromo"
              type="date"
              class="input input-bordered w-full"
            />
          </label>
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