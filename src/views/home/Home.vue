<template>
  <div class="app-wrapper" :class="{ 'dark-mode': isDarkMode }">
    <!-- 顶部标题栏 -->
    <header class="app-header">
      <div class="logo">
        <h1>灵感提供机 - 分类Tag抽签工具</h1>
        <div class="subtitle">激发创意，打破思维定式</div>
      </div>
      <div class="nav-controls">
        <button class="theme-toggle" @click="toggleDarkMode">
          <span v-if="isDarkMode">☀️</span>
          <span v-else>🌙</span>
        </button>
      </div>
    </header>

    <div class="main-container">
      <!-- 左侧导航菜单 -->
      <div class="left-menu">
        <div 
          v-for="(tab, index) in tabs" 
          :key="index"
          class="menu-item"
          :class="{ active: activeTabIndex === index }"
          @click="activeTabIndex = index"
        >
          {{ tab.name }}
        </div>
      </div>

      <!-- 右侧内容区域 -->
      <div class="right-content">
        <!-- 抽签工具页面 -->
        <div v-show="activeTabIndex === 0" class="page-content">
          <div class="draw-tool-container">
            <!-- 抽签面板 -->
            <drawer-panel />
          </div>
          
          <!-- 历史记录区域 -->
          <div class="history-section">
            <div class="section-header">
              <h3 class="panel-title">历史记录</h3>
            </div>
            <div class="history-content">
              <history-panel />
            </div>
          </div>
        </div>
        
        <!-- 标签库管理页面 -->
        <div v-show="activeTabIndex === 1" class="page-content">
          <tag-library-panel />
        </div>
        
        <!-- 设置页面 -->
        <div v-show="activeTabIndex === 2" class="page-content">
          <div class="settings-page-content">
            <settings-panel />
          </div>
        </div>
        
        <!-- 关于页面 -->
        <div v-show="activeTabIndex === 3" class="page-content">
          <div class="about-page-content">
            <info-panel />
          </div>
        </div>
      </div>
    </div>
    
    <!-- 通知系统 -->
    <notification-system />
  </div>
</template>

<script>
import { defineComponent, ref, inject, onMounted, computed } from 'vue';
import DrawerPanel from '@/components/drawer/DrawerPanel.vue';
import HistoryPanel from '@/components/history/HistoryPanel.vue';
import SettingsPanel from '@/components/settings/SettingsPanel.vue';
import InfoPanel from '@/components/about/InfoPanel.vue';
import TagLibraryPanel from '@/components/tag-library/TagLibraryPanel.vue';
import NotificationSystem from '@/components/common/Notification/NotificationSystem.vue';

export default defineComponent({
  name: 'HomeView',
  components: {
    DrawerPanel,
    HistoryPanel,
    SettingsPanel,
    InfoPanel,
    TagLibraryPanel,
    NotificationSystem
  },
  setup() {
    const emitter = inject('emitter');
    
    // 状态管理
    const activeTabIndex = ref(0);
    const isDarkMode = ref(localStorage.getItem('darkMode') === 'true');
    
    // 导航标签页配置
    const tabs = [
      { name: '抽签工具' },
      { name: '标签库管理' },
      { name: '设置' },
      { name: '关于' }
    ];
    
    // 主题切换
    const toggleDarkMode = () => {
      isDarkMode.value = !isDarkMode.value;
      localStorage.setItem('darkMode', isDarkMode.value);
      emitter.emit('settings-changed', { darkMode: isDarkMode.value });
    };
    
    // 事件监听器
    let unsubscribeSettingsChanged;
    
    // 监听设置变更
    onMounted(() => {
      // 设置初始模式
      if (isDarkMode.value) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
      
      // 监听设置变更
      unsubscribeSettingsChanged = emitter.on('settings-changed', (settings) => {
        if (settings.darkMode !== undefined) {
          isDarkMode.value = settings.darkMode;
          if (settings.darkMode) {
            document.body.classList.add('dark-mode');
          } else {
            document.body.classList.remove('dark-mode');
          }
        }
      });
    });
    
    return {
      activeTabIndex,
      isDarkMode,
      tabs,
      toggleDarkMode
    };
  }
});
</script>

<style scoped>
/* 全局布局 */
.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  height: 100vh;
  width: 100%;
  background-color: var(--bg-color, #f0f5f9);
  color: var(--text-color, #333);
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
}

/* 顶部标题栏 */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--primary-color-light, #e6f4ff);
  padding: 1.2rem 2rem;
  height: 76px;
  border-bottom: 1px solid rgba(24, 144, 255, 0.2);
}

.logo {
  display: flex;
  flex-direction: column;
}

