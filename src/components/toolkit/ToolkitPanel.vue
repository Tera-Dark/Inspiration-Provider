<template>
  <div class="toolkit-panel">
    <div class="section-header">
      <h3 class="panel-title">扩展工具箱</h3>
      <div class="toolkit-description">集成多种辅助创作的实用工具</div>
    </div>
    
    <div class="toolkit-content">
      <div class="toolkit-grid">
        <div v-for="(tool, index) in tools" :key="index" class="tool-card" @click="activateTool(tool)">
          <div class="tool-icon">{{ tool.icon }}</div>
          <div class="tool-info">
            <h4 class="tool-title">{{ tool.name }}</h4>
            <div class="tool-description">{{ tool.description }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 工具面板容器，激活工具时显示 -->
    <div v-if="activeToolComponent" class="active-tool-container">
      <div class="active-tool-header">
        <h3>{{ activeTool.name }}</h3>
        <button class="close-button" @click="closeActiveTool">×</button>
      </div>
      <component :is="activeToolComponent"></component>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, markRaw } from 'vue';
import WeightAdder from './weight-adder/WeightAdder.vue';

export default defineComponent({
  name: 'ToolkitPanel',
  components: {
    WeightAdder
  },
  setup() {
    const tools = ref([
      {
        name: '权重添加器',
        description: '生成AI画师权重组合，快速创建绘画风格提示词',
        icon: '🎨',
        component: markRaw(WeightAdder)
      }
      // 可以在这里添加更多工具
    ]);
    
    const activeTool = ref(null);
    const activeToolComponent = ref(null);
    
    const activateTool = (tool) => {
      activeTool.value = tool;
      activeToolComponent.value = tool.component;
    };
    
    const closeActiveTool = () => {
      activeTool.value = null;
      activeToolComponent.value = null;
    };
    
    return {
      tools,
      activeTool,
      activeToolComponent,
      activateTool,
      closeActiveTool
    };
  }
});
</script>

<style scoped>
.toolkit-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--bg-color, #fff);
  border-radius: var(--border-radius-medium, 8px);
  box-shadow: var(--shadow-small, 0 2px 8px rgba(0, 0, 0, 0.1));
  overflow: hidden;
  position: relative;
}

.section-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color, #eee);
  display: flex;
  flex-direction: column;
}

.toolkit-description {
  font-size: 0.9rem;
  color: var(--text-color-light, #666);
  margin-top: 0.3rem;
}

.panel-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-color, #333);
  position: relative;
  padding-left: 0.5rem;
}

.panel-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 1.2em;
  background-color: var(--accent-color, #42b883);
  border-radius: 2px;
}

.toolkit-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.toolkit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem;
}

.tool-card {
  background-color: var(--card-bg-color, #fff);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid var(--border-color, #eee);
}

.tool-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.tool-icon {
  font-size: 2.2rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  width: 60px;
  background-color: var(--primary-color-light, #e6f4ff);
  border-radius: 12px;
  color: var(--primary-color, #1677ff);
}

.tool-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.tool-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: var(--text-color, #333);
}

.tool-description {
  font-size: 0.9rem;
  color: var(--text-color-light, #666);
  line-height: 1.5;
}

.active-tool-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-color, #fff);
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.active-tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color, #eee);
}

.active-tool-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-color-light, #666);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: var(--hover-color, #f0f0f0);
  color: var(--text-color, #333);
}

/* 深色模式样式 */
:global(.dark-mode) .tool-card {
  background-color: var(--card-bg-color-dark, #2a2a2a);
  border-color: var(--border-color-dark, #444);
}

:global(.dark-mode) .tool-icon {
  background-color: var(--primary-color-dark, #177ddc);
  color: #fff;
}
</style> 