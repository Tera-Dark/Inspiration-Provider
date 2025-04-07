<template>
  <div class="tag-library-panel">
    <div class="panel-header">
      <h2 class="panel-title">Tag库管理</h2>
    </div>
    
    <div class="tab-container">
      <div class="tab-buttons">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'import' }"
          @click="activeTab = 'import'"
        >导入</button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'manage' }"
          @click="activeTab = 'manage'"
        >管理</button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'preview' }"
          @click="activeTab = 'preview'"
        >预览</button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'editor' }"
          @click="activeTab = 'editor'"
        >在线编辑</button>
      </div>
      
      <!-- 导入标签库 -->
      <div class="tab-content" :class="{ active: activeTab === 'import' }">
        <ImportPanel 
          :libraries="libraries"
          @library-updated="loadLibraries"
        />
      </div>
      
      <!-- 管理标签库 -->
      <div class="tab-content" :class="{ active: activeTab === 'manage' }">
        <ManagePanel 
          :libraries="libraries"
          :current-library="currentLibrary"
          @library-updated="loadLibraries"
          @switch-library="switchLibrary"
        />
        
        <!-- 高级编辑器 -->
        <div class="section">
          <div class="section-header">
            <h3 class="section-title">高级编辑器</h3>
          </div>
          <div class="section-content">
            <p class="description">使用高级编辑器可以直接编辑标签库的JSON结构或文本形式</p>
            <button @click="openAdvancedEditor" class="primary-button">打开高级编辑器</button>
          </div>
        </div>
      </div>
      
      <!-- 预览标签库 -->
      <div class="tab-content" :class="{ active: activeTab === 'preview' }">
        <PreviewPanel :current-library="currentLibrary" />
      </div>
      
      <!-- 在线编辑器 -->
      <div class="tab-content" :class="{ active: activeTab === 'editor' }">
        <EditorPanel 
          :libraries="libraries" 
          :current-library="currentLibrary"
          @library-updated="loadLibraries"
        />
      </div>
    </div>
  </div>
  
  <!-- 高级编辑器组件 -->
  <AdvancedEditor 
    v-if="showAdvancedEditor" 
    :show="showAdvancedEditor"
    @close="showAdvancedEditor = false"
  />
</template>

<script>
import { defineComponent, ref, inject, onMounted, watch } from 'vue';
import { ImportPanel, ManagePanel, PreviewPanel, EditorPanel } from '@/components/tag-library';
import AdvancedEditor from './advanced-editor/AdvancedEditor.vue';

export default defineComponent({
  name: 'TagLibraryPanel',
  components: {
    ImportPanel,
    ManagePanel,
    PreviewPanel,
    EditorPanel,
    AdvancedEditor
  },
  setup() {
    const tagLibrary = inject('tagLibrary');
    const emitter = inject('emitter');
    
    // 标签库信息
    const libraries = ref([]);
    const currentLibrary = ref('');
    
    // 页签管理
    const activeTab = ref('manage');
    
    // 高级编辑器状态
    const showAdvancedEditor = ref(false);
    
    // 加载所有标签库
    const loadLibraries = () => {
      try {
        const libNames = tagLibrary.getLibraryNames ? tagLibrary.getLibraryNames() : [];
        
        // 准备库信息列表
        libraries.value = libNames.map(name => {
          const count = tagLibrary.getTagCountByLibrary ? tagLibrary.getTagCountByLibrary(name) :
                        (tagLibrary.getAllTags ? tagLibrary.getAllTags(name).length : 0);
          
          return {
            name,
            count
          };
        });
        
        // 如果当前没有选中的库，或者选中的库已被删除，设置第一个库为当前库
        if (!currentLibrary.value || !libraries.value.some(lib => lib.name === currentLibrary.value)) {
          if (libraries.value.length > 0) {
            currentLibrary.value = libraries.value[0].name;
          } else {
            currentLibrary.value = '';
          }
        }
      } catch (error) {
        console.error('加载标签库列表失败:', error);
        emitter.emit('notification', {
          type: 'error',
          message: `加载标签库列表失败: ${error.message}`
        });
      }
    };
    
    // 切换当前选中的库
    const switchLibrary = (name) => {
      if (name && name !== currentLibrary.value) {
        currentLibrary.value = name;
        
        // 通知标签库已切换
        emitter.emit('libraryChanged', name);
      }
    };
    
    // 打开高级编辑器
    const openAdvancedEditor = () => {
      showAdvancedEditor.value = true;
    };
    
    // 生命周期钩子
    onMounted(() => {
      loadLibraries();
      
      // 监听标签库更新
      emitter.on('tagLibraryUpdated', () => {
        loadLibraries();
      });
    });
    
    // 监听标签页切换
    watch(activeTab, (newValue) => {
      console.log(`切换到 ${newValue} 标签页`);
    });
    
    return {
      libraries,
      currentLibrary,
      activeTab,
      
      loadLibraries,
      switchLibrary,
      showAdvancedEditor,
      openAdvancedEditor
    };
  }
});
</script>

