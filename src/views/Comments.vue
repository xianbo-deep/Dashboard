<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { 
  getCommentsData, 
  getCommentStats, 
  getInteractionTrend, 
  getCommentActivities, 
  getTopContributors 
} from '@/api/monitor';
import { 
  IconMessage, 
  IconUserGroup, 
  IconHeart, 
  IconCalendar 
} from '@arco-design/web-vue/es/icon';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components';

use([
  CanvasRenderer,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
]);

const loading = ref(false);
const statsDays = ref('all');
const trendDays = ref(7);
const stats = ref({ comments: 0, replies: 0, reactions: 0 });
const activities = ref([]);
const trendData = ref([]);
const contributors = ref([]);
const feedLimit = ref(5); // Default limit
const chartType = ref('all');

const chartOption = ref({});

const initChart = (data) => {
  if (!data || data.length === 0) return;
  
  const dates = data.map(item => item.date);
  const comments = data.map(item => item.comments);
  const replies = data.map(item => item.replies);
  const reactions = data.map(item => item.reactions);

  const series = [];
  
  // Helper for styles
  const commonLineStyle = (color) => ({
    width: 3,
    color: color,
    shadowColor: color,
    shadowBlur: 15,
    shadowOffsetY: 5
  });

  const commonAreaStyle = (r, g, b) => ({
    color: {
      type: 'linear',
      x: 0, y: 0, x2: 0, y2: 1,
      colorStops: [
        { offset: 0, color: `rgba(${r}, ${g}, ${b}, 0.3)` },
        { offset: 1, color: `rgba(${r}, ${g}, ${b}, 0.0)` }
      ],
      global: false
    }
  });
  
  if (chartType.value === 'all' || chartType.value === 'comments') {
    series.push({
      name: 'Comments',
      type: 'line',
      smooth: true,
      showSymbol: false,
      symbolSize: 10,
      itemStyle: { 
        color: '#4080FF',
        borderColor: '#fff',
        borderWidth: 2
      },
      data: comments,
      lineStyle: commonLineStyle('#4080FF'),
      areaStyle: chartType.value !== 'all' ? commonAreaStyle(64, 128, 255) : undefined
    });
  }
  
  if (chartType.value === 'all' || chartType.value === 'replies') {
    series.push({
      name: 'Replies',
      type: 'line',
      smooth: true,
      showSymbol: false,
      symbolSize: 10,
      itemStyle: { 
        color: '#00E8CF',
        borderColor: '#fff',
        borderWidth: 2
      },
      data: replies,
      lineStyle: commonLineStyle('#00E8CF'),
      areaStyle: chartType.value !== 'all' ? commonAreaStyle(0, 232, 207) : undefined
    });
  }
  
  if (chartType.value === 'all' || chartType.value === 'reactions') {
    series.push({
      name: 'Reactions',
      type: 'line',
      smooth: true,
      showSymbol: false,
      symbolSize: 10,
      itemStyle: { 
        color: '#FF7D00',
        borderColor: '#fff',
        borderWidth: 2
      },
      data: reactions,
      lineStyle: commonLineStyle('#FF7D00'),
      areaStyle: chartType.value !== 'all' ? commonAreaStyle(255, 125, 0) : undefined
    });
  }

  chartOption.value = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(20, 20, 20, 0.4)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      textStyle: { color: '#fff' },
      padding: [16, 20],
      extraCssText: 'backdrop-filter: blur(12px); border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);',
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 255, 255, 0)' },
              { offset: 0.5, color: 'rgba(255, 255, 255, 0.3)' },
              { offset: 1, color: 'rgba(255, 255, 255, 0)' }
            ]
          },
          width: 1
        }
      },
      formatter: (params) => {
        let result = `<div style="margin-bottom: 10px; font-weight: 500; color: rgba(255,255,255,0.7); font-size: 12px; letter-spacing: 0.5px;">${params[0].axisValue}</div>`;
        params.forEach(item => {
          const dot = `<span style="display:inline-block;margin-right:8px;border-radius:50%;width:8px;height:8px;background-color:${item.color};box-shadow: 0 0 5px ${item.color}"></span>`;
          result += `<div style="display: flex; justify-content: space-between; align-items: center; gap: 30px; margin-top: 8px;">
            <span style="color: #fff; font-size: 13px; font-weight: 500;">${dot}${item.seriesName}</span>
            <span style="font-weight: 600; color: #fff; font-family: 'DIN Alternate', sans-serif; font-size: 14px;">${item.value}</span>
          </div>`;
        });
        return result;
      }
    },
    legend: {
      show: chartType.value === 'all',
      data: ['Comments', 'Replies', 'Reactions'],
      textStyle: { color: '#86909C' },
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 4,
      top: 0,
      right: 0
    },
    grid: {
      left: '2%',
      right: '2%',
      bottom: '10%',
      top: '40',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: { show: true, lineStyle: { color: 'rgba(255, 255, 255, 0.08)' } },
      axisTick: { show: false },
      axisLabel: { color: '#86909C', fontSize: 12, margin: 12 }
    },
    yAxis: {
      type: 'value',
      min: 0,
      minInterval: 1,
      splitLine: { show: true, lineStyle: { type: 'dashed', color: 'rgba(255, 255, 255, 0.04)' } },
      axisLabel: { color: '#86909C' },
      splitNumber: 3
    },
    series: series
  };
};

