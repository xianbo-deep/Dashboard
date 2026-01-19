<script setup>
import { ref, onMounted } from 'vue';
import { getPerformanceTrend, getSlowestPages } from '@/api/monitor';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
]);

const loading = ref(true);
const trendOption = ref({});
const slowestOption = ref({});

const initTrendChart = (data) => {
  const times = data.map(item => item.time);
  const latencies = data.map(item => item.latency);

  trendOption.value = {
    backgroundColor: 'transparent',
    title: { text: '全站平均延迟趋势 (24h)', left: 'center', textStyle: { color: '#fff' } },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(20, 20, 20, 0.9)',
      borderColor: '#333',
      textStyle: { color: '#fff' },
      formatter: '{b}: {c}ms'
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: times,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#86909C' }
    },
    yAxis: {
      type: 'value',
      splitLine: { show: true, lineStyle: { type: 'dashed', color: '#333' } },
      axisLabel: { color: '#86909C' }
    },
    series: [
      {
        name: 'Avg Latency',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 3, color: '#FF7D00' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255, 125, 0, 0.5)' },
            { offset: 1, color: 'rgba(255, 125, 0, 0.0)' }
          ])
        },
        data: latencies
      }
    ]
  };
};

const initSlowestChart = (data) => {
  const sorted = [...data].sort((a, b) => a.avg_latency - b.avg_latency); // Ascending for bar chart y-axis
  const paths = sorted.map(item => item.path);
  const latencies = sorted.map(item => item.avg_latency);

  slowestOption.value = {
    backgroundColor: 'transparent',
    title: { text: '最慢页面 Top 10', left: 'center', textStyle: { color: '#fff' } },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(20, 20, 20, 0.9)',
      borderColor: '#333',
      textStyle: { color: '#fff' },
      formatter: '{b}: {c}ms'
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      splitLine: { show: true, lineStyle: { type: 'dashed', color: '#333' } },
      axisLabel: { color: '#86909C' }
    },
    yAxis: {
      type: 'category',
      data: paths,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#86909C', width: 150, overflow: 'truncate' }
    },
    series: [
      {
        name: 'Latency',
        type: 'bar',
        data: latencies,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: '#FF7D00' },
            { offset: 1, color: '#F7BA1E' }
          ]),
          borderRadius: [0, 4, 4, 0]
        },
        label: { show: true, position: 'right', color: '#fff', formatter: '{c}ms' }
      }
    ]
  };
};

onMounted(async () => {
  try {
    loading.value = true;
    const [trendData, slowestData] = await Promise.all([
      getPerformanceTrend(),
      getSlowestPages()
    ]);
    initTrendChart(trendData);
    initSlowestChart(slowestData);
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="performance-container">
    <a-card class="chart-card" :bordered="false">
      <div v-if="loading" class="chart-placeholder">
        <a-skeleton animation>
          <a-skeleton-shape style="width: 100%; height: 350px;" />
        </a-skeleton>
      </div>
      <v-chart v-else class="chart" :option="trendOption" autoresize />
    </a-card>

    <a-card class="chart-card" :bordered="false">
      <div v-if="loading" class="chart-placeholder">
        <a-skeleton animation>
          <a-skeleton-shape style="width: 100%; height: 400px;" />
        </a-skeleton>
      </div>
      <v-chart v-else class="chart-tall" :option="slowestOption" autoresize />
    </a-card>
  </div>
</template>

<style scoped>
.performance-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  /* Ensure card has content */
  min-height: 200px; 
}

.chart-placeholder {
  width: 100%;
  padding: 20px;
}

.chart {
  height: 350px;
  width: 100%;
}

.chart-tall {
  height: 400px;
  width: 100%;
}
</style>