<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getPageStats, getAnalysisTrend, getAnalysisMetrics, getRankings, getAnalysisPathSource } from '@/api/monitor';
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
import { 
  IconSearch, 
  IconDownload, 
  IconSettings, 
  IconCopy, 
  IconLaunch,
  IconArrowRise,
  IconArrowFall,
  IconDesktop,
  IconMobile
} from '@arco-design/web-vue/es/icon';

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
]);

const router = useRouter();

// --- State ---
const loading = ref(false);
const timeRange = ref('15d');
const searchQuery = ref('');
const tableData = ref([]);

// --- Mock Data Generators (Removed) ---

// --- Metrics ---
const metrics = reactive({
  totalPv: { value: 0, trend: 12.5, isUp: true },
  totalUv: { value: 0, trend: 8.2, isUp: true },
  avgLatency: { value: 0, status: 'success' },
  topPath: { value: '/', count: 0 }
});

// --- Charts Options ---
const trendOption = ref({});
const rankOption = ref({});

// --- Table Columns ---
const columns = [
  { title: '路径', dataIndex: 'path', slotName: 'path', width: 300, ellipsis: true },
  { title: 'PV', dataIndex: 'pv', slotName: 'pv', sortable: { sortDirections: ['descend', 'ascend'] }, width: 150 },
  { title: 'UV', dataIndex: 'uv', slotName: 'uv', sortable: { sortDirections: ['descend', 'ascend'] }, width: 150 },
  { title: '平均延迟', dataIndex: 'avg_latency', slotName: 'latency', sortable: { sortDirections: ['descend', 'ascend'] }, width: 150 },
  { title: '操作', slotName: 'actions', width: 100, align: 'center' }
];

// --- Logic ---
const initCharts = (trendData, rankData) => {
  // Trend Chart
  const dates = trendData.map(i => i.date);
  const pvData = trendData.map(i => i.pv);
  const uvData = trendData.map(i => i.uv);

  trendOption.value = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(29, 33, 41, 0.9)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      textStyle: { color: '#fff' },
    },
    legend: {
      data: ['PV', 'UV'],
      top: 0,
      right: 0,
      textStyle: { color: '#86909C' },
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8
    },
    grid: { left: 0, right: 0, bottom: 0, top: 30, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
      axisLabel: { color: '#86909C' },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(255, 255, 255, 0.05)' } },
      axisLabel: { color: '#86909C' }
    },
    series: [
      {
        name: 'PV',
        type: 'line',
        smooth: true,
        showSymbol: false,
        itemStyle: { color: '#165DFF' },
        lineStyle: { width: 2 },
        data: pvData
      },
      {
        name: 'UV',
        type: 'line',
        smooth: true,
        showSymbol: false,
        itemStyle: { color: '#14C9C9' },
        lineStyle: { width: 2 },
        data: uvData
      }
    ]
  };

  // Rank Chart (Top 10)
  // rankData is expected to be from getRankings which returns { path, view_count }
  const paths = rankData.map(i => i.path);
  const pvs = rankData.map(i => i.view_count);

  rankOption.value = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(29, 33, 41, 0.9)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      textStyle: { color: '#fff' }
    },
    grid: { left: 0, right: 20, bottom: 0, top: 0, containLabel: true },
    xAxis: {
      type: 'value',
      splitLine: { show: false },
      axisLabel: { show: false }
    },
    yAxis: {
      type: 'category',
      data: paths,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#C9CDD4', width: 120, overflow: 'truncate' },
      inverse: true
    },
    series: [
      {
        name: 'PV',
        type: 'bar',
        data: pvs,
        barWidth: 8,
        itemStyle: {
          borderRadius: 4,
          color: '#165DFF'
        },
        label: { show: true, position: 'right', color: '#86909C' }
      }
    ]
  };
};

const navigateToDetail = (path) => {
  router.push({
    name: 'PageDetail',
    query: { path }
  });
};

