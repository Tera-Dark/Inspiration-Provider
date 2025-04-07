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
        // 使用专门的创建空库方法
        if (tagLibrary.createEmptyLibrary) {
          tagLibrary.createEmptyLibrary(createLibraryName.value);
        } else {
          // 如果没有该方法，则回退到addLibrary
          tagLibrary.addLibrary(createLibraryName.value, {});
        }
        
        emitter.emit('notification', {
          type: 'success',
          message: `成功创建库 "${createLibraryName.value}"`
        });
        
        // 存储当前创建的库名，用于切换
        const newLibName = createLibraryName.value;
        
        // 清空表单
        createLibraryName.value = '';
        
        // 通知父组件库已更新
        emit('library-updated');
        // 切换到新创建的库
        emit('switch-library', newLibName);
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
  gap: 20px;
}

.section {
  background-color: var(--section-bg-color, #f9f9f9);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.section h3 {
  padding: 12px 16px;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-color, #333);
  border-bottom: 1px solid var(--border-color-light, #eee);
  background-color: var(--section-header-bg, rgba(0, 0, 0, 0.02));
}

.form-group {
  padding: 16px;
  margin-bottom: 0;
}

.input-group {
  display: flex;
  gap: 10px;
}

.form-control {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  background-color: var(--input-bg-color, #fff);
  color: var(--text-color, #333);
  font-size: 0.9rem;
  transition: all 0.3s;
}

.form-control:focus {
  border-color: var(--primary-color, #1677ff);
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
  outline: none;
}

.form-control.small {
  min-width: 120px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.primary-btn {
  background-color: var(--primary-color, #1677ff);
  color: white;
}

.primary-btn:hover {
  background-color: var(--primary-hover-color, #4096ff);
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.danger-btn {
  background-color: var(--danger-color, #ff4d4f);
  color: white;
}

.danger-btn:hover {
  background-color: var(--danger-hover-color, #ff7875);
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.action-btn {
  background-color: var(--secondary-bg-color, #f0f0f0);
  color: var(--text-color, #333);
  border: 1px solid var(--border-color, #ddd);
}

.action-btn:hover {
  background-color: var(--secondary-hover-color, #e6e6e6);
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.action-container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.action-section {
  background-color: var(--card-bg-color, #fff);
  border-radius: 6px;
  padding: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.action-section h4 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-color, #333);
}

.action-controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.libraries-list {
  margin-top: 20px;
  border: 1px solid var(--border-color, #eee);
  border-radius: 6px;
  overflow: hidden;
}

.library-item {
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color, #eee);
  transition: all 0.2s;
}

.library-item:last-child {
  border-bottom: none;
}

.library-item:hover {
  background-color: var(--hover-bg-color, rgba(0, 0, 0, 0.02));
}

.library-item.active {
  background-color: var(--active-bg-color, rgba(22, 119, 255, 0.05));
}

.library-name {
  font-weight: 500;
  color: var(--text-color, #333);
}

.library-count {
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
  background-color: var(--tag-bg-color, #f0f0f0);
  padding: 2px 8px;
  border-radius: 10px;
}

.empty-message {
  padding: 30px 20px;
  text-align: center;
  color: var(--text-color-light, #666);
  font-style: italic;
}

/* 暗模式适配 */
@media (prefers-color-scheme: dark) {
  .section {
    background-color: var(--section-bg-color-dark, #252525);
  }
  
  .section h3 {
    color: var(--text-color-dark, #eee);
    border-bottom-color: var(--border-color-dark, #333);
    background-color: var(--section-header-bg-dark, rgba(255, 255, 255, 0.03));
  }
  
  .form-control {
    background-color: var(--input-bg-color-dark, #333);
    border-color: var(--border-color-dark, #444);
    color: var(--text-color-dark, #eee);
  }
  
  .form-control:focus {
    border-color: var(--primary-color, #1677ff);
    box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2);
  }
  
  .action-btn {
    background-color: var(--secondary-bg-color-dark, #2c2c2c);
    color: var(--text-color-dark, #eee);
    border-color: var(--border-color-dark, #444);
  }
  
  .action-btn:hover {
    background-color: var(--secondary-hover-color-dark, #3c3c3c);
  }
  
  .action-section {
    background-color: var(--card-bg-color-dark, #2a2a2a);
  }
  
  .action-section h4 {
    color: var(--text-color-dark, #eee);
  }
  
  .libraries-list {
    border-color: var(--border-color-dark, #333);
  }
  
  .library-item {
    border-bottom-color: var(--border-color-dark, #333);
  }
  
  .library-item:hover {
    background-color: var(--hover-bg-color-dark, rgba(255, 255, 255, 0.05));
  }
  
  .library-item.active {
    background-color: var(--active-bg-color-dark, rgba(22, 119, 255, 0.15));
  }
  
  .library-name {
    color: var(--text-color-dark, #eee);
  }
  
  .library-count {
    color: var(--text-color-dark, #eee);
    background-color: var(--tag-bg-color-dark, #3a3a3a);
  }
  
  .empty-message {
    color: var(--text-color-light-dark, #aaa);
  }
}
</style> 