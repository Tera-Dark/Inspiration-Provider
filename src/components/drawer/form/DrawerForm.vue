<template>
  <div class="drawer-form">
    <div class="panel-header">
      <h3 class="panel-title">抽签设置</h3>
    </div>
    
    <div class="form-content">
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
            :disabled="drawCount >= 99"
          >+</button>
        </div>
      </div>
      
      <div class="section">
        <h3>选择分类</h3>
        <div class="category-selection">
          <select v-if="!useMultiCategories" v-model="selectedCategory" class="form-select">
            <option value="all">全部分类</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
          
          <div class="category-mode-toggle">
            <button 
              @click="toggleMultiCategoryMode" 
              class="toggle-button"
              :class="{ 'active': useMultiCategories }"
            >
              {{ useMultiCategories ? '单分类模式' : '多分类模式' }}
            </button>
          </div>
        </div>
        
        <multi-category-selector 
          v-if="useMultiCategories"
          :categories="categories"
          v-model:value="selectedCategories"
          class="multi-selector"
        />
        
        <div v-if="useMultiCategories && selectedCategories.length > 1" class="balance-option">
          <input type="checkbox" id="ensureEachCategory" v-model="ensureEachCategory" />
          <label for="ensureEachCategory">多分类平衡模式（确保每个分类至少抽取一个标签）</label>
        </div>
      </div>
      
      <div class="section">
        <h3>选择Tag库</h3>
        <div class="library-selection">
          <select v-model="selectedLibrary" class="form-select" @change="handleLibraryChange">
            <option :value="selectedLibrary">{{ selectedLibrary }}</option>
            <option v-for="library in filteredLibraries" :key="library" :value="library">
              {{ library }}
            </option>
          </select>
          
          <!-- 最近使用的库快速选择 -->
          <div v-if="recentLibraries.length > 0" class="recent-libraries">
            <span class="recent-label">最近使用:</span>
            <div class="recent-chips">
              <button 
                v-for="library in recentLibraries" 
                :key="library" 
                @click="quickSelectLibrary(library)"
                class="library-chip"
                :class="{ 'active': selectedLibrary === library }"
              >
                {{ library }}
              </button>
            </div>
          </div>
          
          <!-- 库信息指示器 -->
          <div class="library-info" v-if="currentLibraryInfo">
            <div class="info-item">
              <span class="info-label">分类数:</span>
              <span class="info-value">{{ currentLibraryInfo.categoryCount }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">标签数:</span>
              <span class="info-value">{{ currentLibraryInfo.tagCount }}</span>
            </div>
          </div>
        </div>
        
        <!-- 加载指示器 -->
        <div v-if="isLibraryLoading" class="loading-indicator">
          <div class="spinner"></div>
          <span>加载标签库中...</span>
        </div>
      </div>
      
      <!-- 高级设置 -->
      <div class="advanced-settings-wrapper">
        <div class="advanced-header" @click="toggleAdvanced">
          <h3>高级设置</h3>
          <span class="toggle-icon">{{ showAdvanced ? '▼' : '▶' }}</span>
        </div>
        
        <div v-show="showAdvanced" class="advanced-content">
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
              <button 
                v-if="showAnimation"
                @click="testAnimation" 
                class="test-btn" 
                title="测试动画效果"
              >
                测
              </button>
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
        <button @click="drawTags" class="primary-button" :disabled="isDrawing">
          <span v-if="isDrawing" class="button-spinner"></span>
          <span v-else class="button-icon">🎯</span> 
          {{ isDrawing ? '抽取中...' : '抽签' }}
        </button>
        <button @click="resetForm" class="secondary-button" :disabled="isDrawing">
          <span class="button-icon">🔄</span> 重置
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, inject, computed, onMounted, onUnmounted, watch } from 'vue';
import MultiCategorySelector from '@/components/common/MultiCategorySelector.vue';

