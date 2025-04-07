<template>
  <div class="library-selector-container">
    <div class="selector-header" @click="toggleDropdown">
      <span class="current-library">{{ currentLibrary }}</span>
      <span class="dropdown-icon" :class="{ 'open': isOpen }">▼</span>
    </div>
    
    <div class="dropdown-menu" v-if="isOpen" :style="dropdownStyle">
      <div class="search-box" v-if="libraries.length > 5">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="搜索库..." 
          @click.stop
          ref="searchInput"
        />
        <span class="search-icon">🔍</span>
      </div>
      
      <div class="library-list" ref="libraryList">
        <div 
          v-for="library in filteredLibraries" 
          :key="library.name"
          class="library-item"
          :class="{ 'active': library.name === currentLibrary }"
          @click.stop="selectLibrary(library.name)"
        >
          <span class="library-name">{{ library.name }}</span>
          <span class="library-count">{{ library.count }}个标签</span>
        </div>
        
        <div class="empty-message" v-if="filteredLibraries.length === 0">
          未找到匹配的库
        </div>
      </div>
      
      <div class="recent-libraries" v-if="recentLibraries.length && !searchQuery">
        <div class="recent-header">最近使用</div>
        <div class="recent-items">
          <div 
            v-for="library in recentLibraries" 
            :key="library"
            class="recent-item"
            :class="{ 'active': library === currentLibrary }"
            @click.stop="selectLibrary(library)"
          >
            {{ library }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted, onBeforeUnmount, nextTick, inject } from 'vue';

