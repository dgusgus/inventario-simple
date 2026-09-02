<script setup>
import { useRouter } from "vue-router";
import { useGimnasioAuthStore } from "../../stores/gimnasioAuth.js";

const auth = useGimnasioAuthStore();
const router = useRouter();

function logout() {
  auth.logout();
  router.push({ name: "gimnasio-login" });
}
</script>

<template>
  <div class="navbar bg-base-100 shadow mb-4">
    <div class="flex-1 gap-1">
      <router-link :to="{ name: 'gimnasio-clientes' }" class="btn btn-ghost btn-sm">
        Clientes
      </router-link>
      <router-link :to="{ name: 'gimnasio-membresias' }" class="btn btn-ghost btn-sm">
        Membresías
      </router-link>
      <router-link :to="{ name: 'gimnasio-pagos' }" class="btn btn-ghost btn-sm">
        Pagos
      </router-link>
      <router-link :to="{ name: 'gimnasio-instructores' }" class="btn btn-ghost btn-sm">
        Instructores
      </router-link>
    </div>
    <div class="flex-none flex items-center gap-3">
      <span class="text-sm opacity-70">{{ auth.usuario?.nombre }}</span>
      <button class="btn btn-sm btn-outline" @click="logout">Salir</button>
    </div>
  </div>
</template>
