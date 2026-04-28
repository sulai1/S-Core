<template>
  <div ref="containerRef" class="bar-chart-container">
    <div class="chart-canvas-wrapper">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  type ChartOptions,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, zoomPlugin);

export interface BarChartItem {
  label: string;
  value: number;
  backgroundColor?: string;
  borderColor?: string;
}

type Orientation = 'horizontal' | 'vertical';

interface Props {
  data?: BarChartItem[];
  title?: string;
  axisLabel?: string;
  orientation?: Orientation;
  visibleBars?: number;
  barPixelSize?: number;
  barGapPixelSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  title: 'Bar Chart',
  axisLabel: 'Value',
  orientation: 'horizontal',
  barPixelSize: 36,
  barGapPixelSize: 20,
});

const containerRef = ref<HTMLElement | null>(null);
const chartTheme = ref({
  fontFamily: 'Roboto, Helvetica Neue, Arial, sans-serif',
  textColor: '#1f2937',
  mutedTextColor: '#5f6b7a',
  gridColor: 'rgba(31, 41, 55, 0.14)',
});

function readCssVar(styles: CSSStyleDeclaration, name: string, fallback: string): string {
  const value = styles.getPropertyValue(name).trim();
  return value || fallback;
}

function syncThemeFromStyles() {
  if (!containerRef.value) {
    return;
  }

  const styles = getComputedStyle(containerRef.value);
  chartTheme.value = {
    fontFamily: styles.fontFamily || chartTheme.value.fontFamily,
    textColor: readCssVar(styles, '--dashboard-text-color', chartTheme.value.textColor),
    mutedTextColor: readCssVar(styles, '--dashboard-muted-text-color', chartTheme.value.mutedTextColor),
    gridColor: readCssVar(styles, '--dashboard-grid-color', chartTheme.value.gridColor),
  };
}

onMounted(() => {
  syncThemeFromStyles();
});

const isHorizontal = computed(() => props.orientation === 'horizontal');

const hasLimitedWindow = computed(() => {
  return typeof props.visibleBars === 'number' && props.visibleBars > 0 && props.data.length > props.visibleBars;
});

const effectiveVisibleBars = computed(() => {
  if (typeof props.visibleBars === 'number' && props.visibleBars > 0) {
    return Math.min(props.visibleBars, Math.max(props.data.length, 1));
  }

  return Math.max(props.data.length, 1);
});

const categoryAxisKey = computed(() => (isHorizontal.value ? 'y' : 'x'));

const categoryWindow = computed(() => {
  if (!hasLimitedWindow.value) {
    return {};
  }

  return {
    min: 0,
    max: Math.max(effectiveVisibleBars.value - 1, 0),
  };
});

const chartData = computed(() => ({
  labels: props.data.map((item) => item.label),
  datasets: [
    {
      label: props.axisLabel,
      data: props.data.map((item) => item.value),
      backgroundColor: props.data.map((item) => item.backgroundColor || 'rgba(54, 162, 235, 0.45)'),
      borderColor: props.data.map((item) => item.borderColor || 'rgb(54, 162, 235)'),
      borderWidth: 1,
      borderRadius: 5,
      borderSkipped: false,
      barThickness: props.barPixelSize,
      maxBarThickness: props.barPixelSize,
    },
  ],
}));

const chartOptions = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  color: chartTheme.value.textColor,
  font: {
    family: chartTheme.value.fontFamily,
  },
  indexAxis: isHorizontal.value ? 'y' : 'x',
  animation: false,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: true,
      text: props.title,
      color: chartTheme.value.textColor,
      font: {
        size: 16,
        weight: 'bold',
        family: chartTheme.value.fontFamily,
      },
    },
    tooltip: {
      titleFont: {
        family: chartTheme.value.fontFamily,
      },
      bodyFont: {
        family: chartTheme.value.fontFamily,
      },
      callbacks: {
        label: (context) => `${context.parsed.x ?? context.parsed.y}`,
      },
    },
    zoom: {
      limits: {
        [categoryAxisKey.value]: {
          min: 0,
          max: Math.max(props.data.length - 1, 0),
          minRange: Math.max(effectiveVisibleBars.value, 1),
        },
      },
      pan: {
        enabled: hasLimitedWindow.value,
        mode: 'y',
      },
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      title: {
        display: !isHorizontal.value,
        text: !isHorizontal.value ? props.axisLabel : '',
        color: chartTheme.value.textColor,
        font: {
          family: chartTheme.value.fontFamily,
        },
      },
      ticks: {
        autoSkip: true,
        maxTicksLimit: 6,
        color: chartTheme.value.mutedTextColor,
        font: {
          family: chartTheme.value.fontFamily,
        },
      },
      grid: {
        color: chartTheme.value.gridColor,
      },
    },
    y: {
      beginAtZero: isHorizontal.value,
      min: isHorizontal.value ? categoryWindow.value.min : undefined,
      max: isHorizontal.value ? categoryWindow.value.max : undefined,
      title: {
        display: isHorizontal.value,
        text: isHorizontal.value ? props.axisLabel : '',
        color: chartTheme.value.textColor,
        font: {
          family: chartTheme.value.fontFamily,
        },
      },
      ticks: {
        autoSkip: false,
        color: chartTheme.value.mutedTextColor,
        font: {
          family: chartTheme.value.fontFamily,
        },
      },
      grid: {
        display: !isHorizontal.value,
      },
    },
  },
}));
</script>

<style scoped>
.bar-chart-container {
  width: 100%;
  padding: 20px;
  background: var(--dashboard-surface-color, #ffffff);
  border: 1px solid var(--dashboard-border-color, rgba(31, 41, 55, 0.12));
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.chart-canvas-wrapper {
  position: relative;
  min-height: 360px;
}

@media (max-width: 600px) {
  .bar-chart-container {
    padding: 12px;
  }

  .chart-canvas-wrapper {
    min-height: 300px;
  }
}
</style>