export default defineComponent({
  name: 'LibrarySelector',
  props: {
    dropdownPosition: {
      type: String,
      default: 'bottom',
      validator: (value) => ['top', 'bottom', 'auto'].includes(value)
    },
    showCount: {
      type: Boolean,
      default: true
    }
  },
  emits: ['library-changed'],
  setup(props, { emit }) {
    const tagLibrary = inject('tagLibrary');
    const emitter = inject('emitter');
    
    const isOpen = ref(false);
    const searchQuery = ref('');
    const currentLibrary = ref('');
    const libraries = ref([]);
    const searchInput = ref(null);
    const libraryList = ref(null);
    const dropdownStyle = ref({});
    
    // 获取最近使用的库
    const recentLibraries = computed(() => {
      const recent = localStorage.getItem('recent_libraries');
      try {
        if (recent) {
          // 过滤掉当前选中的库
          return JSON.parse(recent).filter(lib => lib !== currentLibrary.value);
        }
      } catch (error) {
        console.error('解析最近使用的库时出错:', error);
      }
      return [];
    });
    
    // 过滤库列表
    const filteredLibraries = computed(() => {
      if (!searchQuery.value) return libraries.value;
      
      const query = searchQuery.value.toLowerCase();
      return libraries.value.filter(lib => 
        lib.name.toLowerCase().includes(query)
      );
    });
    
    // 加载所有库
    const loadLibraries = () => {
      try {
        if (tagLibrary && tagLibrary.getLibraryNames) {
          const libNames = tagLibrary.getLibraryNames();
          
          // 格式化库信息
          libraries.value = libNames.map(name => {
            const count = tagLibrary.getTagCountByLibrary ? 
                        tagLibrary.getTagCountByLibrary(name) :
                        (tagLibrary.getAllTags ? tagLibrary.getAllTags(name).length : 0);
            
            return {
              name,
              count
            };
          });
          
          // 如果当前没有选中的库，设置第一个库为当前库
          if (!currentLibrary.value && libraries.value.length > 0) {
            currentLibrary.value = tagLibrary.getCurrentLibraryName();
          }
        }
      } catch (error) {
        console.error('加载库列表失败:', error);
      }
    };
    
    // 切换下拉框
    const toggleDropdown = () => {
      isOpen.value = !isOpen.value;
      
      if (isOpen.value) {
        loadLibraries();
        calculateDropdownPosition();
        
        // 聚焦搜索框
        nextTick(() => {
          if (searchInput.value && libraries.value.length > 5) {
            searchInput.value.focus();
          }
        });
      }
    };
    
    // 关闭下拉框
    const closeDropdown = (event) => {
      // 检查点击是否在组件外部
      const selectorEl = event.target.closest('.library-selector-container');
      if (!selectorEl && isOpen.value) {
        isOpen.value = false;
        searchQuery.value = '';
      }
    };
    
    // 计算下拉框位置
    const calculateDropdownPosition = () => {
      const position = props.dropdownPosition;
      if (position === 'auto') {
        // 自动计算位置的逻辑
        // 这里可以根据视口位置来决定显示在上方还是下方
        dropdownStyle.value = {};
      } else if (position === 'top') {
        dropdownStyle.value = { 
          bottom: '100%',
          top: 'auto'
        };
      } else {
        // 默认显示在下方
        dropdownStyle.value = {};
      }
    };
    
    // 选择库
    const selectLibrary = (libraryName) => {
      if (libraryName === currentLibrary.value) {
        isOpen.value = false;
        return;
      }
      
      currentLibrary.value = libraryName;
      
      // 更新最近使用的库
      updateRecentLibraries(libraryName);
      
      // 切换当前库
      if (tagLibrary && tagLibrary.setCurrentLibrary) {
        tagLibrary.setCurrentLibrary(libraryName);
      }
      
      // 发出库变更事件
      emit('library-changed', libraryName);
      emitter.emit('library-changed', libraryName);
      
      // 关闭下拉框
      isOpen.value = false;
      searchQuery.value = '';
    };
    
    // 更新最近使用的库
    const updateRecentLibraries = (libraryName) => {
      try {
        let recent = localStorage.getItem('recent_libraries');
        let recentList = recent ? JSON.parse(recent) : [];
        
        // 从列表中移除当前库，然后放到第一位
        recentList = recentList.filter(lib => lib !== libraryName);
        recentList.unshift(libraryName);
        
        // 限制最多保存5个
        if (recentList.length > 5) {
          recentList = recentList.slice(0, 5);
        }
        
        localStorage.setItem('recent_libraries', JSON.stringify(recentList));
      } catch (error) {
        console.error('更新最近使用库失败:', error);
      }
    };
    
    // 监听全局库变更事件
    const handleGlobalLibraryChange = (libraryName) => {
      if (libraryName !== currentLibrary.value) {
        currentLibrary.value = libraryName;
      }
    };
    
    // 组件挂载时初始化
    onMounted(() => {
      // 添加点击事件监听以关闭下拉框
      document.addEventListener('click', closeDropdown);
      
      // 获取当前库
      if (tagLibrary && tagLibrary.getCurrentLibraryName) {
        currentLibrary.value = tagLibrary.getCurrentLibraryName();
      }
      
      // 监听全局库变更事件
      emitter.on('library-changed', handleGlobalLibraryChange);
      
      // 初始加载库
      loadLibraries();
    });
    
    // 组件卸载前清理
    onBeforeUnmount(() => {
      document.removeEventListener('click', closeDropdown);
      emitter.off('library-changed', handleGlobalLibraryChange);
    });
    
    // 当搜索条件变化时重新计算下拉框高度
    watch(filteredLibraries, () => {
      nextTick(() => {
        calculateDropdownPosition();
      });
    });
    
    return {
      isOpen,
      searchQuery,
      currentLibrary,
      libraries,
      filteredLibraries,
      recentLibraries,
      searchInput,
      libraryList,
      dropdownStyle,
      toggleDropdown,
      selectLibrary
    };
  }
});
</script>

<style scoped>
.library-selector-container {
  position: relative;
  width: 100%;
  max-width: 280px;
  user-select: none;
}

.selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--panel-bg-color, #fff);
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s;
  height: 38px;
}

