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
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color, #333);
  border-bottom: 1px solid var(--border-color, #eee);
  padding-bottom: 12px;
}

.settings-item {
  display: flex;
  margin-bottom: 20px;
  align-items: flex-start;
}

.setting-label {
  flex: 0 0 120px;
  font-weight: 500;
  color: var(--text-color, #333);
  padding-top: 4px;
}

.setting-control {
  flex: 1;
}

.setting-description {
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
  margin-top: 6px;
}

/* 滑块样式 */
.slider-container {
  position: relative;
  width: 100%;
  max-width: 300px;
}

.slider-container.with-value {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--slider-bg-color, #e0e0e0);
  outline: none;
  transition: all 0.2s;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary-color, #1677ff);
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary-color, #1677ff);
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: none;
}

.slider::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

.slider-value {
  font-weight: 500;
  color: var(--text-color, #333);
  padding: 4px 8px;
  border-radius: 4px;
  background-color: var(--slider-value-bg, #f0f0f0);
  min-width: 60px;
  text-align: center;
}

/* 开关样式 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  margin-top: 2px;
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
  background-color: var(--switch-off-color, #ccc);
  border-radius: 24px;
  transition: 0.4s;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

input:checked + .toggle-slider {
  background-color: var(--primary-color, #1677ff);
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

/* 下拉选择器样式 */
.select-field {
  padding: 8px 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  background-color: var(--input-bg-color, #fff);
  color: var(--text-color, #333);
  font-size: 0.95rem;
  min-width: 200px;
  transition: all 0.3s;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8.825L2.175 5 3 4.175l3 3 3-3L9.825 5 6 8.825z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.select-field:focus {
  border-color: var(--primary-color, #1677ff);
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.select-field option {
  padding: 8px;
}

/* 数字控制 */
.number-input {
  display: flex;
  align-items: center;
  max-width: 150px;
}

.number-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-color, #ddd);
  background-color: var(--button-bg-color, #f5f5f5);
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: bold;
  line-height: 1;
  color: var(--text-color, #333);
  transition: all 0.2s;
}

.number-btn:first-child {
  border-radius: 6px 0 0 6px;
}

.number-btn:last-child {
  border-radius: 0 6px 6px 0;
}

.number-btn:hover {
  background-color: var(--button-hover-bg-color, #e6e6e6);
}

.number-btn:active {
  background-color: var(--button-active-bg-color, #d9d9d9);
}

.number-field {
  width: 56px;
  height: 32px;
  border-top: 1px solid var(--border-color, #ddd);
  border-bottom: 1px solid var(--border-color, #ddd);
  border-left: none;
  border-right: none;
  text-align: center;
  font-size: 0.95rem;
  color: var(--text-color, #333);
  background-color: var(--input-bg-color, #fff);
  padding: 0 4px;
  outline: none;
}

/* 暗模式适配 */
@media (prefers-color-scheme: dark) {
  .settings-section {
    background-color: var(--panel-bg-color-dark, #1e1e1e);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  
  .section-title {
    color: var(--text-color-dark, #eee);
    border-bottom-color: var(--border-color-dark, #333);
  }
  
  .setting-label {
    color: var(--text-color-dark, #eee);
  }
  
  .setting-description {
    color: var(--text-color-light-dark, #aaa);
  }
  
  .slider {
    background: var(--slider-bg-color-dark, #444);
  }
  
  .slider-value {
    color: var(--text-color-dark, #eee);
    background-color: var(--slider-value-bg-dark, #333);
  }
  
  .toggle-slider {
    background-color: var(--switch-off-color-dark, #555);
  }
  
  .select-field {
    background-color: var(--input-bg-color-dark, #333);
    border-color: var(--border-color-dark, #444);
    color: var(--text-color-dark, #eee);
    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 12 12'%3E%3Cpath fill='%23aaa' d='M6 8.825L2.175 5 3 4.175l3 3 3-3L9.825 5 6 8.825z'/%3E%3C/svg%3E");
  }
  
  .number-btn {
    background-color: var(--button-bg-color-dark, #333);
    border-color: var(--border-color-dark, #444);
    color: var(--text-color-dark, #eee);
  }
  
  .number-btn:hover {
    background-color: var(--button-hover-bg-color-dark, #444);
  }
  
  .number-btn:active {
    background-color: var(--button-active-bg-color-dark, #555);
  }
  
  .number-field {
    background-color: var(--input-bg-color-dark, #333);
    border-color: var(--border-color-dark, #444);
    color: var(--text-color-dark, #eee);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-item {
    flex-direction: column;
  }
  
  .setting-label {
    flex: none;
    margin-bottom: 8px;
    padding-top: 0;
  }
  
  .select-field {
    width: 100%;
    max-width: 100%;
  }
}
</style> 