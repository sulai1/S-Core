<template>
  <canvas ref="canvas" class="pie-chart"/>
</template>
<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
  import { Chart, registerables, type Chart as ChartType } from 'chart.js'

  const props = defineProps<{
    data: number[];
    labels: string[];
  }>();

  Chart.register(...registerables)
  const canvas = ref<HTMLCanvasElement | null>(null)
  const chartInstance = ref<ChartType | null>(null)

  function createChart() {
    if (!canvas.value) return
    // destroy existing instance if any
    if (chartInstance.value) {
      chartInstance.value.destroy()
      chartInstance.value = null
    }
    chartInstance.value = new Chart(canvas.value, {
      type: 'pie',
      data: {
        labels: props.labels || [],
        datasets: [{ label: 'Values', data: props.data || [] }]
      }
    })
  }

  onMounted(() => {
    createChart()
  })

  // update chart when props change (sync labels + data to avoid layout races)
  watch([
    () => props.data,
    () => props.labels,
  ], ([newData, newLabels]) => {
    if (!chartInstance.value) return
    // ensure labels exist before setting data to avoid generating undefined legend items
    chartInstance.value.data.labels = newLabels || []
    const ds = chartInstance.value.data.datasets?.[0]
    if (ds) {
      ds.data = newData  || []
    }
    chartInstance.value.update()
  }, { deep: true })

  onBeforeUnmount(() => {
    if (chartInstance.value) {
      chartInstance.value.destroy()
      chartInstance.value = null
    }
  })
</script>
