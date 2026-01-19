<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  document.body.setAttribute('arco-theme', 'dark');
});
</script>

<template>
  <router-view />
</template>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
  background-color: #17171A;
  color: var(--color-text-1);
}
</style>