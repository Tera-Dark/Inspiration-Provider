<template>
  <div class="drawer-results">
    <div class="panel-header">
      <h3 class="panel-title">抽签结果</h3>
      <div v-if="drawnTags.length > 0" class="copy-buttons">
        <button 
          @click="copyResultTags(false)" 
          class="copy-button"
          title="复制全部结果"
        >
          <span class="button-icon">📋</span>
        </button>
        <button 
          @click="copyResultTags(true)" 
          class="copy-button"
          title="只复制内容"
        >
          <span class="button-icon">📝</span>
        </button>
      </div>
    </div>
    
    <div v-if="drawnTags.length === 0" class="empty-result">
      点击"抽签"按钮开始
    </div>
    
    <div v-else class="results-list">
      <div 
        v-for="(tag, index) in drawnTags" 
        :key="index"
        class="result-item"
        :style="{ animationDelay: `${index * 0.15}s` }"
      >
        <div class="result-category">{{ tag.category || '未分类' }}</div>
        <div class="result-content">{{ tag.content }}</div>
        <div v-if="tag.subTitles && tag.subTitles.length > 0" class="result-subtitle">
          {{ tag.subTitles.join(' / ') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, inject } from 'vue';

export default defineComponent({
  name: 'DrawerResults',
  props: {
    drawnTags: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const emitter = inject('emitter');
    
    // 复制抽签结果
    const copyResultTags = (contentOnly = false) => {
      if (!props.drawnTags || props.drawnTags.length === 0) return;
      
      let tagsText = '';
      
      if (contentOnly) {
        // 只复制内容部分，用英文逗号分隔
        tagsText = props.drawnTags.map(tag => tag.content).join(',');
      } else {
        // 复制完整格式，每行之间用英文逗号分隔
        tagsText = props.drawnTags.map(tag => {
          let text = `【${tag.category}】${tag.content}`;
          if (tag.subTitles && tag.subTitles.length > 0) {
            text += ` (${tag.subTitles.join(' / ')})`;
          }
          return text;
        }).join(',');
      }
      
      // 复制到剪贴板
      navigator.clipboard.writeText(tagsText)
        .then(() => {
          emitter.emit('notification', {
            type: 'success',
            message: contentOnly ? '已复制内容到剪贴板' : '已复制完整结果到剪贴板'
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
    
    return {
      copyResultTags
    };
  }
});
</script>

<style scoped>
.drawer-results {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--panel-bg-color, #ffffff);
  border-radius: var(--border-radius-medium, 12px);
  box-shadow: var(--shadow-medium, 0 6px 24px rgba(0, 0, 0, 0.12));
  overflow: hidden;
}

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

.copy-buttons {
  display: flex;
  gap: 0.5rem;
}

.copy-button {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.copy-button:hover {
  background-color: var(--hover-color, rgba(0, 0, 0, 0.05));
}

.button-icon {
  font-size: 1.25rem;
}

.empty-result {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color-light, #999);
  font-style: italic;
  padding: 2rem;
}

.results-list {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.result-item {
  background-color: var(--bg-color-light, #f8f8f8);
  border-radius: var(--border-radius-medium, 8px);
  padding: 1rem;
  animation: slide-in 0.3s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
  border: 1px solid var(--border-color-light, rgba(0, 0, 0, 0.07));
  transition: all 0.2s;
}

.result-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

@keyframes slide-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-category {
  font-size: 0.9rem;
  color: var(--primary-color, #2196F3);
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.result-content {
  font-size: 1.1rem;
  color: var(--text-color, #333);
  margin-bottom: 0.5rem;
  word-break: break-all;
}

.result-subtitle {
  font-size: 0.9rem;
  color: var(--text-color-light, #666);
  font-style: italic;
}

/* 深色模式适配 */
:global(.dark-mode) .drawer-results {
  background-color: var(--panel-bg-color-dark, #1f1f1f);
}

:global(.dark-mode) .panel-header {
  border-color: var(--border-color-dark, rgba(255, 255, 255, 0.08));
}

:global(.dark-mode) .panel-title {
  color: var(--text-color-dark, #f0f0f0);
}

:global(.dark-mode) .copy-button:hover {
  background-color: var(--hover-color-dark, rgba(255, 255, 255, 0.1));
}

:global(.dark-mode) .result-item {
  background-color: var(--bg-color-dark, #2a2a2a);
  border-color: var(--border-color-dark, rgba(255, 255, 255, 0.08));
}

:global(.dark-mode) .result-content {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .result-subtitle {
  color: var(--text-color-light-dark, #999);
}
</style> 