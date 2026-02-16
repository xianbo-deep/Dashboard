
<script setup>
import { ref, onMounted, computed } from 'vue';
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
  DataZoomComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { IconArrowUp, IconArrowDown, IconThunderbolt, IconDashboard, IconBug } from '@arco-design/web-vue/es/icon';

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
]);

const loading = ref(true);
const trendOption = ref({});
const slowestOption = ref({});

const initTrendChart = (data) => {
  const times = data.map(item => item.time);
  const latencies = data.map(item => item.latency);

  trendOption.value = {
    backgroundColor: 'transparent',
    title: {
      text: '全站平均延迟趋势 (24h)',
      left: 'center',
      textStyle: { color: '#F3F4F6', fontSize: 16, fontWeight: 600 }
    },
    grid: { left: '3%', right: '4%', top: '60', bottom: '3%', containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(17, 24, 39, 0.9)',
      borderColor: '#374151',
      textStyle: { color: '#F9FAFB' },
      formatter: (params) => {
        const item = params[0];
        return `<div style="font-weight:bold; margin-bottom:4px;">${item.name}</div>
                <div style="display:flex; align-items:center;">
                  <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${item.color}; margin-right:8px;"></span>
                  <span>延迟: </span>
                  <span style="font-weight:bold; margin-left:4px;">${item.value} ms</span>
                </div>`;
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: times,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#9CA3AF', margin: 12 }
    },
    yAxis: {
      type: 'value',
      name: '延迟 (ms)',
      nameTextStyle: { color: '#9CA3AF', align: 'right', padding: [0, 10, 0, 0] },
      splitLine: { show: true, lineStyle: { type: 'dashed', color: '#374151' } },
      axisLabel: { color: '#9CA3AF' }
    },
    series: [
      {
        name: 'Avg Latency',
        type: 'line',
        smooth: true,
        showSymbol: false,
        symbolSize: 8,
        itemStyle: { color: '#6366f1' },
        lineStyle: { width: 3, color: '#6366f1' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(99, 102, 241, 0.5)' },
            { offset: 1, color: 'rgba(99, 102, 241, 0.0)' }
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
    title: {
      text: '最慢接口 Top 10',
      left: 'center',
      textStyle: { color: '#F3F4F6', fontSize: 16, fontWeight: 600 }
    },
    grid: { left: '3%', right: '4%', top: '50', bottom: '3%', containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(17, 24, 39, 0.9)',
      borderColor: '#374151',
      textStyle: { color: '#F9FAFB' },
      formatter: '{b}: <span style="font-weight:bold;">{c}ms</span>'
    },
    xAxis: {
      type: 'value',
      splitLine: { show: true, lineStyle: { type: 'dashed', color: '#374151' } },
      axisLabel: { color: '#9CA3AF' }
    },
    yAxis: {
      type: 'category',
      data: paths,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#D1D5DB', width: 200, overflow: 'truncate' }
    },
    series: [
      {
        name: 'Latency',
        type: 'bar',
        barWidth: 20,
        data: latencies,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: '#f43f5e' }, // rose-500
            { offset: 1, color: '#fb7185' }  // rose-400
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
    <a-row :gutter="[20, 20]">
      <a-col :span="24">
        <a-card class="chart-card" :bordered="false">
          <div v-if="loading" class="chart-placeholder">
            <a-skeleton animation>

              <a-skeleton-shape style="width: 100%; height: 350px;" />
            </a-skeleton>
          </div>
          <v-chart v-else class="chart" :option="trendOption" autoresize />
        </a-card>
      </a-col>
      
      <a-col :span="24">
        <a-card class="chart-card" :bordered="false">
          <div v-if="loading" class="chart-placeholder">
            <a-skeleton animation>
              <a-skeleton-shape style="width: 100%; height: 350px;" />
            </a-skeleton>
          </div>
          <v-chart v-else class="chart" :option="slowestOption" autoresize />
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>


<style scoped>
.performance-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: #fff;
  padding-bottom: 20px;
}

.chart-card {

  background: rgba(30, 30, 35, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #F3F4F6;
}

.chart-placeholder {
  width: 100%;
  padding: 10px;
}

.chart {
  height: 400px;
  width: 100%;
}

/* Arco Card Override */
:deep(.arco-card) {
  background: transparent;
}
:deep(.arco-card-header) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  height: 50px;
  padding: 0 20px;
}
:deep(.arco-card-body) {
  padding: 20px;
}
</style>
