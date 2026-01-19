<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { IconDashboard, IconFile, IconCommon, IconThunderbolt, IconExport, IconPublic, IconMessage } from '@arco-design/web-vue/es/icon';

const router = useRouter();
const route = useRoute();
const collapsed = ref(false);

const onClickMenuItem = (key) => {
  router.push(key);
};

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
};
</script>

<template>
  <a-layout class="layout-demo">
    <a-layout-sider
      collapsible
      :collapsed="collapsed"
      @collapse="val => collapsed = val"
      breakpoint="xl"
    >
      <div class="logo">
        <div v-if="!collapsed" class="logo-text">Admin</div>
        <div v-else class="logo-text">Z</div>
      </div>
      <a-menu
        :selected-keys="[route.path]"
        @menu-item-click="onClickMenuItem"
      >
        <a-menu-item key="/">
          <template #icon><icon-dashboard /></template>
          监控大屏
        </a-menu-item>
        <a-menu-item key="/pages">
          <template #icon><icon-common /></template>
          页面分析
        </a-menu-item>
        <a-menu-item key="/performance">
          <template #icon><icon-thunderbolt /></template>
          性能监控
        </a-menu-item>
        <a-sub-menu key="map">
          <template #icon><icon-public /></template>
          <template #title>访客地图</template>
          <a-menu-item key="/map/world">全球分布</a-menu-item>
          <a-menu-item key="/map/china">中国分布</a-menu-item>
        </a-sub-menu>
        <a-menu-item key="/comments">
          <template #icon><icon-message /></template>
          社区互动
        </a-menu-item>
        <a-menu-item key="/logs">
          <template #icon><icon-file /></template>
          访问日志
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header style="padding-left: 20px; padding-right: 20px; background: var(--color-bg-2); border-bottom: 1px solid var(--color-border);">
        <div class="header-content">
          <h2 class="brand-title">Z-Monitor</h2>
          <div style="flex: 1;"></div>
          <a-button type="text" status="danger" @click="handleLogout">
            <template #icon><icon-export /></template>
            退出登录
          </a-button>
        </div>
      </a-layout-header>
      <a-layout-content style="padding: 20px; overflow-y: auto; background: #17171A;">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style scoped>
.layout-demo {
  height: 100vh;
  background: #17171A;
}
.logo {
  height: 32px;
  margin: 12px 8px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  border-radius: 2px;
}
.header-content {
  display: flex;
  align-items: center;
  height: 100%;
}
.brand-title {
  color: #fff;
  font-family: 'DIN Alternate', 'Roboto', sans-serif;
  letter-spacing: 1px;
}
</style>