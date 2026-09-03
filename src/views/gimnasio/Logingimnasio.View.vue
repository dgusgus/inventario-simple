<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useGimnasioAuthStore } from "../../stores/gimnasioAuth.js";

const email = ref("");
const password = ref("");
const cargando = ref(false);
const error = ref("");

const auth = useGimnasioAuthStore();
const router = useRouter();

async function onSubmit() {
  error.value = "";
  cargando.value = true;
  try {
    await auth.login(email.value, password.value);
    router.push({ name: "gimnasio-clientes" });
  } catch (e) {
    // El backend puede tardar en despertar (Render free) — se lo avisamos
    // al usuario en vez de dejar el error genérico de axios.
    if (e.code === "ECONNABORTED" || !e.response) {
      error.value =
        "El servidor puede estar despertando (tarda ~30-50s la primera vez). Intenta de nuevo en un momento.";
    } else {
      error.value = e.response?.data?.error ?? "Credenciales inválidas";
    }
  } finally {
    cargando.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-base-200 px-4">
    <div class="card w-full max-w-sm bg-base-100 shadow-xl">
      <div class="card-body">
        <h1 class="card-title justify-center mb-2">Gimnasio — Ingreso</h1>

        <form @submit.prevent="onSubmit" class="flex flex-col gap-3">
          <label class="form-control">
            <span class="label-text mb-1">Email</span>
            <input
              v-model="email"
              type="email"
              required
              class="input input-bordered w-full"
              placeholder="admin@gimnasio.com"
            />
          </label>

          <label class="form-control">
            <span class="label-text mb-1">Contraseña</span>
            <input
              v-model="password"
              type="password"
              required
              class="input input-bordered w-full"
            />
          </label>

          <p v-if="error" class="text-error text-sm">{{ error }}</p>

          <button
            type="submit"
            class="btn btn-primary mt-2"
            :class="{ 'btn-disabled': cargando }"
          >
            <span v-if="cargando" class="loading loading-spinner loading-sm"></span>
            {{ cargando ? "Ingresando..." : "Ingresar" }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>