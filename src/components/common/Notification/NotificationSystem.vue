<template>
  <div class="notification-container" v-if="showNotifications">
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
import { defineComponent, ref, inject, onBeforeUnmount, onMounted, watch } from 'vue';

export default defineComponent({
  name: 'NotificationSystem',
  setup() {
    const emitter = inject('emitter');
    const notifications = ref([]);
    const showNotifications = ref(true); // 默认显示通知
    let nextId = 1;
    
    // 添加通知
    const addNotification = (notification) => {
      // 如果通知功能被禁用，直接返回
      if (!showNotifications.value) return;
      
      const id = nextId++;
      const duration = notification.duration || 2000; // 默认显示2秒
      
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
    
    // 初始化通知设置
    const initNotificationSettings = () => {
      const savedSettings = localStorage.getItem('theme_settings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          showNotifications.value = settings.showNotifications !== false;
        } catch (error) {
          console.error('加载通知设置失败:', error);
        }
      }
    };
    
    // 监听通知设置变更事件
    const unsubscribeSettings = emitter.on('notificationsSettingChanged', (enabled) => {
      showNotifications.value = enabled;
      
      // 如果禁用通知，清空当前所有通知
      if (!enabled) {
        notifications.value = [];
      }
    });
    
    // 监听通知事件
    const unsubscribeNotification = emitter.on('notification', (notification) => {
      addNotification(notification);
    });
    
    onMounted(() => {
      initNotificationSettings();
    });
    
    // 组件销毁时取消订阅
    onBeforeUnmount(() => {
      unsubscribeNotification();
      unsubscribeSettings();
    });
    
    // 优化通知系统组件的显示和消失逻辑
    watch(notifications, (newValue) => {
      // 限制同时显示的通知数量，避免堆积
      if (newValue.length > 5) {
        // 删除最早的通知，保留最新的5条
        const toRemove = newValue.length - 5;
        notifications.value = newValue.slice(toRemove);
      }
    }, { deep: true });
    
    // 优化显示通知的方法
    const showNotification = (notification) => {
      // 去重：如果有相同内容的通知，先移除它
      const existingIndex = notifications.value.findIndex(n => 
        n.message === notification.message && n.type === notification.type
      );
      
      if (existingIndex !== -1) {
        clearTimeout(notifications.value[existingIndex].timeoutId);
        notifications.value.splice(existingIndex, 1);
      }
      
      // 添加唯一ID和超时标识
      const id = Date.now() + Math.random().toString(36).substr(2, 5);
      const timeoutId = setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 3000);
      
      // 添加新通知
      notifications.value.push({
        ...notification,
        id,
        timeoutId,
        duration: notification.duration || 3000
      });
    };
    
    return {
      notifications,
      showNotifications,
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
  color: var(--primary-color, #2196F3);
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
  background-color: var(--primary-color, #2196F3);
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