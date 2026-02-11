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
  // Neon Glow Line Style
  const commonLineStyle = (color) => ({
    width: 3,
    color: color,
    shadowColor: color,
    shadowBlur: 10,
    shadowOffsetY: 0
  });

  // Glassmorphism Gradient Area
  const commonAreaStyle = (r, g, b) => ({
    color: {
      type: 'linear',
      x: 0, y: 0, x2: 0, y2: 1,
      colorStops: [
        { offset: 0, color: `rgba(${r}, ${g}, ${b}, 0.4)` },
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
      symbolSize: 8,
      itemStyle: { 
        color: '#4080FF',
        borderColor: '#fff',
        borderWidth: 2
      },
      data: comments,
      lineStyle: commonLineStyle('#4080FF'),
      areaStyle: chartType.value !== 'all' ? commonAreaStyle(64, 128, 255) : undefined,
      z: 3
    });
  }
  
  if (chartType.value === 'all' || chartType.value === 'replies') {
    series.push({
      name: 'Replies',
      type: 'line',
      smooth: true,
      showSymbol: false,
      symbolSize: 8,
      itemStyle: { 
        color: '#00E8CF',
        borderColor: '#fff',
        borderWidth: 2
      },
      data: replies,
      lineStyle: commonLineStyle('#00E8CF'),
      areaStyle: chartType.value !== 'all' ? commonAreaStyle(0, 232, 207) : undefined,
      z: 2
    });
  }
  
  if (chartType.value === 'all' || chartType.value === 'reactions') {
    series.push({
      name: 'Reactions',
      type: 'line',
      smooth: true,
      showSymbol: false,
      symbolSize: 8,
      itemStyle: { 
        color: '#FF7D00',
        borderColor: '#fff',
        borderWidth: 2
      },
      data: reactions,
      lineStyle: commonLineStyle('#FF7D00'),
      areaStyle: chartType.value !== 'all' ? commonAreaStyle(255, 125, 0) : undefined,
      z: 1
    });
  }

  chartOption.value = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      textStyle: { color: '#fff' },
      padding: [12, 16],
      extraCssText: 'backdrop-filter: blur(10px); border-radius: 8px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);',
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.3)',
          width: 1, 
          type: 'dashed'
        }
      },
      formatter: (params) => {
        let result = `<div style="margin-bottom: 8px; font-weight: 500; color: rgba(255,255,255,0.8); font-size: 12px;">${params[0].axisValue}</div>`;
        params.forEach(item => {
          const dot = `<span style="display:inline-block;margin-right:8px;border-radius:50%;width:8px;height:8px;background-color:${item.color};box-shadow: 0 0 6px ${item.color}"></span>`;
          result += `<div style="display: flex; justify-content: space-between; align-items: center; gap: 24px; margin-top: 6px;">
            <span style="color: rgba(255, 255, 255, 0.9); font-size: 13px;">${dot}${item.seriesName}</span>
            <span style="font-weight: 600; color: #fff; font-family: 'DIN Alternate', sans-serif; font-size: 14px;">${item.value}</span>
          </div>`;
        });
        return result;
      }
    },
    legend: {
      show: chartType.value === 'all',
      data: ['Comments', 'Replies', 'Reactions'],
      textStyle: { color: 'rgba(255, 255, 255, 0.6)' },
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 20,
      top: 0,
      right: 0
    },
    grid: {
      left: '1%',
      right: '2%',
      bottom: '5%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { 
        color: 'rgba(255, 255, 255, 0.4)', 
        fontSize: 11, 
        margin: 16,
        interval: 'auto',
        hideOverlap: true
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      minInterval: 1,
      splitLine: { 
        show: true, 
        lineStyle: { 
          type: 'dashed', 
          color: 'rgba(255, 255, 255, 0.05)' 
        } 
      },
      axisLabel: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 11 },
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
    const [statsRes, trendRes, activitiesRes, contributorsRes] = await Promise.all([
      getCommentStats(statsDays.value),
      getInteractionTrend(trendDays.value),
      getCommentActivities(feedLimit.value),
      getTopContributors()
    ]);

    stats.value = statsRes;
    
    trendData.value = trendRes;
    initChart(trendRes);

    console.log('Fetched activities:', activitiesRes);
    activities.value = activitiesRes || [];
    
    contributors.value = contributorsRes;
    console.log('Fetched contributors:', contributorsRes); // Debug log

  } catch (err) {
    console.error('Fetch data error:', err);
  } finally {
    loading.value = false;
  }
};

