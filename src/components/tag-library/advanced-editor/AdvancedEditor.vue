<template>
  <div v-if="show" class="advanced-editor">
    <div class="modal-overlay" @click="closeEditor"></div>
    <div class="modal-container" @click.stop>
      <!-- 头部 -->
      <div class="modal-header">
        <h3>高级编辑器</h3>
        <div class="header-actions">
          <button class="refresh-btn" 
                  @click="triggerRefresh" 
                  :disabled="isLoading"
                  title="刷新数据">
            <i class="fas fa-sync-alt" :class="{ refreshing: isLoading }"></i>
          </button>
          <button class="close-btn" @click="closeEditor" title="关闭">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- 主体 -->
      <div class="modal-body">
        <!-- 库选择器 -->
        <div class="library-selector">
          <label>选择标签库：</label>
          <select v-model="currentLibraryName" 
                  class="form-control" 
                  :disabled="isLoading">
            <option v-for="name in libraryNames" 
                    :key="name" 
                    :value="name">{{ name }}</option>
          </select>
          <div v-if="isLoading" class="loading-indicator">
            <div class="spinner"></div>
          </div>
        </div>

        <!-- 编辑器布局 -->
        <div class="editor-layout">
          <!-- 分类面板 -->
          <CategoryPanel
            :categories="categoriesList"
            :selected-category="selectedCategory"
            :get-category-tag-count="getCategoryTagCount"
            @select-category="selectCategory"
            @add-category="startAddCategory"
            @edit-category="startEditCategory"
            @delete-category="confirmDeleteCategory"
          />

          <!-- 标签面板 -->
          <TagPanel
            :selected-category="selectedCategory"
            :tags="currentCategoryTags"
            @add-tag="startAddTag"
            @edit-tag="startEditTag"
            @delete-tag="confirmDeleteTag"
          />
        </div>
      </div>
    </div>

    <!-- 标签编辑模态框 -->
    <TagEditModal
      v-if="showTagModal"
      :tag="tagForm"
      :is-editing="isEditingTag"
      :selected-category="selectedCategory"
      @save="saveTag"
      @close="showTagModal = false"
    />

    <!-- 分类编辑模态框 -->
    <CategoryEditModal
      v-if="showCategoryModal"
      :category="categoryForm"
      :is-editing="isEditingCategory"
      @save="saveCategory"
      @close="showCategoryModal = false"
    />

    <!-- 删除确认模态框 -->
    <ConfirmModal
      v-if="showDeleteConfirmModal"
      :message="deleteConfirmMessage"
      @confirm="confirmDelete"
      @cancel="showDeleteConfirmModal = false"
    />
  </div>
</template>

<script>
import { ref, computed, watch, inject, nextTick, onMounted, onUnmounted } from 'vue';
import CategoryPanel from './CategoryPanel.vue';
import TagPanel from './TagPanel.vue';
import TagEditModal from './modals/TagEditModal.vue';
import CategoryEditModal from './modals/CategoryEditModal.vue';
import ConfirmModal from './modals/ConfirmModal.vue';

