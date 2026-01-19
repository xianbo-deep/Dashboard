<script setup>
import { ref, onMounted, reactive } from 'vue';
import { getTrendData, getLogs, getDashboardSummary, getDashboardInsights } from '@/api/monitor';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import { 
  IconArrowRise, 
  IconArrowFall, 
  IconCheckCircle, 
  IconExclamationCircle,
  IconEye,
  IconUserGroup,
  IconWifi,
  IconStorage
} from '@arco-design/web-vue/es/icon';

// Register ECharts components
use([
  CanvasRenderer,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
]);

// --- State ---
const loading = ref(true);

// KPI Data
const stats = reactive({
  pv: { value: '0', diff: 0, isUp: true },
  uv: { value: '0', diff: 0, isUp: true },
  online: { value: '0' },
  totalLogs: { value: '0' }
});

// Geo Data
const geoData = ref([]);

// Error Logs
const errorLogs = ref([]);

// Chart Option
const chartOption = ref({
  grid: { top: '15%', left: '2%', right: '2%', bottom: '5%', containLabel: true },
  xAxis: { type: 'category', data: [] },
  yAxis: { type: 'value' },
  series: []
});

// --- Logic ---
const initChart = (data) => {
  console.log('Init Chart Data:', data);
  const dates = data.map(item => item.date);
  const pvData = data.map(item => item.pv);
  const uvData = data.map(item => item.uv);

  chartOption.value = {
    backgroundColor: 'transparent',
    grid: {
      top: '15%',
      left: '1%',
      right: '1%',
      bottom: '0%',
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(29, 33, 41, 0.9)', // Arco深色背景
      borderColor: 'rgba(255, 255, 255, 0.1)',
      textStyle: { color: '#fff' },
      padding: [10, 15],
      formatter: (params) => {
        let result = `<div style="margin-bottom: 5px; font-weight: bold; color: #C9CDD4">${params[0].axisValue}</div>`;
        params.forEach(item => {
          const dot = `<span style="display:inline-block;margin-right:5px;border-radius:50%;width:8px;height:8px;background-color:${item.color}"></span>`;
          result += `<div style="display: flex; justify-content: space-between; gap: 20px; margin-top: 4px;">
            <span>${dot}${item.seriesName}</span>
            <span style="font-weight: bold; color: #fff">${item.value}</span>
          </div>`;
        });
        return result;
      }
    },
    legend: {
      data: ['PV', 'UV'],
      top: '0%',
      right: '2%',
      icon: 'circle',
      textStyle: { color: '#C9CDD4' },
      itemWidth: 8,
      itemHeight: 8
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false, // 让折线顶头
      axisLine: { show: true, lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
      axisTick: { show: false },
      axisLabel: { color: '#86909C', fontSize: 12, margin: 15 }
    },
    yAxis: {
      type: 'value',
      splitLine: { 
        show: true, 
        lineStyle: { type: 'dashed', color: 'rgba(255, 255, 255, 0.05)' }
      },
      axisLabel: { color: '#86909C' }
    },
    series: [
      {
        name: 'PV',
        type: 'line',
        smooth: true,
        showSymbol: false,
        symbolSize: 8,
        itemStyle: { color: '#165DFF' }, // Arco Blue
        lineStyle: { 
          width: 3, 
          color: '#165DFF',
          shadowColor: 'rgba(22, 93, 255, 0.5)', // 发光效果
          shadowBlur: 10
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(22, 93, 255, 0.4)' },
              { offset: 1, color: 'rgba(22, 93, 255, 0.0)' }
            ],
            global: false
          }
        },
        data: pvData
      },
      {
        name: 'UV',
        type: 'line',
        smooth: true,
        showSymbol: false,
        symbolSize: 8,
        itemStyle: { color: '#14C9C9' }, // Arco Cyan
        lineStyle: { 
          width: 3, 
          color: '#14C9C9',
          shadowColor: 'rgba(20, 201, 201, 0.5)',
          shadowBlur: 10
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(20, 201, 201, 0.4)' },
              { offset: 1, color: 'rgba(20, 201, 201, 0.0)' }
            ],
            global: false
          }
        },
        data: uvData
      }
    ]
  };
};

