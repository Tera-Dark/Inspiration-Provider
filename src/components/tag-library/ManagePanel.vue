<template>
  <div class="manage-container">
    <div class="section">
      <h3>创建标签库</h3>
      <div class="form-group">
        <div class="input-group">
          <input 
            type="text" 
            v-model="createLibraryName" 
            placeholder="新建库名称" 
            class="form-control"
          />
          <button @click="createNewLibrary" class="btn primary-btn">创建新库</button>
        </div>
      </div>
      <div class="form-group">
        <button @click="deleteCurrentLibrary" class="btn danger-btn">删除当前库</button>
      </div>
    </div>
    
    <div class="section">
      <h3>高级管理</h3>
      <div class="action-container">
        <div class="action-section">
          <h4>重命名库</h4>
          <div class="action-controls">
            <select v-model="renameSource" class="form-control small">
              <option value="">选择要重命名的库</option>
              <option v-for="lib in libraries" :key="`rename-${lib.name}`" :value="lib.name">
                {{ lib.name }}
              </option>
            </select>
            <input 
              type="text" 
              v-model="renameTarget" 
              placeholder="新名称" 
              class="form-control small"
            />
            <button @click="renameLibrary" class="btn action-btn">重命名</button>
          </div>
        </div>
        
        <div class="action-section">
          <h4>复制库</h4>
          <div class="action-controls">
            <select v-model="duplicateSource" class="form-control small">
              <option value="">选择源库</option>
              <option v-for="lib in libraries" :key="`duplicate-${lib.name}`" :value="lib.name">
                {{ lib.name }}
              </option>
            </select>
            <input 
              type="text" 
              v-model="duplicateTarget" 
              placeholder="新库名称" 
              class="form-control small"
            />
            <button @click="duplicateLibrary" class="btn action-btn">复制</button>
          </div>
        </div>
        
        <div class="action-section">
          <h4>合并库</h4>
          <div class="action-controls">
            <select v-model="mergeSource" class="form-control small">
              <option value="">选择源库</option>
              <option v-for="lib in libraries" :key="`merge-source-${lib.name}`" :value="lib.name">
                {{ lib.name }}
              </option>
            </select>
            <select v-model="mergeTarget" class="form-control small">
              <option value="">选择目标库</option>
              <option v-for="lib in libraries" :key="`merge-target-${lib.name}`" :value="lib.name">
                {{ lib.name }}
              </option>
            </select>
            <button @click="mergeLibraries" class="btn action-btn">合并</button>
          </div>
        </div>
        
        <div class="action-section">
          <h4>清理和优化</h4>
          <div class="action-controls">
            <select v-model="cleanupTarget" class="form-control small">
              <option value="">选择要清理的库</option>
              <option v-for="lib in libraries" :key="`cleanup-${lib.name}`" :value="lib.name">
                {{ lib.name }}
              </option>
            </select>
            <button @click="cleanEmptyCategories" class="btn action-btn" title="删除没有标签的空分类">清理空分类</button>
            <button @click="cleanDuplicateTags" class="btn action-btn" title="删除重复的标签">去除重复标签</button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h3>库列表</h3>
      <div class="libraries-list">
        <div 
          v-for="library in libraries" 
          :key="library.name"
          class="library-item"
          :class="{ active: currentLibrary === library.name }"
          @click="switchLibrary(library.name)"
        >
          <span class="library-name">{{ library.name }}</span>
          <span class="library-count">{{ library.count }} 个标签</span>
        </div>
        
        <div v-if="libraries.length === 0" class="empty-message">
          无可用标签库
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, inject } from 'vue';