const fetchStats = async () => {
  const data = await getCommentStats(statsDays.value);
  stats.value = data;
};

const fetchTrend = async () => {
  const data = await getInteractionTrend(trendDays.value);
  trendData.value = data;
  initChart(data);
};

const fetchData = async () => {
  loading.value = true;
  try {
    // 默认获取足够多的数据，具体展示条数由前端控制
    // 或者，如果你也希望这里跟随 feedLimit，可以改为 getCommentActivities(feedLimit.value) 并加上 watch(feedLimit, fetchData)
    // 鉴于下拉框只有 5/10/20，这里一次性获取 50 条也是合理的
    // 但既然 API 已经支持参数，这里可以改成传递参数
    await Promise.all([
      fetchStats(),
      fetchTrend(),
      getCommentActivities(feedLimit.value).then(res => activities.value = res),
      getTopContributors().then(res => contributors.value = res)
    ]);
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const displayedActivities = computed(() => {
  // 如果后端已经按 limit 返回了数据，这里就不需要重复 slice，
  // 除非后端返回的数据可能多于 feedLimit
  return activities.value.slice(0, feedLimit.value);
});

watch(feedLimit, () => {
  // 当下拉框变化时，重新请求数据
  loading.value = true;
  getCommentActivities(feedLimit.value)
    .then(res => activities.value = res)
    .finally(() => loading.value = false);
});

watch(chartType, () => {
  initChart(trendData.value);
});

onMounted(() => {
  fetchData();
});

const getActionColor = (action) => {
  switch (action) {
    case 'comment': return 'arcoblue';
    case 'reply': return 'green';
    case 'reaction': return 'red';
    default: return 'gray';
  }
};

const reactionMap = {
  'THUMBS_UP': '👍',
  'THUMBS_DOWN': '👎',
  'LAUGH': '😄',
  'HOORAY': '🎉',
  'CONFUSED': '😕',
  'HEART': '❤️',
  'ROCKET': '🚀',
  'EYES': '👀'
};

const formatContent = (item) => {
  if (item.type === 'reaction') {
    return reactionMap[item.content] || item.content;
  }
  return item.content;
};

const getActionText = (action) => {
    switch (action) {
        case 'comment': return 'commented on';
        case 'reply': return 'replied on';
        case 'reaction': return 'reacted to';
        default: return action;
    }
}

const openLink = (url) => {
    if(url) window.open(url, '_blank');
}
</script>

<template>
  <div class="comments-container">
    <!-- Toolbar -->
    <div class="toolbar">
      <h2 class="page-title">博客互动概览</h2>
      <a-radio-group type="button" v-model="statsDays" @change="fetchStats" size="small">
        <a-radio value="all">全部</a-radio>
        <a-radio :value="3">近 3 天</a-radio>
        <a-radio :value="7">近 7 天</a-radio>
        <a-radio :value="30">近 30 天</a-radio>
      </a-radio-group>
    </div>

    <!-- KPI Cards -->
    <a-grid :cols="3" :col-gap="16" :row-gap="16" class="kpi-grid">
      <a-grid-item>
        <a-card class="kpi-card" :bordered="false">
          <div class="kpi-content">
            <div class="kpi-icon-wrapper blue">
              <icon-message />
            </div>
            <div class="kpi-info">
              <div class="kpi-label">总评论数</div>
              <div class="kpi-value">{{ stats.comments }}</div>
            </div>
          </div>
        </a-card>
      </a-grid-item>
      <a-grid-item>
        <a-card class="kpi-card" :bordered="false">
          <div class="kpi-content">
            <div class="kpi-icon-wrapper green">
              <icon-user-group />
            </div>
            <div class="kpi-info">
              <div class="kpi-label">总回复数</div>
              <div class="kpi-value">{{ stats.replies }}</div>
            </div>
          </div>
        </a-card>
      </a-grid-item>
      <a-grid-item>
        <a-card class="kpi-card" :bordered="false">
          <div class="kpi-content">
            <div class="kpi-icon-wrapper red">
              <icon-heart />
            </div>
            <div class="kpi-info">
              <div class="kpi-label">总回应数</div>
              <div class="kpi-value">{{ stats.reactions }}</div>
            </div>
          </div>
        </a-card>
      </a-grid-item>
    </a-grid>

    <!-- Middle Row: Chart & Contributors -->
    <div class="middle-row">
      <a-card class="chart-card" :bordered="false" :title="`互动趋势 (近 ${trendDays} 天)`">
        <template #extra>
          <a-space>
            <a-select v-model="trendDays" size="small" style="width: 100px" @change="fetchTrend">
              <a-option :value="3">近 3 天</a-option>
              <a-option :value="7">近 7 天</a-option>
              <a-option :value="30">近 30 天</a-option>
            </a-select>
            <a-radio-group type="button" v-model="chartType" size="small">
              <a-radio value="all">全部</a-radio>
              <a-radio value="comments">评论</a-radio>
              <a-radio value="replies">回复</a-radio>
              <a-radio value="reactions">回应</a-radio>
            </a-radio-group>
          </a-space>
        </template>
        <v-chart class="chart" :option="chartOption" autoresize style="width: 100%; height: 100%;" />
      </a-card>
      
      <a-card class="contributors-card" :bordered="false" title="活跃者">
        <div class="contributors-list">
          <div v-for="(user, idx) in contributors" :key="user.id" class="contributor-item">
            <div class="rank" :class="{ top: idx < 3 }">{{ idx + 1 }}</div>
            <a-avatar :size="32" :image-url="user.avatar" />
            <div class="user-name">{{ user.name }}</div>
            <div class="user-count">{{ user.count }}</div>
          </div>
        </div>
      </a-card>
    </div>

    <!-- Activity Feed -->
    <a-card class="feed-card" :bordered="false">
      <template #title>
        <div class="feed-header-row">
          <span>最新动态</span>
          <a-select v-model="feedLimit" :style="{width:'120px'}" size="small">
            <a-option :value="5">最近 5 条</a-option>
            <a-option :value="10">最近 10 条</a-option>
            <a-option :value="20">最近 20 条</a-option>
          </a-select>
        </div>
      </template>
      <div class="feed-list">
        <a-skeleton :loading="loading" animation>
          <div v-if="loading">
            <a-skeleton-line :rows="3" />
          </div>
          <div v-else>
            <div v-for="item in displayedActivities" :key="item.id" class="feed-item">
              <div class="feed-avatar">
                <a :href="item.userUrl" target="_blank">
                    <img :src="item.avatar" alt="avatar" />
                </a>
              </div>
              <div class="feed-content">
                <div class="feed-header">
                  <a :href="item.userUrl" target="_blank" class="feed-user">{{ item.user }}</a>
                  <span class="feed-action">{{ getActionText(item.action) }}</span>
                  <span class="feed-target" @click="openLink(item.url)" :title="item.target">{{ item.target }}</span>
                  <span class="feed-time">{{ item.time }}</span>
                </div>
                
                <!-- Reply Context -->
                <div v-if="item.replyTo && item.replyTo.name && item.action === 'reply'" class="reply-context">
                   <span class="replied-to">Replying to <span class="reply-name">@{{ item.replyTo.name }}</span>:</span>
                   <div class="reply-quote">{{ item.replyTo.content }}</div>
                </div>

                <div class="feed-body">
                  <div v-if="item.type === 'reaction'" class="reaction-content">
                    {{ formatContent(item) }}
                  </div>
                  <div v-else class="text-content">
                    {{ item.content }}
                  </div>
                </div>
              </div>
              <div class="feed-tag">
                <a-tag :color="getActionColor(item.action)" size="small">{{ item.action }}</a-tag>
              </div>
            </div>
          </div>
        </a-skeleton>
      </div>
    </a-card>
  </div>
</template>

<style scoped>
.comments-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: #fff;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  color: #fff;
}

/* KPI Cards */
.kpi-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  transition: transform 0.3s;
}
.kpi-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.08);
}

