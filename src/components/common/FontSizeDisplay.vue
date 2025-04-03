<template>
  <div class="font-size-display">
    <div class="font-size-label">字体大小</div>
    <div class="font-size-value" :style="{ fontSize: fontSize + 'px' }">{{ fontSize }}px</div>
    <div class="font-size-description">调整应用的整体字体大小 (12-20像素)</div>
  </div>
</template>

<script>
import { defineComponent, ref, inject, onMounted, onUnmounted } from 'vue';

export default defineComponent({
  name: 'FontSizeDisplay',
  
  setup() {
    const emitter = inject('emitter');
    const fontSize = ref(16); // 默认值
    
    // 更新字体大小显示
    const updateFontSize = (newSize) => {
      fontSize.value = parseInt(newSize);
    };
    
    onMounted(() => {
      // 从存储中读取初始字体大小
      const savedFontSize = localStorage.getItem('user_font_size');
      if (savedFontSize) {
        fontSize.value = parseInt(savedFontSize);
      }
      
      // 监听字体大小变更事件
      emitter.on('font-size-changed', updateFontSize);
    });
    
    onUnmounted(() => {
      // 清理事件监听器
      emitter.off('font-size-changed', updateFontSize);
    });
    
    return {
      fontSize
    };
  }
});
</script>

<style scoped>
.font-size-display {
  background-color: var(--panel-bg-color, #ffffff);
  border-radius: var(--border-radius-medium, 8px);
  padding: 1rem;
  box-shadow: var(--shadow-small, 0 2px 6px rgba(0, 0, 0, 0.05));
  text-align: center;
}

.font-size-label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-color, #333);
}

.font-size-value {
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--primary-color, #2196F3);
}

.font-size-description {
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
}

/* 深色模式 */
:global(.dark-mode) .font-size-display {
  background-color: var(--panel-bg-color-dark, #1f1f1f);
}

:global(.dark-mode) .font-size-label {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .font-size-value {
  color: var(--primary-color-light-dark, #177ddc);
}

:global(.dark-mode) .font-size-description {
  color: var(--text-color-light-dark, #999);
}
</style> 