export default defineComponent({
  name: 'DrawerForm',
  components: {
    MultiCategorySelector
  },
  emits: ['draw-completed'],
  setup(props, { emit }) {
    const emitter = inject('emitter');
    const tagLibrary = inject('tagLibrary');
    const tagDrawer = inject('tagDrawer');
    
    // 用于触发重新计算的刷新器
    const refreshTrigger = ref(0);
    
    // 抽签设置
    const drawCount = ref(3);
    const selectedCategory = ref('all');
    const selectedCategories = ref([]);
    const useMultiCategories = ref(false);
    const selectedLibrary = ref('default');
    const excludeKeywords = ref('');
    const noDuplicates = ref(true);
    const useWeights = ref(false);
    const showAdvanced = ref(false);
    const showAnimation = ref(false);
    const animationIntensity = ref(60);
    const maxHistoryCount = ref(20);
    const ensureEachCategory = ref(false);
    
    // 库加载状态
    const isLibraryLoading = ref(false);
    // 抽取加载状态
    const isDrawing = ref(false);
    
    // 计算属性
    const categories = computed(() => {
      // 使用refreshTrigger强制更新
      refreshTrigger.value;
      return tagLibrary.getCategories() || [];
    });
    
    const libraries = computed(() => {
      // 使用refreshTrigger强制更新
      refreshTrigger.value;
      return tagLibrary.getLibraryNames() || ['default'];
    });
    
    // 获取最近使用的库
    const recentLibraries = computed(() => {
      refreshTrigger.value;
      const recent = tagLibrary.getRecentLibraries() || [];
      // 过滤掉当前选中的库
      return recent.filter(lib => lib !== selectedLibrary.value);
    });
    
    // 获取当前库的信息
    const currentLibraryInfo = computed(() => {
      refreshTrigger.value;
      if (!selectedLibrary.value) return null;
      
      const categories = tagLibrary.getCategories(selectedLibrary.value) || [];
      let tagCount = 0;
      
      // 计算总标签数
      if (selectedLibrary.value) {
        tagCount = tagLibrary.getTagCountByLibrary(selectedLibrary.value);
      }
      
      return {
        categoryCount: categories.length,
        tagCount: tagCount
      };
    });
    
    // 过滤掉当前选中的库，避免重复显示
    const filteredLibraries = computed(() => {
      return libraries.value.filter(lib => lib !== selectedLibrary.value);
    });
    
    // 刷新数据
    const refreshData = () => {
      refreshTrigger.value++;
      console.log('抽签设置: 标签库数据已更新', refreshTrigger.value);
      
      // 检查当前选择的库是否仍然存在
      if (selectedLibrary.value && !libraries.value.includes(selectedLibrary.value)) {
        // 如果当前选择的库不存在了，切换到第一个可用的库
        if (libraries.value.length > 0) {
          selectedLibrary.value = libraries.value[0];
          // 切换库
          handleLibraryChange();
        }
      }
    };
    
    // 切换单/多分类模式
    const toggleMultiCategoryMode = () => {
      useMultiCategories.value = !useMultiCategories.value;
      
      // 切换到多分类模式时，初始化选中分类
      if (useMultiCategories.value) {
        if (selectedCategory.value !== 'all') {
          selectedCategories.value = [selectedCategory.value];
        } else {
          selectedCategories.value = [];
        }
      }
    };
    
    // 事件处理
    const drawTags = async () => {
      // 设置抽取中状态
      isDrawing.value = true;
      
      try {
        // 解析排除关键词
        const excludeList = excludeKeywords.value
          ? excludeKeywords.value.split(',').map(kw => kw.trim())
          : [];
        
        // 设置抽取选项
        const options = {
          count: parseInt(drawCount.value),
          excludeKeywords: excludeList,
          noDuplicates: noDuplicates.value,
          useWeights: useWeights.value,
          showAnimation: showAnimation.value,
          animationIntensity: animationIntensity.value,
          maxHistoryCount: maxHistoryCount.value,
          library: selectedLibrary.value
        };
        
        // 根据模式设置分类
        if (useMultiCategories.value) {
          // 多分类模式：检查是否有选中的分类
          if (selectedCategories.value.length > 0) {
            console.log('多分类模式-选中分类:', selectedCategories.value);
            
            // 直接设置category为选中的分类数组
            options.category = selectedCategories.value;
            
            // 确保在多分类模式下，如果启用了确保平衡功能且有至少两个选中的分类，则启用平衡
            if (ensureEachCategory.value && selectedCategories.value.length > 1) {
              console.log('启用多分类平衡抽取');
              options.ensureEachCategory = true;
            } else {
              options.ensureEachCategory = false;
              console.log('未启用多分类平衡抽取：', ensureEachCategory.value ? '分类数量不足' : '用户未启用平衡功能');
            }
          } else {
            console.log('多分类模式-未选择任何分类，默认使用all');
            options.category = 'all';
            options.ensureEachCategory = false;
          }
        } else {
          // 单分类模式
          console.log('单分类模式-使用分类:', selectedCategory.value);
          options.category = selectedCategory.value;
          options.ensureEachCategory = false; // 单分类模式下不启用平衡功能
        }
        
        console.log('最终抽取选项:', options);
        
        // 执行抽取 (现在是异步的)
        const result = await tagDrawer.draw(options);
        
        // 播放动画效果（如果启用）
        if (showAnimation.value) {
          playDrawAnimation();
        }
        
        // 发布抽取结果事件
        emit('draw-completed', result);
        emitter.emit('tags-drawn', result);
        
        // 保存到历史记录
        tagLibrary.addToHistory(result, options);
        
        emitter.emit('notification', {
          type: 'success',
          message: `成功抽取了 ${result.length} 个标签`
        });
      } catch (error) {
        console.error('抽取失败:', error);
        emitter.emit('notification', {
          type: 'error',
          message: `抽取失败: ${error.message || '未知错误'}`
        });
      } finally {
        // 完成后清除抽取中状态
        isDrawing.value = false;
      }
    };
    
    // 播放抽取动画
    const playDrawAnimation = () => {
      emitter.emit('play-draw-animation', animationIntensity.value);
    };
    
    // 测试动画效果
    const testAnimation = () => {
      if (showAnimation.value) {
        playDrawAnimation();
      }
    };
    
    // 重置表单
    const resetForm = () => {
      drawCount.value = 3;
      selectedCategory.value = 'all';
      selectedCategories.value = [];
      excludeKeywords.value = '';
      emit('draw-completed', []);
    };
    
    // 增减数量
    const increaseCount = () => {
      if (drawCount.value < 99) {
        drawCount.value++;
      }
    };
    
    const decreaseCount = () => {
      if (drawCount.value > 1) {
        drawCount.value--;
      }
    };
    
    // 切换高级设置显示
    const toggleAdvanced = () => {
      showAdvanced.value = !showAdvanced.value;
    };
    
    // 处理库变更
    const handleLibraryChange = () => {
      console.log(`切换标签库到: ${selectedLibrary.value}`);
      
      // 设置加载状态
      isLibraryLoading.value = true;
      
      // 使用setTimeout让UI有时间更新加载状态
      setTimeout(() => {
        // 通知TagLibrary切换当前库
        if (tagLibrary.setCurrentLibrary) {
          tagLibrary.setCurrentLibrary(selectedLibrary.value);
        }
        
        // 刷新数据以更新分类列表
        refreshData();
        
        // 重置分类选择
        selectedCategory.value = 'all';
        selectedCategories.value = [];
        
        // 发出通知
        emitter.emit('notification', {
          type: 'info',
          message: `已切换到标签库: ${selectedLibrary.value}`
        });
        
        // 清除加载状态
        isLibraryLoading.value = false;
      }, 200); // 添加小延迟，让用户感知到加载过程
    };
    
    // 快速选择库
    const quickSelectLibrary = (libraryName) => {
      if (libraryName && libraryName !== selectedLibrary.value) {
        selectedLibrary.value = libraryName;
        handleLibraryChange();
      }
    };
    
    // 初始化
    onMounted(() => {
      // 加载用户设置
      const userSettings = localStorage.getItem('drawer_settings');
      if (userSettings) {
        try {
          const settings = JSON.parse(userSettings);
          
          // 应用设置
          if (typeof settings.defaultDrawCount === 'number') {
            drawCount.value = settings.defaultDrawCount;
          }
          
          if (typeof settings.noDuplicates === 'boolean') {
            noDuplicates.value = settings.noDuplicates;
          }
          
          if (typeof settings.useWeights === 'boolean') {
            useWeights.value = settings.useWeights;
          }
          
          if (typeof settings.showAnimation === 'boolean') {
            showAnimation.value = settings.showAnimation;
          }
          
          if (typeof settings.animationIntensity === 'number') {
            animationIntensity.value = settings.animationIntensity;
          }
          
          if (typeof settings.maxHistoryCount === 'number') {
            maxHistoryCount.value = settings.maxHistoryCount;
          }
          
          if (typeof settings.useMultiCategories === 'boolean') {
            useMultiCategories.value = settings.useMultiCategories;
          }
          
          if (typeof settings.ensureEachCategory === 'boolean') {
            ensureEachCategory.value = settings.ensureEachCategory;
          }
        } catch (e) {
          console.error('加载抽签设置失败', e);
        }
      }
      
      // 加载默认库设置
      const librarySettings = localStorage.getItem('library_settings');
      let defaultLibraryName = null;
      
      if (librarySettings) {
        try {
          const settings = JSON.parse(librarySettings);
          if (settings.defaultLibrary) {
            defaultLibraryName = settings.defaultLibrary;
          }
        } catch (e) {
          console.error('加载默认库设置失败', e);
        }
      }
      
      // 设置默认库
      // 优先级：1. 用户设置的默认库 2. 指定的特定库（如"所长常规法典库"） 3. 当前加载的库 4. 第一个可用库
      if (defaultLibraryName && libraries.value.includes(defaultLibraryName)) {
        selectedLibrary.value = defaultLibraryName;
      } else if (libraries.value.includes('所长常规法典库')) {
        selectedLibrary.value = '所长常规法典库';
      } else {
        selectedLibrary.value = tagLibrary.getCurrentLibraryName() || 
                              (libraries.value.length > 0 ? libraries.value[0] : 'default');
      }
      
      // 应用选择的库
      if (selectedLibrary.value) {
        handleLibraryChange();
      }
      
      // 监听标签库更新事件
      emitter.on('tagLibraryUpdated', refreshData);
    });
    
    // 组件卸载时移除事件监听
    onUnmounted(() => {
      emitter.off('tagLibraryUpdated', refreshData);
    });
    
    // 保存设置
    watch([
      drawCount, 
      noDuplicates, 
      useWeights, 
      showAnimation, 
      animationIntensity, 
      maxHistoryCount,
      useMultiCategories,
      ensureEachCategory
    ], () => {
      localStorage.setItem('drawer_settings', JSON.stringify({
        drawCount: drawCount.value,
        noDuplicates: noDuplicates.value,
        useWeights: useWeights.value,
        showAnimation: showAnimation.value,
        animationIntensity: animationIntensity.value,
        maxHistoryCount: maxHistoryCount.value,
        useMultiCategories: useMultiCategories.value,
        ensureEachCategory: ensureEachCategory.value
      }));
    }, { deep: true });
    
    return {
      drawCount,
      selectedCategory,
      selectedCategories,
      useMultiCategories,
      toggleMultiCategoryMode,
      selectedLibrary,
      excludeKeywords,
      noDuplicates,
      useWeights,
      showAdvanced,
      showAnimation,
      animationIntensity,
      maxHistoryCount,
      ensureEachCategory,
      categories,
      libraries,
      filteredLibraries,
      recentLibraries,
      currentLibraryInfo,
      isLibraryLoading,
      isDrawing,
      drawTags,
      playDrawAnimation,
      testAnimation,
      resetForm,
      increaseCount,
      decreaseCount,
      toggleAdvanced,
      handleLibraryChange,
      quickSelectLibrary,
      refreshData
    };
  }
});
</script>

