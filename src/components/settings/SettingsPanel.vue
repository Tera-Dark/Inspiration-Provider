<template>
  <div class="settings-panel">
    <div class="panel-header">
      <h3>系统设置</h3>
      <div class="header-actions">
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>
    </div>
    
    <div class="panel-body">
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
        
        <div class="tab-content-container">
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
  emits: ['close'],
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
  background-color: var(--panel-bg-color, #fff);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color, #eee);
  background-color: var(--section-header-bg, rgba(0, 0, 0, 0.02));
}

.panel-header h3 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--text-color, #333);
}

.header-actions {
  display: flex;
  gap: 10px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  color: var(--text-color-light, #666);
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: var(--hover-bg-color, rgba(0, 0, 0, 0.05));
  color: var(--danger-color, #ff4d4f);
}

.panel-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.tab-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tab-buttons {
  display: flex;
  margin-bottom: 20px;
  background-color: var(--section-bg-color, #f9f9f9);
  border-radius: 8px;
  padding: 6px;
  gap: 8px;
}

.tab-btn {
  padding: 10px 16px;
  background: none;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-color, #333);
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  text-align: center;
}

.tab-btn:hover {
  background-color: var(--hover-bg-color, rgba(0, 0, 0, 0.05));
  color: var(--primary-color, #1677ff);
}

.tab-btn.active {
  background-color: var(--primary-color, #1677ff);
  color: white;
}

.tab-content-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.tab-content {
  display: none;
  height: 100%;
  overflow-y: auto;
  animation: fadeIn 0.3s ease-out;
  padding: 0 5px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.tab-content.active {
  display: block;
}

/* 滚动条样式 */
.tab-content::-webkit-scrollbar {
  width: 6px;
}

.tab-content::-webkit-scrollbar-track {
  background: transparent;
}

.tab-content::-webkit-scrollbar-thumb {
  background: var(--border-color, #ddd);
  border-radius: 3px;
}

.tab-content::-webkit-scrollbar-thumb:hover {
  background: var(--border-color-dark, #ccc);
}

/* 暗模式适配 */
@media (prefers-color-scheme: dark) {
  .panel-header {
    border-bottom-color: var(--border-color-dark, #333);
    background-color: var(--section-header-bg-dark, rgba(255, 255, 255, 0.03));
  }
  
  .panel-header h3 {
    color: var(--text-color-dark, #eee);
  }
  
  .close-btn {
    color: var(--text-color-light-dark, #aaa);
  }
  
  .close-btn:hover {
    background-color: var(--hover-bg-color-dark, rgba(255, 255, 255, 0.05));
  }
  
  .tab-buttons {
    background-color: var(--section-bg-color-dark, #252525);
  }
  
  .tab-btn {
    color: var(--text-color-dark, #eee);
  }
  
  .tab-btn:hover {
    background-color: var(--hover-bg-color-dark, rgba(255, 255, 255, 0.05));
  }
  
  .tab-content::-webkit-scrollbar-thumb {
    background: var(--border-color-dark, #444);
  }
  
  .tab-content::-webkit-scrollbar-thumb:hover {
    background: var(--text-color-light-dark, #555);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tab-buttons {
    flex-wrap: wrap;
  }
  
  .tab-btn {
    padding: 8px 12px;
    font-size: 0.9rem;
  }
  
  .panel-body {
    padding: 15px;
  }
}
</style> 