const displayedActivities = computed(() => {
  return (activities.value || []).slice(0, feedLimit.value);
});

watch(feedLimit, () => {
  // 当下拉框变化时，重新请求数据
  loading.value = true;
  getCommentActivities(feedLimit.value)
    .then(res => {
        activities.value = res || [];
    })
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
            <div class="user-info-wraper">
                <div 
                    class="user-name aurora-text" 
                    :class="{ clickable: !!user.url }" 
                    @click="user.url && openLink(user.url)" 
                    :title="user.url"
                >
                    {{ user.name }}
                </div>
                <div class="user-count">{{ user.count }} interactions</div>
            </div>
          </div>
        </div>
      </a-card>
    </div>

    <!-- Activity Feed -->
    <a-card class="feed-card" :bordered="false">
      <template #title>
        <div class="feed-header-row">
          <span class="section-title">最新动态</span>
          <a-select v-model="feedLimit" class="glass-select" :style="{width:'120px'}" size="small">
            <a-option :value="5">最近 5 条</a-option>
            <a-option :value="10">最近 10 条</a-option>
            <a-option :value="20">最近 20 条</a-option>
          </a-select>
        </div>
      </template>
      <div class="feed-list">
        <!-- Manual Loading State -->
        <div v-if="loading" class="loading-state">
           <a-spin dot />
        </div>
        <div v-else class="feed-content-list">
            <div v-if="displayedActivities.length === 0" class="empty-state">
                <a-empty description="暂无动态" />
            </div>
            
            <div v-for="item in displayedActivities" :key="item.id" class="feed-card-item">
              <!-- Left Side: Avatar -->
              <div class="item-avatar">
                 <a :href="item.userUrl" target="_blank" class="avatar-link">
                    <img :src="item.avatar" alt="avatar" />
                 </a>
              </div>

              <!-- Right Side: Content -->
              <div class="item-main">
                <!-- Header: Who did what where -->
                <div class="item-header">
                   <div class="header-left">
                      <a :href="item.userUrl" target="_blank" class="user-link aurora-text">{{ item.user }}</a>
                      
                      <span class="action-badge" :class="item.action">
                         <icon-message v-if="item.action === 'comment'" /> 
                         <icon-user-group v-else-if="item.action === 'reply'" />
                         <icon-heart v-else-if="item.action === 'reaction'" />
                         <span class="action-text">{{ getActionText(item.action).replace(' on', '').replace(' to', '') }}</span>
                      </span>

                      <span class="target-link" @click="openLink(item.url)" :title="item.url || item.target">
                        {{ item.target }}
                      </span>
                   </div>
                   <div class="header-right">
                       <span class="time-text">{{ item.time }}</span>
                   </div>
                </div>

                <!-- Body Content -->
                <div class="item-body">
                   <!-- Reaction is special -->
                   <div v-if="item.type === 'reaction'" class="reaction-display">
                      {{ formatContent(item) }}
                   </div>
                   <div v-else class="text-display">
                      {{ item.content }}
                   </div>
                </div>

                <!-- Quote / Context -->
                <div v-if="item.replyTo && item.replyTo.name && (item.action === 'reply' || item.action === 'comment')" class="quote-container">
                   <div class="quote-header">
                      Replying to <span class="quote-user">@{{ item.replyTo.name }}</span>
                   </div>
                   <div class="quote-content">{{ item.replyTo.content }}</div>
                </div>
              </div>
            </div>
        </div>
      </div>
    </a-card>
  </div>
</template>

<style scoped>
.comments-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  color: #fff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  background: linear-gradient(90deg, #fff, #b4b8bf);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
}

/* KPI Cards */
.kpi-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  transition: all 0.3s ease;
}
.kpi-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.kpi-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.kpi-icon-wrapper {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: transform 0.3s;
}
.kpi-card:hover .kpi-icon-wrapper {
  transform: scale(1.1);
}
.kpi-icon-wrapper.blue { background: rgba(22, 93, 255, 0.15); color: #4080FF; }
.kpi-icon-wrapper.green { background: rgba(0, 180, 42, 0.15); color: #00E8CF; }
.kpi-icon-wrapper.red { background: rgba(245, 63, 63, 0.15); color: #FF7D00; }

.kpi-info {
  display: flex;
  flex-direction: column;
}
.kpi-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}
.kpi-value {
  font-size: 28px;
  font-weight: 700;
  font-family: 'DIN Alternate', sans-serif;
  color: #fff;
  line-height: 1.2;
}

/* Middle Row */
.middle-row {
  display: flex;
  gap: 20px;
  height: 380px;
}
.chart-card, .contributors-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}
.chart-card {
  flex: 2;
}
.chart-card :deep(.arco-card-header), .contributors-card :deep(.arco-card-header) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}
.chart-card :deep(.arco-card-body) {
  padding: 0 16px 16px;
  height: 100%;
}
.contributors-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.contributors-card :deep(.arco-card-body) {
  flex: 1;
  overflow: hidden;
  padding: 12px;
}

