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
            <!-- 左侧抽签设置 -->
            <div class="draw-settings-panel">
              <tag-drawer-panel @draw-completed="handleDrawCompleted" />
            </div>
            
            <!-- 右侧抽签结果 -->
            <div class="draw-results-panel">
              <h3 class="panel-title">抽签结果</h3>
              <div v-if="drawnTags.length === 0" class="empty-result">
                点击"抽签"按钮开始
              </div>
              <div v-else class="results-list">
                <div 
                  v-for="(tag, index) in drawnTags" 
                  :key="index"
                  class="result-item"
                >
                  <div class="result-category">{{ tag.category }}</div>
                  <div class="result-content">{{ tag.content }}</div>
                  <div v-if="tag.subTitles && tag.subTitles.length > 0" class="result-subtitle">
                    {{ tag.subTitles.join(' / ') }}
                  </div>
                </div>
              </div>
            </div>
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
          <settings-panel />
        </div>
        
        <!-- 关于页面 -->
        <div v-show="activeTabIndex === 3" class="page-content">
          <info-panel />
        </div>
      </div>
    </div>
    
    <!-- 通知系统 -->
    <notification-system />
  </div>
</template>

<script>
import { defineComponent, ref, inject, onMounted, onBeforeUnmount, computed } from 'vue';
import TagDrawerPanel from '@/components/panels/TagDrawerPanel.vue';
import HistoryPanel from '@/components/panels/HistoryPanel.vue';
import SettingsPanel from '@/components/panels/SettingsPanel.vue';
import InfoPanel from '@/components/panels/InfoPanel.vue';
import TagLibraryPanel from '@/components/panels/TagLibraryPanel.vue';
import NotificationSystem from '@/components/common/NotificationSystem.vue';

export default defineComponent({
  name: 'HomeView',
  components: {
    TagDrawerPanel,
    HistoryPanel,
    SettingsPanel,
    InfoPanel,
    TagLibraryPanel,
    NotificationSystem
  },
  setup() {
    const emitter = inject('emitter');
    
    // 状态管理
    const drawnTags = ref([]);
    const activeTabIndex = ref(0);
    const isDarkMode = ref(localStorage.getItem('darkMode') === 'true');
    
    // 导航标签页配置
    const tabs = [
      { name: '抽签工具' },
      { name: '标签库管理' },
      { name: '设置' },
      { name: '关于' }
    ];
    
    // 处理抽签完成事件
    const handleDrawCompleted = (tags) => {
      drawnTags.value = tags;
    };
    
    // 主题切换
    const toggleDarkMode = () => {
      isDarkMode.value = !isDarkMode.value;
      localStorage.setItem('darkMode', isDarkMode.value);
      emitter.emit('settings-changed', { darkMode: isDarkMode.value });
    };
    
    // 事件监听
    // 监听标签抽取事件
    const unsubscribeTags = emitter.on('tags-drawn', (tags) => {
      drawnTags.value = tags;
    });
    
    // 监听重置事件
    const unsubscribeReset = emitter.on('tags-reset', () => {
      drawnTags.value = [];
    });
    
    // 监听历史记录重用
    const unsubscribeHistory = emitter.on('reuse-history', (historyItem) => {
      drawnTags.value = historyItem.tags;
    });
    
    // 监听设置变更
    const unsubscribeSettings = emitter.on('settings-changed', (settings) => {
      isDarkMode.value = settings.darkMode;
    });
    
    // 组件销毁时取消订阅
    onBeforeUnmount(() => {
      unsubscribeTags();
      unsubscribeReset();
      unsubscribeHistory();
      unsubscribeSettings();
    });
    
    return {
      drawnTags,
      activeTabIndex,
      tabs,
      isDarkMode,
      handleDrawCompleted,
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
  overflow-y: auto;
  background-color: var(--bg-color, #fff);
}

.page-content {
  height: 100%;
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

/* 抽签工具布局 */
.draw-tool-container {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  height: 65%;
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

.panel-title {
  font-size: 1.2rem;
  color: var(--text-color, #333);
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color, #eee);
}

/* 历史记录区域 */
.history-section {
  height: 30%;
  background-color: var(--panel-bg-color, #fff);
  border-radius: var(--border-radius-medium, 8px);
  box-shadow: var(--shadow-small, 0 2px 8px rgba(0, 0, 0, 0.1));
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.section-header {
  padding: 16px 20px 0;
}

.history-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 20px;
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
}
</style> 