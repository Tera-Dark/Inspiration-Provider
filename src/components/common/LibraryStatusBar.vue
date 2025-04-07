<template>
  <div class="library-status-bar">
    <div class="status-content">
      <div class="library-info">
        <span class="library-label">当前库:</span>
        <library-selector class="library-selector" />
      </div>
      
      <div class="library-stats" v-if="currentLibraryInfo">
        <div class="stat-item">
          <span class="stat-icon">📚</span>
          <span class="stat-value">{{ currentLibraryInfo.count }}</span>
          <span class="stat-label">标签</span>
        </div>
        <div class="stat-item" v-if="currentLibraryInfo.categoryCount !== undefined">
          <span class="stat-icon">📂</span>
          <span class="stat-value">{{ currentLibraryInfo.categoryCount }}</span>
          <span class="stat-label">分类</span>
        </div>
      </div>
      
      <div class="action-buttons">
        <button 
          class="action-btn" 
          title="管理标签库"
          @click="openLibraryManager"
        >
          <span class="btn-icon">⚙️</span>
        </button>
        <button 
          class="action-btn" 
          title="刷新库数据"
          @click="refreshLibrary"
          :class="{ 'is-loading': isRefreshing }"
        >
          <span class="btn-icon">🔄</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, inject, computed, onMounted, onBeforeUnmount } from 'vue';
import LibrarySelector from './LibrarySelector.vue';

export default defineComponent({
  name: 'LibraryStatusBar',
  components: {
    LibrarySelector
  },
  setup() {
    const tagLibrary = inject('tagLibrary');
    const emitter = inject('emitter');
    
    const isRefreshing = ref(false);
    const currentLibrary = ref('');
    const currentLibraryInfo = ref(null);
    
    // 加载当前库信息
    const loadCurrentLibraryInfo = () => {
      try {
        if (!tagLibrary) return;
        
        const libraryName = tagLibrary.getCurrentLibraryName();
        currentLibrary.value = libraryName;
        
        // 获取库的标签数量
        const count = tagLibrary.getTagCountByLibrary ? 
                     tagLibrary.getTagCountByLibrary(libraryName) :
                     (tagLibrary.getAllTags ? tagLibrary.getAllTags(libraryName).length : 0);
        
        // 获取库的分类数量
        const categories = tagLibrary.getCategories ? tagLibrary.getCategories(libraryName) : [];
        const categoryCount = Array.isArray(categories) ? categories.length : 0;
        
        currentLibraryInfo.value = {
          name: libraryName,
          count,
          categoryCount
        };
      } catch (error) {
        console.error('加载当前库信息失败:', error);
        currentLibraryInfo.value = null;
      }
    };
    
    // 打开标签库管理器
    const openLibraryManager = () => {
      emitter.emit('open-panel', 'tag-library');
    };
    
    // 刷新库数据
    const refreshLibrary = async () => {
      if (isRefreshing.value) return;
      
      isRefreshing.value = true;
      
      try {
        // 等待一小段时间，模拟刷新过程
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // 重新加载库信息
        loadCurrentLibraryInfo();
        
        // 通知刷新完成
        emitter.emit('notification', {
          type: 'success',
          message: `${currentLibrary.value} 库已刷新`
        });
      } catch (error) {
        console.error('刷新库数据失败:', error);
        emitter.emit('notification', {
          type: 'error',
          message: '刷新库数据失败'
        });
      } finally {
        isRefreshing.value = false;
      }
    };
    
    // 处理库变更事件
    const handleLibraryChanged = (libraryName) => {
      if (libraryName !== currentLibrary.value) {
        currentLibrary.value = libraryName;
        loadCurrentLibraryInfo();
      }
    };
    
    // 组件挂载时初始化
    onMounted(() => {
      loadCurrentLibraryInfo();
      
      // 监听库变更事件
      emitter.on('library-changed', handleLibraryChanged);
    });
    
    // 组件卸载前清理
    onBeforeUnmount(() => {
      emitter.off('library-changed', handleLibraryChanged);
    });
    
    return {
      currentLibraryInfo,
      isRefreshing,
      openLibraryManager,
      refreshLibrary
    };
  }
});
</script>

<style scoped>
.library-status-bar {
  display: flex;
  align-items: center;
  background-color: var(--panel-bg-color, #fff);
  border-bottom: 1px solid var(--border-color, #eee);
  padding: 8px 16px;
  height: 50px;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.status-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.library-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.library-label {
  font-size: 0.9rem;
  color: var(--text-color, #666);
  white-space: nowrap;
}

.library-selector {
  width: 220px;
}

.library-stats {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-icon {
  font-size: 1rem;
}

.stat-value {
  font-weight: 600;
  color: var(--text-color, #333);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background-color: var(--hover-bg-color, rgba(0, 0, 0, 0.04));
}

.action-btn .btn-icon {
  font-size: 1.1rem;
}

.action-btn.is-loading {
  pointer-events: none;
}

.action-btn.is-loading .btn-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 暗模式适配 */
@media (prefers-color-scheme: dark) {
  .library-status-bar {
    background-color: var(--panel-bg-color-dark, #1e1e1e);
    border-bottom-color: var(--border-color-dark, #333);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  
  .library-label {
    color: var(--text-color-light-dark, #aaa);
  }
  
  .stat-value {
    color: var(--text-color-dark, #eee);
  }
  
  .stat-label {
    color: var(--text-color-light-dark, #aaa);
  }
  
  .action-btn:hover {
    background-color: var(--hover-bg-color-dark, rgba(255, 255, 255, 0.05));
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .library-status-bar {
    padding: 8px 12px;
  }
  
  .status-content {
    flex-wrap: wrap;
  }
  
  .library-info {
    width: 100%;
    margin-bottom: 8px;
  }
  
  .library-stats {
    width: 100%;
    justify-content: flex-start;
    margin-top: 8px;
  }
  
  .action-buttons {
    position: absolute;
    top: 10px;
    right: 12px;
  }
}

@media (max-width: 480px) {
  .library-status-bar {
    height: auto;
    padding: 10px 12px;
  }
  
  .status-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .library-info {
    margin-bottom: 10px;
  }
  
  .library-stats {
    margin-top: 10px;
  }
}
</style> 