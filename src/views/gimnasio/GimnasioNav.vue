<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useGimnasioAuthStore } from "../../stores/gimnasioAuth.js";

const auth = useGimnasioAuthStore();
const route = useRoute();
const router = useRouter();

// Controlamos el menú móvil nosotros mismos (no con <details>/DaisyUI)
const menuAbierto = ref(false);

function toggleMenu() {
  menuAbierto.value = !menuAbierto.value;
}

function cerrarMenu() {
  menuAbierto.value = false;
}

// Secciones que van en la barra inferior móvil (las más usadas desde el celular)
const itemsInferior = [
  { nombre: "clientes", label: "Clientes", to: "gimnasio-clientes" },
  { nombre: "membresias", label: "Membresías", to: "gimnasio-membresias" },
  { nombre: "visitas", label: "Check-in", to: "gimnasio-visitas" },
  { nombre: "horarios", label: "Horarios", to: "gimnasio-horarios" },
  { nombre: "asistencia", label: "Asistencia", to: "gimnasio-asistencia" },
];

const itemsMenu = [
  { nombre: "clientes", label: "Clientes", to: "gimnasio-clientes" },
  { nombre: "planes", label: "Planes", to: "gimnasio-planes" },
  { nombre: "membresias", label: "Membresías", to: "gimnasio-membresias" },
  { nombre: "horarios", label: "Horarios", to: "gimnasio-horarios" },
  { nombre: "asistencia", label: "Asistencia", to: "gimnasio-asistencia" },
  { nombre: "pagos", label: "Pagos", to: "gimnasio-pagos" },
  { nombre: "instructores", label: "Instructores", to: "gimnasio-instructores" },
  { nombre: "visitas", label: "Check-in", to: "gimnasio-visitas" },
];

function estaActivo(to) {
  return route.name === to;
}

function logout() {
  cerrarMenu();
  auth.logout();
  router.push({ name: "gimnasio-login" });
}
</script>

<template>
  <div class="sticky top-0 z-[60] bg-base-100 shadow-md overflow-x-hidden">
    <!-- Header -->
    <div class="navbar">
      <div class="flex-1 gap-2 relative">
        <button type="button" class="btn btn-ghost btn-circle md:hidden" @click="toggleMenu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <!-- Menú móvil: overlay + panel, controlado por menuAbierto -->
        <div v-if="menuAbierto" class="fixed inset-0 z-[70] md:hidden" @click.self="cerrarMenu">
          <div class="absolute top-14 left-2 bg-base-100 rounded-box shadow-lg w-56 border border-base-300">
            <ul tabindex="0" class="menu">
              <li><span class="menu-title">Módulo Gimnasio</span></li>
              <li v-for="item in itemsMenu" :key="item.nombre">
                <RouterLink :to="{ name: item.to }" :class="{ 'text-primary font-semibold': estaActivo(item.to) }" @click="cerrarMenu">
                  {{ item.label }}
                </RouterLink>
              </li>
              <li v-if="auth.rol === 'ADMIN'">
                <RouterLink :to="{ name: 'gimnasio-sueldos' }" :class="{ 'text-primary font-semibold': estaActivo('gimnasio-sueldos') }" @click="cerrarMenu">
                  Sueldos
                </RouterLink>
              </li>
              <li class="menu-title mt-2">Sesión</li>
              <li><button class="text-error" @click="logout">Cerrar sesión</button></li>
            </ul>
          </div>
        </div>

        <RouterLink :to="{ name: 'gimnasio-clientes' }" class="font-semibold text-lg tracking-tight">
          Gimnasio
        </RouterLink>
      </div>

      <div class="flex-none hidden md:flex items-center gap-3">
        <span class="text-sm opacity-70">{{ auth.usuario?.nombre }}</span>
        <button class="btn btn-sm btn-outline" @click="logout">Salir</button>
      </div>
    </div>

    <!-- Navegación de escritorio: todos los módulos en la barra superior -->
    <nav class="hidden md:block px-3 pb-2">
      <div class="flex items-center gap-1 overflow-x-auto">
        <RouterLink
          v-for="item in itemsMenu"
          :key="item.nombre"
          :to="{ name: item.to }"
          class="btn btn-ghost btn-sm whitespace-nowrap"
          :class="{ 'btn-active pointer-events-none': estaActivo(item.to) }"
        >
          {{ item.label }}
        </RouterLink>
        <RouterLink
          v-if="auth.rol === 'ADMIN'"
          :to="{ name: 'gimnasio-sueldos' }"
          class="btn btn-ghost btn-sm whitespace-nowrap"
          :class="{ 'btn-active pointer-events-none': estaActivo('gimnasio-sueldos') }"
        >
          Sueldos
        </RouterLink>
      </div>
    </nav>
  </div>

  <!-- Barra de navegación inferior fija (móvil) -->
  <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 z-50">
    <div class="flex items-end justify-around px-2 pb-2 pt-1">
      <RouterLink
        v-for="item in itemsInferior"
        :key="item.nombre"
        :to="{ name: item.to }"
        class="flex flex-col items-center gap-0.5 py-2 px-3 rounded-2xl transition-colors text-[11px] font-medium"
        :class="estaActivo(item.to) ? 'text-primary bg-primary/10' : 'text-base-content/50'"
      >
        <!-- Clientes -->
        <svg v-if="item.nombre === 'clientes'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <!-- Membresías -->
        <svg v-else-if="item.nombre === 'membresias'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
        </svg>
        <!-- Check-in / Visitas -->
        <svg v-else-if="item.nombre === 'visitas'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="m9 11 3 3L22 4"/>
        </svg>
        <!-- Horarios -->
        <svg v-else-if="item.nombre === 'horarios'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <!-- Asistencia -->
        <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        <span>{{ item.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>