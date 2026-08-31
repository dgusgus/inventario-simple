// Agregar a tu router existente (junto al guard de inventario, sin reemplazarlo).
// Ejemplo de rutas del módulo:
//
// {
//   path: "/gimnasio",
//   meta: { requiereAuthGimnasio: true },
//   children: [
//     { path: "clientes", component: () => import("@/views/gimnasio/Clientes.vue") },
//     { path: "membresias", component: () => import("@/views/gimnasio/Membresias.vue") },
//     { path: "pagos", component: () => import("@/views/gimnasio/Pagos.vue") },
//   ],
// },
// { path: "/gimnasio/login", component: () => import("@/views/gimnasio/Login.vue") },

import { useGimnasioAuthStore } from "../stores/gimnasioAuth";

export function guardGimnasio(to, _from, next) {
  if (!to.meta.requiereAuthGimnasio) return next();

  const auth = useGimnasioAuthStore();
  if (!auth.estaAutenticado) {
    return next({ path: "/gimnasio/login" });
  }
  next();
}

// En tu archivo de router:
// router.beforeEach(guardGimnasio)
// (puede coexistir con el beforeEach que ya tienes para inventario,
// Vue Router ejecuta todos los guards registrados en orden)