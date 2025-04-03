<template>
  <div class="history-panel">
    <div v-if="historyItems.length === 0" class="empty-history">
      <p>暂无抽签历史记录</p>
      <p class="empty-tip">抽签后的结果将自动保存在这里</p>
    </div>
    
    <div v-else class="history-content">
      <div class="history-header">
        <h3>历史记录</h3>
        <div class="header-actions">
          <button @click="clearAllHistory" class="clear-all-btn">
            清空全部
          </button>
        </div>
      </div>
      
      <div class="history-list">
        <div 
          v-for="item in historyItems" 
          :key="item.id"
          class="history-item"
        >
          <div class="history-meta">
            <div class="history-time">{{ formatTime(item.timestamp) }}</div>
            <div class="history-actions">
              <button @click="reuseHistory(item)" class="action-btn reuse-btn" title="重新使用">
                <span class="btn-icon">🔄</span>
                <span class="btn-text">重用</span>
              </button>
              <button @click="copyHistoryTags(item)" class="action-btn copy-btn" title="复制结果">
                <span class="btn-icon">📋</span>
                <span class="btn-text">复制</span>
              </button>
              <button @click="deleteHistory(item.id)" class="action-btn delete-btn" title="删除">
                <span class="btn-icon">🗑️</span>
                <span class="btn-text">删除</span>
              </button>
            </div>
          </div>
          
          <div class="history-tags">
            <div 
              v-for="(tag, tagIndex) in item.tags" 
              :key="tagIndex"
              class="history-tag"
            >
              <span class="tag-category">{{ tag.category }}</span>
              <span class="tag-content">{{ tag.content }}</span>
              <span v-if="tag.subTitles && tag.subTitles.length > 0" class="tag-subtitle">
                {{ tag.subTitles.join(' / ') }}
              </span>
            </div>
          </div>
          
          <div class="history-options">
            <span class="option-label">抽取选项:</span>
            <div class="option-values">
              <span class="option-item">
                <span class="option-icon">🎯</span>
                <span>数量: {{ item.options.count }}</span>
              </span>
              <span class="option-item">
                <span class="option-icon">📁</span>
                <span>分类: {{ item.options.category || '全部' }}</span>
              </span>
              <span class="option-item">
                <span class="option-icon">🔄</span>
                <span>排除重复: {{ item.options.noDuplicates ? '是' : '否' }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, inject, onMounted, onBeforeUnmount } from 'vue';

export default defineComponent({
  name: 'HistoryPanel',
  setup() {
    const emitter = inject('emitter');
    const tagLibrary = inject('tagLibrary');
    const historyItems = ref([]);
    
    // 加载历史记录
    const loadHistory = () => {
      try {
        const history = tagLibrary.getHistory();
        historyItems.value = history || [];
      } catch (error) {
        console.error('加载历史记录失败:', error);
        emitter.emit('notification', {
          type: 'error',
          message: '加载历史记录失败'
        });
      }
    };
    
    // 格式化时间戳
    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };
    
    // 重用历史记录
    const reuseHistory = (historyItem) => {
      emitter.emit('reuse-history', historyItem);
      emitter.emit('notification', {
        type: 'success',
        message: '已重用历史记录'
      });
    };
    
    // 复制历史记录标签
    const copyHistoryTags = (historyItem) => {
      if (!historyItem.tags || historyItem.tags.length === 0) return;
      
      const tagsText = historyItem.tags.map(tag => {
        let text = `【${tag.category}】${tag.content}`;
        if (tag.subTitles && tag.subTitles.length > 0) {
          text += ` (${tag.subTitles.join(' / ')})`;
        }
        return text;
      }).join(',');
      
      // 复制到剪贴板
      navigator.clipboard.writeText(tagsText)
        .then(() => {
          emitter.emit('notification', {
            type: 'success',
            message: '已复制历史记录到剪贴板'
          });
        })
        .catch(err => {
          console.error('复制失败:', err);
          emitter.emit('notification', {
            type: 'error',
            message: '复制失败，请手动复制'
          });
        });
    };
    
    // 删除单条历史记录
    const deleteHistory = (id) => {
      try {
        tagLibrary.removeHistoryItem(id);
        loadHistory(); // 重新加载历史记录
        
        emitter.emit('notification', {
          type: 'success',
          message: '历史记录已删除'
        });
      } catch (error) {
        console.error('删除历史记录失败:', error);
        emitter.emit('notification', {
          type: 'error',
          message: '删除历史记录失败'
        });
      }
    };
    
    // 清空所有历史记录
    const clearAllHistory = () => {
      if (confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
        try {
          tagLibrary.clearHistory();
          historyItems.value = [];
          
          emitter.emit('notification', {
            type: 'success',
            message: '所有历史记录已清空'
          });
        } catch (error) {
          console.error('清空历史记录失败:', error);
          emitter.emit('notification', {
            type: 'error',
            message: '清空历史记录失败'
          });
        }
      }
    };
    
    // 初始加载和事件监听
    onMounted(() => {
      loadHistory();
      
      // 监听历史记录更新事件
      unsubscribeHistory = emitter.on('history-updated', () => {
        loadHistory();
      });
      
      // 监听抽签完成事件，立即更新历史记录
      unsubscribeTagsDrawn = emitter.on('tags-drawn', () => {
        loadHistory();
      });
      
      // 监听来自TagLibrary的CustomEvent
      const handleHistoryUpdated = () => loadHistory();
      window.addEventListener('history-updated', handleHistoryUpdated);
      
      // 记住清理函数
      customEventCleanup = () => {
        window.removeEventListener('history-updated', handleHistoryUpdated);
      };
    });
    
    // 清理事件监听
    let unsubscribeHistory;
    let unsubscribeTagsDrawn;
    let customEventCleanup;
    onBeforeUnmount(() => {
      if (unsubscribeHistory) unsubscribeHistory();
      if (unsubscribeTagsDrawn) unsubscribeTagsDrawn();
      if (customEventCleanup) customEventCleanup();
    });
    
    return {
      historyItems,
      formatTime,
      reuseHistory,
      copyHistoryTags,
      deleteHistory,
      clearAllHistory
    };
  }
});
</script>

