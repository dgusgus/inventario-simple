<script setup>
import { ref, computed, onMounted } from "vue";
import { useProductosStore } from "../stores/productos.js";
import { useMovimientosStore } from "../stores/movimientos.js";

const productosStore = useProductosStore();
const movimientosStore = useMovimientosStore();

function refrescar() {
  productosStore.cargar({ forzar: true });
  movimientosStore.cargar({ forzar: true });
}

// --- Alertas de stock ---
const productosEnAlerta = computed(() =>
  productosStore.lista.filter((p) => p.activo && p.stock_actual <= p.stock_minimo)
);

// --- Estadísticas por período ---
function claveMes(fecha) {
  const d = new Date(fecha);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // ej: "2026-08"
}

function nombreMes(clave) {
  const [anio, mes] = clave.split("-");
  const d = new Date(Number(anio), Number(mes) - 1);
  return d.toLocaleDateString("es-BO", { month: "short", year: "2-digit" });
}

function claveDia(fecha) {
  const d = new Date(fecha);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; // "2026-08-24"
}

function nombreDia(clave) {
  const [anio, mes, dia] = clave.split("-");
  const d = new Date(Number(anio), Number(mes) - 1, Number(dia));
  return d.toLocaleDateString("es-BO", { day: "numeric", month: "short" });
}

const estadisticasPorMes = computed(() => {
  const mapa = new Map(); // clave "2026-08" -> { entradas: 0, salidas: 0 }

  movimientosStore.lista.forEach((m) => {
    const clave = claveMes(m.fecha);
    if (!mapa.has(clave)) mapa.set(clave, { entradas: 0, salidas: 0 });
    const grupo = mapa.get(clave);
    if (m.tipo === "entrada") grupo.entradas += Number(m.cantidad);
    else grupo.salidas += Number(m.cantidad);
  });

  return Array.from(mapa.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([clave, valores]) => ({ clave, nombre: nombreMes(clave), ...valores }));
});

const maxValor = computed(() =>
  Math.max(1, ...estadisticasPorMes.value.flatMap((m) => [m.entradas, m.salidas]))
);

