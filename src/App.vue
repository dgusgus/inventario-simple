<script setup>
import { RouterView, RouterLink, useRoute } from "vue-router";
import { useAuthStore } from "./stores/auth.js";

const auth = useAuthStore();
const route = useRoute();
</script>

<template>
  <!-- Login queda fuera del shell (header/tabs/nav): pantalla propia, como antes -->
  <RouterView v-if="route.name === 'login'" />

  <div v-else class="min-h-screen pb-24 md:pb-0 bg-base-100">
    <div class="flex justify-between items-center p-4 gap-2">
      <span class="text-sm text-base-content/70 truncate">{{ auth.username }}</span>
      <div class="flex items-center gap-1 shrink-0">
        <!-- Acceso a "Nuevo usuario": icono solo, para no competir con la navegación principal en mobile -->
        <RouterLink
          :to="{ name: 'nuevo-usuario' }"
          class="btn btn-sm btn-ghost btn-square"
          :class="{ 'text-primary': route.name === 'nuevo-usuario' }"
          aria-label="Nuevo usuario"
          title="Nuevo usuario"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>
          </svg>
        </RouterLink>
        <button class="btn btn-sm btn-ghost" @click="auth.logout()">Cerrar sesión</button>
      </div>
    </div>

    <!-- Tabs: solo en pantallas medianas o más grandes -->
    <div class="hidden md:block p-4">
      <div role="tablist" class="tabs tabs-boxed w-fit">
        <RouterLink :to="{ name: 'productos' }" role="tab" class="tab" :class="{ 'tab-active': route.name === 'productos' }">Productos</RouterLink>
        <RouterLink :to="{ name: 'registrar-movimiento' }" role="tab" class="tab" :class="{ 'tab-active': route.name === 'registrar-movimiento' }">Registrar</RouterLink>
        <RouterLink :to="{ name: 'historial' }" role="tab" class="tab" :class="{ 'tab-active': route.name === 'historial' }">Historial</RouterLink>
        <RouterLink :to="{ name: 'dashboard' }" role="tab" class="tab" :class="{ 'tab-active': route.name === 'dashboard' }">Resumen</RouterLink>
        <RouterLink :to="{ name: 'nuevo-usuario' }" role="tab" class="tab" :class="{ 'tab-active': route.name === 'nuevo-usuario' }">Usuarios</RouterLink>
      </div>
    </div>

    <!-- Contenido: cada vista se monta/desmonta al navegar. Antes, con v-show,
         las 4 vistas quedaban montadas siempre aunque no se estuvieran viendo. -->
    <RouterView />

    <!-- Navegación móvil -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 z-50">
      <div class="flex items-end justify-around px-2 pb-2 pt-1 relative">

        <!-- Productos -->
        <RouterLink
          :to="{ name: 'productos' }"
          class="flex flex-col items-center gap-0.5 py-2 px-3 rounded-2xl transition-colors"
          :class="route.name === 'productos' ? 'text-primary bg-primary/10' : 'text-base-content/50'"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
            <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
          </svg>
          <span class="text-[11px] font-medium">Productos</span>
        </RouterLink>

        <!-- Historial -->
        <RouterLink
          :to="{ name: 'historial' }"
          class="flex flex-col items-center gap-0.5 py-2 px-3 rounded-2xl transition-colors"
          :class="route.name === 'historial' ? 'text-primary bg-primary/10' : 'text-base-content/50'"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
          </svg>
          <span class="text-[11px] font-medium">Historial</span>
        </RouterLink>

        <!-- Registrar: botón central elevado -->
        <RouterLink :to="{ name: 'registrar-movimiento' }" class="flex flex-col items-center -translate-y-4">
          <span class="flex items-center justify-center w-14 h-14 rounded-full shadow-lg bg-primary text-primary-content transition-transform active:scale-95">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </span>
          <span class="text-[11px] font-medium mt-0.5" :class="route.name === 'registrar-movimiento' ? 'text-primary' : 'text-base-content/50'">Registrar</span>
        </RouterLink>

        <!-- Resumen -->
        <RouterLink
          :to="{ name: 'dashboard' }"
          class="flex flex-col items-center gap-0.5 py-2 px-3 rounded-2xl transition-colors"
          :class="route.name === 'dashboard' ? 'text-primary bg-primary/10' : 'text-base-content/50'"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3v18h18"/><rect x="7" y="13" width="3" height="5"/><rect x="12" y="9" width="3" height="9"/><rect x="17" y="5" width="3" height="13"/>
          </svg>
          <span class="text-[11px] font-medium">Resumen</span>
        </RouterLink>

      </div>
    </nav>
  </div>
</template>