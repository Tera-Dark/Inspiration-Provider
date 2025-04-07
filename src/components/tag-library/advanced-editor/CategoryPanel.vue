<template>
  <div class="category-panel">
    <div class="panel-header">
      <h4>分类管理</h4>
      <button 
        class="btn-icon add-btn" 
        @click="$emit('add-category')" 
        title="添加分类">
        <i class="fas fa-plus-circle"></i>
      </button>
    </div>
    
    <div class="category-list">
      <div 
        v-for="category in categories" 
        :key="category"
        class="category-item"
        :class="{ active: selectedCategory === category }"
        @click="$emit('select-category', category)"
      >
        <span class="category-name">{{ category }}</span>
        <span class="tag-count">{{ getCategoryTagCount(category) }}</span>
        <div class="category-actions">
          <button 
            class="btn-icon edit-btn" 
            @click.stop="$emit('edit-category', category)" 
            title="重命名">
            <i class="fas fa-pencil-alt"></i>
          </button>
          <button 
            class="btn-icon delete-btn" 
            @click.stop="$emit('delete-category', category)" 
            title="删除">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      
      <div v-if="categories.length === 0" class="empty-message">
        没有分类，请添加一个新分类
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CategoryPanel',
  props: {
    categories: {
      type: Array,
      required: true
    },
    selectedCategory: {
      type: String,
      default: ''
    },
    getCategoryTagCount: {
      type: Function,
      required: true
    }
  }
};
</script>

<style scoped>
.category-panel {
  background-color: var(--section-bg-color, #f9f9f9);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color-light, #eee);
  background-color: var(--section-header-bg, rgba(0, 0, 0, 0.02));
}

.panel-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-color, #333);
}

.category-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.category-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: visible;
  justify-content: space-between;
  background-color: var(--bg-color, #fff);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.category-item:hover {
  background-color: var(--hover-bg-color, rgba(0, 0, 0, 0.03));
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.category-item.active {
  background-color: var(--active-bg-color, rgba(22, 119, 255, 0.1));
  border-left: 3px solid var(--primary-color, #1677ff);
}

.category-name {
  font-weight: 500;
  color: var(--text-color, #333);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-count {
  font-size: 0.8rem;
  color: var(--text-color-light, #666);
  background-color: var(--tag-bg-color, #f0f0f0);
  padding: 2px 8px;
  border-radius: 10px;
  margin-right: 8px;
}

.category-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
  z-index: 5;
}

.category-item:hover .category-actions {
  opacity: 1;
  transform: scale(1);
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  color: #fff;
  background-size: 100% 100%;
  background-position: center;
  font-size: 0.9rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

.btn-icon:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.btn-icon:active {
  transform: translateY(0);
}

.btn-icon i {
  font-size: 1rem;
}

.add-btn {
  background-color: var(--success-color, #52c41a);
  color: white;
}

.add-btn:hover {
  background-color: var(--success-hover-color, #73d13d);
}

.add-btn:active {
  background-color: #389e0d;
}

.edit-btn {
  background-color: #1677ff;
  color: white;
}

.edit-btn:hover {
  background-color: #4096ff;
}

.edit-btn:active {
  background-color: #0958d9;
}

.delete-btn {
  background-color: #ff4d4f;
  color: white;
}

.delete-btn:hover {
  background-color: #ff7875;
}

.delete-btn:active {
  background-color: #d9363e;
}

.empty-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: var(--text-color-light, #666);
  font-style: italic;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  margin: 10px 0;
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .category-panel {
    background-color: var(--section-bg-color-dark, #252525);
  }
  
  .panel-header {
    border-bottom-color: var(--border-color-dark, #333);
    background-color: var(--section-header-bg-dark, rgba(255, 255, 255, 0.03));
  }
  
  .panel-header h4 {
    color: var(--text-color-dark, #eee);
  }
  
  .category-item {
    background-color: var(--bg-color-dark, #2a2a2a);
  }
  
  .category-item:hover {
    background-color: var(--hover-bg-color-dark, rgba(255, 255, 255, 0.05));
  }
  
  .category-item.active {
    background-color: var(--active-bg-color-dark, rgba(22, 119, 255, 0.15));
  }
  
  .category-name {
    color: var(--text-color-dark, #eee);
  }
  
  .tag-count {
    color: var(--text-color-light-dark, #aaa);
    background-color: var(--tag-bg-color-dark, #333);
  }
}
</style> 