.kpi-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.kpi-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}
.kpi-icon-wrapper.blue { background: rgba(22, 93, 255, 0.2); color: #165DFF; }
.kpi-icon-wrapper.green { background: rgba(0, 180, 42, 0.2); color: #00B42A; }
.kpi-icon-wrapper.red { background: rgba(245, 63, 63, 0.2); color: #F53F3F; }

.kpi-info {
  display: flex;
  flex-direction: column;
}
.kpi-label {
  color: var(--color-text-3);
  font-size: 12px;
}
.kpi-value {
  font-size: 24px;
  font-weight: bold;
  font-family: 'DIN Alternate', sans-serif;
  color: #fff;
}

/* Middle Row */
.middle-row {
  display: flex;
  gap: 16px;
  height: 350px;
}
.chart-card {
  flex: 2;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
  border-radius: 8px;
}
.chart-card :deep(.arco-card-body) {
  padding: 0 12px 12px;
  height: 100%;
  box-sizing: border-box;
}
.contributors-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}
.contributors-card :deep(.arco-card-body) {
  flex: 1;
  overflow: hidden;
  padding: 0 12px 12px;
}

.chart {
  width: 100%;
  height: 100%;
}

/* Contributors List */
.contributors-list {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.contributor-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.02);
}
.rank {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  font-size: 12px;
  font-weight: bold;
  color: var(--color-text-3);
}
.rank.top {
  background: #F7BA1E;
  color: #000;
}
.user-name {
  flex: 1;
  font-weight: 500;
}
.user-count {
  font-family: 'DIN Alternate', sans-serif;
  font-weight: bold;
  color: #165DFF;
}

/* Feed */
.feed-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  /* Removed min-height to let it shrink */
}

.feed-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.feed-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feed-item {
  display: flex;
  gap: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  transition: background 0.2s;
}
.feed-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.feed-avatar img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #333;
}

.feed-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.feed-header {
  font-size: 13px;
  color: var(--color-text-3);
}
.feed-user {
  color: #fff;
  font-weight: bold;
  margin-right: 4px;
}
.feed-action {
  margin-right: 4px;
}
.feed-target {
  color: #165DFF;
  cursor: pointer;
  margin-right: 8px;
}
.feed-time {
  font-size: 12px;
  color: var(--color-text-4);
}

.feed-body {
  font-size: 14px;
  color: var(--color-text-1);
  margin-top: 2px;
}

.reaction-content {
  font-size: 18px;
}

.reply-context {
  margin: 4px 0;
  padding: 8px;
  background: rgba(255, 255, 255, 0.04);
  border-left: 2px solid #4E5969;
  border-radius: 0 4px 4px 0;
  font-size: 12px;
}
.replied-to {
  color: var(--color-text-3);
  margin-bottom: 2px;
  display: block;
}
.reply-name {
  color: #165DFF;
  font-weight: 500;
}
.reply-quote {
  color: var(--color-text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feed-tag {
  display: flex;
  align-items: flex-start;
}
</style>