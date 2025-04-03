<template>
  <div class="general-settings">
    <div class="settings-section">
      <h3 class="section-title">启动选项</h3>
      <div class="settings-item">
        <div class="setting-label">加载上次库</div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input type="checkbox" v-model="autoLoadLastLibrary" @change="saveGeneralSettings">
            <span class="toggle-slider"></span>
          </label>
          <div class="setting-description">启动时自动加载上次使用的标签库</div>
        </div>
      </div>
      <div class="settings-item">
        <div class="setting-label">默认抽取界面</div>
        <div class="setting-control">
          <select v-model="defaultDrawMode" class="select-field" @change="saveGeneralSettings">
            <option value="simple">简洁模式</option>
            <option value="advanced">高级模式</option>
            <option value="grid">网格模式</option>
          </select>
          <div class="setting-description">设置默认的抽签界面样式</div>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h3 class="section-title">备份设置</h3>
      <div class="settings-item">
        <div class="setting-label">自动备份</div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input type="checkbox" v-model="autoBackup" @change="saveGeneralSettings">
            <span class="toggle-slider"></span>
          </label>
          <div class="setting-description">启用自动备份功能</div>
        </div>
      </div>
      <div class="settings-item" v-if="autoBackup">
        <div class="setting-label">备份频率</div>
        <div class="setting-control">
          <select v-model="backupFrequency" class="select-field" @change="saveGeneralSettings">
            <option value="daily">每日</option>
            <option value="weekly">每周</option>
            <option value="monthly">每月</option>
          </select>
          <div class="setting-description">设置自动备份的频率</div>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h3 class="section-title">性能设置</h3>
      <div class="settings-item">
        <div class="setting-label">预加载库</div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input type="checkbox" v-model="preloadLibraries" @change="saveGeneralSettings">
            <span class="toggle-slider"></span>
          </label>
          <div class="setting-description">预加载所有标签库（提高切换速度，但增加内存占用）</div>
        </div>
      </div>
      <div class="settings-item">
        <div class="setting-label">缓存大小</div>
        <div class="setting-control">
          <div class="slider-container with-value">
            <input 
              type="range" 
              min="50" 
              max="500" 
              step="50" 
              v-model="cacheSize" 
              class="slider" 
              @change="saveGeneralSettings"
            />
            <span class="slider-value">{{ cacheSize }}MB</span>
          </div>
          <div class="setting-description">设置应用缓存的最大大小</div>
        </div>
      </div>
      <div class="settings-item">
        <div class="setting-label">网络超时</div>
        <div class="setting-control">
          <div class="number-input">
            <button @click="decreaseTimeout" class="number-btn">-</button>
            <input type="number" v-model="networkTimeout" min="5" max="60" step="5" class="number-field" @change="saveGeneralSettings">
            <button @click="increaseTimeout" class="number-btn">+</button>
          </div>
          <div class="setting-description">设置网络请求的超时时间（秒）</div>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h3 class="section-title">调试选项</h3>
      <div class="settings-item">
        <div class="setting-label">调试模式</div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input type="checkbox" v-model="debugMode" @change="saveGeneralSettings">
            <span class="toggle-slider"></span>
          </label>
          <div class="setting-description">启用调试模式（开发者使用）</div>
        </div>
      </div>
      <div class="settings-item">
        <div class="setting-label">错误报告</div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input type="checkbox" v-model="sendErrorReports" @change="saveGeneralSettings">
            <span class="toggle-slider"></span>
          </label>
          <div class="setting-description">发送匿名错误报告，帮助改进应用</div>
        </div>
      </div>
      <div class="settings-item">
        <div class="setting-label">日志管理</div>
        <div class="setting-control">
          <button @click="clearLogs" class="action-button secondary">清除日志</button>
          <div class="setting-description">清除应用收集的调试日志数据</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, inject, onMounted } from 'vue';

