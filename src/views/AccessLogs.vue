<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { getLogs } from '@/api/monitor';
import { 
  IconSearch, 
  IconRefresh, 
  IconDesktop, 
  IconMobile, 
  IconCode,
  IconBug,
  IconThunderbolt,
  IconUserGroup,
  IconEye
} from '@arco-design/web-vue/es/icon';

// --- State ---
const loading = ref(false);
const data = ref([]);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: true,
  showJumper: true,
  showPageSize: true
});

const searchForm = reactive({
  keyword: '',
  status: '',
  latency: undefined // Change to undefined or integer, initially empty
});

const drawerVisible = ref(false);
const currentLog = ref({});

// --- Helpers ---
const parseUA = (ua) => {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', type: 'desktop' };
  
  let browser = 'Other';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  let os = 'Other';
  let type = 'desktop';
  if (ua.includes('Windows')) { os = 'Windows'; type = 'desktop'; }
  else if (ua.includes('Mac')) { os = 'MacOS'; type = 'desktop'; }
  else if (ua.includes('Linux')) { os = 'Linux'; type = 'desktop'; }
  else if (ua.includes('Android')) { os = 'Android'; type = 'mobile'; }
  else if (ua.includes('iPhone') || ua.includes('iPad')) { os = 'iOS'; type = 'mobile'; }

  return { browser, os, type };
};

// --- Columns ---
const columns = [
  {
    title: '访问时间',
    dataIndex: 'visit_time',
    width: 180,
  },
  {
    title: '访客ID',
    dataIndex: 'visitor_id',
    width: 120,
    ellipsis: true,
    tooltip: true,
  },
  {
    title: '状态码',
    dataIndex: 'status',
    width: 100,
    slotName: 'status',
  },
  {
    title: '耗时',
    dataIndex: 'latency',
    width: 120,
    slotName: 'latency',
    sortable: {
      sortDirections: ['ascend', 'descend']
    }
  },
  {
    title: '访客 IP',
    dataIndex: 'ip',
    width: 140,
    slotName: 'ip',
  },
  {
    title: '地理位置',
    dataIndex: 'location',
    width: 200,
    slotName: 'location',
  },
  {
    title: '访问路径',
    dataIndex: 'path',
    ellipsis: true,
    tooltip: true,
  },
  {
    title: '设备信息',
    dataIndex: 'user_agent',
    width: 160,
    slotName: 'user_agent',
  },
];

// --- Logic ---
const fetchData = async (params = {}) => {
  loading.value = true;
  try {
    const query = {
      page: params.current || pagination.current,
      pageSize: params.pageSize || pagination.pageSize,
      keyword: searchForm.keyword,
      status: searchForm.status,
    };

    // 只有当有值的时候才传递 latency，并确保转为整数
    if (searchForm.latency) {
        query.latency = parseInt(searchForm.latency, 10);
    }

    // In a real app, pass searchForm to API
    const res = await getLogs(query);
    
    data.value = res.list;
    pagination.total = res.total;
    pagination.current = res.page || params.current; // Use backend current page if available
    pagination.pageSize = res.page_size || params.pageSize;
  } catch (err) {
    console.error('Fetch logs failed', err);
  } finally {
    loading.value = false;
  }
};

const onPageChange = (current) => {
  fetchData({ current });
};

const onPageSizeChange = (pageSize) => {
  fetchData({ current: 1, pageSize });
};

const onSearch = () => {
  fetchData({ current: 1 });
};

const onReset = () => {
  searchForm.keyword = '';
  searchForm.status = '';
  searchForm.latency = undefined;
  fetchData({ current: 1 });
};

