<template>
  <div class="drawer-panel">
    <div class="drawer-settings-panel">
      <drawer-form @draw-completed="handleDrawCompleted" />
    </div>
    
    <div class="drawer-results-panel">
      <drawer-results :drawn-tags="drawnTags" />
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue';
import DrawerForm from './form/DrawerForm.vue';
import DrawerResults from './results/DrawerResults.vue';

export default defineComponent({
  name: 'DrawerPanel',
  components: {
    DrawerForm,
    DrawerResults
  },
  setup() {
    const drawnTags = ref([]);
    
    const handleDrawCompleted = (tags) => {
      drawnTags.value = tags;
    };
    
    return {
      drawnTags,
      handleDrawCompleted
    };
  }
});
</script>

<style scoped>
.drawer-panel {
  display: flex;
  height: 100%;
  gap: 2rem;
  padding: 1.5rem;
  background-color: var(--bg-color, #f8f8f8);
  border-radius: var(--border-radius-large, 16px);
}

.drawer-settings-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.drawer-results-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; /* 防止内容溢出 */
}

/* 深色模式 */
:global(.dark-mode) .drawer-panel {
  background-color: var(--bg-color-dark, #121212);
}

/* 响应式设计 */
@media (max-width: 992px) {
  .drawer-settings-panel {
    max-width: 320px;
  }
}

@media (max-width: 768px) {
  .drawer-panel {
    flex-direction: column;
    padding: 1rem;
    gap: 1.5rem;
  }
  
  .drawer-settings-panel {
    flex: none;
    max-width: none;
    width: 100%;
    margin-bottom: 1.5rem;
  }
  
  .drawer-results-panel {
    flex: none;
    width: 100%;
    min-height: 350px;
  }
}
</style> 