<script setup>
import { ref } from "vue";
import ListaProductos from "./components/ListaProductos.vue";
import RegistrarMovimiento from "./components/RegistrarMovimiento.vue";
import HistorialMovimientos from "./components/HistorialMovimientos.vue";
import Dashboard from "./components/Dashboard.vue";

const vista = ref("productos");
const refreshKey = ref(0);

function onMovimientoRegistrado() {
  refreshKey.value++;
  vista.value = "productos";
}
</script>

<template>
  <div class="min-h-screen pb-24 md:pb-0 bg-base-100">
    <!-- Tabs: solo en pantallas medianas o más grandes -->
    <div class="hidden md:block p-4">
      <div role="tablist" class="tabs tabs-boxed w-fit">
        <a role="tab" class="tab" :class="{ 'tab-active': vista === 'productos' }" @click="vista = 'productos'">Productos</a>
        <a role="tab" class="tab" :class="{ 'tab-active': vista === 'movimiento' }" @click="vista = 'movimiento'">Registrar</a>
        <a role="tab" class="tab" :class="{ 'tab-active': vista === 'historial' }" @click="vista = 'historial'">Historial</a>
        <a role="tab" class="tab" :class="{ 'tab-active': vista === 'dashboard' }" @click="vista = 'dashboard'">Resumen</a>
      </div>
    </div>

    <!-- Contenido -->
    <div>
      <div v-show="vista === 'productos'"><ListaProductos :key="refreshKey" /></div>
      <div v-show="vista === 'movimiento'"><RegistrarMovimiento @movimiento-registrado="onMovimientoRegistrado" /></div>
      <div v-show="vista === 'historial'"><HistorialMovimientos /></div>
      <div v-show="vista === 'dashboard'"><Dashboard /></div>
    </div>

    <!-- Navegación móvil -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 z-50">
      <div class="flex items-end justify-around px-2 pb-2 pt-1 relative">

        <!-- Productos -->
        <button
          class="flex flex-col items-center gap-0.5 py-2 px-3 rounded-2xl transition-colors"
          :class="vista === 'productos' ? 'text-primary bg-primary/10' : 'text-base-content/50'"
          @click="vista = 'productos'"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
            <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
          </svg>
          <span class="text-[11px] font-medium">Productos</span>
        </button>

        <!-- Historial -->
        <button
          class="flex flex-col items-center gap-0.5 py-2 px-3 rounded-2xl transition-colors"
          :class="vista === 'historial' ? 'text-primary bg-primary/10' : 'text-base-content/50'"
          @click="vista = 'historial'"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
          </svg>
          <span class="text-[11px] font-medium">Historial</span>
        </button>

        <!-- Registrar: botón central elevado -->
        <button
          class="flex flex-col items-center -translate-y-4"
          @click="vista = 'movimiento'"
        >
          <span
            class="flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform active:scale-95"
            :class="vista === 'movimiento' ? 'bg-primary text-primary-content' : 'bg-primary text-primary-content'"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </span>
          <span class="text-[11px] font-medium mt-0.5" :class="vista === 'movimiento' ? 'text-primary' : 'text-base-content/50'">Registrar</span>
        </button>

        <!-- Resumen -->
        <button
          class="flex flex-col items-center gap-0.5 py-2 px-3 rounded-2xl transition-colors"
          :class="vista === 'dashboard' ? 'text-primary bg-primary/10' : 'text-base-content/50'"
          @click="vista = 'dashboard'"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3v18h18"/><rect x="7" y="13" width="3" height="5"/><rect x="12" y="9" width="3" height="9"/><rect x="17" y="5" width="3" height="13"/>
          </svg>
          <span class="text-[11px] font-medium">Resumen</span>
        </button>

      </div>
    </nav>
  </div>
</template>