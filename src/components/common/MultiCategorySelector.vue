<template>
  <div class="multi-category-selector">
    <!-- 触发按钮 -->
    <button 
      @click="openModal" 
      class="selector-trigger"
      :class="{ 'has-selections': selectedCategories.length > 0 }"
    >
      <span class="trigger-icon">🔍</span>
      <span class="trigger-text">
        {{ selectedCategories.length > 0 
          ? `已选择 ${selectedCategories.length} 个分类` 
          : '选择分类范围' }}
      </span>
      <span class="trigger-badge" v-if="selectedCategories.length > 0">
        {{ selectedCategories.length }}
      </span>
    </button>
    
    <!-- 模态框 -->
    <div class="selector-modal" v-if="isModalOpen">
      <div class="modal-backdrop" @click="closeModal"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>选择分类范围</h3>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        
        <div class="search-box">
          <input 
            type="text" 
            v-model="searchTerm"
            placeholder="搜索分类..."
            class="search-input"
            ref="searchInput"
          />
          <span class="search-icon">🔍</span>
        </div>
        
        <div class="selection-actions">
          <button @click="selectAll" class="action-btn">全选</button>
          <button @click="selectNone" class="action-btn">清空</button>
          <span class="selection-counter">已选择 {{ selectedCategories.length }}/{{ filteredCategories.length }}</span>
        </div>
        
        <div class="categories-list">
          <div 
            v-for="category in filteredCategories" 
            :key="category"
            class="category-item"
            :class="{ 'selected': selectedCategories.includes(category) }"
            @click="toggleCategory(category)"
          >
            <span class="checkbox">
              <span class="checkmark" v-if="selectedCategories.includes(category)">✓</span>
            </span>
            <span class="category-name">{{ category }}</span>
          </div>
          
          <div v-if="filteredCategories.length === 0" class="empty-result">
            没有找到匹配的分类
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="confirm" class="primary-btn">确定</button>
          <button @click="closeModal" class="cancel-btn">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, nextTick } from 'vue';

export default defineComponent({
  name: 'MultiCategorySelector',
  props: {
    categories: {
      type: Array,
      required: true
    },
    value: {
      type: Array,
      default: () => []
    },
    maxSelections: {
      type: Number,
      default: 0 // 0表示不限制
    }
  },
  emits: ['update:value', 'change'],
  setup(props, { emit }) {
    const isModalOpen = ref(false);
    const searchTerm = ref('');
    const selectedCategories = ref([...props.value]);
    const searchInput = ref(null);
    
    // 过滤分类
    const filteredCategories = computed(() => {
      if (!searchTerm.value) return props.categories;
      
      const term = searchTerm.value.toLowerCase();
      return props.categories.filter(category => 
        category.toLowerCase().includes(term)
      );
    });
    
    // 同步外部传入的值
    watch(() => props.value, (newValue) => {
      selectedCategories.value = [...newValue];
    });
    
    // 打开模态框
    const openModal = () => {
      isModalOpen.value = true;
      searchTerm.value = '';
      
      // 自动聚焦搜索框
      nextTick(() => {
        if (searchInput.value) {
          searchInput.value.focus();
        }
      });
    };
    
    // 关闭模态框
    const closeModal = () => {
      isModalOpen.value = false;
    };
    
    // 全选
    const selectAll = () => {
      selectedCategories.value = [...filteredCategories.value];
      
      // 如果有最大选择数限制
      if (props.maxSelections > 0 && selectedCategories.value.length > props.maxSelections) {
        selectedCategories.value = selectedCategories.value.slice(0, props.maxSelections);
      }
    };
    
    // 清空选择
    const selectNone = () => {
      selectedCategories.value = [];
    };
    
    // 切换单个分类的选择状态
    const toggleCategory = (category) => {
      const index = selectedCategories.value.indexOf(category);
      
      if (index === -1) {
        // 如果有最大选择数限制且已达到限制
        if (props.maxSelections > 0 && selectedCategories.value.length >= props.maxSelections) {
          return;
        }
        
        selectedCategories.value.push(category);
      } else {
        selectedCategories.value.splice(index, 1);
      }
    };
    
    // 确认选择
    const confirm = () => {
      emit('update:value', selectedCategories.value);
      emit('change', selectedCategories.value);
      closeModal();
    };
    
    return {
      isModalOpen,
      searchTerm,
      selectedCategories,
      filteredCategories,
      searchInput,
      openModal,
      closeModal,
      selectAll,
      selectNone,
      toggleCategory,
      confirm
    };
  }
});
</script>

<style scoped>
.multi-category-selector {
  position: relative;
  display: inline-block;
  width: 100%;
}