.selector-header:hover {
  border-color: var(--primary-color, #1677ff);
}

.current-library {
  flex: 1;
  font-size: 0.95rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-color, #333);
}

.dropdown-icon {
  font-size: 0.8rem;
  margin-left: 8px;
  color: var(--text-color-light, #999);
  transition: transform 0.2s;
}

.dropdown-icon.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 5px;
  background: var(--panel-bg-color, #fff);
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  overflow: hidden;
  max-height: 350px;
  display: flex;
  flex-direction: column;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from { 
    opacity: 0;
    transform: translateY(-10px); 
  }
  to { 
    opacity: 1;
    transform: translateY(0); 
  }
}

.search-box {
  padding: 10px;
  border-bottom: 1px solid var(--border-color, #eee);
  position: relative;
}

.search-box input {
  width: 100%;
  padding: 8px 32px 8px 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.2s;
}

.search-box input:focus {
  border-color: var(--primary-color, #1677ff);
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.search-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-color-light, #999);
  pointer-events: none;
}

.library-list {
  overflow-y: auto;
  max-height: 250px;
  padding: 8px;
}

.library-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.library-item:hover {
  background-color: var(--hover-bg-color, rgba(0, 0, 0, 0.04));
}

.library-item.active {
  background-color: var(--primary-bg-light, rgba(24, 144, 255, 0.1));
  color: var(--primary-color, #1677ff);
}

.library-name {
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.library-count {
  font-size: 0.85rem;
  color: var(--text-color-light, #999);
  margin-left: 8px;
}

.empty-message {
  text-align: center;
  padding: 20px;
  color: var(--text-color-light, #999);
  font-style: italic;
}

.recent-libraries {
  border-top: 1px solid var(--border-color, #eee);
  padding: 8px;
}

.recent-header {
  font-size: 0.85rem;
  color: var(--text-color-light, #999);
  margin-bottom: 8px;
  padding: 0 4px;
}

.recent-items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.recent-item {
  padding: 5px 10px;
  background-color: var(--bg-color-light, #f5f5f5);
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.recent-item:hover {
  background-color: var(--hover-bg-color, rgba(0, 0, 0, 0.04));
}

.recent-item.active {
  background-color: var(--primary-bg-light, rgba(24, 144, 255, 0.1));
  color: var(--primary-color, #1677ff);
}

/* 滚动条样式 */
.library-list::-webkit-scrollbar {
  width: 6px;
}

.library-list::-webkit-scrollbar-track {
  background: transparent;
}

.library-list::-webkit-scrollbar-thumb {
  background: var(--border-color, #ddd);
  border-radius: 3px;
}

.library-list::-webkit-scrollbar-thumb:hover {
  background: var(--border-color-dark, #ccc);
}

/* 暗模式适配 */
@media (prefers-color-scheme: dark) {
  .selector-header {
    background: var(--panel-bg-color-dark, #1e1e1e);
    border-color: var(--border-color-dark, #444);
  }
  
  .current-library {
    color: var(--text-color-dark, #eee);
  }
  
  .dropdown-icon {
    color: var(--text-color-light-dark, #aaa);
  }
  
  .dropdown-menu {
    background: var(--panel-bg-color-dark, #1e1e1e);
    border-color: var(--border-color-dark, #444);
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.3);
  }
  
  .search-box {
    border-bottom-color: var(--border-color-dark, #444);
  }
  
  .search-box input {
    background-color: var(--input-bg-color-dark, #333);
    border-color: var(--border-color-dark, #555);
    color: var(--text-color-dark, #eee);
  }
  
  .search-icon {
    color: var(--text-color-light-dark, #aaa);
  }
  
  .library-item:hover {
    background-color: var(--hover-bg-color-dark, rgba(255, 255, 255, 0.05));
  }
  
  .library-item.active {
    background-color: var(--primary-bg-light-dark, rgba(24, 144, 255, 0.15));
  }
  
  .library-count {
    color: var(--text-color-light-dark, #aaa);
  }
  
  .empty-message {
    color: var(--text-color-light-dark, #aaa);
  }
  
  .recent-libraries {
    border-top-color: var(--border-color-dark, #444);
  }
  
  .recent-header {
    color: var(--text-color-light-dark, #aaa);
  }
  
  .recent-item {
    background-color: var(--bg-color-light-dark, #333);
  }
  
  .recent-item:hover {
    background-color: var(--hover-bg-color-dark, rgba(255, 255, 255, 0.05));
  }
  
  .recent-item.active {
    background-color: var(--primary-bg-light-dark, rgba(24, 144, 255, 0.15));
  }
  
  .library-list::-webkit-scrollbar-thumb {
    background: var(--border-color-dark, #444);
  }
  
  .library-list::-webkit-scrollbar-thumb:hover {
    background: var(--text-color-light-dark, #555);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dropdown-menu {
    max-height: 300px;
  }
  
  .library-list {
    max-height: 200px;
  }
  
  .library-item {
    padding: 8px 10px;
  }
}
</style> 