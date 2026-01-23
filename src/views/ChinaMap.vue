<script setup>
import { ref, onMounted, watch } from 'vue';
import { getChinaStats } from '@/api/monitor';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { MapChart } from 'echarts/charts';
import {
  TooltipComponent,
  VisualMapComponent,
  GeoComponent,
  TitleComponent
} from 'echarts/components';
import * as echarts from 'echarts/core';
import axios from 'axios';

use([
  CanvasRenderer,
  MapChart,
  TooltipComponent,
  VisualMapComponent,
  GeoComponent,
  TitleComponent
]);

const loading = ref(false);
const end = Date.now();
const start = end - 30 * 24 * 60 * 60 * 1000;
const dateRange = ref([start, end]);
const mapOption = ref({});

const registerMap = async () => {
  try {
    // Using a CDN for the China map GeoJSON
    const { data } = await axios.get('https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/json/china.json');
    echarts.registerMap('china', data);
  } catch (error) {
    console.error('Failed to load map data', error);
  }
};

const fetchData = async () => {
  loading.value = true;
  try {
    // 拆分传递开始和结束时间
    const [start, end] = dateRange.value || [];
    const data = await getChinaStats(start, end);
    
    mapOption.value = {
      backgroundColor: 'transparent',
      title: {
        text: '中国访客分布',
        left: 'center',
        top: 20,
        textStyle: { color: '#fff' }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(20, 20, 20, 0.9)',
        borderColor: '#333',
        textStyle: { color: '#fff' },
        formatter: function (params) {
          const value = Number.isNaN(params.value) ? 0 : params.value;
          return `${params.name}: ${value} Visitors`;
        }
      },
      visualMap: {
        min: 0,
        max: 5000,
        text: ['High', 'Low'],
        realtime: false,
        calculable: true,
        inRange: {
          color: ['#1e3c72', '#2a5298', '#2b32b2', '#4facfe', '#00f2fe']
        },
        textStyle: { color: '#fff' },
        left: 'left',
        bottom: '20'
      },
      series: [
        {
          name: 'Visitors',
          type: 'map',
          map: 'china',
          roam: true,
          emphasis: {
            label: { show: false },
            itemStyle: {
              areaColor: '#F7BA1E'
            }
          },
          itemStyle: {
            areaColor: '#323c48',
            borderColor: '#111'
          },
          data: data
        }
      ]
    };
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

watch(dateRange, () => {
  fetchData();
});

onMounted(async () => {
  await registerMap();
  fetchData();
});
</script>

<template>
  <div class="map-container">
    <div class="toolbar">
      <a-range-picker v-model="dateRange" style="width: 360px;" show-time value-format="timestamp" />
    </div>
    <a-card class="map-card" :bordered="false">
      <div v-if="loading" class="loading-state">
        <a-spin dot />
      </div>
      <v-chart v-else class="chart" :option="mapOption" autoresize />
    </a-card>
  </div>
</template>

<style scoped>
.map-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: calc(100vh - 100px); /* Adjust based on layout */
}

.toolbar {
  display: flex;
  justify-content: flex-end;
}

.map-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.map-card :deep(.arco-card-body) {
  flex: 1;
  height: 100%;
  padding: 0;
}

.chart {
  width: 100%;
  height: 100%;
  min-height: 500px;
}

.loading-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
