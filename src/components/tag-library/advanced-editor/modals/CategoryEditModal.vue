<template>
  <div class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h4>{{ isEditing ? '重命名分类' : '添加分类' }}</h4>
        <button class="close-btn" @click="$emit('close')" title="关闭">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label>分类名称:</label>
          <input 
            type="text" 
            v-model="form.name" 
            class="form-control" 
            placeholder="输入分类名称"
            @keyup.enter="save"
          >
        </div>
      </div>
      
      <div class="modal-footer">
        <button 
          class="btn btn-secondary" 
          @click="$emit('close')"
        >取消</button>
        <button 
          class="btn btn-primary" 
          @click="save"
        >保存</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue';

export default {
  name: 'CategoryEditModal',
  props: {
    category: {
      type: Object,
      required: true
    },
    isEditing: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const form = ref({
      name: '',
      originalName: ''
    });
    
    // 监听category属性变化，更新表单
    watch(() => props.category, (newCategory) => {
      form.value = {
        name: newCategory.name || '',
        originalName: newCategory.originalName || ''
      };
    }, { immediate: true });
    
    // 保存分类
    const save = () => {
      console.log('CategoryEditModal - 保存按钮点击，表单数据:', form.value);
      
      if (!form.value.name.trim()) {
        console.error('CategoryEditModal - 分类名称为空，不执行保存');
        return;
      }
      
      // 确保传递的对象包含所有必要的属性
      const categoryData = {
        name: form.value.name.trim(),
        originalName: form.value.originalName
      };
      
      console.log('CategoryEditModal - 发送保存事件，数据:', categoryData);
      emit('save', categoryData);
    };
    
    return {
      form,
      save
    };
  }
};
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
}

.modal-content {
  background-color: var(--bg-color, #fff);
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color, #eee);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-color, #333);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: var(--text-color-light, #666);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.3s;
}

.close-btn:hover {
  color: var(--danger-color, #ff4d4f);
  background-color: var(--hover-bg-color, rgba(0, 0, 0, 0.03));
}

.modal-body {
  padding: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-color, #333);
  font-weight: 500;
}

.form-control {
  width: 100%;
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

.modal-footer {
  padding: 16px;
  border-top: 1px solid var(--border-color, #eee);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.btn-secondary {
  background-color: var(--secondary-bg-color, #f0f0f0);
  color: var(--text-color, #333);
  border: 1px solid var(--border-color, #ddd);
}

.btn-secondary:hover {
  background-color: var(--secondary-hover-color, #e6e6e6);
}

.btn-primary {
  background-color: var(--primary-color, #1677ff);
  color: #fff;
}

.btn-primary:hover {
  background-color: var(--primary-hover-color, #4096ff);
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .modal-content {
    background-color: var(--bg-color-dark, #1f1f1f);
  }
  
  .modal-header {
    border-bottom-color: var(--border-color-dark, #333);
  }
  
  .modal-header h4 {
    color: var(--text-color-dark, #eee);
  }
  
  .close-btn {
    color: var(--text-color-light-dark, #999);
  }
  
  .close-btn:hover {
    background-color: var(--hover-bg-color-dark, rgba(255, 255, 255, 0.05));
  }
  
  .form-group label {
    color: var(--text-color-dark, #eee);
  }
  
  .form-control {
    background-color: var(--input-bg-color-dark, #2c2c2c);
    border-color: var(--border-color-dark, #444);
    color: var(--text-color-dark, #eee);
  }
  
  .modal-footer {
    border-top-color: var(--border-color-dark, #333);
  }
  
  .btn-secondary {
    background-color: var(--secondary-bg-color-dark, #2c2c2c);
    color: var(--text-color-dark, #eee);
    border-color: var(--border-color-dark, #444);
  }
  
  .btn-secondary:hover {
    background-color: var(--secondary-hover-color-dark, #3c3c3c);
  }
}
</style> 