<style scoped>
.tag-library-panel {
  background-color: var(--panel-bg-color, #ffffff);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border-color, #eee);
}

.panel-title {
  color: var(--text-color, #333);
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.tab-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tab-buttons {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border-color-light, #eee);
  gap: 5px;
}

.tab-btn {
  padding: 10px 20px;
  background: none;
  border: none;
  border-radius: 6px 6px 0 0;
  border-bottom: 2px solid transparent;
  color: var(--text-color-light, #666);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-btn.active {
  color: var(--primary-color, #1677ff);
  border-bottom-color: var(--primary-color, #1677ff);
  background-color: rgba(22, 119, 255, 0.05);
}

.tab-btn:hover:not(.active) {
  color: var(--text-color-dark, #333);
  background-color: rgba(0, 0, 0, 0.03);
}

.tab-content {
  display: none;
  flex: 1;
  overflow-y: auto;
  transition: opacity 0.3s ease;
  opacity: 0;
}

.tab-content.active {
  display: block;
  opacity: 1;
  animation: fadeIn 0.3s forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.section {
  background-color: var(--section-bg-color, #f9f9f9);
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.section-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color-light, #eee);
  background-color: var(--section-header-bg, rgba(0, 0, 0, 0.02));
}

.section-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-color, #333);
}

.section-content {
  padding: 16px;
}

.description {
  color: var(--text-color-light, #666);
  margin-bottom: 15px;
  font-size: 0.9rem;
}

/* 按钮样式 */
.primary-button {
  background-color: var(--primary-color, #1677ff);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.primary-button:hover {
  background-color: var(--primary-hover-color, #4096ff);
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.primary-button:active {
  transform: translateY(0);
}

.secondary-button {
  background-color: var(--secondary-bg-color, #f0f0f0);
  color: var(--text-color, #333);
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.secondary-button:hover {
  background-color: var(--secondary-hover-color, #e6e6e6);
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.secondary-button:active {
  transform: translateY(0);
}

/* 暗模式适配 */
@media (prefers-color-scheme: dark) {
  .tag-library-panel {
    background-color: var(--panel-bg-color-dark, #1e1e1e);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  
  .panel-header {
    border-bottom-color: var(--border-color-dark, #333);
  }
  
  .panel-title {
    color: var(--text-color-dark, #fff);
  }
  
  .tab-buttons {
    border-bottom-color: var(--border-color-dark, #333);
  }
  
  .tab-btn {
    color: var(--text-color-light-dark, #aaa);
  }
  
  .tab-btn.active {
    background-color: rgba(22, 119, 255, 0.15);
  }
  
  .tab-btn:hover:not(.active) {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .section {
    background-color: var(--section-bg-color-dark, #252525);
  }
  
  .section-header {
    background-color: var(--section-header-bg-dark, rgba(255, 255, 255, 0.03));
    border-bottom-color: var(--border-color-dark, #333);
  }
  
  .section-title {
    color: var(--text-color-dark, #eee);
  }
  
  .description {
    color: var(--text-color-light-dark, #aaa);
  }
  
  .secondary-button {
    background-color: var(--secondary-bg-color-dark, #2c2c2c);
    color: var(--text-color-dark, #eee);
    border-color: var(--border-color-dark, #444);
  }
  
  .secondary-button:hover {
    background-color: var(--secondary-hover-color-dark, #3c3c3c);
  }
}
</style> 