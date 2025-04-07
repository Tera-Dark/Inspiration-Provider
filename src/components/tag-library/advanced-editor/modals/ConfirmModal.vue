<template>
  <div class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h4>确认删除</h4>
        <button class="close-btn" @click="$emit('cancel')" title="关闭">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="modal-body">
        <p class="confirm-message">{{ message }}</p>
      </div>
      
      <div class="modal-footer">
        <button 
          class="btn btn-secondary" 
          @click="$emit('cancel')"
        >取消</button>
        <button 
          class="btn btn-danger" 
          @click="$emit('confirm')"
        >删除</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConfirmModal',
  props: {
    message: {
      type: String,
      required: true
    }
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

.confirm-message {
  margin: 0;
  color: var(--text-color, #333);
  line-height: 1.5;
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

.btn-danger {
  background-color: var(--danger-color, #ff4d4f);
  color: #fff;
}

.btn-danger:hover {
  background-color: var(--danger-hover-color, #ff7875);
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
  
  .confirm-message {
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