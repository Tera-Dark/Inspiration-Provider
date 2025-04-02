<template>
  <div class="tag-drawer-panel">
    <div class="section">
      <h3>抽取数量</h3>
      <div class="number-control">
        <button 
          class="control-btn" 
          @click="decreaseCount" 
          :disabled="drawCount <= 1"
        >-</button>
        <span class="number">{{ drawCount }}</span>
        <button 
          class="control-btn" 
          @click="increaseCount" 
          :disabled="drawCount >= 10"
        >+</button>
      </div>
    </div>
    
    <div class="section">
      <h3>选择分类</h3>
      <select v-model="selectedCategory" class="form-select">
        <option value="all">全部分类</option>
        <option v-for="category in categories" :key="category" :value="category">
          {{ category }}
        </option>
      </select>
    </div>
    
    <div class="section">
      <h3>选择Tag库</h3>
      <select v-model="selectedLibrary" class="form-select" @change="handleLibraryChange">
        <option v-for="library in libraries" :key="library" :value="library">
          {{ library }}
        </option>
      </select>
    </div>
    
    <div class="section advanced-section">
      <div class="advanced-header" @click="toggleAdvanced">
        <h3>高级设置</h3>
        <span class="toggle-icon">{{ showAdvanced ? '▼' : '▶' }}</span>
      </div>
      
      <div v-if="showAdvanced" class="advanced-content">
        <div class="advanced-item">
          <label>排除关键词</label>
          <input 
            type="text" 
            v-model="excludeKeywords" 
            placeholder="输入关键词，用逗号分隔"
            class="form-input"
          />
        </div>
        
        <div class="advanced-item checkbox">
          <input type="checkbox" id="noDuplicates" v-model="noDuplicates" />
          <label for="noDuplicates">避免重复标签</label>
        </div>
        
        <div class="advanced-item checkbox">
          <input type="checkbox" id="useWeights" v-model="useWeights" />
          <label for="useWeights">使用权重（常用标签更易抽到）</label>
        </div>

        <div class="advanced-item checkbox">
          <input type="checkbox" id="showAnimation" v-model="showAnimation" />
          <label for="showAnimation">显示抽取动画</label>
        </div>

        <div class="advanced-item">
          <label>动画效果强度</label>
          <div class="slider-container">
            <input 
              type="range" 
              min="1" 
              max="100" 
              v-model="animationIntensity" 
              class="slider" 
              :disabled="!showAnimation"
            />
            <span class="slider-value">{{ animationIntensity }}%</span>
          </div>
        </div>

        <div class="advanced-item">
          <label>历史记录保存数量</label>
          <div class="slider-container">
            <input 
              type="range" 
              min="10" 
              max="100" 
              v-model="maxHistoryCount" 
              class="slider" 
            />
            <span class="slider-value">{{ maxHistoryCount }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="button-group">
      <button @click="drawTags" class="primary-button">
        <span class="button-icon">🎯</span> 抽签
      </button>
      <button @click="resetResult" class="secondary-button">
        <span class="button-icon">🔄</span> 重置
      </button>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, inject, computed, onMounted, watch } from 'vue';