export default defineComponent({
  name: 'GeneralSettings',
  setup() {
    const emitter = inject('emitter');
    
    // 常规设置状态
    const autoBackup = ref(true);
    const backupFrequency = ref('weekly');
    const autoLoadLastLibrary = ref(true);
    const defaultDrawMode = ref('simple');
    const preloadLibraries = ref(false);
    const cacheSize = ref(100);
    const networkTimeout = ref(30);
    const debugMode = ref(false);
    const sendErrorReports = ref(true);
    
    // 加载常规设置
    const loadGeneralSettings = () => {
      try {
        const savedSettings = localStorage.getItem('general_settings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          
          autoBackup.value = settings.autoBackup !== undefined ? settings.autoBackup : true;
          backupFrequency.value = settings.backupFrequency || 'weekly';
          autoLoadLastLibrary.value = settings.autoLoadLastLibrary !== undefined ? settings.autoLoadLastLibrary : true;
          defaultDrawMode.value = settings.defaultDrawMode || 'simple';
          preloadLibraries.value = settings.preloadLibraries !== undefined ? settings.preloadLibraries : false;
          cacheSize.value = settings.cacheSize || 100;
          networkTimeout.value = settings.networkTimeout || 30;
          debugMode.value = settings.debugMode !== undefined ? settings.debugMode : false;
          sendErrorReports.value = settings.sendErrorReports !== undefined ? settings.sendErrorReports : true;
        }
      } catch (error) {
        console.error('加载常规设置失败', error);
      }
    };
    
    // 保存常规设置
    const saveGeneralSettings = () => {
      try {
        const settings = {
          autoBackup: autoBackup.value,
          backupFrequency: backupFrequency.value,
          autoLoadLastLibrary: autoLoadLastLibrary.value,
          defaultDrawMode: defaultDrawMode.value,
          preloadLibraries: preloadLibraries.value,
          cacheSize: cacheSize.value,
          networkTimeout: networkTimeout.value,
          debugMode: debugMode.value,
          sendErrorReports: sendErrorReports.value
        };
        
        localStorage.setItem('general_settings', JSON.stringify(settings));
        
        // 应用设置
        if (debugMode.value) {
          console.log('调试模式已启用');
        }
        
        // 通知其他组件
        emitter.emit('generalSettingsChanged', settings);
        
        emitter.emit('notification', {
          type: 'success',
          message: '常规设置已保存'
        });
      } catch (error) {
        console.error('保存常规设置失败', error);
        emitter.emit('notification', {
          type: 'error',
          message: `保存设置失败: ${error.message}`
        });
      }
    };
    
    // 网络超时增减
    const increaseTimeout = () => {
      if (networkTimeout.value < 60) {
        networkTimeout.value += 5;
        saveGeneralSettings();
      }
    };
    
    const decreaseTimeout = () => {
      if (networkTimeout.value > 5) {
        networkTimeout.value -= 5;
        saveGeneralSettings();
      }
    };
    
    // 清除日志
    const clearLogs = () => {
      try {
        // 清除localStorage中的日志数据
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('log_')) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        emitter.emit('notification', {
          type: 'success',
          message: '日志已清除'
        });
      } catch (error) {
        console.error('清除日志失败', error);
        emitter.emit('notification', {
          type: 'error',
          message: `清除日志失败: ${error.message}`
        });
      }
    };
    
    // 初始化
    onMounted(() => {
      loadGeneralSettings();
    });
    
    return {
      // 状态
      autoBackup,
      backupFrequency,
      autoLoadLastLibrary,
      defaultDrawMode,
      preloadLibraries,
      cacheSize,
      networkTimeout,
      debugMode,
      sendErrorReports,
      
      // 方法
      saveGeneralSettings,
      increaseTimeout,
      decreaseTimeout,
      clearLogs
    };
  }
});
</script>

<style scoped>
.settings-section {
  background-color: var(--panel-bg-color, #ffffff);
  border-radius: var(--border-radius-medium, 8px);
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-small, 0 2px 6px rgba(0, 0, 0, 0.05));
}