const fetchData = async () => {
  loading.value = true;
  
  try {
      const daysMap = { '3d': 3, '15d': 15, '30d': 30 };
      const days = daysMap[timeRange.value] || 15;
      
      // Use real APIs
      // 并行请求所有需要的数据
      const [trendData, pageData, metricsData, rankData] = await Promise.all([
          getAnalysisTrend(days),
          getPageStats(days),        // 表格数据
          getAnalysisMetrics(days),  // 统计指标
          getRankings(days)          // 排行榜数据
      ]);

      // Update Metrics using dedicated API response
      // Assuming metricsData structure corresponds to what backend returns (total_pv, total_uv, avg_latency)
      // 根据通常的后端返回这里做一个简单适配，如果后端返回字段名不同请调整
      metrics.totalPv.value = metricsData.totalPV || 0;
      metrics.totalUv.value = metricsData.totalUV || 0;
      metrics.avgLatency.value = Math.round(metricsData.avgLatency || 0);

      // Trend or status logic remains similar for frontend visual
      metrics.avgLatency.status = metrics.avgLatency.value < 200 ? 'success' : metrics.avgLatency.value < 500 ? 'warning' : 'danger';
      
      // Top Page from metricsData
      metrics.topPath.value = metricsData.hotPage || '/';
      metrics.topPath.count = metricsData.hotPagePV || 0;

      // Update Charts
      initCharts(trendData, rankData);

      // Update Table
      const maxPv = Math.max(...pageData.map(i => i.pv)) || 1;
      const maxUv = Math.max(...pageData.map(i => i.uv)) || 1;
      tableData.value = pageData.map(item => ({
        ...item,
        pvPercent: item.pv / maxPv,
        uvPercent: item.uv / maxUv
      }));
  } catch (err) {
      console.error(err);
  } finally {
      loading.value = false;
  }
};

