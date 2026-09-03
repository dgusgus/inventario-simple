<script setup>
import { ref, computed, onMounted } from "vue";
import apiGimnasio from "../../services/api-gimnasio.js";
import { useGimnasioAuthStore } from "../../stores/gimnasioAuth.js";
import GimnasioNav from "./GimnasioNav.vue";

const auth = useGimnasioAuthStore();

const clientes = ref([]);
const cargando = ref(false);
const error = ref("");
const busqueda = ref("");

const modalAbierto = ref(false);
const guardando = ref(false);
const esEdicion = ref(false);
const clienteEditandoId = ref(null);
const formCliente = ref({ nombre: "", telefono: "", email: "" });

const modalEliminarAbierto = ref(false);
const clienteParaEliminar = ref(null);
const eliminando = ref(false);

const clientesFiltrados = computed(() => {
  if (!busqueda.value.trim()) return clientes.value;
  const q = busqueda.value.trim().toLowerCase();
  return clientes.value.filter((c) => c.nombre.toLowerCase().includes(q));
});

async function cargarClientes() {
  cargando.value = true;
  error.value = "";
  try {
    const { data } = await apiGimnasio.get("/clientes", {
      params: { activo: true },
    });
    clientes.value = data;
  } catch (e) {
    error.value = "No se pudo cargar la lista de clientes.";
  } finally {
    cargando.value = false;
  }
}

function estadoMembresia(cliente) {
  const ultima = cliente.membresias?.[0];
  if (!ultima) return { texto: "Sin membresía", clase: "badge-ghost" };
  if (ultima.estado === "CANCELADA") {
    return { texto: "Cancelada", clase: "badge-ghost" };
  }
  const vencida = new Date(ultima.fechaVencimiento) < new Date();
  if (vencida) return { texto: "Vencida", clase: "badge-error" };
  return { texto: "Activa", clase: "badge-success" };
}

function abrirModalCrear() {
  esEdicion.value = false;
  clienteEditandoId.value = null;
  formCliente.value = { nombre: "", telefono: "", email: "" };
  modalAbierto.value = true;
}

function abrirModalEditar(cliente) {
  esEdicion.value = true;
  clienteEditandoId.value = cliente.id;
  formCliente.value = {
    nombre: cliente.nombre,
    telefono: cliente.telefono || "",
    email: cliente.email || "",
  };
  modalAbierto.value = true;
}

async function guardarCliente() {
  guardando.value = true;
  error.value = "";
  try {
    if (esEdicion.value) {
      await apiGimnasio.patch(`/clientes/${clienteEditandoId.value}`, formCliente.value);
    } else {
      await apiGimnasio.post("/clientes", formCliente.value);
    }
    modalAbierto.value = false;
    await cargarClientes();
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo guardar el cliente.";
  } finally {
    guardando.value = false;
  }
}

function abrirModalEliminar(cliente) {
  clienteParaEliminar.value = cliente;
  modalEliminarAbierto.value = true;
}

async function eliminarCliente() {
  if (!clienteParaEliminar.value) return;
  eliminando.value = true;
  error.value = "";
  try {
    await apiGimnasio.delete(`/clientes/${clienteParaEliminar.value.id}`);
    modalEliminarAbierto.value = false;
    clienteParaEliminar.value = null;
    await cargarClientes();
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo eliminar el cliente.";
  } finally {
    eliminando.value = false;
  }
}

onMounted(cargarClientes);
</script>

