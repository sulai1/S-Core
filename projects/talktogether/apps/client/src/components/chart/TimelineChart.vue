<template>
  <div class="timeline-chart-container">
    <div class="chart-wrapper">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
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

interface Props {
  events?: TimelineEvent[];
  title?: string;
  yAxisLabel?: string;
  backgroundColor?: string;
  borderColor?: string;
  fillArea?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  events: () => [],
  title: 'Timeline',
  yAxisLabel: 'Value',
  backgroundColor: 'rgba(75, 192, 192, 0.1)',
  borderColor: 'rgb(75, 192, 192)',
  fillArea: true,
});

const sortedEvents = computed(() => {
  return [...props.events].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
});

const dateFormatter = new Intl.DateTimeFormat('de-DE');

const chartData = computed(() => ({
  datasets: [
    {
      label: props.title,
      data: sortedEvents.value.map((event) => ({
        x: new Date(event.date).getTime(),
        y: event.value,
      })),
      backgroundColor: props.backgroundColor,
      borderColor: props.borderColor,
      borderWidth: 2,
      fill: props.fillArea,
      pointRadius: 5,
      pointHoverRadius: 7,
      pointBackgroundColor: props.borderColor,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    },
  ],
}));

const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: 2,
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
        padding: 15,
        font: {
          size: 12,
        },
      },
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
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleFont: {
        size: 13,
      },
      bodyFont: {
        size: 12,
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
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
    },
    x: {
      type: 'linear',
      ticks: {
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
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-wrapper {
  position: relative;
  width: 100%;
  max-width: 100%;
}
</style>
