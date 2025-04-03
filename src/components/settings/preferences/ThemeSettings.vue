<template>
  <div class="theme-settings">
    <div class="settings-section">
      <h3 class="section-title">界面设置</h3>
      
      <!-- 字体大小设置 -->
      <div class="settings-item">
        <div class="setting-label">字体大小</div>
        <div class="setting-control">
          <div class="slider-container with-value">
            <input 
              type="range" 
              min="12" 
              max="20" 
              step="1" 
              v-model="fontSize" 
              class="slider" 
              @change="applyFontSize"
            />
            <span class="slider-value">{{ fontSize }}px</span>
          </div>
          <div class="setting-description">调整应用的整体字体大小 (12-20像素)</div>
        </div>
      </div>
      
      <!-- 主题颜色设置 -->
      <div class="settings-item">
        <div class="setting-label">主题颜色</div>
        <div class="setting-control">
          <div class="color-picker">
            <div 
              v-for="(color, index) in themeColors" 
              :key="index"
              class="color-swatch" 
              :class="{ active: themeColor === color.value }"
              :style="{ backgroundColor: color.value }"
              @click="setThemeColor(color.value)"
              :title="color.name"
            ></div>
          </div>
          <div class="setting-description">选择应用的主题配色</div>
        </div>
      </div>
      
      <!-- 深色模式切换 -->
      <div class="settings-item">
        <div class="setting-label">深色模式</div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input type="checkbox" v-model="darkMode" @change="toggleDarkMode">
            <span class="toggle-slider"></span>
          </label>
          <div class="setting-description">切换应用的明暗主题</div>
        </div>
      </div>
      
      <!-- 通知显示切换 -->
      <div class="settings-item">
        <div class="setting-label">通知消息</div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input type="checkbox" v-model="showNotifications" @change="toggleNotifications">
            <span class="toggle-slider"></span>
          </label>
          <div class="setting-description">控制是否显示操作反馈通知消息</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, inject, onMounted } from 'vue';

export default defineComponent({
  name: 'ThemeSettings',
  setup() {
    const emitter = inject('emitter');
    
    // 字体大小设置
    const fontSize = ref(16);
    
    // 主题颜色设置
    const themeColor = ref('#2196F3');
    const themeColors = [
      { name: '宝石蓝', value: '#2196F3' },
      { name: '翡翠绿', value: '#4CAF50' },
      { name: '珊瑚红', value: '#F44336' },
      { name: '紫水晶', value: '#9C27B0' },
      { name: '琥珀黄', value: '#FF9800' },
      { name: '青玉', value: '#009688' },
      { name: '石墨黑', value: '#37474F' },
      { name: '深蓝', value: '#3F51B5' }
    ];
    
    // 深色模式设置
    const darkMode = ref(false);
    
    // 通知显示设置
    const showNotifications = ref(true);
    
    // 应用字体大小
    const applyFontSize = () => {
      document.documentElement.style.setProperty('--base-font-size', `${fontSize.value}px`);
      saveSettings();
    };
    
    // 设置主题颜色
    const setThemeColor = (color) => {
      themeColor.value = color;
      document.documentElement.style.setProperty('--primary-color', color);
      
      // 计算衍生颜色
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      
      // 计算暗色调
      const darker = `rgb(${Math.max(0, r * 0.7)}, ${Math.max(0, g * 0.7)}, ${Math.max(0, b * 0.7)})`;
      document.documentElement.style.setProperty('--primary-hover-color', darker);
      
      // 计算亮色调
      const lighter = `rgba(${r}, ${g}, ${b}, 0.1)`;
      document.documentElement.style.setProperty('--primary-light-color', lighter);
      
      saveSettings();
    };
    
    // 切换深色模式
    const toggleDarkMode = () => {
      if (darkMode.value) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
      saveSettings();
    };
    
    // 切换通知显示
    const toggleNotifications = () => {
      // 通知设置变更事件，传递给NotificationSystem组件
      emitter.emit('notificationsSettingChanged', showNotifications.value);
      saveSettings();
    };
    
    // 保存设置
    const saveSettings = () => {
      localStorage.setItem('theme_settings', JSON.stringify({
        fontSize: fontSize.value,
        themeColor: themeColor.value,
        darkMode: darkMode.value,
        showNotifications: showNotifications.value
      }));
      
      // 仅当通知启用时才显示保存成功提示
      if (showNotifications.value) {
        emitter.emit('notification', {
          type: 'success',
          message: '主题设置已保存'
        });
      }
    };
    
    // 初始化设置
    const initSettings = () => {
      // 从本地存储加载设置
      const savedSettings = localStorage.getItem('theme_settings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          
          // 应用保存的设置
          fontSize.value = settings.fontSize || 16;
          themeColor.value = settings.themeColor || '#2196F3';
          darkMode.value = settings.darkMode || false;
          showNotifications.value = settings.showNotifications !== false; // 默认启用通知
          
          // 应用设置到DOM
          document.documentElement.style.setProperty('--base-font-size', `${fontSize.value}px`);
          document.documentElement.style.setProperty('--primary-color', themeColor.value);
          
          if (darkMode.value) {
            document.body.classList.add('dark-mode');
          } else {
            document.body.classList.remove('dark-mode');
          }
          
          // 初始化时触发通知设置变更事件
          emitter.emit('notificationsSettingChanged', showNotifications.value);
          
          // 计算衍生色
          setThemeColor(themeColor.value);
        } catch (error) {
          console.error('加载主题设置失败:', error);
        }
      }
    };
    
    // 初始化
    onMounted(() => {
      initSettings();
    });
    
    return {
      fontSize,
      themeColor,
      themeColors,
      darkMode,
      showNotifications,
      applyFontSize,
      setThemeColor,
      toggleDarkMode,
      toggleNotifications
    };
  }
});
</script>

