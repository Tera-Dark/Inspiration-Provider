<template>
  <div class="drawer-settings">
    <div class="settings-section">
      <h3 class="section-title">抽签行为设置</h3>
      
      <!-- 默认抽签数量 -->
      <div class="settings-item">
        <div class="setting-label">默认抽签数量</div>
        <div class="setting-control">
          <div class="number-input">
            <button @click="decreaseDefaultDrawCount" class="number-btn">-</button>
            <input type="number" v-model="defaultDrawCount" min="1" max="10" class="number-field" @change="saveDrawSettings">
            <button @click="increaseDefaultDrawCount" class="number-btn">+</button>
          </div>
          <div class="setting-description">设置每次抽签的默认数量</div>
        </div>
      </div>
      
      <!-- 避免重复标签 -->
      <div class="settings-item">
        <div class="setting-label">避免重复标签</div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input type="checkbox" v-model="noDuplicates" @change="saveDrawSettings">
            <span class="toggle-slider"></span>
          </label>
          <div class="setting-description">启用后，抽取结果中不会出现重复的标签</div>
        </div>
      </div>
      
      <!-- 使用权重 -->
      <div class="settings-item">
        <div class="setting-label">使用权重抽取</div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input type="checkbox" v-model="useWeights" @change="saveDrawSettings">
            <span class="toggle-slider"></span>
          </label>
          <div class="setting-description">启用后，常用标签将有更高的概率被抽到</div>
        </div>
      </div>
      
      <!-- 确保每个分类至少抽取一个标签 -->
      <div class="settings-item">
        <div class="setting-label">多分类模式下确保平衡</div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input type="checkbox" v-model="ensureEachCategory" @change="saveDrawSettings">
            <span class="toggle-slider"></span>
          </label>
          <div class="setting-description">在多分类模式下，确保每个选定的分类至少抽取一个标签</div>
        </div>
      </div>
      
      <!-- 动画效果 -->
      <div class="settings-item">
        <div class="setting-label">抽签动画</div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input type="checkbox" v-model="showAnimation" @change="saveDrawSettings">
            <span class="toggle-slider"></span>
          </label>
          <div class="setting-description">启用动画效果，增强抽签体验</div>
        </div>
      </div>
      
      <!-- 动画强度 -->
      <div class="settings-item" v-if="showAnimation">
        <div class="setting-label">动画强度</div>
        <div class="setting-control">
          <div class="slider-container with-value">
            <input 
              type="range" 
              min="10" 
              max="100" 
              step="10" 
              v-model="animationIntensity" 
              class="slider" 
              @change="saveDrawSettings"
            />
            <span class="slider-value">{{ animationIntensity }}%</span>
          </div>
          <div class="setting-description">调整抽签动画的视觉效果强度</div>
        </div>
      </div>
    </div>
    
    <div class="settings-section">
      <h3 class="section-title">历史记录</h3>
      
      <!-- 自动保存历史记录 -->
      <div class="settings-item">
        <div class="setting-label">自动保存历史记录</div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input type="checkbox" v-model="autoSaveHistory" @change="saveHistorySettings">
            <span class="toggle-slider"></span>
          </label>
          <div class="setting-description">自动记录每次抽签结果，便于后续查看和分析</div>
        </div>
      </div>
      
      <!-- 最大历史记录数量 -->
      <div class="settings-item">
        <div class="setting-label">最大历史记录数量</div>
        <div class="setting-control">
          <div class="slider-container with-value">
            <input 
              type="range" 
              min="10" 
              max="100" 
              step="10" 
              v-model="maxHistoryCount" 
              class="slider" 
              @change="saveHistorySettings"
              :disabled="!autoSaveHistory"
            />
            <span class="slider-value">{{ maxHistoryCount }}</span>
          </div>
          <div class="setting-description">设置历史记录保存的最大数量，超出将自动删除最早的记录</div>
        </div>
      </div>
    </div>
    
    <div class="settings-section">
      <h3 class="section-title">标签库默认设置</h3>
      
      <!-- 默认标签库 -->
      <div class="settings-item">
        <div class="setting-label">默认标签库</div>
        <div class="setting-control">
          <select 
            v-model="defaultLibrary"
            @change="saveLibrarySettings"
            class="select-field"
          >
            <option v-for="library in libraries" :key="library" :value="library">
              {{ library }}
            </option>
          </select>
          <div class="setting-description">设置应用启动时默认加载的标签库</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, inject, computed, onMounted, onUnmounted } from 'vue';