<style scoped>
.history-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.empty-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  text-align: center;
}

.empty-history p {
  margin: 0.5rem 0;
  color: var(--text-color-light, #666);
}

.empty-history p:first-child {
  font-size: 1.1rem;
  font-weight: 500;
}

.empty-tip {
  font-size: 0.9rem;
  opacity: 0.7;
}

.empty-history::before {
  content: '📜';
  font-size: 3.5rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.history-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.25rem;
  background-color: var(--bg-color-light, #f8f9fa);
}

.history-header h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color, #333);
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.clear-all-btn {
  padding: 0.4rem 0.75rem;
  border: none;
  background-color: var(--bg-color, #f0f0f0);
  color: var(--text-color, #333);
  font-size: 0.85rem;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.clear-all-btn::before {
  content: '🗑️';
  font-size: 0.85rem;
}

.clear-all-btn:hover {
  background-color: var(--danger-color-light, #ffebee);
  color: var(--danger-color, #f44336);
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-item {
  background-color: var(--bg-color-light, #f8f9fa);
  border-radius: var(--border-radius-small, 8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.2s;
  border-left: 3px solid var(--accent-color, #42b883);
}

.history-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.history-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: var(--bg-color, #f0f0f0);
  border-bottom: 1px solid var(--border-color-light, rgba(0, 0, 0, 0.05));
}

.history-time {
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
  font-weight: 500;
}

.history-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.35rem;
  border-radius: 4px;
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition: all 0.2s;
}

.action-btn:hover {
  background-color: var(--bg-color-light, #f5f5f5);
}

.reuse-btn:hover {
  color: var(--primary-color, #2196F3);
}

.copy-btn:hover {
  color: var(--success-color, #4caf50);
}

.delete-btn:hover {
  color: var(--danger-color, #f44336);
}

.btn-icon {
  font-size: 1rem;
}

.btn-text {
  font-size: 0.85rem;
}

.history-tags {
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.history-tag {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag-category {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--primary-color, #2196F3);
  background-color: var(--primary-color-light, #e3f2fd);
  padding: 0.15rem 0.5rem;
  border-radius: 100px;
}

.tag-content {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-color, #333);
}

.tag-subtitle {
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
  font-style: italic;
}

.history-options {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-top: 1px solid var(--border-color, #eee);
  padding-top: 12px;
  margin-top: 4px;
}

.option-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-color-light, #777);
  margin-bottom: 4px;
}

.option-values {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--text-color, #333);
  background-color: var(--bg-color, #fff);
  padding: 4px 8px;
  border-radius: var(--border-radius-small, 4px);
  border: 1px solid var(--border-color, #eee);
}

.option-icon {
  font-size: 0.9rem;
}

/* 深色模式 */
:global(.dark-mode) .empty-history p {
  color: var(--text-color-light-dark, #aaa);
}

:global(.dark-mode) .history-header {
  background-color: var(--bg-color-light-dark, #2a2a2a);
}

:global(.dark-mode) .history-header h3 {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .clear-all-btn {
  background-color: var(--bg-color-dark, #333);
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .clear-all-btn:hover {
  background-color: rgba(244, 67, 54, 0.2);
  color: var(--danger-color-light, #ff8a80);
}

:global(.dark-mode) .history-item {
  background-color: var(--bg-color-light-dark, #2a2a2a);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

:global(.dark-mode) .history-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

:global(.dark-mode) .history-meta {
  background-color: var(--bg-color-dark, #222);
  border-color: var(--border-color-dark, rgba(255, 255, 255, 0.05));
}

:global(.dark-mode) .history-time {
  color: var(--text-color-light-dark, #aaa);
}

:global(.dark-mode) .action-btn {
  color: var(--text-color-light-dark, #aaa);
}

:global(.dark-mode) .action-btn:hover {
  background-color: var(--bg-color-dark, #333);
}

:global(.dark-mode) .tag-category {
  background-color: rgba(33, 150, 243, 0.15);
}

:global(.dark-mode) .tag-content {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .tag-subtitle {
  color: var(--text-color-light-dark, #aaa);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .history-header {
    padding: 0.5rem 1rem;
  }
  
  .history-list {
    padding: 0.75rem;
    gap: 0.75rem;
  }
  
  .btn-text {
    display: none;
  }
  
  .action-btn {
    padding: 0.25rem;
  }
  
  .tag-content {
    font-size: 0.95rem;
  }
}
</style> 