onMounted(async () => {
  try {
    loading.value = true;
    
    // Fetch Trend Data
    const trendData = await getTrendData();
    initChart(trendData);

    // Fetch Summary
    const summary = await getDashboardSummary();
    stats.pv.value = summary.pv;
    stats.pv.diff = Math.abs(summary.pv_percent);
    stats.pv.isUp = summary.pv_percent >= 0;

    stats.uv.value = summary.uv;
    stats.uv.diff = Math.abs(summary.uv_percent);
    stats.uv.isUp = summary.uv_percent >= 0;

    stats.online.value = summary.online_count;
    stats.totalLogs.value = summary.total_log_count; // Set as number

    // Fetch Insights
    const insights = await getDashboardInsights();
    
    if (insights.geo_stat_items) {
      const totalGeo = insights.geo_stat_items.reduce((acc, curr) => acc + curr.count, 0);
      geoData.value = insights.geo_stat_items.map(item => ({
        country: item.country,
        percent: totalGeo ? item.count / totalGeo : 0,
        count: item.count.toLocaleString(),
        rawCount: item.count
      }));
    }

    if (insights.error_logs) {
      errorLogs.value = insights.error_logs.map(log => ({
        time: new Date(log.time).toLocaleTimeString(),
        code: log.status,
        path: log.path,
        msg: log.status >= 500 ? 'Server Error' : 'Client Error'
      }));
    }

  } catch (error) {
    console.error('Failed to fetch dashboard data', error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="dashboard-container">
    
    <!-- 1. KPI Cards -->
    <a-grid :cols="{ xs: 1, sm: 2, md: 4 }" :colGap="16" :rowGap="16">
      <!-- Card 1: PV -->
      <a-grid-item>
        <a-card class="stat-card" :bordered="false">
          <div class="stat-content">
            <div class="stat-header">
              <span class="stat-label">今日总浏览量</span>
              <span :class="['stat-trend', stats.pv.isUp ? 'up' : 'down']">
                <component :is="stats.pv.isUp ? IconArrowRise : IconArrowFall" />
                {{ stats.pv.diff }}%
              </span>
            </div>
            <div class="stat-value">
              <a-statistic :value="stats.pv.value" show-group-separator animation :value-style="{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }" />
            </div>
          </div>
        </a-card>
      </a-grid-item>

      <!-- Card 2: UV -->
      <a-grid-item>
        <a-card class="stat-card" :bordered="false">
          <div class="stat-content">
            <div class="stat-header">
              <span class="stat-label">今日独立访客</span>
              <span :class="['stat-trend', stats.uv.isUp ? 'up' : 'down']">
                <component :is="stats.uv.isUp ? IconArrowRise : IconArrowFall" />
                {{ stats.uv.diff }}%
              </span>
            </div>
            <div class="stat-value">
              <a-statistic :value="stats.uv.value" show-group-separator animation :value-style="{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }" />
            </div>
          </div>
        </a-card>
      </a-grid-item>

      <!-- Card 3: Online -->
      <a-grid-item>
        <a-card class="stat-card" :bordered="false">
          <div class="stat-content">
            <div class="stat-header">
              <span class="stat-label">实时在线</span>
              <div class="pulsing-dot"></div>
            </div>
            <div class="stat-value">
              <a-statistic :value="Number(String(stats.online.value).replace(/,/g, ''))" show-group-separator animation :value-style="{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }">
                <template #suffix>
                  <span class="stat-unit">Users</span>
                </template>
              </a-statistic>
            </div>
          </div>
        </a-card>
      </a-grid-item>

      <!-- Card 4: Total Logs -->
      <a-grid-item>
        <a-card class="stat-card" :bordered="false">
          <div class="stat-content">
            <div class="stat-header">
              <span class="stat-label">总日志数</span>
            </div>
            <div class="stat-value">
              <a-statistic :value="Number(String(stats.totalLogs.value).replace(/,/g, ''))" show-group-separator animation :value-style="{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }">
                <template #suffix>
                  <span class="stat-unit">Rows</span>
                </template>
              </a-statistic>
            </div>
          </div>
        </a-card>
      </a-grid-item>
    </a-grid>

    <!-- 2. Main Chart -->
    <a-card class="main-chart-card" :bordered="false" title="流量态势感知 (7 Days)">
      <template #extra>
        <a-tag color="arcoblue" size="small">Live</a-tag>
      </template>
      <div class="chart-wrapper">
        <v-chart class="chart" :option="chartOption" autoresize style="height: 300px; width: 100%" />
      </div>
    </a-card>

    <!-- 3. Bottom Area -->
    <div class="bottom-row">
      <!-- Left: Geo Distribution -->
      <a-card class="bottom-card geo-card" :bordered="false" title="来源地理分布">
        <div class="geo-list">
          <div v-for="item in geoData" :key="item.country" class="geo-item">
            <div class="geo-info">
              <span class="geo-name">{{ item.country }}</span>
              <span class="geo-count">{{ item.count }}</span>
            </div>
            <a-progress 
              :percent="item.percent" 
              :show-text="false" 
              color="arcoblue"
              track-color="rgba(255,255,255,0.1)"
              size="small"
            />
          </div>
        </div>
      </a-card>

      <!-- Right: System Health -->
      <a-card class="bottom-card health-card" :bordered="false" title="异常状态监控">
        <div v-if="errorLogs.length > 0" class="error-list">
          <div v-for="(log, idx) in errorLogs" :key="idx" class="error-item">
            <div class="error-content">
              <div class="error-header">
                <a-tag :color="log.code >= 500 ? 'red' : 'orange'" size="small" class="error-tag">
                  {{ log.code }}
                </a-tag>
                <span class="error-time">{{ log.time }}</span>
              </div>
              <div class="error-path" :title="log.path">{{ log.path }}</div>
            </div>
          </div>
        </div>
        <div v-else class="system-normal">
          <icon-check-circle class="success-icon" />
          <p>系统运行正常</p>
        </div>
      </a-card>
    </div>

  </div>
</template>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: #fff;
}

/* --- KPI Cards --- */
.stat-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  transition: all 0.3s;
}
.stat-card:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.08);
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  color: var(--color-text-3);
  font-size: 14px;
}

