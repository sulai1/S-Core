<template>
  <div class="bar-chart-container">
    <div class="chart-canvas-wrapper">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
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
  indexAxis: isHorizontal.value ? 'y' : 'x',
  animation: false,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: true,
      text: props.title,
      font: {
        size: 16,
        weight: 'bold',
      },
    },
    tooltip: {
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
      },
      ticks: {
        autoSkip: true,
        maxTicksLimit: 6,
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.06)',
      },
    },
    y: {
      beginAtZero: isHorizontal.value,
      min: isHorizontal.value ? categoryWindow.value.min : undefined,
      max: isHorizontal.value ? categoryWindow.value.max : undefined,
      title: {
        display: isHorizontal.value,
        text: isHorizontal.value ? props.axisLabel : '',
      },
      ticks: {
        autoSkip: false,
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
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
