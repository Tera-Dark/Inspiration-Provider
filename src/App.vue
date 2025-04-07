<template>
  <div id="app" :class="{ 'dark-mode': isDarkMode }">
    <home-view />
    <library-status-bar v-if="showLibraryBar" class="library-status-bar" />
  </div>
</template>

<script>
import { defineComponent, ref, inject, onMounted } from 'vue';
import HomeView from '@/views/home/Home.vue';
import LibraryStatusBar from './components/common/LibraryStatusBar.vue';

export default defineComponent({
  name: 'App',
  components: {
    HomeView,
    LibraryStatusBar
  },
  setup() {
    const isDarkMode = ref(false);
    const emitter = inject('emitter');
    const showLibraryBar = ref(true);
    
    // 获取较深的颜色
    const getDarkerColor = (hex, percent) => {
      // 将 hex 转换为 RGB
      let r = parseInt(hex.substr(1, 2), 16);
      let g = parseInt(hex.substr(3, 2), 16);
      let b = parseInt(hex.substr(5, 2), 16);
      
      // 使颜色更深
      r = Math.floor(r * (100 - percent) / 100);
      g = Math.floor(g * (100 - percent) / 100);
      b = Math.floor(b * (100 - percent) / 100);
      
      // 转回 hex
      return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };
    
    // 获取较浅的颜色
    const getLighterColor = (hex, percent) => {
      // 将 hex 转换为 RGB
      let r = parseInt(hex.substr(1, 2), 16);
      let g = parseInt(hex.substr(3, 2), 16);
      let b = parseInt(hex.substr(5, 2), 16);
      
      // 使颜色更浅
      r = Math.floor(r + (255 - r) * percent / 100);
      g = Math.floor(g + (255 - g) * percent / 100);
      b = Math.floor(b + (255 - b) * percent / 100);
      
      // 转回 hex
      return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };
    
    // 初始化时从本地存储加载主题设置
    onMounted(() => {
      // 加载深色模式设置
      isDarkMode.value = localStorage.getItem('dark_mode') === 'true';
      
      // 加载字体大小
      const savedFontSize = localStorage.getItem('user_font_size');
      if (savedFontSize) {
        const baseSize = parseInt(savedFontSize);
        const root = document.documentElement;
        root.style.setProperty('--font-size-base', `${baseSize}px`);
        
        // 更新所有基于基础字体大小的变量
        root.style.setProperty('--font-size-xs', `${baseSize * 0.85}px`);
        root.style.setProperty('--font-size-sm', `${baseSize * 0.95}px`);
        root.style.setProperty('--font-size-md', `${baseSize}px`);
        root.style.setProperty('--font-size-lg', `${baseSize * 1.2}px`);
        root.style.setProperty('--font-size-xl', `${baseSize * 1.5}px`);
      }
      
      // 监听字体大小变更事件，确保所有显示字体大小的组件都能获取到最新值
      emitter.on('font-size-changed', (newSize) => {
        const baseSize = parseInt(newSize);
        const root = document.documentElement;
        
        // 更新所有CSS变量
        root.style.setProperty('--font-size-base', `${baseSize}px`);
        root.style.setProperty('--font-size-xs', `${baseSize * 0.85}px`);
        root.style.setProperty('--font-size-sm', `${baseSize * 0.95}px`);
        root.style.setProperty('--font-size-md', `${baseSize}px`);
        root.style.setProperty('--font-size-lg', `${baseSize * 1.2}px`);
        root.style.setProperty('--font-size-xl', `${baseSize * 1.5}px`);
        
        // 将最新的字体大小保存到本地存储
        localStorage.setItem('user_font_size', baseSize.toString());
      });
      
      // 加载主题颜色
      const savedThemeColor = localStorage.getItem('user_theme_color');
      if (savedThemeColor) {
        document.documentElement.style.setProperty('--primary-color', savedThemeColor);
        
        // 计算相关颜色
        const darkerColor = getDarkerColor(savedThemeColor, 15);
        const lighterColor = getLighterColor(savedThemeColor, 85);
        
        document.documentElement.style.setProperty('--primary-hover-color', darkerColor);
        document.documentElement.style.setProperty('--primary-color-light', lighterColor);
        document.documentElement.style.setProperty('--action-color', savedThemeColor);
        document.documentElement.style.setProperty('--action-hover-color', darkerColor);
      }
      
      // 应用深色模式
      if (isDarkMode.value) {
        document.body.classList.add('dark-mode');
      }
      
      // 监听主题变更事件
      emitter.on('settings-updated', (settings) => {
        if (settings && settings.darkMode !== undefined) {
          isDarkMode.value = settings.darkMode;
          
          if (isDarkMode.value) {
            document.body.classList.add('dark-mode');
          } else {
            document.body.classList.remove('dark-mode');
          }
        }
      });
    });
    
    return {
      isDarkMode,
      showLibraryBar
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
  background-color: var(--bg-color, #f5f5f5);
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
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-color-light, #f5f5f5);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: var(--bg-color-dark, #e0e0e0);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--border-color-dark, #dddddd);
}

.dark-mode ::-webkit-scrollbar-track {
  background: var(--bg-color-light-dark, #333333);
}

.dark-mode ::-webkit-scrollbar-thumb {
  background: var(--bg-color-dark-dark, #3c3c3c);
}

.dark-mode ::-webkit-scrollbar-thumb:hover {
  background: var(--border-color-dark-mode, #444444);
}

/* 添加库状态栏样式 */
.library-status-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
}

/* 调整内容区域以适应库状态栏 */
.app-content {
  margin-top: 50px;
}
</style> 