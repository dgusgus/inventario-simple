<script setup>
import { ref, computed, onMounted } from "vue";
import api from "../services/api.js";

const productos = ref([]);
const movimientos = ref([]);
const cargando = ref(true);
const error = ref(null);

async function cargar() {
  cargando.value = true;
  error.value = null;
  try {
    const [prod, mov] = await Promise.all([api.getProductos(), api.getMovimientos()]);
    productos.value = prod;
    movimientos.value = mov;
  } catch (e) {
    error.value = e.message;
  } finally {
    cargando.value = false;
  }
}

// --- Alertas de stock ---
const productosEnAlerta = computed(() =>
  productos.value.filter((p) => p.activo && p.stock_actual <= p.stock_minimo)
);

// --- Estadísticas mensuales ---
function claveMes(fecha) {
  const d = new Date(fecha);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // ej: "2026-08"
}

function nombreMes(clave) {
  const [anio, mes] = clave.split("-");
  const d = new Date(Number(anio), Number(mes) - 1);
  return d.toLocaleDateString("es-BO", { month: "short", year: "2-digit" });
}

const estadisticasPorMes = computed(() => {
  const mapa = new Map(); // clave "2026-08" -> { entradas: 0, salidas: 0 }

  movimientos.value.forEach((m) => {
    const clave = claveMes(m.fecha);
    if (!mapa.has(clave)) mapa.set(clave, { entradas: 0, salidas: 0 });
    const grupo = mapa.get(clave);
    if (m.tipo === "entrada") grupo.entradas += Number(m.cantidad);
    else grupo.salidas += Number(m.cantidad);
  });

  // Ordenamos por clave (año-mes) ascendente, y tomamos los últimos 6 meses
  return Array.from(mapa.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([clave, valores]) => ({ clave, nombre: nombreMes(clave), ...valores }));
});

// Valor máximo entre entradas/salidas de todos los meses, para escalar las barras
const maxValor = computed(() =>
  Math.max(1, ...estadisticasPorMes.value.flatMap((m) => [m.entradas, m.salidas]))
);