.logo h1 {
  margin: 0;
  font-size: 1.8rem;
  color: var(--primary-color, #1677ff);
  font-weight: 600;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.subtitle {
  font-size: 1rem;
  color: var(--text-color-light, #666);
  margin-top: 6px;
  font-weight: 500;
}

.nav-controls {
  display: flex;
  align-items: center;
}

.theme-toggle {
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.theme-toggle:hover {
  background-color: rgba(24, 144, 255, 0.1);
}

/* 主容器 */
.main-container {
  display: flex;
  flex: 1;
  height: calc(100vh - 76px);
  overflow: hidden;
}

/* 左侧菜单 */
.left-menu {
  width: 200px;
  background-color: var(--bg-color-light, #f5f5f5);
  padding: 20px 0;
  border-right: 1px solid var(--border-color, #eee);
  overflow-y: auto;
}

.menu-item {
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
  color: var(--text-color, #333);
  border-left: 3px solid transparent;
  font-weight: 500;
}

.menu-item:hover {
  background-color: var(--hover-color, #e6f7ff);
  color: var(--primary-color, #1677ff);
}

.menu-item.active {
  background-color: var(--primary-color-light, #e6f4ff);
  color: var(--primary-color, #1677ff);
  border-left-color: var(--primary-color, #1677ff);
}

/* 右侧内容区 */
.right-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto; /* 保持右侧内容区可滚动 */
  background-color: var(--bg-color, #fff);
  display: flex;
  flex-direction: column;
}

.page-content {
  height: auto; /* 改为自适应高度，不限制页面高度 */
  display: flex;
  flex-direction: column;
}

/* 标签页 */
.tabs-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tabs-header {
  display: flex;
  border-bottom: 1px solid var(--border-color, #eee);
  margin-bottom: 20px;
}

.tab {
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 500;
  color: var(--text-color-light, #666);
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
}

.tab:hover {
  color: var(--primary-color, #1677ff);
}

.tab.active {
  color: var(--primary-color, #1677ff);
  border-bottom-color: var(--primary-color, #1677ff);
}

.tab-content {
  flex: 1;
  overflow-y: auto;
}

/* 抽签工具页面样式 */
.draw-tool-container {
  height: auto;
  min-height: 450px;
  max-height: none; /* 取消最大高度限制 */
  margin-bottom: 1.5rem;
  flex-shrink: 0; 
}

.draw-settings-panel {
  flex: 1;
  min-width: 0;
  max-width: 50%;
}

.draw-results-panel {
  flex: 1;
  min-width: 0;
  padding: 20px;
  background-color: var(--panel-bg-color, #fff);
  border-radius: var(--border-radius-medium, 8px);
  box-shadow: var(--shadow-small, 0 2px 8px rgba(0, 0, 0, 0.1));
  overflow-y: auto;
}

.section-header {
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-color, #eee);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-color, #333);
  position: relative;
  padding-left: 0.5rem;
}

.panel-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 1.2em;
  background-color: var(--accent-color, #42b883);
  border-radius: 2px;
}

.copy-buttons {
  display: flex;
  gap: 8px;
}

.copy-button {
  background-color: var(--bg-color-light, #f0f0f0);
  color: var(--text-color, #333);
  border: none;
  border-radius: 4px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.copy-button:hover {
  background-color: var(--primary-color-light, #e6f4ff);
  color: var(--primary-color, #1677ff);
}

.copy-button .button-icon {
  font-size: 1.1rem;
}

/* 历史记录区域 */
.history-section {
  display: block;
  margin-top: 1.5rem;
  height: auto;
  min-height: auto;
  overflow: visible;
  background-color: var(--panel-bg-color, #fff);
  border-radius: var(--border-radius-medium, 8px);
  box-shadow: var(--shadow-small, 0 2px 8px rgba(0, 0, 0, 0.1));
  margin-bottom: 1.5rem;
  max-height: 90vh; /* 限制最大高度为视窗高度的90% */
  overflow-y: auto; /* 超出时显示滚动条 */
}

.history-content {
  display: block;
  width: 100%;
  height: auto;
  min-height: auto;
  max-height: none;
  overflow: visible;
}

/* 抽签结果样式 */
.draw-results {
  padding: 20px;
  overflow-y: auto;
}

.empty-result {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: var(--text-color-light, #666);
  font-style: italic;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-item {
  padding: 16px;
  border-radius: var(--border-radius-medium, 8px);
  border: 1px solid var(--border-color, #eee);
  background-color: var(--panel-bg-color, #fff);
  transition: transform 0.2s, box-shadow 0.2s;
  border-left: 3px solid var(--primary-color, #1677ff);
  animation: tag-fade-in 0.6s ease-out both;
}

@keyframes tag-fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-small, 0 2px 8px rgba(0, 0, 0, 0.1));
}

.result-category {
  font-size: 0.85rem;
  color: var(--primary-color, #1677ff);
  margin-bottom: 6px;
  font-weight: 500;
}

.result-content {
  font-size: 1.2rem;
  color: var(--text-color, #333);
  margin-bottom: 8px;
  font-weight: 500;
}

.result-subtitle {
  font-size: 0.9rem;
  color: var(--text-color-light, #666);
  font-style: italic;
}

/* 深色模式 */
.dark-mode .app-wrapper {
  background-color: var(--bg-color-dark-mode, #141414);
  color: var(--text-color-dark, #e0e0e0);
}

.dark-mode .app-header {
  background-color: rgba(22, 119, 255, 0.1);
  border-bottom-color: rgba(22, 119, 255, 0.2);
}

.dark-mode .logo h1 {
  color: var(--primary-color-light-dark, #177ddc);
}

.dark-mode .subtitle {
  color: var(--text-color-light-dark, #999);
}

.dark-mode .theme-toggle:hover {
  background-color: rgba(22, 119, 255, 0.2);
}

.dark-mode .left-menu {
  background-color: var(--bg-color-light-dark, #2c2c2c);
  border-right-color: var(--border-color-dark-mode, #333);
}

.dark-mode .menu-item {
  color: var(--text-color-dark, #e0e0e0);
}

.dark-mode .menu-item:hover {
  background-color: var(--hover-color-dark, #165996);
  color: var(--primary-color-light-dark, #177ddc);
}

.dark-mode .menu-item.active {
  background-color: rgba(22, 119, 255, 0.15);
  color: var(--primary-color-light-dark, #177ddc);
  border-left-color: var(--primary-color-light-dark, #177ddc);
}

.dark-mode .right-content {
  background-color: var(--bg-color-dark-mode, #141414);
}

.dark-mode .tabs-header {
  border-bottom-color: var(--border-color-dark-mode, #333);
}

.dark-mode .tab {
  color: var(--text-color-light-dark, #999);
}

.dark-mode .tab:hover,
.dark-mode .tab.active {
  color: var(--primary-color-light-dark, #177ddc);
}

.dark-mode .tab.active {
  border-bottom-color: var(--primary-color-light-dark, #177ddc);
}

.dark-mode .empty-result {
  color: var(--text-color-light-dark, #999);
}

.dark-mode .result-item {
  background-color: var(--panel-bg-color-dark, #1f1f1f);
  border-color: var(--border-color-dark-mode, #333);
  border-left-color: var(--primary-color-light-dark, #177ddc);
}

.dark-mode .result-category {
  color: var(--primary-color-light-dark, #177ddc);
}

.dark-mode .result-content {
  color: var(--text-color-dark, #e0e0e0);
}

.dark-mode .result-subtitle {
  color: var(--text-color-light-dark, #999);
}

.dark-mode .copy-button {
  background-color: var(--bg-color-light-dark, #2c2c2c);
  color: var(--text-color-dark, #e0e0e0);
}

.dark-mode .copy-button:hover {
  background-color: var(--primary-color-light-dark, #177ddc);
  color: var(--text-color-dark, #fff);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .left-menu {
    width: 60px;
  }
  
  .menu-item {
    padding: 16px 0;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 0.85rem;
  }
  
  .app-header {
    padding: 1rem;
  }
  
  .logo h1 {
    font-size: 1.4rem;
  }
  
  .subtitle {
    font-size: 0.8rem;
  }
  
  .tab {
    padding: 8px 12px;
    font-size: 0.9rem;
  }
  
  .draw-tool-container {
    max-height: none; /* 移动端不限制最大高度 */
  }
  
  .section-header {
    padding: 0.75rem 1rem;
  }
  
  .panel-title {
    font-size: 1.1rem;
  }
}

/* 设置页面和关于页面公共样式 */
.settings-page-content,
.about-page-content {
  height: auto;
  overflow-y: auto; /* 允许内容滚动 */
  padding: 1.5rem;
  background-color: var(--panel-bg-color, #fff);
  border-radius: var(--border-radius-medium, 12px);
  box-shadow: var(--shadow-small, 0 2px 8px rgba(0, 0, 0, 0.1));
  margin-bottom: 1.5rem;
}

/* 深色模式适配 */
.dark-mode .settings-page-content,
.dark-mode .about-page-content {
  background-color: var(--panel-bg-color-dark, #1f1f1f);
  box-shadow: var(--shadow-medium-dark, 0 4px 16px rgba(0, 0, 0, 0.2));
}
</style> 