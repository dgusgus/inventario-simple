import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth.js'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// api.js no depende de Vue/Pinia, así que cuando detecta un token
// rechazado avisa por este evento en vez de importar el store directo.
// Acá lo conectamos con el estado reactivo y mandamos al usuario al login.
window.addEventListener('sesion-expirada', () => {
  useAuthStore().limpiarLocal()
  router.push({ name: 'login' })
})

app.mount('#app')