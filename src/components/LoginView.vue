<script setup>
import { ref } from "vue";
import api from "../services/api.js";

const emit = defineEmits(["login-exitoso"]);

const username = ref("");
const password = ref("");
const enviando = ref(false);
const error = ref(null);

async function enviar() {
  enviando.value = true;
  error.value = null;
  try {
    await api.login(username.value, password.value);
    emit("login-exitoso");
  } catch (e) {
    error.value = e.message;
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6 bg-base-200">
    <form @submit.prevent="enviar" class="card w-full max-w-sm bg-base-100 shadow-xl p-6 flex flex-col gap-4">
      <h1 class="text-xl font-bold text-center">Iniciar sesión</h1>

      <div v-if="error" class="alert alert-error">
        <span>{{ error }}</span>
      </div>

      <label class="form-control">
        <span class="label-text">Usuario</span>
        <input
          v-model="username"
          type="text"
          required
          autocomplete="username"
          class="input input-bordered"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Contraseña</span>
        <input
          v-model="password"
          type="password"
          required
          autocomplete="current-password"
          class="input input-bordered"
        />
      </label>

      <button type="submit" class="btn btn-primary mt-2" :disabled="enviando">
        <span v-if="enviando" class="loading loading-spinner"></span>
        {{ enviando ? "Ingresando..." : "Ingresar" }}
      </button>
    </form>
  </div>
</template>