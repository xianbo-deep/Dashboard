import { createRouter, createWebHashHistory } from 'vue-router'
import MainLayout from '../layout/MainLayout.vue'
import Dashboard from '../views/Dashboard.vue'
import AccessLogs from '../views/AccessLogs.vue'
import Pages from '../views/Pages.vue'
import PageDetail from '../views/PageDetail.vue'
import Performance from '../views/Performance.vue'
import WorldMap from '../views/WorldMap.vue'
import ChinaMap from '../views/ChinaMap.vue'
import Comments from '../views/Comments.vue'
import Login from '../views/Login.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'dashboard',
          component: Dashboard
        },
        {
          path: 'logs',
          name: 'logs',
          component: AccessLogs
        },
        {
          path: 'pages',
          name: 'pages',
          component: Pages
        },
        {
          path: 'pages/detail',
          name: 'PageDetail',
          component: PageDetail
        },
        {
          path: 'performance',
          name: 'performance',
          component: Performance
        },
        {
          path: 'map/world',
          name: 'world-map',
          component: WorldMap
        },
        {
          path: 'map/china',
          name: 'china-map',
          component: ChinaMap
        },
        {
          path: 'comments',
          name: 'comments',
          component: Comments
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('token');
  
  if (to.name !== 'login' && !isAuthenticated) {
    next({ name: 'login' });
  } else if (to.name === 'login' && isAuthenticated) {
    next({ name: 'dashboard' }); 
  } else {
    next();
  }
});

export default router