.stat-trend {
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.stat-trend.up { color: rgb(var(--green-6)); }
.stat-trend.down { color: rgb(var(--red-6)); }

.stat-unit {
  margin-left: 4px;
  font-size: 14px;
  color: var(--color-text-3);
  font-weight: normal;
}

/* Pulsing Dot */
.pulsing-dot {
  width: 8px;
  height: 8px;
  background-color: rgb(var(--green-6));
  border-radius: 50%;
  position: relative;
}
.pulsing-dot::after {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: inherit;
  border-radius: 50%;
  animation: pulse 1.5s infinite ease-out;
}
@keyframes pulse {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(3); opacity: 0; }
}

/* --- Main Chart --- */
.main-chart-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
  border-radius: 8px;
}
.chart-wrapper {
  height: 300px;
  width: 100%;
}
.chart {
  width: 100%;
  height: 100%;
}

/* --- Bottom Area --- */
.bottom-row {
  display: flex;
  gap: 16px;
  height: 250px;
}
.bottom-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}
.geo-card { flex: 3; }
.health-card { flex: 2; }

/* Geo List */
.geo-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 10px;
}
.geo-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.geo-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--color-text-2);
}
.geo-count {
  font-family: 'DIN Alternate', sans-serif;
  color: #fff;
}

/* Error List */
.error-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding-right: 4px;
  height: 100%;
}

/* Custom Scrollbar for Error List */
.error-list::-webkit-scrollbar {
  width: 4px;
}
.error-list::-webkit-scrollbar-track {
  background: transparent;
}
.error-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}
.error-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.error-item {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 4px;
  transition: background 0.2s;
  flex-shrink: 0; /* Prevent shrinking */
}
.error-item:hover {
  background: rgba(255, 255, 255, 0.05);
}
.error-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.error-tag {
  font-weight: bold;
}
.error-time {
  font-size: 12px;
  color: var(--color-text-3);
}
.error-path {
  font-size: 13px;
  color: var(--color-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: monospace;
}

.system-normal {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgb(var(--green-6));
  gap: 10px;
}
.success-icon {
  font-size: 48px;
  opacity: 0.8;
}

/* Ensure card body takes available space */
.health-card :deep(.arco-card-body) {
  flex: 1;
  overflow: hidden;
  padding: 12px;
  display: flex;
  flex-direction: column;
}
</style>