// --- Top productos más movidos (por cantidad total, en todo el historial) ---
const topProductos = computed(() => {
  const mapa = new Map(); // producto_id -> cantidad total movida

  movimientos.value.forEach((m) => {
    const actual = mapa.get(String(m.producto_id)) || 0;
    mapa.set(String(m.producto_id), actual + Number(m.cantidad));
  });

  const nombrePorId = new Map(productos.value.map((p) => [String(p.id), p.nombre]));

  return Array.from(mapa.entries())
    .map(([id, total]) => ({ nombre: nombrePorId.get(id) || `#${id}`, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
});

// Dentro del <script setup> de Dashboard.vue, junto a las otras computed

// Solo cuenta ganancia en salidas cuyo motivo sea "venta" (una salida por "ajuste" o "devolución" no es una venta real)
function esVenta(m) {
  return m.tipo === "salida" && m.motivo === "venta";
}

function gananciaDeMovimiento(m) {
  const precioVenta = Number(m.precio_unitario) || 0;
  const costo = Number(m.costo_unitario) || 0;
  return (precioVenta - costo) * Number(m.cantidad);
}

const gananciaTotal = computed(() =>
  movimientos.value.filter(esVenta).reduce((total, m) => total + gananciaDeMovimiento(m), 0)
);

const gananciaPorMes = computed(() => {
  const mapa = new Map();

  movimientos.value.filter(esVenta).forEach((m) => {
    const clave = claveMes(m.fecha);
    const actual = mapa.get(clave) || 0;
    mapa.set(clave, actual + gananciaDeMovimiento(m));
  });

  return Array.from(mapa.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([clave, ganancia]) => ({ clave, nombre: nombreMes(clave), ganancia }));
});

const gananciaPorProducto = computed(() => {
  const mapa = new Map();
  const nombrePorId = new Map(productos.value.map((p) => [String(p.id), p.nombre]));

  movimientos.value.filter(esVenta).forEach((m) => {
    const id = String(m.producto_id);
    const actual = mapa.get(id) || 0;
    mapa.set(id, actual + gananciaDeMovimiento(m));
  });

  return Array.from(mapa.entries())
    .map(([id, ganancia]) => ({ nombre: nombrePorId.get(id) || `#${id}`, ganancia }))
    .sort((a, b) => b.ganancia - a.ganancia)
    .slice(0, 5);
});



// Dentro del <script setup> de Dashboard.vue

const granularidad = ref("mes"); // "dia" | "mes"

function claveDia(fecha) {
  const d = new Date(fecha);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; // "2026-08-24"
}

function nombreDia(clave) {
  const [anio, mes, dia] = clave.split("-");
  const d = new Date(Number(anio), Number(mes) - 1, Number(dia));
  return d.toLocaleDateString("es-BO", { day: "numeric", month: "short" });
}

// Selecciona la función de agrupación según la granularidad activa
function clave(fecha) {
  return granularidad.value === "dia" ? claveDia(fecha) : claveMes(fecha);
}
function nombrePeriodo(c) {
  return granularidad.value === "dia" ? nombreDia(c) : nombreMes(c);
}

// Reemplaza gananciaPorMes por esta versión genérica
const gananciaPorPeriodo = computed(() => {
  const mapa = new Map();

  movimientos.value.filter(esVenta).forEach((m) => {
    const c = clave(m.fecha);
    const actual = mapa.get(c) || 0;
    mapa.set(c, actual + gananciaDeMovimiento(m));
  });

  const cantidadPeriodos = granularidad.value === "dia" ? 14 : 6; // últimos 14 días o 6 meses

  return Array.from(mapa.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-cantidadPeriodos)
    .map(([c, ganancia]) => ({ clave: c, nombre: nombrePeriodo(c), ganancia }));
});

onMounted(cargar);
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">Dashboard</h2>
      <button class="btn btn-sm btn-ghost" @click="cargar">Refrescar</button>
    </div>

    <div v-if="cargando" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="error" class="alert alert-error">
      <span>{{ error }}</span>
    </div>

    <div v-else class="flex flex-col gap-6">
      <!-- Alertas de stock -->
      <div>
        <h3 class="font-semibold mb-2">Alertas de stock</h3>
        <div v-if="productosEnAlerta.length === 0" class="alert alert-success">
          <span>Todos los productos están sobre su stock mínimo.</span>
        </div>
        <div v-else class="flex flex-col gap-2">
          <div v-for="p in productosEnAlerta" :key="p.id" class="alert alert-warning">
            <span>
              <strong>{{ p.nombre }}</strong> — stock actual: {{ p.stock_actual }}, mínimo: {{ p.stock_minimo }}
            </span>
          </div>
        </div>
      </div>

      <!-- Estadísticas mensuales: gráfico de barras simple en SVG -->
      <div>
        <h3 class="font-semibold mb-2">Movimientos por mes (últimos 6 meses)</h3>
        <div v-if="estadisticasPorMes.length === 0" class="alert">
          <span>Aún no hay movimientos registrados.</span>
        </div>
        <svg v-else :viewBox="`0 0 ${estadisticasPorMes.length * 100} 220`" class="w-full max-w-2xl">
          <g v-for="(m, i) in estadisticasPorMes" :key="m.clave" :transform="`translate(${i * 100}, 0)`">
            <!-- Barra de entradas -->
            <rect
              x="15"
              :y="160 - (m.entradas / maxValor) * 140"
              width="28"
              :height="(m.entradas / maxValor) * 140"
              fill="#1D9E75"
            />
            <!-- Barra de salidas -->
            <rect
              x="55"
              :y="160 - (m.salidas / maxValor) * 140"
              width="28"
              :height="(m.salidas / maxValor) * 140"
              fill="#D85A30"
            />
            <text x="50" y="180" text-anchor="middle" font-size="12" fill="currentColor">{{ m.nombre }}</text>
            <text x="29" :y="155 - (m.entradas / maxValor) * 140" text-anchor="middle" font-size="10" fill="currentColor">{{ m.entradas }}</text>
            <text x="69" :y="155 - (m.salidas / maxValor) * 140" text-anchor="middle" font-size="10" fill="currentColor">{{ m.salidas }}</text>
          </g>
        </svg>
        <div class="flex gap-4 mt-2 text-sm">
          <span class="flex items-center gap-1"><span class="w-3 h-3 inline-block" style="background:#1D9E75"></span> Entradas</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 inline-block" style="background:#D85A30"></span> Salidas</span>
        </div>
      </div>

      <!-- Top productos más movidos -->
      <div>
        <h3 class="font-semibold mb-2">Productos con más movimiento (histórico)</h3>
        <div v-if="topProductos.length === 0" class="alert">
          <span>Aún no hay movimientos registrados.</span>
        </div>
        <table v-else class="table table-zebra max-w-md">
          <thead>
            <tr><th>Producto</th><th>Cantidad movida</th></tr>
          </thead>
          <tbody>
            <tr v-for="p in topProductos" :key="p.nombre">
              <td>{{ p.nombre }}</td>
              <td>{{ p.total }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <div>
  <h3 class="font-semibold mb-2">Ganancias</h3>
  <div class="stat bg-base-200 rounded-box max-w-xs mb-3">
    <div class="stat-title">Ganancia total (histórico)</div>
    <div class="stat-value text-success">{{ gananciaTotal.toFixed(2) }} Bs</div>
  </div>

  <table class="table table-zebra max-w-md">
    <thead><tr><th>Producto</th><th>Ganancia</th></tr></thead>
    <tbody>
      <tr v-for="p in gananciaPorProducto" :key="p.nombre">
        <td>{{ p.nombre }}</td>
        <td>{{ p.ganancia.toFixed(2) }} Bs</td>
      </tr>
    </tbody>
  </table>
</div>

<div>
  <div class="flex justify-between items-center mb-2">
    <h3 class="font-semibold">Ganancias por período</h3>
    <div class="join">
      <button
        class="btn btn-xs join-item"
        :class="granularidad === 'dia' ? 'btn-active' : ''"
        @click="granularidad = 'dia'"
      >Día</button>
      <button
        class="btn btn-xs join-item"
        :class="granularidad === 'mes' ? 'btn-active' : ''"
        @click="granularidad = 'mes'"
      >Mes</button>
    </div>
  </div>

  <div v-if="gananciaPorPeriodo.length === 0" class="alert">
    <span>Aún no hay ventas registradas.</span>
  </div>
  <table v-else class="table table-zebra max-w-md">
    <thead><tr><th>Período</th><th>Ganancia</th></tr></thead>
    <tbody>
      <tr v-for="p in gananciaPorPeriodo" :key="p.clave">
        <td>{{ p.nombre }}</td>
        <td class="text-success">{{ p.ganancia.toFixed(2) }} Bs</td>
      </tr>
    </tbody>
  </table>
</div>
</template>