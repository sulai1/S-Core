<template>
  <div ref="containerRef" class="timeline-chart-container">
    <div class="chart-wrapper">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  type ChartOptions,
  type TooltipItem,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';


ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export interface TimelineEvent {
  date: string | Date;
  value: number;
  label: string;
  category?: string;
}

export interface TimelineSeries {
  label: string;
  events: TimelineEvent[];
  backgroundColor?: string;
  borderColor?: string;
  fillArea?: boolean;
}

interface Props {
  data?: TimelineEvent[] | TimelineSeries[];
  title?: string;
  yAxisLabel?: string;
  backgroundColor?: string;
  borderColor?: string;
  fillArea?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  title: 'Timeline',
  yAxisLabel: 'Value',
  backgroundColor: 'rgba(75, 192, 192, 0.1)',
  borderColor: 'rgb(75, 192, 192)',
  fillArea: true,
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

// Default color palette for multiple series
const colorPalettes = [
  { bg: 'rgba(75, 192, 192, 0.1)', border: 'rgb(75, 192, 192)' },
  { bg: 'rgba(255, 99, 132, 0.1)', border: 'rgb(255, 99, 132)' },
  { bg: 'rgba(54, 162, 235, 0.1)', border: 'rgb(54, 162, 235)' },
  { bg: 'rgba(255, 206, 86, 0.1)', border: 'rgb(255, 206, 86)' },
  { bg: 'rgba(153, 102, 255, 0.1)', border: 'rgb(153, 102, 255)' },
  { bg: 'rgba(255, 159, 64, 0.1)', border: 'rgb(255, 159, 64)' },
];

const isSeriesArray = (arr: unknown[]): arr is TimelineSeries[] => {
  return arr.length > 0 && 'events' in (arr[0] as object);
};

const activeSeries = computed(() => {
  if (!props.data || props.data.length === 0) {
    return [];
  }

  if (isSeriesArray(props.data)) {
    return props.data;
  }

  // Wrap TimelineEvent[] in a series
  return [
    {
      label: props.title,
      events: props.data,
      backgroundColor: props.backgroundColor,
      borderColor: props.borderColor,
      fillArea: props.fillArea,
    },
  ];
});

const sortedSeries = computed(() => {
  return activeSeries.value.map((s) => ({
    ...s,
    events: [...s.events].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    }),
  }));
});

const dateFormatter = new Intl.DateTimeFormat('de-DE');

const chartData = computed(() => ({
  datasets: sortedSeries.value.map((s, index) => {
    const colors = colorPalettes[index % colorPalettes.length]!;
    return {
      label: s.label,
      data: s.events.map((event) => ({
        x: new Date(event.date).getTime(),
        y: event.value,
      })),
      backgroundColor: s.backgroundColor || colors.bg,
      borderColor: s.borderColor || colors.border,
      borderWidth: 2,
      fill: s.fillArea ?? true,
      pointRadius: 5,
      pointHoverRadius: 7,
      pointBackgroundColor: s.borderColor || colors.border,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    };
  }),
}));

const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  color: chartTheme.value.textColor,
  font: {
    family: chartTheme.value.fontFamily,
  },
  interaction: {
    intersect: false,
    mode: 'index',
  },
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 12,
        boxWidth: 10,
        color: chartTheme.value.textColor,
        font: {
          size: 11,
          family: chartTheme.value.fontFamily,
        },
      },
    },
    title: {
      display: true,
      text: props.title,
      font: {
        size: 15,
        weight: 'bold',
        family: chartTheme.value.fontFamily,
      },
      color: chartTheme.value.textColor,
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      titleFont: {
        size: 13,
        family: chartTheme.value.fontFamily,
      },
      bodyFont: {
        size: 12,
        family: chartTheme.value.fontFamily,
      },
      padding: 12,
      displayColors: true,
      callbacks: {
        title: (items: TooltipItem<'line'>[]) => {
          const xValue = items[0]?.parsed.x;
          return typeof xValue === 'number' ? dateFormatter.format(new Date(xValue)) : '';
        },
        label: (context: TooltipItem<'line'>) => `Value: ${context.parsed.y}`,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: props.yAxisLabel,
        color: chartTheme.value.textColor,
        font: {
          family: chartTheme.value.fontFamily,
        },
      },
      ticks: {
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
    x: {
      type: 'linear',
      ticks: {
        autoSkip: true,
        maxTicksLimit: 6,
        maxRotation: 0,
        color: chartTheme.value.mutedTextColor,
        font: {
          family: chartTheme.value.fontFamily,
        },
        callback: (value) => dateFormatter.format(new Date(Number(value))),
      },
      grid: {
        display: false,
      },
    },
  },
}));
</script>

<style scoped>
.timeline-chart-container {
  width: 100%;
  height: 100%;
  padding: 16px;
  background: var(--dashboard-surface-color, #ffffff);
  border: 1px solid var(--dashboard-border-color, rgba(31, 41, 55, 0.12));
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.chart-wrapper {
  position: relative;
  width: 100%;
  max-width: 100%;
  min-height: 320px;
}

@media (max-width: 600px) {
  .timeline-chart-container {
    padding: 12px;
  }

  .chart-wrapper {
    min-height: 260px;
  }
}
</style>
