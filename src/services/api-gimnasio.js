import axios from "axios";
import { useGimnasioAuthStore } from "../stores/gimnasioAuth.js";

// Distinto del cliente que le habla a Apps Script: este apunta al
// backend Node/Express/Prisma desplegado en Railway.
const apiGimnasio = axios.create({
  baseURL: import.meta.env.VITE_API_GIMNASIO_URL,
});

apiGimnasio.interceptors.request.use((config) => {
  const auth = useGimnasioAuthStore();
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

apiGimnasio.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const auth = useGimnasioAuthStore();
      auth.logout();
    }
    return Promise.reject(error);
  }
);

export default apiGimnasio;
