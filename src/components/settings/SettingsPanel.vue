<template>
  <div class="settings-panel">
    <h2>系统设置</h2>
    
    <div class="tab-container">
      <div class="tab-buttons">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'preferences' }"
          @click="activeTab = 'preferences'"
        >用户偏好</button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'drawer' }"
          @click="activeTab = 'drawer'"
        >抽签设置</button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'backup' }"
          @click="activeTab = 'backup'"
        >数据/备份</button>
      </div>
      
      <div class="tab-content" :class="{ active: activeTab === 'preferences' }">
        <theme-settings />
      </div>
      
      <div class="tab-content" :class="{ active: activeTab === 'drawer' }">
        <drawer-settings />
      </div>
      
      <div class="tab-content" :class="{ active: activeTab === 'backup' }">
        <backup-settings />
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue';
import ThemeSettings from './preferences/ThemeSettings.vue';
import DrawerSettings from './preferences/DrawerSettings.vue';
import BackupSettings from './backup/BackupSettings.vue';

export default defineComponent({
  name: 'SettingsPanel',
  components: {
    ThemeSettings,
    DrawerSettings,
    BackupSettings
  },
  setup() {
    const activeTab = ref('preferences');
    
    return {
      activeTab
    };
  }
});
</script>

<style scoped>
.settings-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color, #333);
}

.tab-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tab-buttons {
  display: flex;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color, #ddd);
}

.tab-btn {
  padding: 0.75rem 1.25rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 1rem;
  color: var(--text-color, #333);
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 0.5rem;
}

.tab-btn:hover {
  color: var(--primary-color, #2196F3);
}

.tab-btn.active {
  color: var(--primary-color, #2196F3);
  border-bottom-color: var(--primary-color, #2196F3);
}

.tab-content {
  flex: 1;
  display: none;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.tab-content.active {
  display: block;
}

/* 深色模式 */
:global(.dark-mode) h2 {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .tab-buttons {
  border-color: var(--border-color-dark, #444);
}

:global(.dark-mode) .tab-btn {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .tab-btn:hover {
  color: var(--primary-color, #2196F3);
}

/* 滚动条样式 */
.tab-content::-webkit-scrollbar {
  width: 8px;
}

.tab-content::-webkit-scrollbar-track {
  background: var(--bg-color-light, #f5f5f5);
  border-radius: 4px;
}

.tab-content::-webkit-scrollbar-thumb {
  background: var(--border-color, #ddd);
  border-radius: 4px;
}

.tab-content::-webkit-scrollbar-thumb:hover {
  background: var(--border-color-dark, #ccc);
}

:global(.dark-mode) .tab-content::-webkit-scrollbar-track {
  background: var(--bg-color-light-dark, #333);
}

:global(.dark-mode) .tab-content::-webkit-scrollbar-thumb {
  background: var(--border-color-dark, #444);
}

:global(.dark-mode) .tab-content::-webkit-scrollbar-thumb:hover {
  background: var(--text-color-light-dark, #555);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tab-buttons {
    flex-wrap: wrap;
  }
  
  .tab-btn {
    flex: 1;
    text-align: center;
    padding: 0.75rem 0.5rem;
    min-width: 80px;
  }
}
</style> 