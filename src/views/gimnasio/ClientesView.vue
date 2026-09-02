<script setup>
import { ref, computed, onMounted } from "vue";
import apiGimnasio from "../../services/api-gimnasio.js";
import GimnasioNav from "./GimnasioNav.vue";

const clientes = ref([]);
const cargando = ref(false);
const error = ref("");
const busqueda = ref("");

const modalAbierto = ref(false);
const guardando = ref(false);
const nuevoCliente = ref({ nombre: "", telefono: "", email: "" });

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

async function crearCliente() {
  guardando.value = true;
  try {
    await apiGimnasio.post("/clientes", nuevoCliente.value);
    modalAbierto.value = false;
    nuevoCliente.value = { nombre: "", telefono: "", email: "" };
    await cargarClientes();
  } catch (e) {
    error.value = e.response?.data?.error ?? "No se pudo crear el cliente.";
  } finally {
    guardando.value = false;
  }
}

onMounted(cargarClientes);
</script>

<template>
  <GimnasioNav />

  <div class="max-w-4xl mx-auto px-4 pb-10">
    <div class="flex flex-wrap gap-3 items-center justify-between mb-4">
      <h1 class="text-xl font-semibold">Clientes</h1>
      <div class="flex gap-2">
        <input
          v-model="busqueda"
          type="text"
          placeholder="Buscar por nombre..."
          class="input input-bordered input-sm"
        />
        <button class="btn btn-primary btn-sm" @click="modalAbierto = true">
          + Nuevo cliente
        </button>
      </div>
    </div>

    <p v-if="error" class="text-error text-sm mb-3">{{ error }}</p>

    <div v-if="cargando" class="flex justify-center py-10">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Teléfono</th>
            <th>Membresía</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in clientesFiltrados" :key="c.id">
            <td>{{ c.nombre }}</td>
            <td>{{ c.telefono || "—" }}</td>
            <td>
              <span class="badge" :class="estadoMembresia(c).clase">
                {{ estadoMembresia(c).texto }}
              </span>
            </td>
            <td>
              <router-link
                :to="{ name: 'gimnasio-membresias', query: { clienteId: c.id } }"
                class="link link-primary text-sm"
              >
                Gestionar membresía
              </router-link>
            </td>
          </tr>
          <tr v-if="clientesFiltrados.length === 0">
            <td colspan="4" class="text-center opacity-60 py-6">
              No hay clientes {{ busqueda ? "que coincidan" : "registrados" }}.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Modal: nuevo cliente -->
  <dialog class="modal" :open="modalAbierto">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-3">Nuevo cliente</h3>
      <form @submit.prevent="crearCliente" class="flex flex-col gap-3">
        <input
          v-model="nuevoCliente.nombre"
          required
          placeholder="Nombre completo"
          class="input input-bordered w-full"
        />
        <input
          v-model="nuevoCliente.telefono"
          placeholder="Teléfono (opcional)"
          class="input input-bordered w-full"
        />
        <input
          v-model="nuevoCliente.email"
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
</template>
