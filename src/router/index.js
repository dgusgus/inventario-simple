// src/router/index.js
import { createRouter, createWebHashHistory } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

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
];

const router = createRouter({
  // Hash history: no requiere configurar rewrites en el servidor,
  // por eso es la opción correcta para desplegar en GitHub Pages.
  history: createWebHashHistory(),
  routes,
});

// Guarda de navegación única: reemplaza la lógica repartida que había
// entre App.vue (v-if de LoginView) y cada componente.
router.beforeEach((to) => {
  const auth = useAuthStore();

  if (!to.meta.publica && !auth.autenticado) {
    return { name: "login" };
  }
  if (to.name === "login" && auth.autenticado) {
    return { name: "productos" };
  }
});

export default router;