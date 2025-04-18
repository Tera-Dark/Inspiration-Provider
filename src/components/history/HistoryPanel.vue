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
              <div class="tag-header">
                <span class="tag-category">{{ tag.category }}</span>
              </div>
              <div class="tag-body">
                <span class="tag-content">{{ tag.content }}</span>
                <span v-if="tag.subTitles && tag.subTitles.length > 0" class="tag-subtitle">
                  {{ tag.subTitles.join(' / ') }}
                </span>
              </div>
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
        console.log('HistoryPanel: 开始加载历史记录');
        const history = tagLibrary.getHistory();
        console.log('HistoryPanel: 从TagLibrary获取到历史记录数量:', history?.length || 0);
        
        if (Array.isArray(history)) {
          historyItems.value = history;
          console.log('HistoryPanel: 历史记录加载成功，数量:', historyItems.value.length);
          
          // 检查历史记录数据的有效性
          if (history.length > 0) {
            const sampleItem = history[0];
            console.log('HistoryPanel: 历史记录示例项:', JSON.stringify(sampleItem).substring(0, 200) + '...');
          }
        } else {
          console.error('HistoryPanel: 获取到的历史记录不是数组');
          historyItems.value = [];
        }
      } catch (error) {
        console.error('HistoryPanel: 加载历史记录失败:', error);
        historyItems.value = [];
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
      console.log('HistoryPanel: 组件挂载');
      // 立即加载历史记录
      setTimeout(() => {
        console.log('HistoryPanel: 延迟加载历史记录');
        loadHistory();
      }, 500); // 延迟加载以确保TagLibrary已初始化
      
      // 监听历史记录更新事件
      unsubscribeHistory = emitter.on('history-updated', () => {
        console.log('HistoryPanel: 收到history-updated事件');
        loadHistory();
      });
      
      // 监听抽签完成事件，立即更新历史记录
      unsubscribeTagsDrawn = emitter.on('tags-drawn', () => {
        console.log('HistoryPanel: 收到tags-drawn事件');
        setTimeout(() => {
          console.log('HistoryPanel: 延迟响应tags-drawn事件，开始加载历史记录');
          loadHistory();
        }, 200); // 延迟200ms加载，确保历史记录已保存
      });
      
      // 监听来自TagLibrary的CustomEvent
      const handleHistoryUpdated = () => {
        console.log('HistoryPanel: 收到history-updated自定义事件');
        setTimeout(() => {
          console.log('HistoryPanel: 延迟响应CustomEvent，开始加载历史记录');
          loadHistory();
        }, 200);
      };
      window.addEventListener('history-updated', handleHistoryUpdated);
      
      // 每隔30秒自动刷新一次历史记录，确保数据同步
      const autoRefreshInterval = setInterval(() => {
        console.log('HistoryPanel: 触发自动刷新历史记录');
        loadHistory();
      }, 30000);
      
      // 记住清理函数
      customEventCleanup = () => {
        console.log('HistoryPanel: 清理事件监听');
        window.removeEventListener('history-updated', handleHistoryUpdated);
        clearInterval(autoRefreshInterval);
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
  height: auto;
  display: block;
  overflow: visible;
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
  display: block;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color-light, #eee);
  flex-shrink: 0;
}

.history-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
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
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 0.75rem;
  padding: 0.75rem;
  overflow-y: auto;
  max-height: 80vh;
}

.history-item {
  border: 1px solid var(--border-color-light, #eee);
  border-radius: 8px;
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  background-color: var(--bg-color-light, #f8f8f8);
  transition: transform 0.2s, box-shadow 0.2s;
  height: fit-content;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.history-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.history-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.history-time {
  font-size: 0.8rem;
  color: var(--text-color-light, #666);
}

.history-actions {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
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
  overflow: hidden;
}

.history-tag {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  word-break: break-word;
  width: 100%;
  margin-bottom: 0.5rem;
  background-color: var(--bg-color-light, #f0f0f0);
  border-radius: 6px;
  overflow: hidden;
}

.tag-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.tag-body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem 0.5rem 0.5rem;
}

.tag-category {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--primary-color, #2196F3);
  background-color: var(--primary-bg-light, rgba(33, 150, 243, 0.1));
  padding: 0.2rem 0.6rem;
  border-radius: 0;
  width: 100%;
  display: block;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.tag-content {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-color, #333);
  overflow-wrap: break-word;
  max-width: 100%;
  line-height: 1.4;
  padding: 0 0.25rem;
}

.tag-subtitle {
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
  font-style: italic;
  overflow-wrap: break-word;
  max-width: 100%;
  line-height: 1.3;
  padding: 0 0.25rem;
}

.history-options {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-top: 1px solid var(--border-color, #eee);
  padding-top: 12px;
  margin-top: 4px;
  overflow: hidden;
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
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

:global(.dark-mode) .history-tag {
  background-color: var(--bg-color-dark, #222);
}

:global(.dark-mode) .tag-category {
  background-color: var(--primary-bg-dark, rgba(33, 150, 243, 0.15));
  border-bottom-color: rgba(255, 255, 255, 0.05);
}

:global(.dark-mode) .tag-content {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .tag-subtitle {
  color: var(--text-color-light-dark, #aaa);
}

/* 移动端优化 */
@media (max-width: 768px) {
  .history-header {
    padding: 0.5rem 0.75rem;
  }
  
  .history-list {
    display: flex;
    flex-direction: column;
    padding: 0.5rem;
    gap: 0.75rem;
  }
  
  .history-item {
    padding: 0.75rem;
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
  
  .option-item {
    white-space: normal;
    word-break: break-word;
  }
  
  .history-tags {
    padding: 0.5rem 0.75rem;
  }
  
  .tag-category {
    font-size: 0.7rem;
    padding: 0.1rem 0.4rem;
  }
}

/* 中等屏幕优化 */
@media (min-width: 769px) and (max-width: 991px) {
  .history-list {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
  
  .history-item {
    padding: 0.75rem;
  }
}

/* 更大屏幕优化 */
@media (min-width: 992px) {
  .history-list {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1rem;
  }
  
  .history-item {
    padding: 1rem;
  }
}

/* 超大屏幕优化 */
@media (min-width: 1400px) {
  .history-list {
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 1.25rem;
  }
}
</style> 