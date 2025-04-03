<template>
  <div class="category-manager">
    <h4>分类管理</h4>
    <div class="form-group">
      <select v-model="selectedLibrary" class="form-control">
        <option value="">选择要管理分类的库</option>
        <option v-for="lib in libraryNames" :key="`cat-mng-${lib}`" :value="lib">{{ lib }}</option>
      </select>
      
      <div v-if="selectedLibrary" class="category-management">
        <div class="category-list">
          <div 
            v-for="category in libCategories" 
            :key="category"
            class="category-item"
            :class="{active: selectedCategory === category}"
            @click="selectedCategory = category"
          >
            <span class="category-name">{{ category }}</span>
            <span class="category-count">{{ getCategoryTagCount(category) }}个标签</span>
          </div>
        </div>
        
        <div class="category-actions">
          <div class="input-group">
            <input 
              type="text" 
              v-model="newCategoryName" 
              placeholder="新分类名称" 
              class="form-control"
            />
            <button 
              @click="addNewCategory" 
              class="btn btn-primary" 
              :disabled="!newCategoryName"
            >添加分类</button>
          </div>
          
          <div class="input-group" v-if="selectedCategory">
            <button 
              @click="renameCategory" 
              class="btn btn-secondary" 
              :disabled="!selectedCategory || !newCategoryName"
            >重命名分类</button>
            <button 
              @click="deleteCategory" 
              class="btn btn-danger" 
              :disabled="!selectedCategory"
            >删除分类</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, inject } from 'vue';

export default {
  name: 'CategoryManager',
  setup() {
    // 获取共享的标签库实例
    const tagLibrary = inject('tagLibrary');
    const emitter = inject('emitter');
    
    // 分类管理相关状态
    const selectedLibrary = ref('');
    const selectedCategory = ref('');
    const newCategoryName = ref('');
    
    // 计算属性：所有库名称
    const libraryNames = computed(() => {
      return tagLibrary.getLibraryNames ? tagLibrary.getLibraryNames() : 
             (tagLibrary.getLibraries ? tagLibrary.getLibraries() : []);
    });
    
    // 计算属性：选定库的分类
    const libCategories = computed(() => {
      if (!selectedLibrary.value) return [];
      const lib = tagLibrary.getLibrary ? tagLibrary.getLibrary(selectedLibrary.value) : {};
      return Object.keys(lib).sort();
    });
    
    // 获取分类标签数量
    const getCategoryTagCount = (category) => {
      if (!selectedLibrary.value || !category) return 0;
      
      const lib = tagLibrary.getLibrary ? tagLibrary.getLibrary(selectedLibrary.value) : {};
      if (!lib[category] || !Array.isArray(lib[category])) return 0;
      
      return lib[category].length;
    };
    
    // 监听分类管理的库选择变化
    watch(selectedLibrary, () => {
      selectedCategory.value = '';
      newCategoryName.value = '';
    });
    
    // 添加新分类
    const addNewCategory = () => {
      if (!newCategoryName.value || !selectedLibrary.value) {
        emitter.emit('notification', {
          type: 'warning',
          message: '请选择库并输入新分类名称'
        });
        return;
      }
      
      try {
        tagLibrary.addCategory(selectedLibrary.value, newCategoryName.value);
        
        emitter.emit('notification', {
          type: 'success',
          message: `成功添加新分类 "${newCategoryName.value}"`
        });
        
        // 清空表单
        newCategoryName.value = '';
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `添加新分类失败: ${error.message}`
        });
      }
    };
    
    // 重命名分类
    const renameCategory = () => {
      if (!selectedCategory.value || !newCategoryName.value || !selectedLibrary.value) {
        emitter.emit('notification', {
          type: 'warning',
          message: '请选择库、分类并输入新名称'
        });
        return;
      }
      
      try {
        tagLibrary.renameCategory(selectedLibrary.value, selectedCategory.value, newCategoryName.value);
        
        emitter.emit('notification', {
          type: 'success',
          message: `成功将分类 "${selectedCategory.value}" 重命名为 "${newCategoryName.value}"`
        });
        
        // 清空表单
        selectedCategory.value = '';
        newCategoryName.value = '';
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `重命名分类失败: ${error.message}`
        });
      }
    };
    
    // 删除分类
    const deleteCategory = () => {
      if (!selectedCategory.value || !selectedLibrary.value) {
        emitter.emit('notification', {
          type: 'warning',
          message: '请选择库和要删除的分类'
        });
        return;
      }
      
      if (confirm(`确定要删除分类 "${selectedCategory.value}" 吗？此操作不可撤销。`)) {
        try {
          tagLibrary.deleteCategory(selectedLibrary.value, selectedCategory.value);
          
          emitter.emit('notification', {
            type: 'success',
            message: `成功删除分类 "${selectedCategory.value}"`
          });
          
          // 清空表单
          selectedCategory.value = '';
        } catch (error) {
          emitter.emit('notification', {
            type: 'error',
            message: `删除分类失败: ${error.message}`
          });
        }
      }
    };
    
    return {
      selectedLibrary,
      selectedCategory,
      newCategoryName,
      libraryNames,
      libCategories,
      getCategoryTagCount,
      addNewCategory,
      renameCategory,
      deleteCategory
    };
  }
};
</script>