export default defineComponent({
  name: 'ManagePanel',
  props: {
    libraries: {
      type: Array,
      required: true
    },
    currentLibrary: {
      type: String,
      required: true
    }
  },
  emits: ['library-updated', 'switch-library'],
  setup(props, { emit }) {
    const tagLibrary = inject('tagLibrary');
    const emitter = inject('emitter');
    
    // 库管理相关状态
    const createLibraryName = ref('');
    const renameSource = ref('');
    const renameTarget = ref('');
    const duplicateSource = ref('');
    const duplicateTarget = ref('');
    const mergeSource = ref('');
    const mergeTarget = ref('');
    const cleanupTarget = ref('');
    
    // 切换库
    const switchLibrary = (name) => {
      if (name !== props.currentLibrary) {
        emit('switch-library', name);
      }
    };
    
    // 创建新库
    const createNewLibrary = () => {
      if (!createLibraryName.value) {
        emitter.emit('notification', {
          type: 'warning',
          message: '请输入新库名称'
        });
        return;
      }
      
      try {
        tagLibrary.addLibrary(createLibraryName.value);
        
        emitter.emit('notification', {
          type: 'success',
          message: `成功创建库 "${createLibraryName.value}"`
        });
        
        // 清空表单
        createLibraryName.value = '';
        
        // 通知父组件库已更新
        emit('library-updated');
        emit('switch-library', createLibraryName.value);
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `创建库失败: ${error.message}`
        });
      }
    };
    
    // 删除当前库
    const deleteCurrentLibrary = () => {
      if (props.libraries.length <= 1) {
        emitter.emit('notification', {
          type: 'warning',
          message: '至少需要保留一个标签库'
        });
        return;
      }
      
      if (confirm(`确定要删除标签库 "${props.currentLibrary}" 吗？此操作不可恢复。`)) {
        try {
          tagLibrary.deleteLibrary(props.currentLibrary);
          
          emitter.emit('notification', {
            type: 'success',
            message: `成功删除标签库 "${props.currentLibrary}"`
          });
          
          // 通知父组件库已更新
          emit('library-updated');
        } catch (error) {
          emitter.emit('notification', {
            type: 'error',
            message: `删除库失败: ${error.message}`
          });
        }
      }
    };
    
    // 重命名库
    const renameLibrary = () => {
      if (!renameSource.value || !renameTarget.value) {
        emitter.emit('notification', {
          type: 'warning',
          message: '请选择要重命名的库并输入新名称'
        });
        return;
      }
      
      try {
        tagLibrary.renameLibrary(renameSource.value, renameTarget.value);
        
        emitter.emit('notification', {
          type: 'success',
          message: `成功将库 "${renameSource.value}" 重命名为 "${renameTarget.value}"`
        });
        
        // 清空表单
        renameSource.value = '';
        renameTarget.value = '';
        
        // 通知父组件库已更新
        emit('library-updated');
        
        // 如果重命名的是当前库，切换到新名称
        if (props.currentLibrary === renameSource.value) {
          emit('switch-library', renameTarget.value);
        }
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `重命名库失败: ${error.message}`
        });
      }
    };
    
    // 复制库
    const duplicateLibrary = () => {
      if (!duplicateSource.value || !duplicateTarget.value) {
        emitter.emit('notification', {
          type: 'warning',
          message: '请选择源库并输入新库名称'
        });
        return;
      }
      
      try {
        tagLibrary.duplicateLibrary(duplicateSource.value, duplicateTarget.value);
        
        emitter.emit('notification', {
          type: 'success',
          message: `成功复制库 "${duplicateSource.value}" 到 "${duplicateTarget.value}"`
        });
        
        // 清空表单
        duplicateSource.value = '';
        duplicateTarget.value = '';
        
        // 通知父组件库已更新
        emit('library-updated');
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `复制库失败: ${error.message}`
        });
      }
    };
    
    // 合并库
    const mergeLibraries = () => {
      if (!mergeSource.value || !mergeTarget.value) {
        emitter.emit('notification', {
          type: 'warning',
          message: '请选择源库和目标库'
        });
        return;
      }
      
      if (mergeSource.value === mergeTarget.value) {
        emitter.emit('notification', {
          type: 'warning',
          message: '源库和目标库不能相同'
        });
        return;
      }
      
      try {
        tagLibrary.mergeLibraries(mergeSource.value, mergeTarget.value);
        
        emitter.emit('notification', {
          type: 'success',
          message: `成功将库 "${mergeSource.value}" 合并到 "${mergeTarget.value}"`
        });
        
        // 清空表单
        mergeSource.value = '';
        mergeTarget.value = '';
        
        // 通知父组件库已更新
        emit('library-updated');
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `合并库失败: ${error.message}`
        });
      }
    };
    
    // 清理空分类
    const cleanEmptyCategories = () => {
      if (!cleanupTarget.value) {
        emitter.emit('notification', {
          type: 'warning',
          message: '请选择要清理的库'
        });
        return;
      }
      
      try {
        const count = tagLibrary.cleanEmptyCategories(cleanupTarget.value);
        
        emitter.emit('notification', {
          type: 'success',
          message: count > 0 
            ? `清理成功：删除了 ${count} 个空分类` 
            : '没有发现空分类'
        });
        
        // 如果清理了分类，通知父组件库已更新
        if (count > 0) {
          emit('library-updated');
        }
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `清理空分类失败: ${error.message}`
        });
      }
    };
    
    // 清理重复标签
    const cleanDuplicateTags = () => {
      if (!cleanupTarget.value) {
        emitter.emit('notification', {
          type: 'warning',
          message: '请选择要清理的库'
        });
        return;
      }
      
      try {
        const count = tagLibrary.cleanDuplicateTags(cleanupTarget.value);
        
        emitter.emit('notification', {
          type: 'success',
          message: count > 0 
            ? `清理成功：删除了 ${count} 个重复标签` 
            : '没有发现重复标签'
        });
        
        // 如果清理了标签，通知父组件库已更新
        if (count > 0) {
          emit('library-updated');
        }
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `清理重复标签失败: ${error.message}`
        });
      }
    };
    
    return {
      createLibraryName,
      renameSource,
      renameTarget,
      duplicateSource,
      duplicateTarget,
      mergeSource,
      mergeTarget,
      cleanupTarget,
      
      switchLibrary,
      createNewLibrary,
      deleteCurrentLibrary,
      renameLibrary,
      duplicateLibrary,
      mergeLibraries,
      cleanEmptyCategories,
      cleanDuplicateTags
    };
  }
});
</script>

