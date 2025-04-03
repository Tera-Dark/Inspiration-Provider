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
          <div class="notification-message">
            {{ notification.message }}
            <span v-if="notification.count > 1" class="notification-count">x{{ notification.count }}</span>
          </div>
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
      
      const duration = notification.duration || 2000; // 默认显示2秒
      
      // 检查是否存在相同消息的通知
      const existingNotificationIndex = notifications.value.findIndex(
        n => n.message === notification.message && n.type === notification.type
      );
      
      if (existingNotificationIndex !== -1) {
        // 如果存在相同消息，增加计数并重置计时器
        const existingNotification = notifications.value[existingNotificationIndex];
        clearTimeout(existingNotification.timerId);
        
        existingNotification.count += 1;
        existingNotification.duration = duration;
        
        // 重新设置自动移除计时器
        existingNotification.timerId = setTimeout(() => {
          removeNotification(existingNotification.id);
        }, duration);
        
        // 更新通知数组，触发视图更新
        notifications.value = [...notifications.value];
      } else {
        // 创建新通知对象
        const id = nextId++;
        const newNotification = {
          id,
          message: notification.message,
          type: notification.type || 'info',
          duration,
          count: 1,
          timerId: null
        };
        
        // 设置自动移除计时器
        newNotification.timerId = setTimeout(() => {
          removeNotification(id);
        }, duration);
        
        // 添加到通知列表
        notifications.value.push(newNotification);
      }
    };
    
    // 移除通知
    const removeNotification = (id) => {
      const index = notifications.value.findIndex(n => n.id === id);
      if (index !== -1) {
        // 清除计时器
        clearTimeout(notifications.value[index].timerId);
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
        // 清除所有计时器
        notifications.value.forEach(n => clearTimeout(n.timerId));
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
      // 清除所有计时器
      notifications.value.forEach(n => clearTimeout(n.timerId));
      unsubscribeNotification();
      unsubscribeSettings();
    });
    
    // 优化通知系统组件的显示和消失逻辑
    watch(notifications, (newValue) => {
      // 限制同时显示的通知数量，避免堆积
      if (newValue.length > 5) {
        // 先清除多余通知的计时器
        for (let i = 0; i < newValue.length - 5; i++) {
          if (newValue[i] && newValue[i].timerId) {
            clearTimeout(newValue[i].timerId);
          }
        }
        // 删除最早的通知，保留最新的5条
        notifications.value = newValue.slice(newValue.length - 5);
      }
    }, { deep: true });
    
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
  flex-shrink: 0;
  font-size: var(--font-size-lg, 18px);
  margin-right: 12px;
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

.notification-count {
  display: inline-block;
  font-size: 0.85rem;
  font-weight: bold;
  margin-left: 4px;
  padding: 1px 4px;
  border-radius: 3px;
  background-color: var(--bg-color-light, #f0f0f0);
  color: var(--text-color-light, #666);
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

:global(.dark-mode) .notification-count {
  background-color: var(--bg-color-light-dark, #333333);
  color: var(--text-color-light-dark, #aaaaaa);
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