import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://api.xbzhong.cn',
  timeout: 10000
});

// Request interceptor to add token
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Response interceptor to unwrap data
apiClient.interceptors.response.use(response => {
  const res = response.data;
  // 兼容 code=0 或 code=200 为成功状态
  if (res.code === 200 || res.code === 0) {
    return res.data;
  } else {
    // 排除登录接口，避免登录失败时刷新页面
    if (res.code === 401 && !response.config.url.includes('/login')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
    }
    return Promise.reject(new Error(res.message || 'Error'));
  }
}, error => {
  if (error.response && error.response.status === 401 && !(error.config && error.config.url.includes('/login'))) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  return Promise.reject(error);
});

// --- Auth ---
export function login(username, password) {
  return apiClient.post('/admin/login', { username, password });
}

// --- Dashboard ---

export function getTrendData() {
  return apiClient.get('/admin/dashboard/trend').then(data => {
    return data.map(item => {
        const dateObj = new Date(item.date);
        const dateStr = `${dateObj.getMonth() + 1}-${dateObj.getDate()}`;
        return {
            date: dateStr,
            pv: item.pv,
            uv: item.uv
        };
    });
  });
}

export function getAnalysisTrend(days = 7) {
  return apiClient.get('/admin/analysis/trend', { params: { days } }).then(data => {
    return data.map(item => {
        const dateObj = new Date(item.date);
        const dateStr = `${dateObj.getMonth() + 1}-${dateObj.getDate()}`;
        return {
            date: dateStr,
            pv: item.pv,
            uv: item.uv
        };
    });
  });
}

export function getRankings(days = 7) {
  return apiClient.get('/admin/analysis/rank', { params: { days } }).then(data => {
      return data.map(item => ({
          path: item.path,
          view_count: item.pv
      }));
  });
}

export function getDashboardSummary() {
    return apiClient.get('/admin/dashboard/summary');
}

export function getDashboardInsights() {
    return apiClient.get('/admin/dashboard/insights');
}

// --- Access Logs ---

export function getLogs(params) {
  const query = {
      page: params.page || 1,
      page_size: params.pageSize || 10,
      ...params
  };
  return apiClient.get('/admin/accesslog/logs', { params: query }).then(data => {
      // Backend returns { list: [], total: ... }
      return data;
  });
}

// --- Page Analysis ---

export function getPageStats(queryOrType) {
  let days = 30;
  if (typeof queryOrType === 'string') {
      days = queryOrType === 'today' ? 1 : 30;
  } else if (typeof queryOrType === 'number') {
      days = queryOrType;
  }

  const params = {
      page: 1,
      page_size: 100,
      days
  };
  
  return apiClient.get('/admin/analysis/querypath', { params }).then(res => {
     return res.list.map(item => ({
         path: item.path,
         pv: item.pv,
         uv: item.uv,
         avg_latency: item.avg_latency
     }));
  });
}

// --- Performance ---

export function getPerformanceTrend() {
  return apiClient.get('/admin/performance/averageDelay').then(data => {
      return data.map(item => {
          const d = new Date(item.time);
          const hour = d.getHours().toString().padStart(2, '0') + ':00';
          return {
              time: hour,
              latency: item.avg_delay
          };
      });
  });
}

export function getSlowestPages() {
  return apiClient.get('/admin/performance/slowPages').then(data => {
      // Backend returns []SlowDelayItem { path, avg_delay }
      return data.map(item => ({
          path: item.path,
          avg_latency: item.avg_delay
      }));
  });
}

// --- Visitor Map ---

export function getWorldStats(date) {
  return apiClient.get('/admin/visitormap/map').then(data => {
      return data.map(item => ({
          name: item.country,
          value: item.count
      }));
  });
}

export function getChinaStats(date) {
  return apiClient.get('/admin/visitormap/chineseMap').then(data => {
      return data.map(item => ({
          name: item.province || item.name, 
          value: item.count
      }));
  });
}

// --- Comments ---

export function getCommentsData() {
  return Promise.all([
    getCommentStats(7),
    getCommentActivities(),
    getInteractionTrend(7),
    getTopContributors()
  ]).then(([stats, activities, trend, contributors]) => {
    return {
      stats,
      activities,
      trend,
      contributors
    };
  });
}

export function getCommentStats(days = 7) {
  const d = days === 'all' ? 365 : days;
  return apiClient.get('/admin/discussionmap/metric', { params: { days: d } }).then(data => {
      return {
          comments: data.total_comments,
          replies: data.total_replies,
          reactions: data.total_reactions
      };
  });
}

export function getCommentActivities() {
   return apiClient.get('/admin/discussionmap/feed', { params: { limit: 50 } }).then(data => {
       return data.map(item => ({
           id: item.url + item.time,
           user: item.name,
           avatar: item.avatar,
           action: item.event_type,
           target: item.path,
           content: item.content,
           time: item.time,
           type: item.event_type
       }));
   });
}

export function getInteractionTrend(days = 7) {
    return apiClient.get('/admin/discussionmap/trend', { params: { days } }).then(data => {
        return data.map(item => ({
            date: item.date,
            comments: item.totalComments,
            replies: item.totalReplies,
            reactions: item.totalResponses || item.totalReactions 
        }));
    });
}

export function getTopContributors() {
    return apiClient.get('/admin/discussionmap/activeuser', { params: { limit: 10 } }).then(data => {
        return data.map(item => ({
            name: item.name,
            avatar: item.avatar,
            count: item.totalFeeds
        }));
    });
}

// --- Page Detail ---

export function getPageDetail(path) {
    const p1 = apiClient.get('/admin/analysis/pathDetail/trend', { params: { path } });
    const p2 = apiClient.get('/admin/analysis/pathDetail/source', { params: { path } });
    const p3 = apiClient.get('/admin/analysis/pathDetail/device', { params: { path } });
    const p4 = apiClient.get('/admin/analysis/pathDetail/metric', { params: { path } });

    return Promise.all([p1, p2, p3, p4]).then(([trendData, sourceData, deviceData, metricData]) => {
        
        const trend = trendData.map(item => ({
            time: item.date, 
            pv: item.pv,
            uv: item.uv
        }));

        const sources = sourceData.map(item => ({
            name: item.source,
            value: item.count
        }));

        const devices = deviceData.map(item => ({
            name: item.device,
            value: item.count
        }));

        const stats = {
            pv: metricData.pv || 0,
            uv: metricData.uv || 0,
            avgTime: '0s', 
            bounceRate: '0%' 
        };

        return {
            path,
            stats,
            trend,
            sources,
            devices
        };
    });
}