<style scoped>
.drawer-form {
  background-color: var(--panel-bg-color, #fff);
  border-radius: var(--border-radius-medium, 12px);
  box-shadow: var(--shadow-medium, 0 4px 16px rgba(0, 0, 0, 0.1));
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 60vh;
  max-height: 80vh;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid var(--border-color-light, rgba(0, 0, 0, 0.07));
  flex-shrink: 0;
}

.form-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.85rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.section {
  padding-bottom: 0.65rem;
  border-bottom: 1px solid var(--border-color-light, rgba(0, 0, 0, 0.07));
}

.section:last-of-type {
  border-bottom: none;
}

.section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color, #333);
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.number-control {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.5rem;
}

.control-btn {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  border: 1px solid var(--primary-color, #2196F3);
  background-color: transparent;
  color: var(--primary-color, #2196F3);
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.control-btn:hover:not(:disabled) {
  background-color: var(--primary-color, #2196F3);
  color: white;
}

.control-btn:disabled {
  border-color: var(--border-color, #ddd);
  color: var(--text-color-light, #999);
  cursor: not-allowed;
}

.number {
  font-size: 2.5rem;
  font-weight: 600;
  color: var(--text-color, #333);
  margin: 0 1.5rem;
  min-width: 3rem;
  text-align: center;
}

.form-select {
  width: 100%;
  padding: 0.875rem 1rem;
  border-radius: var(--border-radius-small, 8px);
  border: 1px solid var(--border-color, #ddd);
  background-color: var(--bg-color-light, #f9f9f9);
  color: var(--text-color, #333);
  font-size: 1rem;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1rem;
  cursor: pointer;
  transition: border-color 0.2s;
}

.form-select:focus {
  outline: none;
  border-color: var(--primary-color, #2196F3);
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.advanced-settings-wrapper {
  background-color: var(--bg-color-light, #f9f9f9);
  border-radius: var(--border-radius-small, 8px);
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.advanced-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.advanced-header:hover {
  background-color: var(--bg-color, #f0f0f0);
}

.advanced-header h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--text-color, #333);
}

.toggle-icon {
  color: var(--primary-color, #2196F3);
  font-size: 0.875rem;
  transition: transform 0.3s;
}

.advanced-content {
  padding: 1rem;
  background-color: var(--bg-color, #f0f0f0);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.advanced-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.advanced-item label {
  font-size: 0.875rem;
  color: var(--text-color, #333);
  font-weight: 500;
}

.advanced-item.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
}

.advanced-item.checkbox input[type="checkbox"] {
  appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--border-color, #ddd);
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.advanced-item.checkbox input[type="checkbox"]:checked {
  background-color: var(--primary-color, #2196F3);
  border-color: var(--primary-color, #2196F3);
}

.advanced-item.checkbox input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  top: 0.25rem;
  left: 0.4rem;
  width: 0.3rem;
  height: 0.6rem;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.form-input {
  padding: 0.875rem 1rem;
  border-radius: var(--border-radius-small, 8px);
  border: 1px solid var(--border-color, #ddd);
  background-color: var(--bg-color-light, #f9f9f9);
  color: var(--text-color, #333);
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color, #2196F3);
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
}

.slider {
  flex: 1;
  appearance: none;
  height: 6px;
  background: var(--border-color, #ddd);
  border-radius: 3px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary-color, #2196F3);
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: var(--primary-color, #2196F3);
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.slider::-moz-range-thumb:hover {
  transform: scale(1.2);
}

.slider:disabled {
  opacity: 0.5;
}

.slider-value {
  min-width: 2.5rem;
  text-align: center;
  font-weight: 600;
  color: var(--text-color, #333);
  font-size: 0.9rem;
}

.test-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background-color: var(--primary-color, #2196F3);
  color: white;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.test-btn:hover {
  background-color: var(--primary-hover-color, #1565c0);
  transform: scale(1.1);
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: auto;
  padding-top: 0.75rem;
  bottom: 0;
  background-color: var(--panel-bg-color, #fff);
  z-index: 10;
  flex-shrink: 0;
  position: sticky;
  bottom: 0;
}

.primary-button, .secondary-button {
  flex: 1;
  padding: 1rem;
  border-radius: var(--border-radius-small, 8px);
  border: none;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.primary-button {
  background-color: var(--primary-color, #2196F3);
  color: white;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.primary-button:hover {
  background-color: var(--primary-hover-color, #1565c0);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(33, 150, 243, 0.4);
}

.secondary-button {
  background-color: var(--bg-color-light, #f5f5f5);
  color: var(--text-color, #333);
  border: 1px solid var(--border-color, #ddd);
}

.secondary-button:hover {
  background-color: var(--bg-color, #e5e5e5);
}

.button-icon {
  font-size: 1.25rem;
}

/* 深色模式适配 */
:global(.dark-mode) .drawer-form {
  background-color: var(--panel-bg-color-dark, #2a2a2a);
  box-shadow: var(--shadow-medium-dark, 0 4px 16px rgba(0, 0, 0, 0.2));
}

:global(.dark-mode) .panel-header {
  border-color: var(--border-color-dark, rgba(255, 255, 255, 0.08));
}

:global(.dark-mode) .panel-title {
  color: var(--text-color-dark, #f0f0f0);
}

:global(.dark-mode) .section {
  border-color: var(--border-color-dark, rgba(255, 255, 255, 0.1));
}

:global(.dark-mode) .section h3 {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .control-btn {
  border-color: var(--primary-color, #2196F3);
  color: var(--primary-color, #2196F3);
}

:global(.dark-mode) .control-btn:disabled {
  border-color: var(--border-color-dark, #444);
  color: var(--text-color-light-dark, #777);
}

:global(.dark-mode) .number {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .form-select,
:global(.dark-mode) .form-input {
  background-color: var(--bg-color-light-dark, #333);
  border-color: var(--border-color-dark, #444);
  color: var(--text-color-dark, #e0e0e0);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23e0e0e0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
}

:global(.dark-mode) .advanced-settings-wrapper {
  background-color: var(--bg-color-light-dark, #333);
}

:global(.dark-mode) .advanced-header:hover {
  background-color: var(--bg-color-dark, #3a3a3a);
}

:global(.dark-mode) .advanced-header h3 {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .advanced-content {
  background-color: var(--bg-color-dark, #222);
}

:global(.dark-mode) .advanced-item label {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .advanced-item.checkbox input[type="checkbox"] {
  border-color: var(--border-color-dark, #444);
}

:global(.dark-mode) .slider {
  background: var(--border-color-dark, #444);
}

:global(.dark-mode) .slider-value {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .secondary-button {
  background-color: var(--bg-color-light-dark, #333);
  color: var(--text-color-dark, #e0e0e0);
  border-color: var(--border-color-dark, #444);
}

:global(.dark-mode) .secondary-button:hover {
  background-color: var(--bg-color-dark, #3a3a3a);
}

/* 响应式适配 */
@media (max-width: 768px) {
  .drawer-form {
    padding: 0;
    min-height: auto;
    max-height: none;
  }
  
  .form-content {
    padding: 0.75rem 1rem;
  }
  
  .number-control {
    width: 100%;
  }
  
  .control-btn {
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .number {
    font-size: 2rem;
    margin: 0 1rem;
  }
  
  .button-group {
    position: static;
    padding-top: 0.5rem;
    margin-top: 0.5rem;
  }
}

/* 新增样式 */
.category-selection {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.category-mode-toggle {
  display: flex;
  justify-content: flex-end;
}

.toggle-button {
  background: none;
  border: none;
  color: var(--primary-color, #2196F3);
  font-size: 0.85rem;
  padding: 0.25rem 0.5rem;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-button:hover {
  background-color: var(--primary-color-lighter, #e3f2fd);
}

.toggle-button.active {
  background-color: var(--primary-color, #2196F3);
  color: white;
}

.multi-selector {
  margin-top: 0.75rem;
}

.balance-option {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: var(--bg-color-light, #f0f8ff);
  border-radius: var(--border-radius-small, 8px);
  border: 1px dashed var(--primary-color-light, #90caf9);
}

.balance-option input[type="checkbox"] {
  width: 1.125rem;
  height: 1.125rem;
  margin: 0;
}

.balance-option label {
  font-size: 0.9rem;
  color: var(--primary-color, #2196F3);
}

/* 恢复toggle-button样式 */
:global(.dark-mode) .toggle-button {
  color: var(--primary-color, #2196F3);
}

:global(.dark-mode) .toggle-button:hover {
  background-color: rgba(33, 150, 243, 0.15);
}

:global(.dark-mode) .toggle-button.active {
  background-color: var(--primary-color, #2196F3);
  color: white;
}

/* 更新深色模式下的样式 */
:global(.dark-mode) .balance-option {
  background-color: var(--primary-color-darker, #0d47a1);
  border-color: var(--primary-color, #2196F3);
}

:global(.dark-mode) .balance-option label {
  color: var(--text-color-dark, #e0e0e0);
}

/* 修改标题样式，与抽签结果标题保持一致 */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color-light, rgba(0, 0, 0, 0.07));
}

.panel-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color, #333);
  position: relative;
}

.panel-title::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 0;
  width: 40px;
  height: 3px;
  background-color: var(--primary-color, #2196F3);
  border-radius: 2px;
}

:global(.dark-mode) .panel-header {
  border-color: var(--border-color-dark, rgba(255, 255, 255, 0.08));
}

:global(.dark-mode) .panel-title {
  color: var(--text-color-dark, #f0f0f0);
}

/* 添加复选框提示样式 */
.checkbox-hint {
  display: block;
  font-size: 0.8rem;
  color: var(--text-secondary, #777);
  margin-top: 0.2rem;
  margin-left: 1.5rem;
  font-style: italic;
}

/* 最近使用的库快速选择样式 */
.recent-libraries {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recent-label {
  font-size: 0.85rem;
  color: var(--text-secondary, #777);
}

.recent-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.library-chip {
  background-color: var(--bg-color-light, #f9f9f9);
  border: 1px solid var(--border-color, #ddd);
  border-radius: 1rem;
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
  color: var(--text-color, #333);
  cursor: pointer;
  transition: all 0.2s;
}

.library-chip:hover {
  background-color: var(--primary-color-lighter, #e3f2fd);
  border-color: var(--primary-color-light, #90caf9);
}

.library-chip.active {
  background-color: var(--primary-color, #2196F3);
  color: white;
  border-color: var(--primary-color, #2196F3);
}

/* 库信息显示样式 */
.library-info {
  margin-top: 0.75rem;
  display: flex;
  gap: 1rem;
  padding: 0.5rem;
  background-color: var(--bg-color-light, #f9f9f9);
  border-radius: 0.5rem;
  font-size: 0.85rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.info-label {
  color: var(--text-secondary, #777);
}

.info-value {
  font-weight: 600;
  color: var(--text-color, #333);
}

/* 加载指示器样式 */
.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
  padding: 0.75rem;
  background-color: var(--bg-color-light, #f9f9f9);
  border-radius: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-color, #333);
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: var(--primary-color, #2196F3);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 深色模式适配 */
:global(.dark-mode) .library-chip {
  background-color: var(--bg-color-light-dark, #333);
  border-color: var(--border-color-dark, #444);
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .library-chip:hover {
  background-color: rgba(33, 150, 243, 0.15);
  border-color: var(--primary-color-light, #90caf9);
}

:global(.dark-mode) .library-info {
  background-color: var(--bg-color-light-dark, #333);
}

:global(.dark-mode) .info-label {
  color: var(--text-secondary-dark, #aaa);
}

:global(.dark-mode) .info-value {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .loading-indicator {
  background-color: var(--bg-color-light-dark, #333);
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .spinner {
  border-color: rgba(255, 255, 255, 0.1);
  border-top-color: var(--primary-color, #2196F3);
}

.button-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  display: inline-block;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
}

.primary-button:disabled {
  background-color: var(--primary-color-light, #90caf9);
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none;
  opacity: 0.7;
}

.secondary-button:disabled {
  background-color: var(--bg-color-light, #f5f5f5);
  color: var(--text-color-light, #999);
  cursor: not-allowed;
  opacity: 0.7;
}
</style> 