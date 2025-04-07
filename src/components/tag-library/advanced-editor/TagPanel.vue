<template>
  <div class="tags-panel">
    <div class="panel-header" v-if="selectedCategory">
      <h4>{{ selectedCategory }} 中的标签</h4>
      <button 
        class="btn-icon add-btn" 
        @click="$emit('add-tag')" 
        title="添加标签">
        <i class="fas fa-plus-circle"></i>
      </button>
    </div>
    
    <div class="tag-list" v-if="selectedCategory">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          class="form-control" 
          placeholder="搜索标签..."
          @input="debouncedSearch"
        >
        <i class="fas fa-search search-icon"></i>
      </div>
      
      <!-- 直接渲染标签项 -->
      <div class="tags-container">
        <div 
          v-for="(tag, index) in filteredTags" 
          :key="tag.content + index"
          class="tag-item"
        >
          <div class="tag-content">
            <div class="tag-main-content">{{ tag.content }}</div>
            <div 
              v-if="tag.subTitles && tag.subTitles.length > 0" 
              class="tag-subtitle"
            >
              {{ tag.subTitles.join(' / ') }}
            </div>
          </div>
          <div class="tag-actions">
            <button 
              class="btn-icon edit-btn" 
              @click="$emit('edit-tag', tag, index)" 
              title="编辑标签">
              <i class="fas fa-pencil-alt"></i>
            </button>
            <button 
              class="btn-icon delete-btn" 
              @click="$emit('delete-tag', tag, index)" 
              title="删除标签">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="tags.length === 0" class="empty-message">
        当前分类没有标签
      </div>
      
      <div v-else-if="filteredTags.length === 0" class="empty-message">
        没有找到匹配的标签
      </div>
    </div>
    
    <div v-else class="empty-message">
      请从左侧选择一个分类
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  name: 'TagPanel',
  props: {
    selectedCategory: {
      type: String,
      default: ''
    },
    tags: {
      type: Array,
      default: () => []
    }
  },
  emits: ['add-tag', 'edit-tag', 'delete-tag'],
  setup(props) {
    const searchQuery = ref('');
    let searchTimeout = null;
    
    // 过滤后的标签列表
    const filteredTags = computed(() => {
      if (!searchQuery.value) return props.tags;
      
      const query = searchQuery.value.toLowerCase();
      return props.tags.filter(tag => {
        const content = tag.content.toLowerCase();
        const subTitles = tag.subTitles?.join(' ').toLowerCase() || '';
        return content.includes(query) || subTitles.includes(query);
      });
    });
    
    // 防抖搜索
    const debouncedSearch = () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      searchTimeout = setTimeout(() => {
        // 触发搜索
      }, 300);
    };
    
    return {
      searchQuery,
      filteredTags,
      debouncedSearch
    };
  }
};
</script>

<style scoped>
.tags-panel {
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

.tag-list {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 12px;
}

.search-box {
  position: relative;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.search-box .form-control {
  width: 100%;
  padding: 10px 12px 10px 38px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  font-size: 0.95rem;
  color: var(--text-color, #333);
  background-color: var(--input-bg-color, #fff);
  transition: all 0.3s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.search-box .form-control:focus {
  border-color: var(--primary-color, #1677ff);
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
  outline: none;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-color-light, #666);
  font-size: 1.1rem;
}

.tags-container {
  flex: 1;
  overflow-y: auto;
  margin-right: -8px;
  padding-right: 8px;
}

.tag-item {
  position: relative;
  padding: 12px 16px 12px 16px;
  background-color: var(--tag-item-bg, #fff);
  border-radius: 8px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tag-item:hover {
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
  background-color: var(--tag-item-hover-bg, #fafafa);
}

.tag-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-right: 10px;
}

.tag-main-content {
  font-weight: 500;
  color: var(--text-color, #333);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
  max-height: 3em;
}

.tag-subtitle {
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
  margin-top: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  background-color: var(--tag-subtitle-bg, rgba(0, 0, 0, 0.03));
  padding: 2px 8px;
  border-radius: 4px;
}

.tag-actions {
  position: static;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
  z-index: 1;
}

.tag-item:hover .tag-actions {
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
  .tags-panel {
    background-color: var(--section-bg-color-dark, #252525);
  }
  
  .panel-header {
    border-bottom-color: var(--border-color-dark, #333);
    background-color: var(--section-header-bg-dark, rgba(255, 255, 255, 0.03));
  }
  
  .panel-header h4 {
    color: var(--text-color-dark, #eee);
  }
  
  .search-box .form-control {
    background-color: var(--input-bg-color-dark, #2c2c2c);
    border-color: var(--border-color-dark, #444);
    color: var(--text-color-dark, #eee);
  }
  
  .search-icon {
    color: var(--text-color-light-dark, #999);
  }
  
  .tag-item {
    background-color: var(--tag-item-bg-dark, #2a2a2a);
  }
  
  .tag-item:hover {
    background-color: var(--tag-item-hover-bg-dark, #333);
  }
  
  .tag-main-content {
    color: var(--text-color-dark, #eee);
  }
  
  .tag-subtitle {
    color: var(--text-color-light-dark, #aaa);
    background-color: var(--tag-subtitle-bg-dark, rgba(255, 255, 255, 0.05));
  }
  
  .empty-message {
    color: var(--text-color-light-dark, #aaa);
    background-color: rgba(255, 255, 255, 0.03);
  }
}
</style> 