<template>
  <GimnasioNav />

  <div class="max-w-4xl mx-auto px-4 pb-20 md:pb-10">
    <div class="flex flex-wrap gap-3 items-center justify-between mb-4">
      <h1 class="text-xl font-semibold">Clientes</h1>
      <div class="flex gap-2 w-full sm:w-auto">
        <input
          v-model="busqueda"
          type="text"
          placeholder="Buscar por nombre..."
          class="input input-bordered input-sm flex-1 sm:flex-none"
        />
        <button class="btn btn-primary btn-sm shrink-0" @click="abrirModalCrear">
          + Nuevo
        </button>
      </div>
    </div>

    <p v-if="error" class="text-error text-sm mb-3">{{ error }}</p>

    <div v-if="cargando" class="flex justify-center py-10">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <template v-else>
      <!-- Móvil: lista de tarjetas. Cada cliente es una tarjeta con nombre y
           estado arriba, contacto en medio, y acciones abajo como botones
           grandes (fáciles de tocar), en vez de links apretados en una celda. -->
      <div class="md:hidden flex flex-col gap-3">
        <div
          v-for="c in clientesFiltrados"
          :key="c.id"
          class="card bg-base-100 shadow border border-base-200"
        >
          <div class="card-body p-4 gap-2">
            <div class="flex items-start justify-between gap-2">
              <h2 class="font-semibold leading-tight">{{ c.nombre }}</h2>
              <span class="badge shrink-0" :class="estadoMembresia(c).clase">
                {{ estadoMembresia(c).texto }}
              </span>
            </div>

            <div class="text-sm opacity-70 flex flex-col gap-0.5">
              <span>{{ c.telefono || "Sin teléfono" }}</span>
              <span>{{ c.email || "Sin email" }}</span>
            </div>

            <div class="grid grid-cols-2 gap-2 mt-2">
              <router-link
                :to="{ name: 'gimnasio-membresias', query: { clienteId: c.id } }"
                class="btn btn-sm btn-soft btn-primary"
              >
                Membresía
              </router-link>
              <router-link
                :to="{ name: 'gimnasio-asistencia', query: { clienteId: c.id } }"
                class="btn btn-sm btn-soft btn-secondary"
              >
                Horario
              </router-link>
              <button
                v-if="auth.rol === 'ADMIN'"
                class="btn btn-sm btn-soft"
                @click="abrirModalEditar(c)"
              >
                Editar
              </button>
              <button
                v-if="auth.rol === 'ADMIN'"
                class="btn btn-sm btn-soft btn-error"
                @click="abrirModalEliminar(c)"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>

        <p v-if="clientesFiltrados.length === 0" class="text-center opacity-60 py-10">
          No hay clientes {{ busqueda ? "que coincidan" : "registrados" }}.
        </p>
      </div>

      <!-- Escritorio: se mantiene como tabla, aprovechando el ancho disponible. -->
      <div class="hidden md:block overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Membresía</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in clientesFiltrados" :key="c.id">
              <td>{{ c.nombre }}</td>
              <td>{{ c.telefono || "—" }}</td>
              <td>{{ c.email || "—" }}</td>
              <td>
                <span class="badge" :class="estadoMembresia(c).clase">
                  {{ estadoMembresia(c).texto }}
                </span>
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  <router-link
                    :to="{ name: 'gimnasio-membresias', query: { clienteId: c.id } }"
                    class="link link-primary text-sm"
                  >
                    Membresía
                  </router-link>
                  <router-link
                    :to="{ name: 'gimnasio-asistencia', query: { clienteId: c.id } }"
                    class="link link-primary text-sm"
                  >
                    Horario
                  </router-link>
                  <button
                    v-if="auth.rol === 'ADMIN'"
                    class="link text-sm"
                    @click="abrirModalEditar(c)"
                  >
                    Editar
                  </button>
                  <button
                    v-if="auth.rol === 'ADMIN'"
                    class="link text-sm text-error"
                    @click="abrirModalEliminar(c)"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="clientesFiltrados.length === 0">
              <td colspan="5" class="text-center opacity-60 py-6">
                No hay clientes {{ busqueda ? "que coincidan" : "registrados" }}.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>

  <!-- Modal: crear/editar cliente -->
  <dialog class="modal" :open="modalAbierto">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-3">{{ esEdicion ? "Editar cliente" : "Nuevo cliente" }}</h3>
      <form @submit.prevent="guardarCliente" class="flex flex-col gap-3">
        <input
          v-model="formCliente.nombre"
          required
          placeholder="Nombre completo"
          class="input input-bordered w-full"
        />
        <input
          v-model="formCliente.telefono"
          placeholder="Teléfono (opcional)"
          class="input input-bordered w-full"
        />
        <input
          v-model="formCliente.email"
          type="email"
          placeholder="Email (opcional)"
          class="input input-bordered w-full"
        />
        <div class="modal-action">
          <button type="button" class="btn" @click="modalAbierto = false">
            Cancelar
          </button>
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

  <!-- Modal: confirmar eliminación -->
  <dialog class="modal" :open="modalEliminarAbierto">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-3">Eliminar cliente</h3>
      <p class="mb-4">
        ¿Estás seguro de eliminar a <strong>{{ clienteParaEliminar?.nombre }}</strong>?
        Esta acción desactivará al cliente del sistema.
      </p>
      <div class="modal-action">
        <button type="button" class="btn" @click="modalEliminarAbierto = false" :disabled="eliminando">
          Cancelar
        </button>
        <button type="button" class="btn btn-error" @click="eliminarCliente" :disabled="eliminando">
          {{ eliminando ? "Eliminando..." : "Eliminar" }}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop" @click="modalEliminarAbierto = false">
      <button>cerrar</button>
    </form>
  </dialog>
</template>