export default defineComponent({
  name: 'DrawerSettings',
  setup() {
    const emitter = inject('emitter');
    const tagLibrary = inject('tagLibrary');
    
    // 用于触发刷新的响应式变量
    const refreshTrigger = ref(0);
    
    // 抽签设置
    const defaultDrawCount = ref(3);
    const noDuplicates = ref(true);
    const useWeights = ref(false);
    const showAnimation = ref(true);
    const animationIntensity = ref(60);
    const ensureEachCategory = ref(false);
    
    // 历史记录设置
    const autoSaveHistory = ref(true);
    const maxHistoryCount = ref(50);
    
    // 标签库设置
    const defaultLibrary = ref('default');
    const libraries = computed(() => {
      // 使用refreshTrigger强制更新
      refreshTrigger.value;
      return tagLibrary.getLibraryNames() || ['default'];
    });
    
    // 刷新数据
    const refreshData = () => {
      refreshTrigger.value++;
      console.log('抽签设置: 标签库列表已更新', refreshTrigger.value);
      
      // 如果当前选中的库已不存在，则自动选择第一个可用的库
      if (defaultLibrary.value && !libraries.value.includes(defaultLibrary.value)) {
        if (libraries.value.length > 0) {
          defaultLibrary.value = libraries.value[0];
          // 保存更改
          saveLibrarySettings();
        }
      }
    };
    
    // 增减默认抽签数量
    const increaseDefaultDrawCount = () => {
      if (defaultDrawCount.value < 10) {
        defaultDrawCount.value++;
        saveDrawSettings();
      }
    };
    
    const decreaseDefaultDrawCount = () => {
      if (defaultDrawCount.value > 1) {
        defaultDrawCount.value--;
        saveDrawSettings();
      }
    };
    
    // 保存抽签设置
    const saveDrawSettings = () => {
      localStorage.setItem('drawer_settings', JSON.stringify({
        defaultDrawCount: defaultDrawCount.value,
        noDuplicates: noDuplicates.value,
        useWeights: useWeights.value,
        showAnimation: showAnimation.value,
        animationIntensity: animationIntensity.value,
        ensureEachCategory: ensureEachCategory.value
      }));
      
      emitter.emit('notification', {
        type: 'success',
        message: '抽签设置已保存'
      });
    };
    
    // 保存历史记录设置
    const saveHistorySettings = () => {
      localStorage.setItem('history_settings', JSON.stringify({
        autoSaveHistory: autoSaveHistory.value,
        maxHistoryCount: maxHistoryCount.value
      }));
      
      // 通知标签库更新最大历史记录数量
      if (tagLibrary && typeof tagLibrary.setMaxHistorySize === 'function') {
        tagLibrary.setMaxHistorySize(autoSaveHistory.value ? maxHistoryCount.value : 0);
      }
      
      emitter.emit('notification', {
        type: 'success',
        message: '历史记录设置已保存'
      });
    };
    
    // 保存标签库设置
    const saveLibrarySettings = () => {
      localStorage.setItem('library_settings', JSON.stringify({
        defaultLibrary: defaultLibrary.value
      }));
      
      // 设置当前库
      if (tagLibrary && typeof tagLibrary.setCurrentLibrary === 'function') {
        tagLibrary.setCurrentLibrary(defaultLibrary.value);
      }
      
      emitter.emit('notification', {
        type: 'success',
        message: '标签库设置已保存'
      });
    };
    
    // 初始化设置
    const initSettings = () => {
      // 加载抽签设置
      const drawerSettings = localStorage.getItem('drawer_settings');
      if (drawerSettings) {
        try {
          const settings = JSON.parse(drawerSettings);
          defaultDrawCount.value = settings.defaultDrawCount || 3;
          noDuplicates.value = settings.noDuplicates !== false;
          useWeights.value = settings.useWeights || false;
          showAnimation.value = settings.showAnimation || true;
          animationIntensity.value = settings.animationIntensity || 60;
          ensureEachCategory.value = settings.ensureEachCategory || false;
        } catch (error) {
          console.error('加载抽签设置失败:', error);
        }
      }
      
      // 加载历史记录设置
      const historySettings = localStorage.getItem('history_settings');
      if (historySettings) {
        try {
          const settings = JSON.parse(historySettings);
          autoSaveHistory.value = settings.autoSaveHistory !== false;
          maxHistoryCount.value = settings.maxHistoryCount || 50;
          
          // 应用最大历史记录数量设置
          if (tagLibrary && typeof tagLibrary.setMaxHistorySize === 'function') {
            tagLibrary.setMaxHistorySize(autoSaveHistory.value ? maxHistoryCount.value : 0);
          }
        } catch (error) {
          console.error('加载历史记录设置失败:', error);
        }
      }
      
      // 加载标签库设置
      const librarySettings = localStorage.getItem('library_settings');
      if (librarySettings) {
        try {
          const settings = JSON.parse(librarySettings);
          if (settings.defaultLibrary && libraries.value.includes(settings.defaultLibrary)) {
            defaultLibrary.value = settings.defaultLibrary;
          } else if (libraries.value.length > 0) {
            defaultLibrary.value = libraries.value[0];
          }
        } catch (error) {
          console.error('加载标签库设置失败:', error);
        }
      } else if (libraries.value.length > 0) {
        defaultLibrary.value = libraries.value[0];
      }
    };
    
    // 初始化
    onMounted(() => {
      initSettings();
      
      // 监听标签库更新事件
      emitter.on('tagLibraryUpdated', refreshData);
    });
    
    // 清理事件监听
    onUnmounted(() => {
      emitter.off('tagLibraryUpdated', refreshData);
    });
    
    return {
      // 抽签设置
      defaultDrawCount,
      noDuplicates,
      useWeights,
      showAnimation,
      animationIntensity,
      ensureEachCategory,
      increaseDefaultDrawCount,
      decreaseDefaultDrawCount,
      saveDrawSettings,
      
      // 历史记录设置
      autoSaveHistory,
      maxHistoryCount,
      saveHistorySettings,
      
      // 标签库设置
      defaultLibrary,
      libraries,
      saveLibrarySettings,
      
      // 刷新功能
      refreshData
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

.slider:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  flex: 0 0 48px;
  text-align: right;
  font-size: 0.9rem;
  color: var(--text-color, #333);
  font-weight: 500;
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

:global(.dark-mode) .slider {
  background-color: var(--border-color-dark, #444);
}

:global(.dark-mode) .slider-value {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .toggle-slider {
  background-color: var(--border-color-dark, #444);
}

:global(.dark-mode) .select-field {
  background-color: var(--bg-color-dark, #333);
  border-color: var(--border-color-dark, #444);
  color: var(--text-color-dark, #e0e0e0);
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