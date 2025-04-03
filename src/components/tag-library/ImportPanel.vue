<template>
  <div class="section">
    <h3>导入方式</h3>
    <div class="form-group">
      <div class="radio-group">
        <div class="radio-item">
          <input type="radio" id="import-new" v-model="importMode" value="new">
          <label for="import-new">创建新库</label>
        </div>
        <div class="radio-item">
          <input type="radio" id="import-extend" v-model="importMode" value="extend">
          <label for="import-extend">扩展现有库</label>
        </div>
      </div>
    </div>

    <!-- 新库模式 -->
    <div v-if="importMode === 'new'" class="form-group">
      <label for="library-name">新库名称</label>
      <input 
        type="text" 
        id="library-name" 
        v-model="newLibraryName" 
        placeholder="输入新标签库名称"
        class="form-control"
      />
    </div>

    <!-- 扩展模式 -->
    <div v-else class="form-group">
      <label for="extend-library">选择要扩展的库</label>
      <select 
        id="extend-library" 
        v-model="extendLibraryName" 
        class="form-control"
      >
        <option v-for="lib in libraries" :key="lib.name" :value="lib.name">
          {{ lib.name }}
        </option>
      </select>
    </div>
    
    <div class="form-group">
      <label for="import-file" class="file-label">
        <span>选择JSON文件</span>
        <input type="file" id="import-file" @change="handleFileSelect" accept=".json" />
      </label>
      <div v-if="fileSelected" class="selected-file">
        已选择文件
      </div>
    </div>
    
    <div class="action-group">
      <button @click="importLibrary" class="btn primary-btn" :disabled="!fileSelected">导入</button>
      <button @click="clearImport" class="btn secondary-btn">清空</button>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, inject } from 'vue';

export default defineComponent({
  name: 'ImportPanel',
  props: {
    libraries: {
      type: Array,
      required: true
    }
  },
  emits: ['library-updated'],
  setup(props, { emit }) {
    const tagLibrary = inject('tagLibrary');
    const emitter = inject('emitter');
    
    // 导入相关状态
    const importMode = ref('new');
    const newLibraryName = ref('');
    const extendLibraryName = ref('');
    const fileContent = ref(null);
    const fileSelected = ref(false);
    
    // 处理文件选择
    const handleFileSelect = (event) => {
      const file = event.target.files[0];
      if (!file) {
        fileSelected.value = false;
        fileContent.value = null;
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target.result);
          fileContent.value = content;
          fileSelected.value = true;
        } catch (error) {
          emitter.emit('notification', {
            type: 'error',
            message: `无法解析文件: ${error.message}`
          });
          fileSelected.value = false;
          fileContent.value = null;
        }
      };
      
      reader.readAsText(file);
    };
    
    // 清空导入表单
    const clearImport = () => {
      newLibraryName.value = '';
      extendLibraryName.value = '';
      fileContent.value = null;
      fileSelected.value = false;
      
      // 清空文件输入
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = '';
      }
    };
    
    // 导入库
    const importLibrary = () => {
      if (!fileSelected.value || !fileContent.value) {
        emitter.emit('notification', {
          type: 'warning',
          message: '请先选择有效的JSON文件'
        });
        return;
      }
      
      try {
        // 验证导入数据的格式
        if (typeof fileContent.value !== 'object' || fileContent.value === null) {
          throw new Error('导入数据必须是有效的JSON对象');
        }
        
        // 验证对象结构 - 至少包含一个分类，且每个分类都是数组
        let hasValidCategory = false;
        for (const category in fileContent.value) {
          if (!Array.isArray(fileContent.value[category])) {
            throw new Error(`分类 "${category}" 的内容必须是数组`);
          }
          hasValidCategory = true;
        }
        
        if (!hasValidCategory) {
          throw new Error('导入的数据必须至少包含一个分类');
        }
        
        if (importMode.value === 'new') {
          // 创建新库模式
          if (!newLibraryName.value) {
            emitter.emit('notification', {
              type: 'warning',
              message: '请输入新库名称'
            });
            return;
          }
          
          // 检查库名是否已存在
          const existingLibraries = props.libraries.map(lib => lib.name);
          if (existingLibraries.includes(newLibraryName.value)) {
            throw new Error(`库名 "${newLibraryName.value}" 已存在，请使用不同的名称`);
          }
          
          // 使用添加库方法或导入库方法
          if (tagLibrary.importLibrary) {
            tagLibrary.importLibrary(newLibraryName.value, fileContent.value);
          } else if (tagLibrary.addLibrary) {
            tagLibrary.addLibrary(newLibraryName.value, fileContent.value);
          } else {
            throw new Error('缺少导入库的API，请确保标签库提供必要的方法');
          }
          
          emitter.emit('notification', {
            type: 'success',
            message: `成功导入库 "${newLibraryName.value}"`
          });
        } else {
          // 扩展现有库模式
          if (!extendLibraryName.value) {
            emitter.emit('notification', {
              type: 'warning',
              message: '请选择要扩展的库'
            });
            return;
          }
          
          // 使用扩展库方法
          if (tagLibrary.extendLibrary) {
            tagLibrary.extendLibrary(extendLibraryName.value, fileContent.value);
          } else {
            // 后备方案：获取现有库，合并数据，然后替换
            const existingLibrary = tagLibrary.getLibrary(extendLibraryName.value);
            const mergedData = {...existingLibrary};
            
            // 合并分类和标签
            for (const category in fileContent.value) {
              if (Array.isArray(mergedData[category])) {
                // 已存在的分类，添加新标签
                mergedData[category] = [...mergedData[category], ...fileContent.value[category]];
              } else {
                // 新分类，直接添加
                mergedData[category] = [...fileContent.value[category]];
              }
            }
            
            // 保存合并后的数据
            if (tagLibrary.setLibrary) {
              tagLibrary.setLibrary(extendLibraryName.value, mergedData);
            } else if (tagLibrary.addLibrary) {
              tagLibrary.addLibrary(extendLibraryName.value, mergedData);
            } else {
              throw new Error('缺少更新库的API，请确保标签库提供必要的方法');
            }
          }
          
          emitter.emit('notification', {
            type: 'success',
            message: `成功扩展库 "${extendLibraryName.value}"`
          });
        }
        
        // 清空表单
        clearImport();
        
        // 通知父组件库已更新
        emit('library-updated');
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `导入失败: ${error.message}`
        });
      }
    };
    
    return {
      importMode,
      newLibraryName,
      extendLibraryName,
      fileSelected,
      handleFileSelect,
      clearImport,
      importLibrary
    };
  }
});
</script>

