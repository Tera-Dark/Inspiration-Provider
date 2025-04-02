<template>
  <div id="app" :class="{ 'dark-mode': isDarkMode }">
    <home-view />
  </div>
</template>

<script>
import { defineComponent, ref, inject, onMounted } from 'vue';
import HomeView from '@/views/home/Home.vue';

export default defineComponent({
  name: 'App',
  components: {
    HomeView
  },
  setup() {
    const isDarkMode = ref(false);
    const emitter = inject('emitter');
    
    // 初始化时从本地存储加载主题设置
    onMounted(() => {
      isDarkMode.value = localStorage.getItem('darkMode') === 'true';
      
      // 监听主题变更事件
      emitter.on('settings-changed', (settings) => {
        if (settings.darkMode !== undefined) {
          isDarkMode.value = settings.darkMode;
        }
      });
    });
    
    return {
      isDarkMode
    };
  }
});
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  background-color: var(--bg-color, #f0f5f9);
  color: var(--text-color, #333);
  transition: background-color 0.3s, color 0.3s;
}

#app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 设置自定义滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.dark-mode ::-webkit-scrollbar-track {
  background: #2d3748;
}

.dark-mode ::-webkit-scrollbar-thumb {
  background: #4a5568;
}

.dark-mode ::-webkit-scrollbar-thumb:hover {
  background: #718096;
}
</style> 