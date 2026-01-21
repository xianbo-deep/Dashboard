<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { IconUser, IconLock } from '@arco-design/web-vue/es/icon';
import { login } from '@/api/monitor';

const router = useRouter();
const form = reactive({
  username: '',
  password: '',
  remember: false
});
const loading = ref(false);
const errorMessage = ref('');
const currentYear = ref(2025); // 初始值

// 动态获取当前年份
onMounted(() => {
  currentYear.value = new Date().getFullYear();
});

const handleLogin = async () => {
  if (!form.username || !form.password) {
    errorMessage.value = '请输入用户名和密码';
    return;
  }
  
  loading.value = true;
  errorMessage.value = '';
  
  try {
    const data = await login(form.username, form.password);
    // 兼容 data 本身是 token 字符串，或者包含 token 字段的情况
    const token = typeof data === 'string' ? data : (data.token || data.accessToken);
    
    if (!token) {
      throw new Error('登录失败：无法获取令牌');
    }
    
    localStorage.setItem('token', token);
    router.push('/');
  } catch (err) {
    errorMessage.value = err.message || '登录失败，请检查用户名或密码';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="logo-text">Z</div>
        <h1 class="title">Z-Monitor</h1>
        <p class="subtitle"> Sentinel xB</p>
      </div>
      
      <a-form :model="form" layout="vertical" class="login-form">
        <a-form-item field="username" hide-label>
          <a-input v-model="form.username" placeholder="Username" size="large">
            <template #prefix><icon-user /></template>
          </a-input>
        </a-form-item>
        <a-form-item field="password" hide-label>
          <a-input-password v-model="form.password" placeholder="Password" size="large" allow-clear>
            <template #prefix><icon-lock /></template>
          </a-input-password>
        </a-form-item>
        
        <div class="form-actions">
          <a-checkbox v-model="form.remember">记住我</a-checkbox>
          <a-link>忘记密码?</a-link>
        </div>

        <div v-if="errorMessage" class="error-msg">{{ errorMessage }}</div>

        <a-button type="primary" long size="large" :loading="loading" @click="handleLogin" class="login-btn">
          登录
        </a-button>
      </a-form>
    </div>
    
    <div class="footer">
      &copy; {{ currentYear }} xbZhong. All rights reserved.
    </div>
  </div>
</template>

<style scoped>
.login-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #17171A;
  background-image: 
    radial-gradient(circle at 10% 20%, rgba(22, 93, 255, 0.1) 0%, transparent 20%),
    radial-gradient(circle at 90% 80%, rgba(114, 46, 209, 0.1) 0%, transparent 20%);
  position: relative;
  overflow: hidden;
}

/* Decorative background lines */
.login-container::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
}

.login-box {
  width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-text {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #165DFF 0%, #722ED1 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: white;
  margin: 0 auto 16px;
  font-family: 'DIN Alternate', sans-serif;
}

.title {
  color: #fff;
  font-family: 'DIN Alternate', sans-serif;
  font-size: 24px;
  margin: 0 0 8px;
  letter-spacing: 1px;
}

.subtitle {
  color: var(--color-text-3);
  font-size: 14px;
  margin: 0;
}

.login-form :deep(.arco-input-wrapper) {
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
}

.login-form :deep(.arco-input-wrapper:hover),
.login-form :deep(.arco-input-wrapper:focus-within) {
  background-color: rgba(255, 255, 255, 0.08);
  border-color: #165DFF;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
}

.error-msg {
  color: rgb(var(--red-6));
  font-size: 12px;
  margin-bottom: 12px;
  text-align: center;
}

.login-btn {
  background: linear-gradient(90deg, #165DFF 0%, #722ED1 100%);
  border: none;
  font-weight: bold;
  transition: all 0.3s;
}

.login-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.3);
}

.footer {
  position: absolute;
  bottom: 20px;
  color: var(--color-text-4);
  font-size: 12px;
}

/* Fix browser autofill style */
.login-form :deep(input:-webkit-autofill),
.login-form :deep(input:-webkit-autofill:hover), 
.login-form :deep(input:-webkit-autofill:focus), 
.login-form :deep(input:-webkit-autofill:active) {
  /* Use transition to prevent background color change, keeping it transparent/original */
  transition: background-color 99999s ease-in-out 0s;
  -webkit-text-fill-color: white !important;
  caret-color: white;
}
</style>