<template>
  <div class="bar-chart-container">
    <div class="chart-scroll-wrapper" :style="wrapperStyle">
      <div class="chart-canvas-wrapper" :style="canvasWrapperStyle">
        <Bar :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
    return props.visibleBars;
  }

  return props.data.length;
});

const perBarPixels = computed(() => props.barPixelSize + props.barGapPixelSize);

const totalChartPixels = computed(() => {
  return Math.max(props.data.length, 1) * perBarPixels.value;
});

const visibleWindowPixels = computed(() => {
  return Math.max(effectiveVisibleBars.value, 1) * perBarPixels.value;
});

const wrapperStyle = computed<CSSProperties>(() => {
  if (!hasLimitedWindow.value) {
    return {
      overflowX: 'hidden',
      overflowY: 'hidden',
    };
  }

  if (isHorizontal.value) {
    return {
      maxHeight: `${visibleWindowPixels.value}px`,
      overflowY: 'auto',
      overflowX: 'hidden',
    };
  }

  return {
    maxWidth: '100%',
    overflowX: 'auto',
    overflowY: 'hidden',
  };
});

const canvasWrapperStyle = computed<CSSProperties>(() => {
  if (isHorizontal.value) {
    return {
      minHeight: `${totalChartPixels.value}px`,
      width: '100%',
      minWidth: '100%',
    };
  }

  return {
    minWidth: `${totalChartPixels.value}px`,
    minHeight: '360px',
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
  },
  scales: {
    x: {
      beginAtZero: true,
      title: {
        display: !isHorizontal.value,
        text: !isHorizontal.value ? props.axisLabel : '',
      },
      ticks: {
        autoSkip: false,
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.06)',
      },
    },
    y: {
      beginAtZero: isHorizontal.value,
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

.chart-scroll-wrapper {
  width: 100%;
}

.chart-canvas-wrapper {
  position: relative;
}
</style>