const filteredData = computed(() => {
  if (!searchQuery.value) return tableData.value;
  return tableData.value.filter(item => item.path.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

const handleTimeChange = () => {
  fetchData();
};

const handleExpand = async (rowKey, record) => {
  if (record.referers || record.loadingDetail) return; // Already loaded or loading
  
  record.loadingDetail = true;
  try {
     const daysMap = { '3d': 3, '15d': 15, '30d': 30 };
     const days = daysMap[timeRange.value] || 15;

     const data = await getAnalysisPathSource(record.path, days);
     
     // Process Sources
     record.referers = (data.sources || []).map(s => ({
       name: s.source,
       value: s.percent
     })).sort((a,b) => b.value - a.value).slice(0, 5); 

     // Process Devices
     record.devices = (data.devices || []).map(d => ({
        name: d.device,
        value: d.percent
     })).sort((a,b) => b.value - a.value);

  } catch (e) {
    console.error(e);
  } finally {
    record.loadingDetail = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="pages-container">
    
    <!-- 1. KPI Cards (Dashboard Style) -->
    <a-grid :cols="{ xs: 1, sm: 2, md: 4 }" :colGap="16" :rowGap="16">
      <!-- Total PV -->
      <a-grid-item>
        <a-card class="stat-card" :bordered="false">
          <div class="stat-content">
            <div class="stat-header">
              <span class="stat-label">总访问量</span>
            </div>
            <div class="stat-value">
              <a-statistic :value="metrics.totalPv.value" show-group-separator animation :value-style="{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }" />
            </div>
          </div>
        </a-card>
      </a-grid-item>

      <!-- Total UV -->
      <a-grid-item>
        <a-card class="stat-card" :bordered="false">
          <div class="stat-content">
            <div class="stat-header">
              <span class="stat-label">总访客数</span>
            </div>
            <div class="stat-value">
              <a-statistic :value="metrics.totalUv.value" show-group-separator animation :value-style="{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }" />
            </div>
          </div>
        </a-card>
      </a-grid-item>

      <!-- Avg Latency -->
      <a-grid-item>
        <a-card class="stat-card" :bordered="false">
          <div class="stat-content">
            <div class="stat-header">
              <span class="stat-label">平均延迟</span>
            </div>
            <div class="stat-value">
              <a-statistic :value="metrics.avgLatency.value" show-group-separator animation :value-style="{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }">
                <template #suffix>
                  <span class="stat-unit">ms</span>
                </template>
              </a-statistic>
            </div>
          </div>
        </a-card>
      </a-grid-item>

      <!-- Top Page -->
      <a-grid-item>
        <a-card class="stat-card" :bordered="false">
          <div class="stat-content">
            <div class="stat-header">
              <span class="stat-label">热门页面</span>
            </div>
            <div class="stat-value">
              <div class="top-page-path" :title="metrics.topPath.value">{{ metrics.topPath.value }}</div>
              <div class="top-page-count">{{ metrics.topPath.count.toLocaleString() }} 次访问</div>
            </div>
          </div>
        </a-card>
      </a-grid-item>
    </a-grid>

    <!-- 2. Charts Section -->
    <div class="charts-grid">
      <!-- Trend Chart -->
      <div class="chart-panel">
        <div class="panel-header">
          <div class="panel-title">流量趋势</div>
          <a-radio-group type="button" size="mini" v-model="timeRange" @change="handleTimeChange">
            <a-radio value="3d">3天</a-radio>
            <a-radio value="15d">15天</a-radio>
            <a-radio value="30d">30天</a-radio>
          </a-radio-group>
        </div>
        <div class="chart-wrapper">
          <v-chart class="chart" :option="trendOption" autoresize />
        </div>
      </div>

      <!-- Ranking Chart -->
      <div class="chart-panel">
        <div class="panel-header">
          <div class="panel-title">访问排行</div>
        </div>
        <div class="chart-wrapper">
          <v-chart class="chart" :option="rankOption" autoresize />
        </div>
      </div>
    </div>

    <!-- 3. Data Table -->
    <div class="table-panel">
      <div class="panel-header">
        <div class="panel-title">页面详情</div>
        <div class="panel-actions">
          <a-input-search 
            v-model="searchQuery" 
            placeholder="搜索路径..." 
            style="width: 200px"
            size="small"
            allow-clear
          />
          <a-button size="small">
            <template #icon><icon-download /></template>
          </a-button>
        </div>
      </div>

      <a-table
        :data="filteredData"
        :columns="columns"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
        :bordered="false"
        row-key="path"
        hoverable
        @expand="handleExpand"
        :expandable="{ width: 40 }"
      >
        <!-- Path Column -->
        <template #path="{ record }">
          <div class="path-cell">
            <span class="path-text" @click="navigateToDetail(record.path)">{{ record.path }}</span>
            <div class="path-actions">
              <a-tooltip content="Copy">
                <a-button size="mini" type="text"><icon-copy /></a-button>
              </a-tooltip>
              <a-tooltip content="Open">
                <a-button size="mini" type="text"><icon-launch /></a-button>
              </a-tooltip>
            </div>
          </div>
        </template>

        <!-- PV Column -->
        <template #pv="{ record }">
          <div class="metric-bar-cell">
            <span class="cell-value">{{ record.pv.toLocaleString() }}</span>
            <div class="progress-bg">
              <div class="progress-fill" :style="{ width: `${record.pvPercent * 100}%`, background: '#344054' }"></div>
            </div>
          </div>
        </template>

        <!-- UV Column -->
        <template #uv="{ record }">
          <div class="metric-bar-cell">
            <span class="cell-value">{{ record.uv.toLocaleString() }}</span>
            <div class="progress-bg">
              <div class="progress-fill" :style="{ width: `${record.uvPercent * 100}%`, background: '#344054' }"></div>
            </div>
          </div>
        </template>

        <!-- Latency Column -->
        <template #latency="{ record }">
          <span :class="['latency-text', record.avg_latency > 500 ? 'danger' : '']">
            {{ record.avg_latency }}ms
          </span>
        </template>

        <!-- Actions Column -->
        <template #actions="{ record }">
          <a-button type="text" size="mini" style="color: #86909C" @click="navigateToDetail(record.path)">详情</a-button>
        </template>

        <!-- Expanded Row (Based on VisitLog) -->
        <template #expand-row="{ record }">
          <div class="expand-content">
            <a-spin :loading="record.loadingDetail" style="width: 100%">
            <a-grid :cols="2" :colGap="40">
              <a-grid-item>
                <div class="detail-section">
                  <div class="detail-title">来源分析</div>
                  <div class="detail-list" v-if="record.referers && record.referers.length">
                    <div v-for="ref in record.referers" :key="ref.name" class="detail-item">
                      <span class="detail-label">{{ ref.name }}</span>
                      <div class="detail-bar-wrapper">
                        <div class="detail-bar" :style="{ width: `${ref.value}%` }"></div>
                      </div>
                      <span class="detail-val">{{ ref.value }}%</span>
                    </div>
                  </div>
                  <div v-else class="no-data">暂无数据</div>
                </div>
              </a-grid-item>
              <a-grid-item>
                <div class="detail-section">
                  <div class="detail-title">设备分布</div>
                  <div class="detail-list" v-if="record.devices && record.devices.length">
                    <div v-for="dev in record.devices" :key="dev.name" class="detail-item">
                      <span class="detail-label">{{ dev.name }}</span>
                      <div class="detail-bar-wrapper">
                        <div class="detail-bar" :style="{ width: `${dev.value}%` }"></div>
                      </div>
                      <span class="detail-val">{{ dev.value }}%</span>
                    </div>
                  </div>
                  <div v-else class="no-data">暂无数据</div>
                </div>
              </a-grid-item>
            </a-grid>
            </a-spin>
          </div>
        </template>
      </a-table>
    </div>
  </div>
</template>

<style scoped>
.pages-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-family: 'Inter', sans-serif;
  color: #fff;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

/* --- KPI Cards (Dashboard Style) --- */
.stat-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  transition: all 0.3s;
  border: none; /* Remove border to match dashboard style */
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

.stat-unit {
  margin-left: 4px;
  font-size: 14px;
  color: var(--color-text-3);
  font-weight: normal;
}

.top-page-path {
  font-family: monospace;
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}
.top-page-count {
  font-size: 12px;
  color: var(--color-text-3);
}

/* --- Charts Grid --- */
.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.chart-panel {
  background: rgba(255, 255, 255, 0.04); /* Glassmorphism */
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #F2F3F5;
}

.chart-wrapper {
  height: 250px;
  width: 100%;
}
.chart {
  width: 100%;
  height: 100%;
}

/* --- Table Panel --- */
.table-panel {
  background: rgba(255, 255, 255, 0.04); /* Glassmorphism */
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 20px;
}

.panel-actions {
  display: flex;
  gap: 12px;
}

/* Table Styles Override */
:deep(.arco-table-th) {
  background-color: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #86909C;
  font-weight: 500;
}
:deep(.arco-table-td) {
  background-color: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #C9CDD4;
}
:deep(.arco-table-tr:hover .arco-table-td) {
  background-color: rgba(255, 255, 255, 0.05);
}

.path-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.path-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.2s;
}
.path-text:hover {
  color: #165DFF;
  text-decoration: underline;
}
.path-actions {
  opacity: 0;
  transition: opacity 0.2s;
}
.path-cell:hover .path-actions {
  opacity: 1;
}

.metric-bar-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.cell-value {
  font-family: 'JetBrains Mono', monospace;
  width: 50px;
  text-align: right;
  font-size: 13px;
}
.progress-bg {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 2px;
}

.latency-text {
  font-family: 'JetBrains Mono', monospace;
}
.latency-text.danger { color: #F53F3F; }

/* Expanded Content */
.expand-content {
  padding: 16px 0;
}
.detail-title {
  font-size: 12px;
  font-weight: 600;
  color: #86909C;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #C9CDD4;
}
.detail-label {
  width: 80px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.detail-bar-wrapper {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}
.detail-bar {
  height: 100%;
  background: #4E5969;
  border-radius: 2px;
}
.detail-val {
  font-family: 'JetBrains Mono', monospace;
  width: 40px;
  text-align: right;
  color: #86909C;
}

.no-data {
  color: #4E5969;
  font-size: 13px;
  padding: 8px 0;
  font-style: italic;
}

/* Responsive */
@media (max-width: 1200px) {
  .charts-grid { grid-template-columns: 1fr; }
}
</style>