<style scoped>
.settings-section {
  background-color: var(--panel-bg-color, #ffffff);
  border-radius: var(--border-radius-medium, 8px);
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-small, 0 2px 6px rgba(0, 0, 0, 0.05));
}

.section-title {
  margin-top: 0;
  margin-bottom: 1.25rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color, #333);
  border-bottom: 1px solid var(--border-color, #eee);
  padding-bottom: 0.75rem;
}

.settings-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1.25rem;
}

.settings-item:last-child {
  margin-bottom: 0;
}

.setting-label {
  flex: 0 0 120px;
  font-weight: 500;
  padding-top: 0.25rem;
  color: var(--text-color, #333);
}

.setting-control {
  flex: 1;
}

.setting-description {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
}

.slider-container {
  position: relative;
  width: 100%;
  max-width: 300px;
}

.with-value {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.slider {
  flex: 1;
  height: 4px;
  background-color: var(--border-color, #ddd);
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: var(--primary-color, #2196F3);
  cursor: pointer;
}

.slider-value {
  flex: 0 0 48px;
  text-align: right;
  font-size: 0.9rem;
  color: var(--text-color, #333);
  font-weight: 500;
}

.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  max-width: 300px;
}

.color-swatch {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
}

.color-swatch:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.color-swatch.active {
  box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--primary-color, #2196F3);
}

.color-swatch.active::after {
  content: "✓";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 16px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 46px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--border-color, #ccc);
  transition: .4s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: var(--primary-color, #2196F3);
}

input:focus + .toggle-slider {
  box-shadow: 0 0 1px var(--primary-color, #2196F3);
}

input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

/* 深色模式 */
:global(.dark-mode) .settings-section {
  background-color: var(--panel-bg-color-dark, #1f1f1f);
  box-shadow: var(--shadow-small-dark, 0 2px 6px rgba(0, 0, 0, 0.2));
}

:global(.dark-mode) .section-title {
  color: var(--text-color-dark, #e0e0e0);
  border-color: var(--border-color-dark, #333);
}

:global(.dark-mode) .setting-label {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .setting-description {
  color: var(--text-color-light-dark, #aaa);
}

:global(.dark-mode) .slider {
  background-color: var(--border-color-dark, #444);
}

:global(.dark-mode) .slider-value {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .color-swatch.active {
  box-shadow: 0 0 0 2px #333, 0 0 0 4px var(--primary-color, #2196F3);
}

:global(.dark-mode) .toggle-slider {
  background-color: var(--border-color-dark, #444);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-item {
    flex-direction: column;
  }
  
  .setting-label {
    flex: none;
    width: 100%;
    margin-bottom: 0.5rem;
  }
}
</style> 