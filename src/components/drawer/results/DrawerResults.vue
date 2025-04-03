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
        <div class="result-category">{{ tag.category }}</div>
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
  padding: 1.25rem 1.5rem;
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
  gap: 0.75rem;
}

.copy-button {
  background-color: var(--bg-color-light, #f5f5f5);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.copy-button:hover {
  background-color: var(--primary-color-light, #e3f2fd);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.button-icon {
  font-size: 1.25rem;
  color: var(--text-color, #333);
}

.copy-button:hover .button-icon {
  color: var(--primary-color, #2196F3);
}

.empty-result {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  font-size: 1.1rem;
  color: var(--text-color-light, #666);
  text-align: center;
  background-image: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.02));
}

.empty-result::before {
  content: '🎯';
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.5;
}

.results-list {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.result-item {
  background-color: var(--bg-color-light, #f8f9fa);
  border-radius: var(--border-radius-medium, 12px);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  animation: fadeInUp 0.6s ease forwards;
  opacity: 0;
  transform: translateY(20px);
  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.05);
  border-left: 4px solid var(--primary-color, #2196F3);
  transition: all 0.3s ease;
  height: fit-content;
}

.result-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.08);
}

.result-category {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--primary-color, #2196F3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: inline-block;
  padding: 0.15rem 0.5rem;
  background-color: var(--primary-color-light, #e3f2fd);
  border-radius: 100px;
  align-self: flex-start;
}

.result-content {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color, #333);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-subtitle {
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
  font-style: italic;
  background-color: var(--bg-color, #f0f0f0);
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  align-self: flex-start;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 深色模式 */
:global(.dark-mode) .drawer-results {
  background-color: var(--panel-bg-color-dark, #1e1e1e);
  box-shadow: var(--shadow-medium-dark, 0 6px 24px rgba(0, 0, 0, 0.25));
}

:global(.dark-mode) .panel-header {
  border-color: var(--border-color-dark, rgba(255, 255, 255, 0.08));
}

:global(.dark-mode) .panel-title {
  color: var(--text-color-dark, #f0f0f0);
}

:global(.dark-mode) .copy-button {
  background-color: var(--bg-color-light-dark, #2c2c2c);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

:global(.dark-mode) .copy-button:hover {
  background-color: var(--primary-color-dark, #1565c0);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

:global(.dark-mode) .button-icon {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .copy-button:hover .button-icon {
  color: white;
}

:global(.dark-mode) .empty-result {
  color: var(--text-color-light-dark, #aaa);
  background-image: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.02));
}

:global(.dark-mode) .result-item {
  background-color: var(--bg-color-light-dark, #2a2a2a);
  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.15);
  border-left-color: var(--primary-color, #2196F3);
}

:global(.dark-mode) .result-item:hover {
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.25);
}

:global(.dark-mode) .result-category {
  color: var(--primary-color, #2196F3);
  background-color: rgba(33, 150, 243, 0.15);
}

:global(.dark-mode) .result-content {
  color: var(--text-color-dark, #f0f0f0);
}

:global(.dark-mode) .result-subtitle {
  color: var(--text-color-light-dark, #bbb);
  background-color: var(--bg-color-dark, #222);
}

/* 响应式适配 */
@media (max-width: 992px) {
  .results-list {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

@media (max-width: 768px) {
  .panel-header {
    padding: 1rem;
  }
  
  .panel-title {
    font-size: 1.1rem;
  }
  
  .copy-button {
    width: 36px;
    height: 36px;
  }
  
  .results-list {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    padding: 1rem;
    gap: 0.75rem;
  }
  
  .result-item {
    padding: 0.75rem;
  }
  
  .result-content {
    font-size: 1rem;
  }
}
</style> 