<style scoped>
.category-manager {
  margin-bottom: 20px;
}

.category-management {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 4px;
  padding: 16px;
  background-color: var(--bg-color-light, #f5f5f5);
}

.category-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 4px;
  background-color: var(--bg-color, #fff);
}

.category-item {
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-item:last-child {
  border-bottom: none;
}

.category-item:hover {
  background-color: var(--bg-color-light, #f0f0f0);
}

.category-item.active {
  background-color: var(--primary-color-light, #e6f7ff);
  border-left: 3px solid var(--primary-color, #1677ff);
}

.category-name {
  font-weight: 500;
}

.category-count {
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
  background-color: var(--bg-color-light, #f0f0f0);
  border-radius: 10px;
  padding: 2px 8px;
}

.category-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-group {
  display: flex;
  gap: 8px;
}

.form-control {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  font-size: 0.95rem;
  background-color: var(--bg-color, #fff);
  color: var(--text-color, #333);
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-primary {
  background-color: var(--primary-color, #1677ff);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-color-dark, #0958d9);
}

.btn-secondary {
  background-color: var(--bg-color-light, #f5f5f5);
  color: var(--text-color, #333);
  border: 1px solid var(--border-color, #ddd);
}

.btn-secondary:hover {
  background-color: var(--bg-color-dark, #e0e0e0);
}

.btn-danger {
  background-color: var(--danger-color, #ff4d4f);
  color: white;
}

.btn-danger:hover {
  background-color: var(--danger-color-dark, #d9363e);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 暗色模式适配 */
:global(.dark-mode) .category-management {
  background-color: var(--bg-color-dark-2, #2a2a2a);
  border-color: var(--border-color-dark, #333);
}

:global(.dark-mode) .category-list {
  background-color: var(--bg-color-dark, #1f1f1f);
  border-color: var(--border-color-dark, #333);
}

:global(.dark-mode) .category-item {
  border-color: var(--border-color-dark, #333);
}

:global(.dark-mode) .category-item:hover {
  background-color: var(--bg-color-dark-3, #383838);
}

:global(.dark-mode) .category-item.active {
  background-color: rgba(24, 144, 255, 0.1);
}

:global(.dark-mode) .category-count {
  background-color: var(--bg-color-dark-3, #383838);
  color: var(--text-color-light-dark, #aaa);
}

:global(.dark-mode) .form-control {
  background-color: var(--bg-color-dark, #1f1f1f);
  border-color: var(--border-color-dark, #333);
  color: var(--text-color-dark, #ddd);
}

/* 响应式适配 */
@media (max-width: 768px) {
  .input-group {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style> 