export default defineComponent({
  name: 'TagDrawerPanel',
  emits: ['draw-completed'],
  setup(props, { emit }) {
    const emitter = inject('emitter');
    const tagLibrary = inject('tagLibrary');
    const tagDrawer = inject('tagDrawer');
    
    // 抽签设置
    const drawCount = ref(3);
    const selectedCategory = ref('all');
    const selectedLibrary = ref('default');
    const excludeKeywords = ref('');
    const noDuplicates = ref(true);
    const useWeights = ref(false);
    const showAdvanced = ref(false);
    const showAnimation = ref(true);
    const animationIntensity = ref(60);
    const maxHistoryCount = ref(20);
    const settings = ref({
      showConfetti: true,
      defaultDrawCount: 3,
      allowDuplicates: false,
      maxHistorySize: 20
    });
    
    // 计算属性
    const categories = computed(() => {
      return tagLibrary.getCategories() || [];
    });
    
    const libraries = computed(() => {
      return tagLibrary.getLibraries() || ['default'];
    });
    
    // 事件处理
    const drawTags = () => {
      try {
        // 解析排除关键词
        const excludeList = excludeKeywords.value
          ? excludeKeywords.value.split(',').map(kw => kw.trim())
          : [];
        
        // 设置抽取选项
        const options = {
          count: parseInt(drawCount.value),
          category: selectedCategory.value === 'all' ? null : selectedCategory.value,
          library: selectedLibrary.value,
          excludeKeywords: excludeList,
          noDuplicates: settings.value.allowDuplicates ? false : noDuplicates.value,
          useWeights: useWeights.value
        };
        
        // 执行抽取
        const result = tagDrawer.draw(options);
        
        // 播放动画效果（如果启用）
        if (settings.value.showConfetti) {
          playDrawAnimation();
        }
        
        // 发布抽取结果事件
        emit('draw-completed', result);
        emitter.emit('tags-drawn', result);
        
        // 保存到历史记录
        saveHistory(result, options);
        
        emitter.emit('notification', {
          type: 'success',
          message: `成功抽取了 ${result.length} 个标签`
        });
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `抽取失败: ${error.message}`
        });
      }
    };
    
    // 播放抽取动画效果
    const playDrawAnimation = () => {
      if (!showAnimation.value) return;
      
      const container = document.querySelector('.draw-results') || document.body;
      
      // 计算生成的纸屑数量
      const confettiCount = Math.floor(animationIntensity.value * 0.6);
      
      // 创建五彩纸屑动画
      for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        
        // 随机颜色
        const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', 
                         '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', 
                         '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // 随机大小和位置
        const size = Math.random() * 10 + 5;
        const left = Math.random() * 100;
        
        // 随机旋转和延迟
        const rotation = Math.random() * 360;
        const delay = Math.random() * 0.5;
        
        // 设置样式
        Object.assign(confetti.style, {
          backgroundColor: color,
          width: `${size}px`,
          height: `${size}px`,
          left: `${left}%`,
          transform: `rotate(${rotation}deg)`,
          animationDelay: `${delay}s`
        });
        
        container.appendChild(confetti);
        
        // 动画结束后移除元素
        setTimeout(() => {
          if (confetti && confetti.parentNode) {
            confetti.parentNode.removeChild(confetti);
          }
        }, 3000);
      }
    };
    
    const resetResult = () => {
      emitter.emit('tags-reset');
      emitter.emit('notification', {
        type: 'info',
        message: '已重置抽签结果'
      });
    };
    
    const toggleAdvanced = () => {
      showAdvanced.value = !showAdvanced.value;
    };
    
    const handleLibraryChange = () => {
      // 当库变更时重新获取分类
      selectedCategory.value = 'all';
    };
    
    const increaseCount = () => {
      if (drawCount.value < 10) {
        drawCount.value++;
      }
    };
    
    const decreaseCount = () => {
      if (drawCount.value > 1) {
        drawCount.value--;
      }
    };
    
    // 保存历史记录
    const saveHistory = (tags, options) => {
      try {
        const historyItem = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          tags: tags,
          options: options
        };
        
        // 获取现有历史
        let history = JSON.parse(localStorage.getItem('tagHistory') || '[]');
        
        // 获取设置
        const maxHistory = maxHistoryCount.value || settings.value.maxHistorySize || 20;
        
        // 添加新历史并保持最大数量
        history.unshift(historyItem);
        if (history.length > maxHistory) {
          history = history.slice(0, maxHistory);
        }
        
        // 保存到本地存储
        localStorage.setItem('tagHistory', JSON.stringify(history));
        
        // 通知更新
        emitter.emit('history-updated');
        
        console.log("历史记录已保存:", historyItem);
      } catch (error) {
        console.error("保存历史记录失败:", error);
        emitter.emit('notification', {
          type: 'error',
          message: `保存历史记录失败: ${error.message}`
        });
      }
    };
    
    // 加载设置
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('tagDrawer_settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          settings.value = {
            showConfetti: parsed.showConfetti !== undefined ? parsed.showConfetti : true,
            defaultDrawCount: parsed.defaultDrawCount || 3,
            allowDuplicates: parsed.allowDuplicates || false,
            autoSave: parsed.autoSave !== undefined ? parsed.autoSave : true,
            maxHistorySize: parsed.maxHistorySize || 20
          };
          
          // 应用默认抽取数量
          drawCount.value = settings.value.defaultDrawCount;
          
          // 应用是否允许重复
          noDuplicates.value = !settings.value.allowDuplicates;
          
          // 应用历史记录数量
          maxHistoryCount.value = settings.value.maxHistorySize;
          
          // 应用是否显示动画
          showAnimation.value = settings.value.showConfetti;
        }
      } catch (error) {
        console.error('加载设置失败:', error);
      }
    };
    
    // 监听设置变更
    const setupEventListeners = () => {
      emitter.on('settings-updated', (newSettings) => {
        if (newSettings) {
          settings.value = {
            ...settings.value,
            showConfetti: newSettings.showConfetti,
            defaultDrawCount: newSettings.defaultDrawCount,
            allowDuplicates: newSettings.allowDuplicates,
            autoSave: newSettings.autoSave,
            maxHistorySize: newSettings.maxHistorySize
          };
          
          // 有可能需要更新当前UI状态
          drawCount.value = settings.value.defaultDrawCount;
          noDuplicates.value = !settings.value.allowDuplicates;
          showAnimation.value = settings.value.showConfetti;
          maxHistoryCount.value = settings.value.maxHistorySize;
        }
      });
    };
    
    // 保存高级设置到本地
    const saveAdvancedSettings = () => {
      try {
        const currentSettings = JSON.parse(localStorage.getItem('tagDrawer_settings') || '{}');
        const updatedSettings = {
          ...currentSettings,
          showConfetti: showAnimation.value,
          maxHistorySize: maxHistoryCount.value
        };
        
        localStorage.setItem('tagDrawer_settings', JSON.stringify(updatedSettings));
        
        // 通知其他组件设置已更新
        emitter.emit('settings-updated', updatedSettings);
      } catch (error) {
        console.error('保存高级设置失败:', error);
      }
    };
    
    // 当高级设置变更时保存
    watch([showAnimation, maxHistoryCount], () => {
      if (showAdvanced.value) {
        saveAdvancedSettings();
      }
    });
    
    onMounted(() => {
      // 初始加载设置
      loadSettings();
      
      // 设置事件监听
      setupEventListeners();
    });
    
    return {
      drawCount,
      selectedCategory,
      selectedLibrary,
      excludeKeywords,
      noDuplicates,
      useWeights,
      showAdvanced,
      showAnimation,
      animationIntensity,
      maxHistoryCount,
      categories,
      libraries,
      drawTags,
      resetResult,
      toggleAdvanced,
      handleLibraryChange,
      increaseCount,
      decreaseCount
    };
  }
});
</script>