// --- Top productos más movidos ---
const topProductos = computed(() => {
  const mapa = new Map();

  movimientosStore.lista.forEach((m) => {
    const actual = mapa.get(String(m.producto_id)) || 0;
    mapa.set(String(m.producto_id), actual + Number(m.cantidad));
  });

  const nombrePorId = new Map(productosStore.lista.map((p) => [String(p.id), p.nombre]));

  return Array.from(mapa.entries())
    .map(([id, total]) => ({ nombre: nombrePorId.get(id) || `#${id}`, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
});

// --- Ganancias ---
function esVenta(m) {
  return m.tipo === "salida" && m.motivo === "venta";
}

function gananciaDeMovimiento(m) {
  const precioVenta = Number(m.precio_unitario) || 0;
  const costo = Number(m.costo_unitario) || 0;
  return (precioVenta - costo) * Number(m.cantidad);
}

const gananciaTotal = computed(() =>
  movimientosStore.lista.filter(esVenta).reduce((total, m) => total + gananciaDeMovimiento(m), 0)
);

const gananciaPorProducto = computed(() => {
  const mapa = new Map();
  const nombrePorId = new Map(productosStore.lista.map((p) => [String(p.id), p.nombre]));

  movimientosStore.lista.filter(esVenta).forEach((m) => {
    const id = String(m.producto_id);
    const actual = mapa.get(id) || 0;
    mapa.set(id, actual + gananciaDeMovimiento(m));
  });

  return Array.from(mapa.entries())
    .map(([id, ganancia]) => ({ nombre: nombrePorId.get(id) || `#${id}`, ganancia }))
    .sort((a, b) => b.ganancia - a.ganancia)
    .slice(0, 5);
});

const granularidad = ref("mes"); // "dia" | "mes"

function clave(fecha) {
  return granularidad.value === "dia" ? claveDia(fecha) : claveMes(fecha);
}
function nombrePeriodo(c) {
  return granularidad.value === "dia" ? nombreDia(c) : nombreMes(c);
}

const gananciaPorPeriodo = computed(() => {
  const mapa = new Map();

  movimientosStore.lista.filter(esVenta).forEach((m) => {
    const c = clave(m.fecha);
    const actual = mapa.get(c) || 0;
    mapa.set(c, actual + gananciaDeMovimiento(m));
  });

  const cantidadPeriodos = granularidad.value === "dia" ? 14 : 6;

  return Array.from(mapa.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-cantidadPeriodos)
    .map(([c, ganancia]) => ({ clave: c, nombre: nombrePeriodo(c), ganancia }));
});

onMounted(() => {
  productosStore.cargar();
  movimientosStore.cargar();
});
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">Dashboard</h2>
      <button class="btn btn-sm btn-ghost" @click="refrescar">Refrescar</button>
    </div>

    <div v-if="productosStore.cargando || movimientosStore.cargando" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="productosStore.error || movimientosStore.error" class="alert alert-error">
      <span>{{ productosStore.error || movimientosStore.error }}</span>
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

      <!-- Estadísticas mensuales -->
      <div>
        <h3 class="font-semibold mb-2">Movimientos por mes (últimos 6 meses)</h3>
        <div v-if="estadisticasPorMes.length === 0" class="alert">
          <span>Aún no hay movimientos registrados.</span>
        </div>
        <svg v-else :viewBox="`0 0 ${estadisticasPorMes.length * 100} 220`" class="w-full max-w-2xl">
          <g v-for="(m, i) in estadisticasPorMes" :key="m.clave" :transform="`translate(${i * 100}, 0)`">
            <rect x="15" :y="160 - (m.entradas / maxValor) * 140" width="28" :height="(m.entradas / maxValor) * 140" fill="#1D9E75" />
            <rect x="55" :y="160 - (m.salidas / maxValor) * 140" width="28" :height="(m.salidas / maxValor) * 140" fill="#D85A30" />
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

      <!-- Top productos -->
      <div>
        <h3 class="font-semibold mb-2">Productos con más movimiento (histórico)</h3>
        <div v-if="topProductos.length === 0" class="alert">
          <span>Aún no hay movimientos registrados.</span>
        </div>
        <table v-else class="table table-zebra w-full md:max-w-md">
          <thead><tr><th>Producto</th><th>Cantidad movida</th></tr></thead>
          <tbody>
            <tr v-for="p in topProductos" :key="p.nombre">
              <td>{{ p.nombre }}</td>
              <td>{{ p.total }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Ganancias -->
      <div>
        <h3 class="font-semibold mb-2">Ganancias</h3>
        <div class="stat bg-base-200 rounded-box max-w-xs mb-3">
          <div class="stat-title">Ganancia total (histórico)</div>
          <div class="stat-value text-success">{{ gananciaTotal.toFixed(2) }} Bs</div>
        </div>

        <table class="table table-zebra w-full md:max-w-md">
          <thead><tr><th>Producto</th><th>Ganancia</th></tr></thead>
          <tbody>
            <tr v-for="p in gananciaPorProducto" :key="p.nombre">
              <td>{{ p.nombre }}</td>
              <td>{{ p.ganancia.toFixed(2) }} Bs</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Ganancias por período -->
      <div>
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-semibold">Ganancias por período</h3>
          <div class="join">
            <button class="btn btn-xs join-item" :class="granularidad === 'dia' ? 'btn-active' : ''" @click="granularidad = 'dia'">Día</button>
            <button class="btn btn-xs join-item" :class="granularidad === 'mes' ? 'btn-active' : ''" @click="granularidad = 'mes'">Mes</button>
          </div>
        </div>

        <div v-if="gananciaPorPeriodo.length === 0" class="alert">
          <span>Aún no hay ventas registradas.</span>
        </div>
        <table v-else class="table table-zebra w-full md:max-w-md">
          <thead><tr><th>Período</th><th>Ganancia</th></tr></thead>
          <tbody>
            <tr v-for="p in gananciaPorPeriodo" :key="p.clave">
              <td>{{ p.nombre }}</td>
              <td class="text-success">{{ p.ganancia.toFixed(2) }} Bs</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>