<style scoped>
.section {
  background-color: var(--panel-bg-color, #fff);
  border-radius: var(--border-radius-lg, 8px);
  box-shadow: var(--shadow-md, 0 1px 3px rgba(0, 0, 0, 0.1));
  padding: var(--spacing-lg, 20px);
  margin-bottom: var(--spacing-lg, 20px);
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

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: var(--text-color, #333);
  font-weight: 500;
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg, 20px);
  margin-bottom: var(--spacing-sm, 10px);
}

.radio-item {
  display: flex;
  align-items: center;
}

.radio-item input {
  margin-right: 8px;
  cursor: pointer;
}

.radio-item label {
  cursor: pointer;
  margin-bottom: 0;
}

.form-control {
  width: 100%;
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

.file-label {
  display: inline-block;
  padding: 10px 15px;
  background-color: var(--secondary-color, #f1f1f1);
  color: var(--text-color, #333);
  border-radius: var(--border-radius-sm, 4px);
  cursor: pointer;
  transition: background-color 0.2s;
}

.file-label:hover {
  background-color: var(--secondary-hover-color, #e1e1e1);
}

.file-label input {
  display: none;
}

.selected-file {
  margin-top: 10px;
  padding: 8px 12px;
  background-color: var(--success-bg-color, #e8f5e9);
  color: var(--success-color, #4CAF50);
  border-radius: var(--border-radius-sm, 4px);
  font-size: var(--font-size-sm, 0.9rem);
}

.action-group {
  display: flex;
  gap: 10px;
  margin-top: var(--spacing-md, 15px);
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

.primary-btn:disabled {
  background-color: var(--disabled-color, #ccc);
  cursor: not-allowed;
  opacity: 0.7;
  transform: none;
  box-shadow: none;
}

.secondary-btn {
  background-color: var(--bg-color-light, #f0f0f0);
  color: var(--text-color, #333);
}

.secondary-btn:hover {
  background-color: var(--bg-color-dark, #e0e0e0);
}

@media (max-width: 768px) {
  .section {
    padding: var(--spacing-md, 15px);
  }
  
  .action-group {
    flex-direction: column;
  }
  
  .action-group button {
    width: 100%;
  }
}
</style> 