const onRowClick = (record) => {
  currentLog.value = record;
  drawerVisible.value = true;
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="logs-container">
    <!-- Main Content -->
    <a-card title="访问日志监控" :bordered="false" class="logs-card">
      <template #extra>
        <a-space>
          <a-input-search 
            v-model="searchForm.keyword" 
            placeholder="搜索 IP / ID / 路径" 
            style="width: 240px" 
            @search="onSearch"
            @press-enter="onSearch"
          />
          <a-select v-model="searchForm.status" placeholder="状态码" style="width: 120px" allow-clear @change="onSearch">
            <a-option :value="200">200 OK</a-option>
            <a-option :value="301">301 Moved</a-option>
            <a-option :value="404">404 Not Found</a-option>
            <a-option :value="500">500 Error</a-option>
          </a-select>
          <a-input-number 
            v-model="searchForm.latency" 
            placeholder="最小耗时(ms)" 
            style="width: 140px" 
            allow-clear 
            hide-button
            @change="onSearch"
          >
             <template #prefix>
                >
             </template>
          </a-input-number>
          <a-button type="outline" @click="onReset">
            <template #icon><icon-refresh /></template>
            重置
          </a-button>
        </a-space>
      </template>

      <a-table
        :data="data"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        @page-change="onPageChange"
        @page-size-change="onPageSizeChange"
        @row-click="onRowClick"
        row-key="id"
        stripe
        hoverable
        :bordered="{ cell: true }"
      >
        <template #status="{ record }">
          <a-tag :color="record.status >= 200 && record.status < 300 ? 'green' : record.status >= 300 && record.status < 400 ? 'orange' : 'red'">
            {{ record.status }}
          </a-tag>
        </template>
        
        <template #latency="{ record }">
          <span :class="['latency-cell', { 'latency-high': record.latency > 500, 'latency-low': record.latency < 200 }]">
            {{ record.latency }}ms
          </span>
        </template>
        
        <template #ip="{ record }">
          <span class="font-mono">{{ record.ip }}</span>
        </template>

        <template #location="{ record }">
          <div class="location-cell">
            <div class="city">{{ record.city }}</div>
            <div class="region">{{ record.region }} <span v-if="record.country">· {{ record.country }}</span></div>
          </div>
        </template>

        <template #user_agent="{ record }">
          <a-tooltip :content="record.user_agent">
            <div class="ua-cell">
              <component :is="parseUA(record.user_agent).type === 'mobile' ? IconMobile : IconDesktop" />
              <span class="ua-text">{{ parseUA(record.user_agent).browser }}</span>
              <span class="ua-os">{{ parseUA(record.user_agent).os }}</span>
            </div>
          </a-tooltip>
        </template>
      </a-table>
    </a-card>

    <!-- Detail Drawer -->
    <a-drawer 
      :visible="drawerVisible" 
      @ok="drawerVisible = false" 
      @cancel="drawerVisible = false" 
      width="500px"
      title="日志详情"
      :footer="false"
    >
      <div v-if="currentLog" class="log-detail">
        <a-descriptions :column="1" bordered>
          <a-descriptions-item label="Request ID">{{ currentLog.visitor_id }}</a-descriptions-item>
          <a-descriptions-item label="Time">{{ currentLog.visit_time }}</a-descriptions-item>
          <a-descriptions-item label="IP">{{ currentLog.ip }}</a-descriptions-item>
          <a-descriptions-item label="Location">{{ currentLog.city }}, {{ currentLog.region }}, {{ currentLog.country }}</a-descriptions-item>
          <a-descriptions-item label="Method">
            <a-tag color="arcoblue">GET</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="Path">
            <code class="path-code">{{ currentLog.path }}</code>
          </a-descriptions-item>
          <a-descriptions-item label="Status">
            <a-tag :color="currentLog.status >= 200 && currentLog.status < 300 ? 'green' : 'red'">{{ currentLog.status }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="Latency">{{ currentLog.latency }}ms</a-descriptions-item>
          <a-descriptions-item label="Referer">{{ currentLog.referer }}</a-descriptions-item>
          <a-descriptions-item label="User Agent">
            <div class="ua-full">{{ currentLog.user_agent }}</div>
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-drawer>
  </div>
</template>

<style scoped>
.logs-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

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

.logs-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
  border-radius: 8px;
}

:deep(.arco-table-th) {
  background-color: rgba(255, 255, 255, 0.02);
}

.location-cell {
  line-height: 1.3;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.location-cell .city {
  font-weight: 500;
  font-size: 14px;
}
.location-cell .region {
  font-size: 12px;
  color: var(--color-text-3);
}

.latency-cell {
  font-weight: 500;
}
.latency-high {
  color: #f53f3f;
  font-weight: bold;
}
.latency-low {
  color: #00b42a;
}

.font-mono {
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
}

.ua-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}
.ua-text {
  font-weight: 500;
}
.ua-os {
  color: var(--color-text-3);
  font-size: 12px;
}

.path-code {
  background: rgba(255,255,255,0.1);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
}

.ua-full {
  word-break: break-all;
  font-size: 12px;
  color: var(--color-text-3);
}

.json-view {
  margin-top: 20px;
}
.json-view h4 {
  margin-bottom: 8px;
}
.json-view pre {
  background: #1a1a1a;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  color: #a9b7c6;
}
</style>