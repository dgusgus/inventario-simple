// src/router/index.js
import { createRouter, createWebHashHistory } from "vue-router";
import { useAuthStore } from "../stores/auth.js";
import { useGimnasioAuthStore } from "../stores/gimnasioAuth.js";

// Cada vista se carga con import() dinámico: el bundle inicial no
// incluye el código de Dashboard/Historial/etc. hasta que el usuario
// realmente navega a esa pantalla.
const routes = [
  {
    path: "/login",
    name: "login",
    component: () => import("../views/LoginView.vue"),
    meta: { publica: true },
  },
  { path: "/", redirect: "/productos" },
  {
    path: "/productos",
    name: "productos",
    component: () => import("../views/ProductosView.vue"),
  },
  {
    path: "/movimientos/nuevo",
    name: "registrar-movimiento",
    component: () => import("../views/RegistrarMovimientoView.vue"),
  },
  {
    path: "/historial",
    name: "historial",
    component: () => import("../views/HistorialView.vue"),
  },
  {
    path: "/dashboard",
    name: "dashboard",
    component: () => import("../views/DashboardView.vue"),
  },
  {
    path: "/usuarios/nuevo",
    name: "nuevo-usuario",
    component: () => import("../views/UsuariosView.vue"),
  },

  // --- Módulo gimnasio: login y auth propios, separados de inventario.
  // meta.publica: true para que el guard de inventario (más abajo) los
  // deje pasar sin pedir el login de Sheets.
  {
    path: "/gimnasio/login",
    name: "gimnasio-login",
    component: () => import("../views/gimnasio/LoginView.vue"),
    meta: { publica: true },
  },
  {
    path: "/gimnasio/clientes",
    name: "gimnasio-clientes",
    component: () => import("../views/gimnasio/ClientesView.vue"),
    meta: { publica: true, requiereAuthGimnasio: true },
  },
  {
    path: "/gimnasio/planes",
    name: "gimnasio-planes",
    component: () => import("../views/gimnasio/Planesview.vue"),
    meta: { publica: true, requiereAuthGimnasio: true },
  },
  {
    path: "/gimnasio/membresias",
    name: "gimnasio-membresias",
    component: () => import("../views/gimnasio/MembresiasView.vue"),
    meta: { publica: true, requiereAuthGimnasio: true },
  },
  {
    path: "/gimnasio/horarios",
    name: "gimnasio-horarios",
    component: () => import("../views/gimnasio/Horariosview.vue"),
    meta: { publica: true, requiereAuthGimnasio: true },
  },
  {
    path: "/gimnasio/asistencia",
    name: "gimnasio-asistencia",
    component: () => import("../views/gimnasio/Asistenciaview.vue"),
    meta: { publica: true, requiereAuthGimnasio: true },
  },
  {
    path: "/gimnasio/pagos",
    name: "gimnasio-pagos",
    component: () => import("../views/gimnasio/PagosView.vue"),
    meta: { publica: true, requiereAuthGimnasio: true },
  },
  {
    path: "/gimnasio/instructores",
    name: "gimnasio-instructores",
    component: () => import("../views/gimnasio/InstructoresView.vue"),
    meta: { publica: true, requiereAuthGimnasio: true },
  },
  {
    path: "/gimnasio/visitas",
    name: "gimnasio-visitas",
    component: () => import("../views/gimnasio/Visitasview.vue"),
    meta: { publica: true, requiereAuthGimnasio: true },
  },
  {
    path: "/gimnasio/sueldos",
    name: "gimnasio-sueldos",
    component: () => import("../views/gimnasio/Sueldosview.vue"),
    meta: { publica: true, requiereAuthGimnasio: true },
  },
];

const router = createRouter({
  // Hash history: no requiere configurar rewrites en el servidor,
  // por eso es la opción correcta para desplegar en GitHub Pages.
  history: createWebHashHistory(),
  routes,
});

// Guarda de navegación de inventario (login con Sheets/Apps Script)
router.beforeEach((to) => {
  const auth = useAuthStore();

  if (!to.meta.publica && !auth.autenticado) {
    return { name: "login" };
  }
  if (to.name === "login" && auth.autenticado) {
    return { name: "productos" };
  }
});

// Guarda de navegación del gimnasio (login propio, JWT del backend Node)
router.beforeEach((to) => {
  const authGimnasio = useGimnasioAuthStore();

  if (to.meta.requiereAuthGimnasio && !authGimnasio.estaAutenticado) {
    return { name: "gimnasio-login" };
  }
  if (to.name === "gimnasio-login" && authGimnasio.estaAutenticado) {
    return { name: "gimnasio-clientes" };
  }
});

export default router;