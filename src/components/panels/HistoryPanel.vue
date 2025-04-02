<template>
  <div class="history-panel">
    <div v-if="historyItems.length === 0" class="empty-history">
      <p>暂无抽签历史记录</p>
      <p class="empty-tip">抽签后的结果将自动保存在这里</p>
    </div>
    
    <div v-else class="history-content">
      <div class="history-header">
        <h3>历史记录</h3>
        <button @click="clearAllHistory" class="clear-all-btn">
          清空全部
        </button>
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
              <button @click="reuseHistory(item)" class="reuse-btn" title="重新使用">
                <span>重用</span>
              </button>
              <button @click="deleteHistory(item.id)" class="delete-btn" title="删除">
                <span>删除</span>
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
            <span class="option-label">抽取选项: </span>
            <span class="option-value">
              数量: {{ item.options.count }} | 
              分类: {{ item.options.category || '全部' }} | 
              排除重复: {{ item.options.noDuplicates ? '是' : '否' }}
            </span>
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
    const historyItems = ref([]);
    
    // 加载历史记录
    const loadHistory = () => {
      try {
        const savedHistory = localStorage.getItem('tagHistory');
        if (savedHistory) {
          historyItems.value = JSON.parse(savedHistory);
        }
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
    
    // 删除单条历史记录
    const deleteHistory = (id) => {
      try {
        // 过滤掉要删除的项目
        const updatedHistory = historyItems.value.filter(item => item.id !== id);
        historyItems.value = updatedHistory;
        
        // 更新本地存储
        localStorage.setItem('tagHistory', JSON.stringify(updatedHistory));
        
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
          historyItems.value = [];
          localStorage.setItem('tagHistory', JSON.stringify([]));
          
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
    });
    
    // 清理事件监听
    let unsubscribeHistory;
    onBeforeUnmount(() => {
      if (unsubscribeHistory) unsubscribeHistory();
    });
    
    return {
      historyItems,
      formatTime,
      reuseHistory,
      deleteHistory,
      clearAllHistory
    };
  }
});
</script>

<style scoped>
.history-panel {
  background-color: var(--panel-bg-color, #ffffff);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.empty-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-color-light, #999);
  text-align: center;
  padding: 40px 0;
}

.empty-history p {
  margin: 8px 0;
}

.empty-tip {
  font-size: 0.9rem;
  opacity: 0.8;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color, #eee);
}

.history-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-color, #333);
}

.clear-all-btn {
  background-color: transparent;
  border: none;
  color: var(--danger-color, #ff4d4f);
  font-size: 0.85rem;
  cursor: pointer;
  transition: opacity 0.3s;
  padding: 4px 8px;
  border-radius: 4px;
}

.clear-all-btn:hover {
  background-color: rgba(255, 77, 79, 0.1);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-item {
  border: 1px solid var(--border-color, #eee);
  border-radius: 6px;
  padding: 12px;
  background-color: var(--bg-color-light, #f9f9f9);
  transition: transform 0.2s, box-shadow 0.2s;
}

.history-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.history-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.history-time {
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
}

.history-actions {
  display: flex;
  gap: 8px;
}

.reuse-btn, .delete-btn {
  border: none;
  background-color: transparent;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 4px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background-color 0.3s;
}

.reuse-btn {
  color: var(--primary-color, #1677ff);
}

.reuse-btn:hover {
  background-color: rgba(22, 119, 255, 0.1);
}

.delete-btn {
  color: var(--danger-color, #ff4d4f);
}

.delete-btn:hover {
  background-color: rgba(255, 77, 79, 0.1);
}

.history-tags {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  padding: 12px;
  background-color: var(--panel-bg-color, #fff);
  border-radius: 4px;
  border-left: 3px solid var(--primary-color, #1677ff);
}

.history-tag {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  padding: 4px 0;
}

.tag-category {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--primary-color, #1677ff);
  background-color: var(--primary-color-light, #e6f4ff);
  padding: 2px 6px;
  border-radius: 4px;
}

.tag-content {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-color, #333);
}

.tag-subtitle {
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
  font-style: italic;
}

.history-options {
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
  margin-top: 8px;
}

.option-label {
  font-weight: 500;
}

.option-value {
  color: var(--text-color-light, #666);
}

/* 深色模式样式 */
:global(.dark-mode) .history-panel {
  background-color: var(--panel-bg-color-dark, #1f1f1f);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

:global(.dark-mode) .history-header h3 {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .history-header {
  border-bottom-color: var(--border-color-dark, #333);
}

:global(.dark-mode) .empty-history {
  color: var(--text-color-light-dark, #999);
}

:global(.dark-mode) .history-item {
  background-color: var(--bg-color-light-dark, #2c2c2c);
  border-color: var(--border-color-dark, #333);
}

:global(.dark-mode) .history-time {
  color: var(--text-color-light-dark, #999);
}

:global(.dark-mode) .history-tags {
  background-color: var(--panel-bg-color-dark, #1f1f1f);
}

:global(.dark-mode) .tag-content {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .tag-subtitle {
  color: var(--text-color-light-dark, #999);
}

:global(.dark-mode) .history-options,
:global(.dark-mode) .option-value {
  color: var(--text-color-light-dark, #999);
}

:global(.dark-mode) .clear-all-btn:hover {
  background-color: rgba(255, 77, 79, 0.2);
}

:global(.dark-mode) .reuse-btn:hover {
  background-color: rgba(22, 119, 255, 0.2);
}

:global(.dark-mode) .delete-btn:hover {
  background-color: rgba(255, 77, 79, 0.2);
}

@media (max-width: 768px) {
  .history-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .history-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style> 