<script setup>
import { ref } from "vue";
import api from "../services/api.js";

const username = ref("");
const password = ref("");
const confirmarPassword = ref("");

const enviando = ref(false);
const error = ref(null);
const exito = ref(false);

async function crear() {
  error.value = null;
  exito.value = false;

  // Validaciones del lado del cliente, antes de gastar una petición
  if (password.value.length < 6) {
    error.value = "La contraseña debe tener al menos 6 caracteres.";
    return;
  }
  if (password.value !== confirmarPassword.value) {
    error.value = "Las contraseñas no coinciden.";
    return;
  }

  enviando.value = true;
  try {
    await api.crearUsuario(username.value.trim(), password.value);
    exito.value = true;
    username.value = "";
    password.value = "";
    confirmarPassword.value = "";
  } catch (e) {
    error.value = e.message;
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <div class="p-6 max-w-sm">
    <h2 class="text-xl font-bold mb-4">Nuevo usuario</h2>

    <form @submit.prevent="crear" class="flex flex-col gap-3">
      <div v-if="error" class="alert alert-error">
        <span>{{ error }}</span>
      </div>
      <div v-if="exito" class="alert alert-success">
        <span>Usuario creado correctamente.</span>
      </div>

      <label class="form-control">
        <span class="label-text">Usuario</span>
        <input
          v-model="username"
          type="text"
          required
          minlength="3"
          autocomplete="off"
          class="input input-bordered"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Contraseña</span>
        <input
          v-model="password"
          type="password"
          required
          minlength="6"
          autocomplete="new-password"
          class="input input-bordered"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Confirmar contraseña</span>
        <input
          v-model="confirmarPassword"
          type="password"
          required
          autocomplete="new-password"
          class="input input-bordered"
        />
      </label>

      <button type="submit" class="btn btn-primary mt-2" :disabled="enviando">
        <span v-if="enviando" class="loading loading-spinner"></span>
        {{ enviando ? "Creando..." : "Crear usuario" }}
      </button>
    </form>
  </div>
</template>