<style scoped>
.manage-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg, 20px);
}

.section {
  background-color: var(--panel-bg-color, #fff);
  border-radius: var(--border-radius-lg, 8px);
  box-shadow: var(--shadow-md, 0 1px 3px rgba(0, 0, 0, 0.1));
  padding: var(--spacing-lg, 20px);
  margin-bottom: var(--spacing-sm, 10px);
}

.section h3 {
  font-size: var(--font-size-lg, 1.2rem);
  color: var(--text-color, #333);
  margin-top: 0;
  margin-bottom: var(--spacing-md, 15px);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color, #eee);
}

.form-group {
  margin-bottom: var(--spacing-md, 15px);
}

.input-group {
  display: flex;
  gap: 10px;
  width: 100%;
}

.form-control {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: var(--border-radius-sm, 4px);
  font-size: var(--font-size-md, 1rem);
  color: var(--text-color, #333);
  background-color: var(--input-bg-color, #fff);
  transition: border-color 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color, #2196F3);
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.form-control.small {
  flex: 1;
  min-width: 0;
}

.btn {
  padding: 10px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
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

.secondary-btn {
  background-color: var(--bg-color-light, #f0f0f0);
  color: var(--text-color, #333);
}

.secondary-btn:hover {
  background-color: var(--bg-color-dark, #e0e0e0);
}

.danger-btn {
  background-color: var(--error-color, #f5222d);
  color: white;
}

.danger-btn:hover {
  background-color: #ff4d4f;
}

.action-btn {
  background-color: var(--primary-color, #2196F3);
  color: white;
}

.action-btn:hover {
  background-color: var(--primary-hover-color, #1976D2);
}

.action-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 15px);
}

.action-section {
  margin-bottom: var(--spacing-md, 15px);
}

.action-section h4 {
  margin-top: 0;
  margin-bottom: var(--spacing-sm, 10px);
  font-size: var(--font-size-md, 1rem);
  color: var(--text-color, #333);
  font-weight: 500;
}

.action-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.libraries-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding: var(--spacing-sm, 8px);
  border-radius: var(--border-radius-sm, 4px);
  background-color: var(--list-bg-color, #f5f5f5);
}

.library-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-radius: var(--border-radius-sm, 4px);
  background-color: var(--item-bg-color, #ffffff);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}

.library-item:hover {
  background-color: var(--item-hover-bg-color, #f9f9f9);
  transform: translateY(-1px);
}

.library-item.active {
  background-color: var(--item-active-bg-color, #e3f2fd);
  border-left: 3px solid var(--primary-color, #2196F3);
}

.library-name {
  font-weight: 500;
  color: var(--text-color, #333);
}

.library-count {
  font-size: var(--font-size-xs, 0.85rem);
  color: var(--text-color-light, #666);
  background-color: var(--count-bg-color, #f1f1f1);
  padding: 3px 8px;
  border-radius: 12px;
}

.empty-message {
  padding: var(--spacing-md, 15px);
  text-align: center;
  color: var(--text-color-light, #666);
  font-style: italic;
}

@media (max-width: 768px) {
  .section {
    padding: var(--spacing-md, 15px);
  }
  
  .action-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .input-group {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style> 