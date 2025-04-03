<template>
  <div class="panel">
    <h2>Tag库管理</h2>
    
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
          <h3>高级编辑器</h3>
          <div class="form-group">
            <p class="description">使用高级编辑器可以直接编辑标签库的JSON结构或文本形式</p>
            <button @click="openAdvancedEditor" class="btn primary-btn">打开高级编辑器</button>
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
.panel {
  background-color: var(--panel-bg-color, #ffffff);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 25px;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel h2 {
  color: var(--text-color, #333);
  margin-top: 0;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border-color, #eee);
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
}

.tab-btn {
  padding: 10px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-color-light, #666);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-btn.active {
  color: var(--primary-color, #1677ff);
  border-bottom-color: var(--primary-color, #1677ff);
}

.tab-btn:hover:not(.active) {
  color: var(--text-color-dark, #333);
  border-bottom-color: var(--border-color, #ddd);
}

.tab-content {
  display: none;
  flex: 1;
  overflow-y: auto;
}

.tab-content.active {
  display: block;
}

.section {
  background-color: var(--panel-bg-color, #fff);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.section h3 {
  font-size: 1.1rem;
  margin-top: 0;
  margin-bottom: 14px;
  color: var(--text-color-dark, #333);
  font-weight: 600;
}

.form-group {
  margin-bottom: 15px;
}

.description {
  color: var(--text-color-light, #666);
  margin-bottom: 10px;
  font-size: 0.9rem;
}

.btn {
  display: inline-block;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  border: none;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.12);
}

.primary-btn {
  background-color: var(--primary-color, #1677ff);
  color: white;
}

.primary-btn:hover {
  background-color: var(--primary-hover-color, #0958d9);
}

/* 深色模式适配 */
:global(.dark-mode) .panel {
  background-color: var(--panel-bg-color-dark, #2d2d2d);
}

:global(.dark-mode) .panel h2 {
  color: var(--text-color-dark-mode, #e0e0e0);
  border-bottom-color: var(--border-color-dark-mode, #3d3d3d);
}

:global(.dark-mode) .tab-buttons {
  border-bottom-color: var(--border-color-dark-mode, #3d3d3d);
}

:global(.dark-mode) .tab-btn {
  color: var(--text-color-light-dark-mode, #aaa);
}

:global(.dark-mode) .tab-btn.active {
  color: var(--primary-color, #42a5f5);
  border-bottom-color: var(--primary-color, #42a5f5);
}

:global(.dark-mode) .tab-btn:hover:not(.active) {
  color: var(--text-color-dark-mode, #e0e0e0);
  border-bottom-color: var(--border-color-dark-mode, #4d4d4d);
}

:global(.dark-mode) .section {
  background-color: var(--bg-color-light-dark, #333333);
}

:global(.dark-mode) .section h3 {
  color: var(--text-color-dark-mode, #e0e0e0);
}

:global(.dark-mode) .description {
  color: var(--text-color-light-dark-mode, #aaa);
}
</style> 