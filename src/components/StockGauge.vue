<!-- src/components/StockGauge.vue -->
<script setup>
import { computed } from "vue";

const props = defineProps({
  actual: { type: Number, required: true },
  minimo: { type: Number, required: true },
});

// Referencia visual: 2x el mínimo = barra llena. Nunca negativo.
const porcentaje = computed(() => {
  const tope = Math.max(props.minimo * 2, 1);
  return Math.min(100, Math.max(0, (props.actual / tope) * 100));
});

const nivel = computed(() => {
  if (props.actual <= props.minimo) return "critico";
  if (props.actual <= props.minimo * 1.5) return "bajo";
  return "ok";
});

const colorClase = computed(() => ({
  critico: "bg-error",
  bajo: "bg-warning",
  ok: "bg-accent",
}[nivel.value]));
</script>

<template>
  <div class="flex items-center gap-2 w-full max-w-[140px]">
    <div class="h-2 flex-1 bg-base-300 rounded-full overflow-hidden">
      <div
        class="h-full rounded-full transition-all"
        :class="colorClase"
        :style="{ width: porcentaje + '%' }"
      ></div>
    </div>
    <span class="font-display tabular text-sm w-8 text-right">{{ actual }}</span>
  </div>
</template>