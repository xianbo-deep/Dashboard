<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getPageDetail } from '@/api/monitor';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components';
import { 
  IconArrowLeft,
  IconEye,
  IconUserGroup,
  IconClockCircle,
  IconExport
} from '@arco-design/web-vue/es/icon';

use([
  CanvasRenderer,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
]);

const route = useRoute();
const router = useRouter();
const path = route.query.path || '未知路径';
const loading = ref(false);

const stats = ref({
  pv: 0,
  uv: 0
});

const trendOption = ref({});
const sourceOption = ref({});
const deviceOption = ref({});

const goBack = () => {
  router.back();
};

const fetchData = async () => {
  loading.value = true;
  try {
    const data = await getPageDetail(path);
    if (!data) return;

    stats.value = data.stats;

    // Trend Chart
    trendOption.value = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(29, 33, 41, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: { color: '#fff' }
      },
      legend: {
        data: ['浏览量 (PV)', '访客数 (UV)'],
        bottom: 0,
        textStyle: { color: '#86909C' }, // Arco secondary text color
        icon: 'circle'
      },
      grid: {
        top: '10%',
        left: '2%',
        right: '2%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.trend.map(item => item.time),
        axisLine: { lineStyle: { color: '#4E5969' } },
        axisLabel: { color: '#86909C' }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#272E3B', type: 'dashed' } },
        axisLine: { show: false },
        axisLabel: { color: '#86909C' }
      },
      series: [
        {
          name: '浏览量 (PV)',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: data.trend.map(item => item.pv),
          itemStyle: { color: '#4080FF' },
          areaStyle: {
            opacity: 0.1, 
            color: '#4080FF'
          }
        },
        {
          name: '访客数 (UV)',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: data.trend.map(item => item.uv),
          itemStyle: { color: '#2CAB40' },
          areaStyle: { 
            opacity: 0.1, 
            color: '#2CAB40' 
          }
        }
      ]
    };

    // Source Chart
    sourceOption.value = {
      backgroundColor: 'transparent',
      title: { 
        text: '流量来源', 
        left: 'center', 
        textStyle: { color: '#C9CDD4', fontSize: 14, fontWeight: 'normal' } 
      },
      tooltip: { 
        trigger: 'item',
        backgroundColor: 'rgba(29, 33, 41, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: { color: '#fff' }
      },
      legend: { 
        bottom: 0, 
        textStyle: { color: '#86909C' },
        icon: 'circle'
      },
      series: [
        {
          name: '来源',
          type: 'pie',
          radius: ['40%', '60%'],
          data: data.sources,
          label: { show: false },
          labelLine: { show: false },
          itemStyle: {
            borderWidth: 2,
            borderColor: '#232324'
          }
        }
      ]
    };

    // Device Chart
    deviceOption.value = {
      backgroundColor: 'transparent',
      title: { 
        text: '访问设备', 
        left: 'center', 
        textStyle: { color: '#C9CDD4', fontSize: 14, fontWeight: 'normal' } 
      },
      tooltip: { 
        trigger: 'item',
        backgroundColor: 'rgba(29, 33, 41, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: { color: '#fff' }
      },
      legend: { 
        bottom: 0, 
        textStyle: { color: '#86909C' },
        icon: 'circle' 
      },
      series: [
        {
          name: '设备',
          type: 'pie',
          radius: ['40%', '60%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderColor: '#232324',
            borderWidth: 2
          },
          label: { show: false, position: 'center' },
          emphasis: {
            label: { show: true, fontSize: 16, fontWeight: 'bold', color: '#fff' }
          },
          labelLine: { show: false },
          data: data.devices
        }
      ]
    };

  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="page-detail-container">
    <div class="header">
      <a-button @click="goBack" type="text" shape="circle" size="small">
        <template #icon><icon-arrow-left /></template>
      </a-button>
      <div class="header-content">
        <h2 class="title">页面详情</h2>
        <span class="path">{{ path }}</span>
      </div>
    </div>

    <a-spin :loading="loading" style="width: 100%; display: block;">
      <!-- Stats Cards -->
      <a-grid :cols="2" :colGap="16" :rowGap="16" class="stats-grid">
        <a-grid-item>
          <a-card class="data-card" :bordered="false">
            <div class="card-content">
              <div class="card-label">浏览量 (PV)</div>
              <div class="card-value">{{ stats.pv.toLocaleString() }}</div>
              <div class="card-icon pv-icon">
                <icon-eye />
              </div>
            </div>
          </a-card>
        </a-grid-item>
        <a-grid-item>
          <a-card class="data-card" :bordered="false">
            <div class="card-content">
              <div class="card-label">访客数 (UV)</div>
              <div class="card-value">{{ stats.uv.toLocaleString() }}</div>
              <div class="card-icon uv-icon">
                <icon-user-group />
              </div>
            </div>
          </a-card>
        </a-grid-item>
      </a-grid>

      <!-- Trend Chart -->
      <a-card class="chart-card" :bordered="false">
        <template #title>
          <span class="card-title">24小时流量趋势</span>
        </template>
        <div class="chart-container">
          <v-chart class="chart" :option="trendOption" autoresize />
        </div>
      </a-card>

      <!-- Bottom Charts -->
      <a-grid :cols="2" :colGap="16" :rowGap="16" style="margin-top: 16px;">
        <a-grid-item>
          <a-card class="chart-card" :bordered="false">
             <template #title>
              <span class="card-title">流量分布</span>
            </template>
            <div class="chart-container-sm">
              <v-chart class="chart" :option="sourceOption" autoresize />
            </div>
          </a-card>
        </a-grid-item>
        <a-grid-item>
          <a-card class="chart-card" :bordered="false">
             <template #title>
              <span class="card-title">设备占比</span>
            </template>
            <div class="chart-container-sm">
              <v-chart class="chart" :option="deviceOption" autoresize />
            </div>
          </a-card>
        </a-grid-item>
      </a-grid>
    </a-spin>
  </div>
</template>

<style scoped>
.page-detail-container {
  padding: 24px;
}
.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}
.header-content {
  display: flex;
  flex-direction: column;
}
.title {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  color: var(--color-text-1);
  line-height: 1.4;
}
.path {
  font-size: 13px;
  color: var(--color-text-3);
}

.stats-grid {
  margin-bottom: 24px;
}

.data-card {
  background: var(--color-bg-2);
  border-radius: 4px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}
.data-card:hover {
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.card-content {
  padding: 12px 0;
  position: relative;
  z-index: 1;
}

.card-label {
  color: var(--color-text-3);
  font-size: 13px;
  margin-bottom: 8px;
}

.card-value {
  color: var(--color-text-1);
  font-size: 26px;
  font-weight: 600;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.card-icon {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 32px;
  opacity: 0.1;
  pointer-events: none;
}
.pv-icon { color: #4080FF; }
.uv-icon { color: #2CAB40; }
.time-icon { color: #F7BA1E; }
.bounce-icon { color: #F53F3F; }

.chart-card {
  border-radius: 4px;
  background-color: var(--color-bg-2);
}
.card-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-1);
}

.chart-container {
  height: 320px;
  margin-top: 10px;
}
.chart-container-sm {
  height: 280px;
  margin-top: 10px;
}
.chart {
  height: 100%;
  width: 100%;
}
</style>