.section-title {
  margin-top: 0;
  margin-bottom: 1.25rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color, #333);
  border-bottom: 1px solid var(--border-color, #eee);
  padding-bottom: 0.75rem;
}

.settings-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1.25rem;
}

.settings-item:last-child {
  margin-bottom: 0;
}

.setting-label {
  flex: 0 0 120px;
  font-weight: 500;
  padding-top: 0.25rem;
  color: var(--text-color, #333);
}

.setting-control {
  flex: 1;
}

.setting-description {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 46px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--border-color, #ccc);
  transition: .4s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: var(--primary-color, #2196F3);
}

input:focus + .toggle-slider {
  box-shadow: 0 0 1px var(--primary-color, #2196F3);
}

input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

.select-field {
  width: 100%;
  max-width: 300px;
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  background-color: var(--bg-color, #fff);
  color: var(--text-color, #333);
  font-size: 0.9rem;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
}

.slider-container {
  position: relative;
  width: 100%;
  max-width: 300px;
}

.with-value {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.slider {
  flex: 1;
  height: 4px;
  background-color: var(--border-color, #ddd);
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: var(--primary-color, #2196F3);
  cursor: pointer;
}

.slider-value {
  flex: 0 0 60px;
  text-align: right;
  font-size: 0.9rem;
  color: var(--text-color, #333);
  font-weight: 500;
}

.number-input {
  display: flex;
  align-items: center;
  max-width: 120px;
}

.number-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-color, #ddd);
  background-color: var(--bg-color-light, #f5f5f5);
  color: var(--text-color, #333);
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.number-btn:first-child {
  border-radius: 4px 0 0 4px;
}

.number-btn:last-child {
  border-radius: 0 4px 4px 0;
}

.number-btn:hover {
  background-color: var(--bg-color, #eee);
}

.number-field {
  flex: 1;
  height: 32px;
  border: 1px solid var(--border-color, #ddd);
  border-left: none;
  border-right: none;
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-color, #333);
  -moz-appearance: textfield;
}

.number-field::-webkit-outer-spin-button,
.number-field::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.action-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius-small, 4px);
  border: none;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.primary {
  background-color: var(--primary-color, #2196F3);
  color: white;
}

.primary:hover {
  background-color: var(--primary-hover-color, #1976D2);
}

.secondary {
  background-color: var(--bg-color-light, #f5f5f5);
  color: var(--text-color, #333);
  border: 1px solid var(--border-color, #ddd);
}

.secondary:hover {
  background-color: var(--bg-color, #eee);
}

/* 深色模式 */
:global(.dark-mode) .settings-section {
  background-color: var(--panel-bg-color-dark, #1f1f1f);
  box-shadow: var(--shadow-small-dark, 0 2px 6px rgba(0, 0, 0, 0.2));
}

:global(.dark-mode) .section-title {
  color: var(--text-color-dark, #e0e0e0);
  border-color: var(--border-color-dark, #333);
}

:global(.dark-mode) .setting-label {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .setting-description {
  color: var(--text-color-light-dark, #aaa);
}

:global(.dark-mode) .select-field {
  background-color: var(--bg-color-dark, #333);
  border-color: var(--border-color-dark, #444);
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .slider {
  background-color: var(--border-color-dark, #444);
}

:global(.dark-mode) .slider-value {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .number-btn {
  background-color: var(--bg-color-light-dark, #333);
  border-color: var(--border-color-dark, #444);
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .number-btn:hover {
  background-color: var(--bg-color-dark, #444);
}

:global(.dark-mode) .number-field {
  background-color: var(--bg-color-dark, #333);
  border-color: var(--border-color-dark, #444);
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .secondary {
  background-color: var(--bg-color-light-dark, #333);
  border-color: var(--border-color-dark, #444);
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .secondary:hover {
  background-color: var(--bg-color-dark, #444);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-item {
    flex-direction: column;
  }
  
  .setting-label {
    flex: none;
    width: 100%;
    margin-bottom: 0.5rem;
  }
}
</style> 