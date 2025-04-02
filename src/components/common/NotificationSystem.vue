<template>
  <div class="notification-container">
    <transition-group name="notification">
      <div 
        v-for="notification in notifications" 
        :key="notification.id"
        class="notification"
        :class="notification.type"
      >
        <div class="notification-content">
          <div class="notification-icon">
            <span v-if="notification.type === 'success'">✓</span>
            <span v-else-if="notification.type === 'error'">✕</span>
            <span v-else-if="notification.type === 'warning'">!</span>
            <span v-else>ℹ</span>
          </div>
          <div class="notification-message">{{ notification.message }}</div>
          <button @click="removeNotification(notification.id)" class="close-btn">&times;</button>
        </div>
        <div class="notification-progress" :style="{ animationDuration: `${notification.duration}ms` }"></div>
      </div>
    </transition-group>
  </div>
</template>

<script>
import { defineComponent, ref, inject, onBeforeUnmount } from 'vue';

export default defineComponent({
  name: 'NotificationSystem',
  setup() {
    const emitter = inject('emitter');
    const notifications = ref([]);
    let nextId = 1;
    
    // 添加通知
    const addNotification = (notification) => {
      const id = nextId++;
      const duration = notification.duration || 3000; // 默认显示3秒
      
      // 创建通知对象
      const newNotification = {
        id,
        message: notification.message,
        type: notification.type || 'info',
        duration
      };
      
      // 添加到通知列表
      notifications.value.push(newNotification);
      
      // 设置自动移除计时器
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    };
    
    // 移除通知
    const removeNotification = (id) => {
      const index = notifications.value.findIndex(n => n.id === id);
      if (index !== -1) {
        notifications.value.splice(index, 1);
      }
    };
    
    // 监听通知事件
    const unsubscribe = emitter.on('notification', (notification) => {
      addNotification(notification);
    });
    
    // 组件销毁时取消订阅
    onBeforeUnmount(() => {
      unsubscribe();
    });
    
    return {
      notifications,
      removeNotification
    };
  }
});
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 350px;
  width: 100%;
  pointer-events: none;
}

.notification {
  background-color: var(--panel-bg-color, #ffffff);
  box-shadow: var(--shadow-medium, 0 4px 12px rgba(0, 0, 0, 0.1));
  border-radius: var(--border-radius-medium, 8px);
  overflow: hidden;
  margin-bottom: 10px;
  position: relative;
  pointer-events: auto;
}

.notification-content {
  padding: 16px;
  display: flex;
  align-items: center;
}

.notification-icon {
  margin-right: 12px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.notification.success .notification-icon {
  background-color: rgba(82, 196, 26, 0.1);
  color: var(--success-color, #52c41a);
}

.notification.error .notification-icon {
  background-color: rgba(255, 77, 79, 0.1);
  color: var(--danger-color, #ff4d4f);
}

.notification.warning .notification-icon {
  background-color: rgba(250, 173, 20, 0.1);
  color: var(--warning-color, #faad14);
}

.notification.info .notification-icon {
  background-color: rgba(22, 119, 255, 0.1);
  color: var(--primary-color, #1677ff);
}

.notification-message {
  flex: 1;
  word-break: break-word;
  padding-right: 30px;
  font-size: 0.95rem;
  color: var(--text-color, #333);
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  border: none;
  background: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--text-color-light, #666);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  transition: background-color 0.2s;
  padding: 0;
}

.close-btn:hover {
  background-color: var(--bg-color-light, #f5f5f5);
}

.notification-progress {
  height: 3px;
  animation: progress-bar linear forwards;
}

.notification.success .notification-progress {
  background-color: var(--success-color, #52c41a);
}

.notification.error .notification-progress {
  background-color: var(--danger-color, #ff4d4f);
}

.notification.warning .notification-progress {
  background-color: var(--warning-color, #faad14);
}

.notification.info .notification-progress {
  background-color: var(--primary-color, #1677ff);
}

/* 进度条动画 */
@keyframes progress-bar {
  from { width: 100%; }
  to { width: 0%; }
}

/* 过渡动画 */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 深色模式 */
:global(.dark-mode) .notification {
  background-color: var(--panel-bg-color-dark, #1f1f1f);
  box-shadow: var(--shadow-medium, 0 4px 12px rgba(0, 0, 0, 0.3));
}

:global(.dark-mode) .notification-message {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .close-btn {
  color: var(--text-color-light-dark, #999);
}

:global(.dark-mode) .close-btn:hover {
  background-color: var(--bg-color-light-dark, #2c2c2c);
}

@media (max-width: 768px) {
  .notification-container {
    top: 10px;
    left: 10px;
    right: 10px;
    max-width: none;
    width: auto;
  }
}
</style> 