.selector-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.875rem 1rem;
  background-color: var(--bg-color-light, #f9f9f9);
  border: 1px solid var(--border-color, #ddd);
  border-radius: var(--border-radius-small, 8px);
  color: var(--text-color, #333);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  position: relative;
}

.selector-trigger:hover {
  background-color: var(--bg-color, #f0f0f0);
  border-color: var(--primary-color-light, #90caf9);
}

.selector-trigger.has-selections {
  background-color: var(--primary-color-lighter, #e3f2fd);
  border-color: var(--primary-color-light, #90caf9);
}

.trigger-icon {
  font-size: 1.1rem;
}

.trigger-text {
  flex: 1;
}

.trigger-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--primary-color, #2196F3);
  color: white;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  font-size: 0.8rem;
  font-weight: bold;
}

.selector-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
}

.modal-content {
  position: relative;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  background-color: var(--panel-bg-color, #fff);
  border-radius: var(--border-radius-medium, 12px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modal-in 0.2s ease-out;
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color-light, rgba(0, 0, 0, 0.07));
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color, #333);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-color-light, #666);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: var(--bg-color-light, #f5f5f5);
  color: var(--text-color, #333);
}

.search-box {
  padding: 1.25rem 1.5rem;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 2.5rem;
  border: 1px solid var(--border-color, #ddd);
  border-radius: var(--border-radius-small, 8px);
  font-size: 1rem;
  background-color: var(--bg-color-light, #f9f9f9);
  color: var(--text-color, #333);
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color, #2196F3);
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.search-icon {
  position: absolute;
  left: 2.25rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.1rem;
  color: var(--text-color-light, #666);
  pointer-events: none;
}

.selection-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1.5rem 1rem;
}

.action-btn {
  background: none;
  border: none;
  color: var(--primary-color, #2196F3);
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.35rem 0.75rem;
  border-radius: 100px;
  transition: all 0.2s;
}

.action-btn:hover {
  background-color: var(--primary-color-lighter, #e3f2fd);
}

.selection-counter {
  margin-left: auto;
  font-size: 0.9rem;
  color: var(--text-color-light, #666);
}

.categories-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 1.5rem;
  max-height: 300px;
  margin-bottom: 1rem;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: var(--border-radius-small, 8px);
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0.5rem;
}

.category-item:hover {
  background-color: var(--bg-color-light, #f5f5f5);
}

.category-item.selected {
  background-color: var(--primary-color-lighter, #e3f2fd);
}

.checkbox {
  width: 1.2rem;
  height: 1.2rem;
  border: 2px solid var(--border-color, #ddd);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.category-item.selected .checkbox {
  background-color: var(--primary-color, #2196F3);
  border-color: var(--primary-color, #2196F3);
}

.checkmark {
  color: white;
  font-size: 0.85rem;
  font-weight: bold;
}

.category-name {
  font-size: 1rem;
  color: var(--text-color, #333);
  flex: 1;
}

.empty-result {
  text-align: center;
  padding: 2rem 0;
  color: var(--text-color-light, #666);
  font-style: italic;
}

.modal-footer {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--border-color-light, rgba(0, 0, 0, 0.07));
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.primary-btn, .cancel-btn {
  padding: 0.75rem 1.5rem;
  border-radius: var(--border-radius-small, 8px);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-btn {
  background-color: var(--primary-color, #2196F3);
  color: white;
  border: none;
}

.primary-btn:hover {
  background-color: var(--primary-color-dark, #1565c0);
}

.cancel-btn {
  background-color: var(--bg-color-light, #f5f5f5);
  color: var(--text-color, #333);
  border: 1px solid var(--border-color, #ddd);
}

.cancel-btn:hover {
  background-color: var(--bg-color, #e5e5e5);
}

/* 深色模式适配 */
:global(.dark-mode) .selector-trigger {
  background-color: var(--bg-color-light-dark, #333);
  border-color: var(--border-color-dark, #444);
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .selector-trigger:hover {
  background-color: var(--bg-color-dark, #3a3a3a);
  border-color: var(--primary-color-dark, #1565c0);
}

:global(.dark-mode) .selector-trigger.has-selections {
  background-color: rgba(33, 150, 243, 0.15);
  border-color: var(--primary-color-dark, #1565c0);
}

:global(.dark-mode) .modal-content {
  background-color: var(--panel-bg-color-dark, #1e1e1e);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
}

:global(.dark-mode) .modal-header {
  border-color: var(--border-color-dark, rgba(255, 255, 255, 0.1));
}

:global(.dark-mode) .modal-header h3 {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .close-btn {
  color: var(--text-color-light-dark, #aaa);
}

:global(.dark-mode) .close-btn:hover {
  background-color: var(--bg-color-light-dark, #333);
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .search-input {
  border-color: var(--border-color-dark, #444);
  background-color: var(--bg-color-light-dark, #333);
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .search-input:focus {
  border-color: var(--primary-color, #2196F3);
}

:global(.dark-mode) .search-icon {
  color: var(--text-color-light-dark, #aaa);
}

:global(.dark-mode) .action-btn:hover {
  background-color: rgba(33, 150, 243, 0.15);
}

:global(.dark-mode) .selection-counter {
  color: var(--text-color-light-dark, #aaa);
}

:global(.dark-mode) .category-item:hover {
  background-color: var(--bg-color-light-dark, #333);
}

:global(.dark-mode) .category-item.selected {
  background-color: rgba(33, 150, 243, 0.15);
}

:global(.dark-mode) .checkbox {
  border-color: var(--border-color-dark, #444);
}

:global(.dark-mode) .category-name {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .empty-result {
  color: var(--text-color-light-dark, #aaa);
}

:global(.dark-mode) .modal-footer {
  border-color: var(--border-color-dark, rgba(255, 255, 255, 0.1));
}

:global(.dark-mode) .cancel-btn {
  background-color: var(--bg-color-light-dark, #333);
  color: var(--text-color-dark, #e0e0e0);
  border-color: var(--border-color-dark, #444);
}

:global(.dark-mode) .cancel-btn:hover {
  background-color: var(--bg-color-dark, #3a3a3a);
}

/* 响应式适配 */
@media (max-width: 640px) {
  .modal-content {
    width: 95%;
    max-height: 90vh;
  }
  
  .modal-header {
    padding: 1rem;
  }
  
  .search-box {
    padding: 1rem;
  }
  
  .selection-actions {
    padding: 0 1rem 0.75rem;
  }
  
  .categories-list {
    padding: 0 1rem;
    max-height: 250px;
  }
  
  .modal-footer {
    padding: 1rem;
  }
  
  .primary-btn, .cancel-btn {
    padding: 0.65rem 1.25rem;
  }
}
</style> 