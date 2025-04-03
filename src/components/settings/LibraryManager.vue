<template>
  <div class="library-manager">
    <div class="section basic-operations">
      <h4>基本操作</h4>
      <div class="form-group">
        <input 
          type="text" 
          v-model="createLibraryName" 
          placeholder="新库名称" 
          class="form-control"
        />
        <button @click="createEmptyLibrary" class="btn btn-primary" :disabled="!createLibraryName">创建空库</button>
      </div>
      
      <button @click="deleteCurrentLibrary" class="btn btn-danger" :disabled="libraryNames.length <= 1">删除当前库</button>
    </div>
    
    <div class="section duplicate-library">
      <h4>复制标签库</h4>
      <div class="form-group">
        <div class="input-group">
          <select v-model="duplicateSource" class="form-control">
            <option value="">选择源库</option>
            <option v-for="lib in libraryNames" :key="`dup-${lib}`" :value="lib">{{ lib }}</option>
          </select>
          <input
            type="text"
            v-model="duplicateTarget"
            placeholder="新库名称"
            class="form-control"
          />
          <button @click="duplicateLibrary" class="btn btn-primary" :disabled="!duplicateSource || !duplicateTarget">复制</button>
        </div>
      </div>
    </div>
    
    <div class="section rename-library">
      <h4>重命名标签库</h4>
      <div class="form-group">
        <div class="input-group">
          <select v-model="renameSource" class="form-control">
            <option value="">选择要重命名的库</option>
            <option v-for="lib in libraryNames" :key="`rename-${lib}`" :value="lib">{{ lib }}</option>
          </select>
          <input
            type="text"
            v-model="renameTarget"
            placeholder="新名称"
            class="form-control"
          />
          <button @click="renameLibrary" class="btn btn-primary" :disabled="!renameSource || !renameTarget">重命名</button>
        </div>
      </div>
    </div>
    
    <div class="section merge-libraries">
      <h4>合并标签库</h4>
      <div class="form-group">
        <div class="input-group">
          <select v-model="mergeSource" class="form-control">
            <option value="">选择源库</option>
            <option v-for="lib in libraryNames" :key="`merge-src-${lib}`" :value="lib">{{ lib }}</option>
          </select>
          <select v-model="mergeTarget" class="form-control">
            <option value="">选择目标库</option>
            <option v-for="lib in libraryNames" :key="`merge-tgt-${lib}`" :value="lib">{{ lib }}</option>
          </select>
          <button @click="mergeLibraries" class="btn btn-primary" :disabled="!mergeSource || !mergeTarget || mergeSource === mergeTarget">合并</button>
        </div>
        <div class="help-text">将源库中的标签合并到目标库中，自动去除重复标签</div>
      </div>
    </div>
    
    <div class="section cleanup">
      <h4>清理与优化</h4>
      <div class="form-group">
        <div class="input-group">
          <select v-model="cleanupTarget" class="form-control">
            <option value="">选择要清理的库</option>
            <option v-for="lib in libraryNames" :key="`cleanup-${lib}`" :value="lib">{{ lib }}</option>
          </select>
          <button @click="cleanEmptyCategories" class="btn btn-secondary" :disabled="!cleanupTarget">清理空分类</button>
          <button @click="cleanDuplicateTags" class="btn btn-secondary" :disabled="!cleanupTarget">去除重复标签</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, inject } from 'vue';

