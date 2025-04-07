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
import { defineComponent, ref, inject, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
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
    
    // 基本设置
    const drawCount = ref(3);
    const selectedCategory = ref('all');
    const selectedLibrary = ref('default');
    const useMultiCategories = ref(false);
    const selectedCategories = ref([]);
    const ensureEachCategory = ref(false);
    const isDrawing = ref(false);
    const isGenerating = ref(false);
    
    // 库相关
    const recentLibraries = ref([]);
    const currentLibraryInfo = ref(null);
    const isLibraryLoading = ref(false);
    
    // 计算属性
    const categories = computed(() => {
      const lib = tagLibrary.getCurrentLibrary();
      return Object.keys(lib || {});
    });
    
    const filteredLibraries = computed(() => {
      return tagLibrary.getLibraryNames().filter(lib => lib !== selectedLibrary.value);
    });
    
    // 方法
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
    
    const toggleMultiCategoryMode = () => {
      useMultiCategories.value = !useMultiCategories.value;
      if (!useMultiCategories.value) {
        selectedCategories.value = [];
      }
    };
    
    const handleLibraryChange = async () => {
      if (!selectedLibrary.value) return;
      
      try {
        isLibraryLoading.value = true;
        await tagLibrary.setCurrentLibrary(selectedLibrary.value);
        
        // 更新库信息
        updateLibraryInfo();
        
        // 更新最近使用的库列表
        recentLibraries.value = tagLibrary.getRecentLibraries();
        
        // 重置分类选择
        selectedCategory.value = 'all';
        selectedCategories.value = [];
        
        emitter.emit('notification', {
          type: 'success',
          message: `已切换到标签库: ${selectedLibrary.value}`
        });
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `切换标签库失败: ${error.message}`
        });
      } finally {
        isLibraryLoading.value = false;
      }
    };
    
    const updateLibraryInfo = () => {
      const lib = tagLibrary.getCurrentLibrary();
      if (lib) {
        const categoryCount = Object.keys(lib).length;
        let tagCount = 0;
        for (const category in lib) {
          if (Array.isArray(lib[category])) {
            tagCount += lib[category].length;
          }
        }
        currentLibraryInfo.value = { categoryCount, tagCount };
      } else {
        currentLibraryInfo.value = null;
      }
    };
    
    const drawTags = async () => {
      if (isDrawing.value) return;
      
      try {
        isGenerating.value = true;
        
        // 准备抽签参数
        const options = {
          count: drawCount.value,
          categories: useMultiCategories.value ? selectedCategories.value : 
                     selectedCategory.value === 'all' ? undefined : [selectedCategory.value],
          ensureEachCategory: useMultiCategories.value && selectedCategories.value.length > 1 ? 
                            ensureEachCategory.value : false
        };
        
        // 执行抽签
        const result = await tagDrawer.draw(options);
        
        // 添加到历史记录
        tagLibrary.addToHistory(result, options);
        
        // 发送结果到父组件
        emit('draw-completed', result);
        emitter.emit('tags-drawn', result);
        
        // 显示成功通知
        emitter.emit('notification', {
          type: 'success',
          message: `成功抽取了 ${result.length} 个标签`
        });
        
      } catch (error) {
        console.error('抽签失败:', error);
        emitter.emit('notification', {
          type: 'error',
          message: `抽签失败: ${error.message}`
        });
      } finally {
        isDrawing.value = false;
      }
    };
    
    const resetForm = () => {
      drawCount.value = 3;
      selectedCategory.value = 'all';
      useMultiCategories.value = false;
      selectedCategories.value = [];
      ensureEachCategory.value = false;
    };
    
    const quickSelectLibrary = (libraryName) => {
      if (libraryName && libraryName !== selectedLibrary.value) {
        selectedLibrary.value = libraryName;
        handleLibraryChange();
      }
    };
    
    // 初始化
    onMounted(() => {
      // 加载默认库设置
      const librarySettings = localStorage.getItem('library_settings');
      let defaultLibraryName = null;
      
      if (librarySettings) {
        try {
          const settings = JSON.parse(librarySettings);
          defaultLibraryName = settings.defaultLibrary;
        } catch (e) {
          console.error('加载库设置失败', e);
        }
      }
      
      // 设置当前库
      const libraries = tagLibrary.getLibraryNames();
      if (libraries.length > 0) {
        selectedLibrary.value = defaultLibraryName && libraries.includes(defaultLibraryName) ? 
                              defaultLibraryName : libraries[0];
        handleLibraryChange();
      }
      
      // 加载最近使用的库列表
      recentLibraries.value = tagLibrary.getRecentLibraries();
      
      // 更新库信息
      updateLibraryInfo();
    });
    
    return {
      // 基本设置
      drawCount,
      selectedCategory,
      selectedLibrary,
      useMultiCategories,
      selectedCategories,
      ensureEachCategory,
      isDrawing,
      isGenerating,
      
      // 库相关
      recentLibraries,
      currentLibraryInfo,
      isLibraryLoading,
      filteredLibraries,
      
      // 计算属性
      categories,
      
      // 方法
      increaseCount,
      decreaseCount,
      toggleMultiCategoryMode,
      handleLibraryChange,
      drawTags,
      resetForm,
      quickSelectLibrary
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
  padding: 1rem 1.5rem;
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
  position: relative;
}

.advanced-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  position: sticky;
  top: 0;
  z-index: 5;
  background-color: inherit;
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
  max-height: 400px;
  overflow-y: auto;
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
  
  .advanced-content {
    max-height: 300px;
  }
}

/* 根据不同高度调整 */
@media (min-height: 800px) {
  .advanced-content {
    max-height: 450px;
  }
}

@media (max-height: 600px) {
  .advanced-content {
    max-height: 250px;
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

/* 滚动条样式 */
.advanced-content::-webkit-scrollbar,
.form-content::-webkit-scrollbar {
  width: 6px;
}

.advanced-content::-webkit-scrollbar-thumb,
.form-content::-webkit-scrollbar-thumb {
  background-color: var(--border-color-light, rgba(0, 0, 0, 0.2));
  border-radius: 10px;
}

.advanced-content::-webkit-scrollbar-track,
.form-content::-webkit-scrollbar-track {
  background-color: transparent;
}

:global(.dark-mode) .advanced-content::-webkit-scrollbar-thumb,
:global(.dark-mode) .form-content::-webkit-scrollbar-thumb {
  background-color: var(--border-color-dark, rgba(255, 255, 255, 0.2));
}
</style> 