<style scoped>
.tag-drawer-panel {
  background-color: var(--panel-bg-color, #fff);
  border-radius: var(--border-radius-medium, 8px);
  box-shadow: var(--shadow-small, 0 2px 8px rgba(0, 0, 0, 0.1));
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.section {
  margin-bottom: 20px;
}

.section h3 {
  font-size: 1rem;
  margin-bottom: 10px;
  color: var(--text-color, #333);
  font-weight: 500;
}

.number-control {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--border-color, #ddd);
}

.number {
  flex: 1;
  text-align: center;
  font-size: 1.1rem;
  background-color: var(--bg-color-light, #f5f5f5);
  padding: 8px 0;
}

.control-btn {
  width: 40px;
  height: 40px;
  font-size: 1.2rem;
  background-color: var(--primary-color-light, #e6f4ff);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-btn:not(:disabled):hover {
  background-color: var(--primary-color, #1677ff);
  color: white;
}

.form-select, .form-input {
  width: 100%;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid var(--border-color, #ddd);
  background-color: var(--bg-color-light, #f9f9f9);
  font-size: 0.9rem;
  color: var(--text-color, #333);
  transition: border-color 0.3s, box-shadow 0.3s;
}

.form-select:focus, .form-input:focus {
  border-color: var(--primary-color, #1677ff);
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  outline: none;
}

.advanced-section {
  border: 1px solid var(--border-color, #eee);
  border-radius: 6px;
  overflow: hidden;
}

.advanced-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background-color: var(--bg-color-light, #f5f5f5);
  cursor: pointer;
  transition: background-color 0.3s;
}

.advanced-header:hover {
  background-color: var(--hover-color, #e6f7ff);
}

.advanced-header h3 {
  margin: 0;
  font-size: 0.95rem;
}

.toggle-icon {
  font-size: 0.8rem;
  color: var(--text-color-light, #666);
}

.advanced-content {
  padding: 16px;
  background-color: var(--bg-color-lighter, #fafafa);
}

.advanced-item {
  margin-bottom: 12px;
}

.advanced-item:last-child {
  margin-bottom: 0;
}

.advanced-item label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
}

.advanced-item.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.advanced-item.checkbox label {
  margin-bottom: 0;
  cursor: pointer;
}

.button-group {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.primary-button, .secondary-button {
  padding: 10px 18px;
  border-radius: 4px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.3s;
  border: none;
}

.primary-button {
  background-color: var(--primary-color, #1677ff);
  color: white;
  flex: 1;
}

.primary-button:hover {
  background-color: var(--primary-color-dark, #0958d9);
}

.secondary-button {
  background-color: var(--bg-color-light, #f0f0f0);
  color: var(--text-color, #333);
}

.secondary-button:hover {
  background-color: var(--bg-color-dark, #e0e0e0);
}

.button-icon {
  font-size: 1rem;
}

/* 深色模式样式 */
:global(.dark-mode) .tag-drawer-panel {
  background-color: var(--panel-bg-color-dark, #1f1f1f);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

:global(.dark-mode) .section h3 {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .number {
  background-color: var(--bg-color-light-dark, #2c2c2c);
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .control-btn {
  background-color: var(--primary-color-light-dark, #177ddc);
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .control-btn:not(:disabled):hover {
  background-color: var(--primary-color-dark, #0958d9);
}

:global(.dark-mode) .form-select, 
:global(.dark-mode) .form-input {
  background-color: var(--bg-color-light-dark, #2c2c2c);
  border-color: var(--border-color-dark, #434343);
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .advanced-header {
  background-color: var(--bg-color-light-dark, #2c2c2c);
}

:global(.dark-mode) .advanced-header:hover {
  background-color: var(--hover-color-dark, #165996);
}

:global(.dark-mode) .advanced-content {
  background-color: var(--bg-color-lighter-dark, #252525);
}

:global(.dark-mode) .advanced-item label {
  color: var(--text-color-light-dark, #a0a0a0);
}

:global(.dark-mode) .secondary-button {
  background-color: var(--bg-color-light-dark, #2c2c2c);
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .secondary-button:hover {
  background-color: var(--bg-color-dark-dark, #3c3c3c);
}

/* 纸屑动画 */
@keyframes confetti-fall {
  0% {
    opacity: 1;
    top: -10px;
    transform: translateX(0) rotate(0deg);
  }
  100% {
    opacity: 0;
    top: 100vh;
    transform: translateX(100px) rotate(720deg);
  }
}

.confetti {
  position: fixed;
  z-index: 1000;
  top: -10px;
  border-radius: 0%;
  animation: confetti-fall 3s linear forwards;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.slider {
  flex: 1;
  height: 6px;
  background-color: var(--bg-color-light, #eaeaea);
  border-radius: 3px;
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  cursor: pointer;
}

.slider:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: var(--primary-color, #1677ff);
  cursor: pointer;
}

.slider-value {
  min-width: 32px;
  text-align: right;
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
}
</style> 