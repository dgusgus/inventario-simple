import { createRouter, createWebHashHistory } from "vue-router";

import ListaProductos from "../components/ListaProductos.vue";
import RegistrarMovimiento from "../components/RegistrarMovimiento.vue";
import HistorialMovimientos from "../components/HistorialMovimientos.vue";
import Dashboard from "../components/Dashboard.vue";
import LoginView from "../components/LoginView.vue";

const routes = [
  { path: "/login", name: "login", component: LoginView },
  { path: "/", redirect: "/productos" },
  { path: "/productos", name: "productos", component: ListaProductos },
  { path: "/movimiento", name: "movimiento", component: RegistrarMovimiento },
  { path: "/historial", name: "historial", component: HistorialMovimientos },
  { path: "/dashboard", name: "dashboard", component: Dashboard },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// Guarda de navegación: protege todas las rutas excepto /login
router.beforeEach((to) => {
  const autenticado = !!localStorage.getItem("token");

  if (to.name !== "login" && !autenticado) {
    return { name: "login" };
  }
  if (to.name === "login" && autenticado) {
    return { name: "productos" };
  }
});

export default router;