export default {
  name: 'LibraryManager',
  props: {
    currentLibrary: {
      type: String,
      required: true
    }
  },
  emits: ['library-changed'],
  setup(props, { emit }) {
    // 获取共享的标签库实例
    const tagLibrary = inject('tagLibrary');
    const emitter = inject('emitter');
    
    // 库管理相关状态
    const createLibraryName = ref('');
    const duplicateSource = ref('');
    const duplicateTarget = ref('');
    const renameSource = ref('');
    const renameTarget = ref('');
    const mergeSource = ref('');
    const mergeTarget = ref('');
    const cleanupTarget = ref('');
    
    // 计算属性：所有库名称
    const libraryNames = computed(() => {
      return tagLibrary.getLibraryNames ? tagLibrary.getLibraryNames() : 
             (tagLibrary.getLibraries ? tagLibrary.getLibraries() : []);
    });
    
    // 创建空库
    const createEmptyLibrary = () => {
      if (!createLibraryName.value) {
        emitter.emit('notification', {
          type: 'warning',
          message: '请输入新库名称'
        });
        return;
      }
      
      try {
        // 创建新的空库
        tagLibrary.addLibrary(createLibraryName.value, {});
        
        emitter.emit('notification', {
          type: 'success',
          message: `成功创建空库 "${createLibraryName.value}"`
        });
        
        // 通知父组件库已变更
        emit('library-changed', createLibraryName.value);
        
        // 清空表单
        createLibraryName.value = '';
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `创建库失败: ${error.message}`
        });
      }
    };
    
    // 删除当前库
    const deleteCurrentLibrary = () => {
      if (libraryNames.value.length <= 1) {
        emitter.emit('notification', {
          type: 'warning',
          message: '至少需要保留一个标签库'
        });
        return;
      }
      
      if (confirm(`确定要删除标签库 "${props.currentLibrary}" 吗？此操作不可恢复。`)) {
        try {
          // 保存当前库名，以便后续操作
          const deletedLibrary = props.currentLibrary;
          
          // 删除库
          tagLibrary.deleteLibrary(deletedLibrary);
          
          // 获取默认库名（删除后会自动切换到的库）
          const defaultLibrary = tagLibrary.getCurrentLibraryName();
          
          emitter.emit('notification', {
            type: 'success',
            message: `成功删除标签库 "${deletedLibrary}"`
          });
          
          // 通知父组件库已变更
          emit('library-changed', defaultLibrary);
        } catch (error) {
          emitter.emit('notification', {
            type: 'error',
            message: `删除库失败: ${error.message}`
          });
        }
      }
    };
    
    // 复制标签库
    const duplicateLibrary = () => {
      if (!duplicateSource.value || !duplicateTarget.value) {
        emitter.emit('notification', {
          type: 'warning',
          message: '请选择源库并输入新库名称'
        });
        return;
      }
      
      try {
        // 复制库
        tagLibrary.duplicateLibrary(duplicateSource.value, duplicateTarget.value);
        
        emitter.emit('notification', {
          type: 'success',
          message: `成功复制 "${duplicateSource.value}" 到 "${duplicateTarget.value}"`
        });
        
        // 通知父组件库已变更
        emit('library-changed', duplicateTarget.value);
        
        // 清空表单
        duplicateSource.value = '';
        duplicateTarget.value = '';
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `复制库失败: ${error.message}`
        });
      }
    };
    
    // 重命名标签库
    const renameLibrary = () => {
      if (!renameSource.value || !renameTarget.value) {
        emitter.emit('notification', {
          type: 'warning',
          message: '请选择源库并输入新名称'
        });
        return;
      }
      
      try {
        // 保存当前库名和要重命名的库名，以便后续判断
        const currentLib = props.currentLibrary;
        const oldName = renameSource.value;
        
        // 重命名库
        tagLibrary.renameLibrary(renameSource.value, renameTarget.value);
        
        emitter.emit('notification', {
          type: 'success',
          message: `成功将 "${renameSource.value}" 重命名为 "${renameTarget.value}"`
        });
        
        // 如果重命名的是当前库，通知父组件切换到新库名
        if (currentLib === oldName) {
          emit('library-changed', renameTarget.value);
        }
        
        // 清空表单
        renameSource.value = '';
        renameTarget.value = '';
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `重命名库失败: ${error.message}`
        });
      }
    };
    
    // 合并标签库
    const mergeLibraries = () => {
      if (!mergeSource.value || !mergeTarget.value || mergeSource.value === mergeTarget.value) {
        emitter.emit('notification', {
          type: 'warning',
          message: mergeSource.value === mergeTarget.value ? 
            '源库和目标库不能相同' : '请选择源库和目标库'
        });
        return;
      }
      
      try {
        // 合并库
        tagLibrary.mergeLibraries(mergeSource.value, mergeTarget.value);
        
        emitter.emit('notification', {
          type: 'success',
          message: `成功将标签库 "${mergeSource.value}" 合并到 "${mergeTarget.value}"`
        });
        
        // 切换到合并后的库
        emit('library-changed', mergeTarget.value);
        
        // 清空表单
        mergeSource.value = '';
        mergeTarget.value = '';
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `合并标签库失败: ${error.message}`
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
        // 清理空分类
        const count = tagLibrary.cleanEmptyCategories(cleanupTarget.value);
        
        emitter.emit('notification', {
          type: 'success',
          message: count > 0 
            ? `成功清理 ${count} 个空分类` 
            : `标签库 "${cleanupTarget.value}" 中没有空分类`
        });
        
        // 如果清理的是当前库，通知父组件刷新
        if (cleanupTarget.value === props.currentLibrary) {
          emit('library-changed', cleanupTarget.value);
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
        // 清理重复标签
        const count = tagLibrary.cleanDuplicateTags(cleanupTarget.value);
        
        emitter.emit('notification', {
          type: 'success',
          message: count > 0 
            ? `成功清理 ${count} 个重复标签` 
            : `标签库 "${cleanupTarget.value}" 中没有重复标签`
        });
        
        // 如果清理的是当前库，通知父组件刷新
        if (cleanupTarget.value === props.currentLibrary) {
          emit('library-changed', cleanupTarget.value);
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
      duplicateSource,
      duplicateTarget,
      renameSource,
      renameTarget,
      mergeSource,
      mergeTarget,
      cleanupTarget,
      libraryNames,
      createEmptyLibrary,
      deleteCurrentLibrary,
      duplicateLibrary,
      renameLibrary,
      mergeLibraries,
      cleanEmptyCategories,
      cleanDuplicateTags
    };
  }
};
</script>

<style scoped>
.library-manager {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section {
  padding: 16px;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 8px;
  background-color: var(--bg-color-light, #f5f5f5);
}

h4 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-color, #333);
}

.form-group {
  margin-bottom: 16px;
}

.input-group {
  display: flex;
  gap: 8px;
}

.form-control {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  font-size: 0.95rem;
  background-color: var(--bg-color, #fff);
  color: var(--text-color, #333);
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-primary {
  background-color: var(--primary-color, #1677ff);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-color-dark, #0958d9);
}

.btn-secondary {
  background-color: var(--bg-color-light, #f5f5f5);
  color: var(--text-color, #333);
  border: 1px solid var(--border-color, #ddd);
}

.btn-secondary:hover {
  background-color: var(--bg-color-dark, #e0e0e0);
}

.btn-danger {
  background-color: var(--danger-color, #ff4d4f);
  color: white;
}

.btn-danger:hover {
  background-color: var(--danger-color-dark, #d9363e);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.help-text {
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
  margin-top: 8px;
}

/* 暗色模式适配 */
:global(.dark-mode) .section {
  background-color: var(--bg-color-dark-2, #2a2a2a);
  border-color: var(--border-color-dark, #333);
}

:global(.dark-mode) h4 {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .form-control {
  background-color: var(--bg-color-dark, #1f1f1f);
  border-color: var(--border-color-dark, #333);
  color: var(--text-color-dark, #ddd);
}

:global(.dark-mode) .btn-secondary {
  background-color: var(--bg-color-dark-3, #383838);
  color: var(--text-color-dark, #ddd);
  border-color: var(--border-color-dark, #555);
}

:global(.dark-mode) .btn-secondary:hover {
  background-color: var(--bg-color-dark-4, #444);
}

:global(.dark-mode) .help-text {
  color: var(--text-color-light-dark, #aaa);
}

/* 响应式适配 */
@media (max-width: 768px) {
  .input-group {
    flex-direction: column;
    gap: 12px;
  }
  
  .btn {
    width: 100%;
  }
}
</style> 