export default {
  name: 'AdvancedEditor',
  components: {
    CategoryPanel,
    TagPanel,
    TagEditModal,
    CategoryEditModal,
    ConfirmModal
  },
  props: {
    show: {
      type: Boolean,
      required: true
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    // 注入依赖
    const tagLibrary = inject('tagLibrary');
    const emitter = inject('emitter');
    
    // 编辑器状态
    const isLoading = ref(false);
    const currentLibraryName = ref('');
    const selectedCategory = ref('');
    const showTagModal = ref(false);
    const showCategoryModal = ref(false);
    const showDeleteConfirmModal = ref(false);
    const isEditingTag = ref(false);
    const isEditingCategory = ref(false);
    const editingTagIndex = ref(-1);
    const tagForm = ref({ content: '', subTitles: '' });
    const categoryForm = ref({ name: '', originalName: '' });
    const deleteConfirmMessage = ref('');
    const deleteType = ref('');
    const deleteTarget = ref(null);
    const refreshTrigger = ref(0);
    const isInitialLoad = ref(true);
    
    // 计算属性：所有库名称
    const libraryNames = computed(() => {
      return tagLibrary.getLibraryNames ? tagLibrary.getLibraryNames() : [];
    });
    
    // 计算属性：当前库数据
    const libraryData = computed(() => {
      if (!currentLibraryName.value) return {};
      try {
        return tagLibrary.getLibrary(currentLibraryName.value) || {};
      } catch (error) {
        console.error('获取库数据失败:', error);
        return {};
      }
    });
    
    // 计算属性：分类列表
    const categoriesList = computed(() => {
      try {
        if (!libraryData.value) return [];
        return Object.keys(libraryData.value).sort();
      } catch (error) {
        console.error('获取分类列表失败:', error);
        return [];
      }
    });
    
    // 计算属性：当前分类的标签
    const currentCategoryTags = computed(() => {
      try {
        if (!selectedCategory.value || !libraryData.value) return [];
        const categoryTags = libraryData.value[selectedCategory.value];
        if (!Array.isArray(categoryTags)) return [];
        
        return categoryTags.map(tag => {
          if (typeof tag === 'string') {
            return { content: tag, subTitles: [] };
          }
          return {
            content: tag.content || '',
            subTitles: Array.isArray(tag.subTitles) ? tag.subTitles : []
          };
        });
      } catch (error) {
        console.error('获取当前分类标签失败:', error);
        return [];
      }
    });
    
    // 获取分类中的标签数量
    const getCategoryTagCount = (category) => {
      if (!libraryData.value || !libraryData.value[category]) return 0;
      return Array.isArray(libraryData.value[category]) ? libraryData.value[category].length : 0;
    };
    
    // 加载选中的库
    const loadSelectedLibrary = async (silent = false) => {
      if (!currentLibraryName.value) return;
      
      try {
        isLoading.value = true;
        
        // 获取库数据
        const library = tagLibrary.getLibrary(currentLibraryName.value);
        if (!library) {
          throw new Error('无法加载库数据');
        }
        
        // 重置选中的分类
        selectedCategory.value = '';
        
        // 增加刷新触发器的值
        refreshTrigger.value++;
        
        if (!silent) {
          emitter.emit('notification', {
            type: 'success',
            message: '加载库成功'
          });
        }
      } catch (error) {
        console.error('加载库失败:', error);
        if (!silent) {
          emitter.emit('notification', {
            type: 'error',
            message: `加载库失败: ${error.message}`
          });
        }
      } finally {
        isLoading.value = false;
      }
    };
    
    // 手动触发刷新
    const triggerRefresh = () => {
      if (isLoading.value) return; // 防止重复刷新
      
      try {
        isLoading.value = true;
        
        // 强制从本地存储重新加载所有标签库数据
        tagLibrary._loadFromStorage();
        
        // 获取当前库名称
        const libName = currentLibraryName.value;
        
        // 清空当前选择的库
        currentLibraryName.value = '';
        
        // 使用nextTick确保DOM更新
        nextTick(() => {
          // 重新选择当前库，触发库加载
          currentLibraryName.value = libName;
          
          // 提示用户
          emitter.emit('notification', {
            type: 'success',
            message: '数据刷新成功'
          });
          
          // 重置加载状态
          isLoading.value = false;
        });
      } catch (error) {
        console.error('刷新失败:', error);
        emitter.emit('notification', {
          type: 'error',
          message: '刷新失败: ' + (error.message || '未知错误')
        });
        isLoading.value = false;
      }
    };
    
    // 选择分类
    const selectCategory = (category) => {
      selectedCategory.value = category;
    };
    
    // 开始编辑标签
    const startEditTag = (tag, index) => {
      isEditingTag.value = true;
      editingTagIndex.value = index;
      tagForm.value = {
        content: tag.content || '',
        subTitles: Array.isArray(tag.subTitles) ? tag.subTitles.join(',') : ''
      };
      showTagModal.value = true;
      console.log('开始编辑标签:', tagForm.value);
    };
    
    // 保存标签
    const saveTag = async (formData) => {
      console.log('接收到保存标签请求，表单数据:', formData);
      
      // 如果直接传入了表单数据，则使用传入的数据更新tagForm
      if (formData && typeof formData === 'object') {
        tagForm.value = { ...formData };
      }
      
      if (!tagForm.value.content || !tagForm.value.content.trim()) {
        emitter.emit('notification', {
          type: 'error',
          message: '标签内容不能为空'
        });
        return;
      }
      
      if (!selectedCategory.value || !currentLibraryName.value) {
        emitter.emit('notification', {
          type: 'error',
          message: '请先选择分类'
        });
        return;
      }
      
      try {
        isLoading.value = true;
        console.log('处理标签表单数据:', tagForm.value);
        
        // 准备标签对象
        const tagObj = {
          content: tagForm.value.content.trim(),
          subTitles: tagForm.value.subTitles.trim() 
            ? tagForm.value.subTitles.split(',').map(s => s.trim()).filter(s => s)
            : []
        };
        
        console.log('准备保存标签:', tagObj);
        console.log('TagLibrary emitter 状态:', tagLibrary.hasEmitter());
        
        let success = false;
        
        if (isEditingTag.value && editingTagIndex.value >= 0) {
          // 编辑现有标签
          const oldTag = currentCategoryTags.value[editingTagIndex.value];
          console.log('编辑标签:', oldTag, '->', tagObj);
          
          // 先删除旧标签
          const removeSuccess = tagLibrary.removeTag(
            selectedCategory.value,
            oldTag.content,
            currentLibraryName.value
          );
          
          console.log('删除旧标签结果:', removeSuccess);
          
          if (removeSuccess) {
            // 再添加新标签
            success = tagLibrary.addTag(
              selectedCategory.value,
              tagObj,
              currentLibraryName.value
            );
            console.log('添加新标签结果:', success);
          } else {
            throw new Error('删除旧标签失败');
          }
        } else {
          // 添加新标签
          console.log('添加新标签:', tagObj);
          success = tagLibrary.addTag(
            selectedCategory.value,
            tagObj,
            currentLibraryName.value
          );
          console.log('添加标签结果:', success);
        }
        
        if (!success) {
          throw new Error('保存操作未成功完成');
        }
        
        emitter.emit('notification', {
          type: 'success',
          message: isEditingTag.value ? '标签更新成功' : '标签添加成功'
        });
        
        // 关闭模态框
        showTagModal.value = false;
        
        // TagLibrary的更改会自动触发tagLibraryUpdated事件，不需要再次刷新
        // triggerRefresh();
      } catch (error) {
        console.error('保存标签失败:', error);
        emitter.emit('notification', {
          type: 'error',
          message: `保存标签失败: ${error.message}`
        });
      } finally {
        isLoading.value = false;
      }
    };
    
    // 开始编辑分类
    const startEditCategory = (category) => {
      isEditingCategory.value = true;
      categoryForm.value = {
        name: category,
        originalName: category
      };
      showCategoryModal.value = true;
      console.log('开始编辑分类:', categoryForm.value);
    };
    
    // 保存分类
    const saveCategory = async (formData) => {
      console.log('接收到保存分类请求，表单数据:', formData);
      
      // 如果直接传入了表单数据，则使用传入的数据更新categoryForm
      if (formData && typeof formData === 'object') {
        categoryForm.value = { ...formData };
      }
      
      if (!categoryForm.value.name || !categoryForm.value.name.trim()) {
        emitter.emit('notification', {
          type: 'error',
          message: '分类名称不能为空'
        });
        return;
      }
      
      if (!currentLibraryName.value) {
        emitter.emit('notification', {
          type: 'error',
          message: '请先选择库'
        });
        return;
      }
      
      try {
        isLoading.value = true;
        console.log('处理分类表单数据:', categoryForm.value);
        
        if (isEditingCategory.value) {
          // 重命名分类
          console.log('准备重命名分类:', 
            categoryForm.value.originalName, '->', categoryForm.value.name.trim());
          
          const success = tagLibrary.renameCategory(
            currentLibraryName.value,
            categoryForm.value.originalName,
            categoryForm.value.name.trim()
          );
          
          console.log('重命名分类结果:', success);
          
          if (success) {
            emitter.emit('notification', {
              type: 'success',
              message: '分类重命名成功'
            });
          } else {
            throw new Error('重命名分类失败');
          }
        } else {
          // 添加新分类
          console.log('准备添加新分类:', categoryForm.value.name.trim());
          
          const success = tagLibrary.addCategory(
            currentLibraryName.value,
            categoryForm.value.name.trim()
          );
          
          console.log('添加分类结果:', success);
          
          if (success) {
            emitter.emit('notification', {
              type: 'success',
              message: '分类添加成功'
            });
          } else {
            throw new Error('添加分类失败');
          }
        }
        
        // 关闭模态框
        showCategoryModal.value = false;
        
        // TagLibrary的更改会自动触发tagLibraryUpdated事件，不需要再次刷新
        // triggerRefresh();
      } catch (error) {
        console.error('保存分类失败:', error);
        emitter.emit('notification', {
          type: 'error',
          message: `保存分类失败: ${error.message}`
        });
      } finally {
        isLoading.value = false;
      }
    };
    
    // 确认删除分类
    const confirmDeleteCategory = (category) => {
      deleteType.value = 'category';
      deleteTarget.value = category;
      deleteConfirmMessage.value = `确定要删除分类 "${category}" 吗？此操作将删除该分类下的所有标签，且不可恢复。`;
      showDeleteConfirmModal.value = true;
    };
    
    // 确认删除标签
    const confirmDeleteTag = (tag, index) => {
      deleteType.value = 'tag';
      deleteTarget.value = index;
      deleteConfirmMessage.value = `确定要删除标签 "${tag.content}" 吗？此操作不可恢复。`;
      showDeleteConfirmModal.value = true;
    };
    
    // 确认删除
    const confirmDelete = async () => {
      try {
        isLoading.value = true;
        
        if (deleteType.value === 'category') {
          // 删除分类
          console.log('准备删除分类:', deleteTarget.value);
          
          const result = await tagLibrary.deleteCategory(currentLibraryName.value, deleteTarget.value);
          console.log('删除分类结果:', result);
          
          if (result) {
            emitter.emit('notification', {
              type: 'success',
              message: `分类 "${deleteTarget.value}" 已删除`
            });
            
            // 如果删除的是当前选中的分类，清空选择
            if (selectedCategory.value === deleteTarget.value) {
              selectedCategory.value = '';
            }
          } else {
            throw new Error('删除分类操作未成功完成');
          }
        } else if (deleteType.value === 'tag') {
          // 删除标签
          const tag = currentCategoryTags.value[deleteTarget.value];
          if (tag) {
            console.log('准备删除标签:', tag);
            
            const success = tagLibrary.removeTag(
              selectedCategory.value,
              tag.content,
              currentLibraryName.value
            );
            console.log('删除标签结果:', success);
            
            if (success) {
              emitter.emit('notification', {
                type: 'success',
                message: '标签已删除'
              });
            } else {
              throw new Error('删除标签操作未成功完成');
            }
          } else {
            throw new Error('找不到要删除的标签');
          }
        }
        
        // 关闭确认框
        showDeleteConfirmModal.value = false;
        deleteType.value = '';
        deleteTarget.value = null;
        deleteConfirmMessage.value = '';
        
        // TagLibrary的更改会自动触发tagLibraryUpdated事件，不需要再次刷新
        // triggerRefresh();
      } catch (error) {
        console.error('删除失败:', error);
        emitter.emit('notification', {
          type: 'error',
          message: `删除失败: ${error.message}`
        });
      } finally {
        isLoading.value = false;
      }
    };
    
    // 关闭编辑器
    const closeEditor = () => {
      emit('close');
      currentLibraryName.value = '';
      selectedCategory.value = '';
      showTagModal.value = false;
      showCategoryModal.value = false;
      showDeleteConfirmModal.value = false;
      isEditingTag.value = false;
      isEditingCategory.value = false;
      editingTagIndex.value = -1;
      tagForm.value = { content: '', subTitles: '' };
      categoryForm.value = { name: '', originalName: '' };
      deleteConfirmMessage.value = '';
      deleteType.value = '';
      deleteTarget.value = null;
    };
    
    // 监听show属性变化
    watch(() => props.show, (newVal) => {
      if (newVal) {
        // 当显示编辑器时，自动加载当前库
        const currentLib = tagLibrary.getCurrentLibraryName();
        if (currentLib && (isInitialLoad.value || currentLib !== currentLibraryName.value)) {
          currentLibraryName.value = currentLib;
          loadSelectedLibrary(true);
          isInitialLoad.value = false;
        }
      }
    });
    
    // 监听库名称变化
    watch(() => currentLibraryName.value, (newVal, oldVal) => {
      if (newVal && newVal !== oldVal && !isInitialLoad.value) {
        loadSelectedLibrary(false);
      }
    });
    
    // 监听标签库更新事件
    let unsubTagLibraryUpdated;
    let refreshDebounceTimer = null;
    let lastRefreshTime = 0; // 记录最后一次刷新时间
    
    onMounted(() => {
      // 监听标签库更新事件，添加防抖机制避免无限刷新循环
      unsubTagLibraryUpdated = emitter.on('tagLibraryUpdated', (eventData) => {
        console.log('AdvancedEditor: 接收到 tagLibraryUpdated 事件', eventData);
        
        // 检查是否需要刷新：如果在短时间内已经刷新过，则忽略本次事件
        const now = Date.now();
        const timeSinceLastRefresh = now - lastRefreshTime;
        if (timeSinceLastRefresh < 1000) { // 1秒内不重复刷新
          console.log(`AdvancedEditor: 最近${timeSinceLastRefresh}ms内已刷新过，忽略本次事件`);
          return;
        }
        
        // 清除之前的定时器
        if (refreshDebounceTimer) {
          clearTimeout(refreshDebounceTimer);
        }
        
        // 防抖，避免短时间内多次刷新
        refreshDebounceTimer = setTimeout(() => {
          console.log('AdvancedEditor: 执行防抖后的刷新');
          
          // 如果当前正在加载中，则不执行刷新
          if (!isLoading.value) {
            // 不调用完整刷新，而是简单地增加刷新触发器的值
            refreshTrigger.value++;
            // 更新最后刷新时间
            lastRefreshTime = Date.now();
          }
          
          refreshDebounceTimer = null;
        }, 300);
      });
    });
    
    // 清理事件监听
    onUnmounted(() => {
      if (unsubTagLibraryUpdated) {
        unsubTagLibraryUpdated();
      }
    });
    
    // 开始添加分类
    const startAddCategory = () => {
      console.log('开始添加新分类');
      isEditingCategory.value = false;
      categoryForm.value = {
        name: '',
        originalName: ''
      };
      showCategoryModal.value = true;
    };
    
    // 开始添加标签
    const startAddTag = () => {
      console.log('开始添加新标签');
      isEditingTag.value = false;
      tagForm.value = {
        content: '',
        subTitles: ''
      };
      showTagModal.value = true;
    };
    
    return {
      // 状态
      isLoading,
      currentLibraryName,
      selectedCategory,
      showTagModal,
      showCategoryModal,
      showDeleteConfirmModal,
      isEditingTag,
      isEditingCategory,
      editingTagIndex,
      tagForm,
      categoryForm,
      deleteConfirmMessage,
      deleteType,
      deleteTarget,
      refreshTrigger,
      
      // 计算属性
      libraryNames,
      libraryData,
      categoriesList,
      currentCategoryTags,
      
      // 方法
      getCategoryTagCount,
      loadSelectedLibrary,
      selectCategory,
      startEditTag,
      saveTag,
      startEditCategory,
      saveCategory,
      confirmDeleteCategory,
      confirmDeleteTag,
      confirmDelete,
      closeEditor,
      triggerRefresh,
      startAddCategory,
      startAddTag
    };
  }
};
</script>

<style scoped>
.advanced-editor {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-container {
  position: relative;
  width: 90%;
  max-width: 1200px;
  height: 90vh;
  background-color: var(--bg-color, #fff);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color, #eee);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--text-color, #333);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.refresh-btn {
  background: none;
  border: none;
  padding: 4px 8px;
  cursor: pointer;
  color: var(--text-color-light, #666);
  transition: all 0.3s;
}

.refresh-btn:hover {
  color: var(--primary-color, #1677ff);
}

.refresh-icon {
  display: inline-block;
  transition: transform 0.3s;
}

.refresh-icon.refreshing {
  animation: spin 1s linear infinite;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  padding: 4px 8px;
  cursor: pointer;
  color: var(--text-color-light, #666);
  transition: all 0.3s;
}

.close-btn:hover {
  color: var(--danger-color, #ff4d4f);
}

.modal-body {
  flex: 1;
  padding: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.library-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.library-selector label {
  color: var(--text-color, #333);
  font-weight: 500;
}

.form-control {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  font-size: 0.9rem;
  color: var(--text-color, #333);
  background-color: var(--input-bg-color, #fff);
  transition: all 0.3s;
}

.form-control:focus {
  border-color: var(--primary-color, #1677ff);
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
  outline: none;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-color, #eee);
  border-top-color: var(--primary-color, #1677ff);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.editor-layout {
  flex: 1;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 16px;
  overflow: hidden;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .modal-container {
    background-color: var(--bg-color-dark, #1f1f1f);
  }

  .modal-header {
    border-bottom-color: var(--border-color-dark, #333);
  }

  .modal-header h3 {
    color: var(--text-color-dark, #eee);
  }

  .refresh-btn {
    color: var(--text-color-light-dark, #999);
  }

  .close-btn {
    color: var(--text-color-light-dark, #999);
  }

  .form-control {
    background-color: var(--input-bg-color-dark, #2c2c2c);
    border-color: var(--border-color-dark, #444);
    color: var(--text-color-dark, #eee);
  }

  .library-selector label {
    color: var(--text-color-dark, #eee);
  }
}
</style> 