/* Contributors List Advanced Interaction */
.contributors-list {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 4px;
}
/* Scrollbar styling */
.contributors-list::-webkit-scrollbar {
    width: 4px;
}
.contributors-list::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
}

.contributor-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.01);
  transition: all 0.3s;
}
.contributor-item:hover {
  background: rgba(255, 255, 255, 0.05);
  transform: translateX(4px);
}

.rank {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  font-size: 13px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
}
.rank.top {
  background: linear-gradient(135deg, #FFD700 0%, #FDB931 100%);
  color: #333;
  box-shadow: 0 2px 8px rgba(253, 185, 49, 0.3);
}

.user-info-wraper {
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex: 1;
    overflow: hidden;
}

/* Advanced Hover Effect for User Name */
.aurora-text {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  position: relative;
  display: inline-block;
  width: fit-content;
  transition: all 0.3s ease;
}

.aurora-text.clickable {
    cursor: pointer;
}

/* Animated Underline Effect */
.aurora-text.clickable::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 2px;
  bottom: -2px;
  left: 0;
  background: linear-gradient(90deg, #165DFF, #00E8CF);
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.3s ease-out;
  box-shadow: 0 0 8px rgba(22, 93, 255, 0.5);
}

.aurora-text.clickable:hover {
  color: #fff;
  text-shadow: 0 0 12px rgba(22, 93, 255, 0.6);
}

.aurora-text.clickable:hover::after {
  transform: scaleX(1);
}

.user-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 400;
}

/* Feed */
.feed-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

.feed-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.section-title {
    font-size: 16px;
    font-weight: 600;
}

.feed-list {
  display: flex;
  flex-direction: column;
  gap: 16px; /* spacing between cards */
  padding: 8px 0;
}

/* Modern Card Style for Feed Items */
.feed-card-item {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.feed-card-item:hover {
  background: rgba(255, 255, 255, 0.035);
  border-color: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.item-avatar img {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.3s;
}
.item-avatar img:hover {
    transform: rotate(10deg) scale(1.05);
    border-color: #165DFF;
}

.item-main {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
}
.header-left {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
}

.user-link {
    font-size: 15px; 
    font-weight: 600; 
    text-decoration: none;
    letter-spacing: 0.3px;
}
/* Re-use aurora effect logic simplified for feed username if valid */
.user-link:hover {
    color: #165DFF;
    text-shadow: 0 0 10px rgba(22, 93, 255, 0.4);
}

/* Integrated Action Badge */
.action-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 20px;
    font-weight: 500;
}
.action-badge.comment { color: #4080FF; background: rgba(64, 128, 255, 0.1); }
.action-badge.reply { color: #00E8CF; background: rgba(0, 232, 207, 0.1); }
.action-badge.reaction { color: #FF7D00; background: rgba(255, 125, 0, 0.1); }

.target-link {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.85);
    cursor: pointer;
    font-weight: 500;
    transition: color 0.2s;
    position: relative;
    padding-left: 12px;
}
.target-link::before {
    content: '/';
    position: absolute;
    left: 2px;
    color: rgba(255, 255, 255, 0.3);
}
.target-link:hover {
    color: #165DFF;
}

.header-right .time-text {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.3);
    font-family: 'Inter', sans-serif;
}

.item-body {
    font-size: 15px;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.6;
    margin-bottom: 4px;
}

/* Reaction Content Big Emoji */
.reaction-display {
    font-size: 24px;
    line-height: 1.2;
    padding: 4px 0;
    filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.2));
}

/* Enhanced Quote Block */
.quote-container {
    margin-top: 10px;
    padding: 12px 16px;
    background: linear-gradient(90deg, rgba(22, 93, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%);
    border-left: 3px solid #165DFF;
    border-radius: 0 8px 8px 0;
    font-size: 13px;
}

.quote-header {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 4px;
}
.quote-user {
    color: #4080FF;
    font-weight: 500;
}
.quote-content {
    color: rgba(255, 255, 255, 0.7);
    font-style: italic;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.loading-state {
    display: flex;
    justify-content: center;
    padding: 40px;
}
</style>