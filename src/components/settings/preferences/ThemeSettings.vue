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
              @input="applyFontSize"
            />
            <span class="slider-value" :style="{ fontSize: fontSize + 'px' }">{{ fontSize }}px</span>
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
      const root = document.documentElement;
      const baseSize = fontSize.value;
      
      // 设置基础字体大小
      root.style.setProperty('--font-size-base', `${baseSize}px`);
      
      // 更新所有相关字体大小变量
      root.style.setProperty('--font-size-xs', `${baseSize * 0.85}px`);
      root.style.setProperty('--font-size-sm', `${baseSize * 0.95}px`);
      root.style.setProperty('--font-size-md', `${baseSize}px`);
      root.style.setProperty('--font-size-lg', `${baseSize * 1.2}px`);
      root.style.setProperty('--font-size-xl', `${baseSize * 1.5}px`);
      
      // 发出字体大小变更事件，以便所有相关组件能够更新
      emitter.emit('font-size-changed', baseSize);
      
      // 保存到本地存储
      localStorage.setItem('user_font_size', baseSize.toString());
      
      // 静默保存设置，不显示通知
      saveSettings(true);
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
      
      // 静默保存设置，不显示通知
      saveSettings(true);
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
    const saveSettings = (silent = false) => {
      localStorage.setItem('theme_settings', JSON.stringify({
        fontSize: fontSize.value,
        themeColor: themeColor.value,
        darkMode: darkMode.value,
        showNotifications: showNotifications.value
      }));
      
      // 仅当启用通知且不是静默模式时才显示成功提示
      if (showNotifications.value && !silent) {
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
          
          // 应用字体大小设置
          const baseSize = fontSize.value;
          const root = document.documentElement;
          root.style.setProperty('--font-size-base', `${baseSize}px`);
          root.style.setProperty('--font-size-xs', `${baseSize * 0.85}px`);
          root.style.setProperty('--font-size-sm', `${baseSize * 0.95}px`);
          root.style.setProperty('--font-size-md', `${baseSize}px`);
          root.style.setProperty('--font-size-lg', `${baseSize * 1.2}px`);
          root.style.setProperty('--font-size-xl', `${baseSize * 1.5}px`);
          
          // 应用主题颜色
          root.style.setProperty('--primary-color', themeColor.value);
          
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
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color, #333);
  border-bottom: 1px solid var(--border-color, #eee);
  padding-bottom: 12px;
}

.settings-item {
  display: flex;
  margin-bottom: 20px;
  align-items: flex-start;
}

.setting-label {
  flex: 0 0 120px;
  font-weight: 500;
  color: var(--text-color, #333);
  padding-top: 4px;
}

.setting-control {
  flex: 1;
}

.setting-description {
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
  margin-top: 6px;
}

/* 滑块样式 */
.slider-container {
  position: relative;
  width: 100%;
  max-width: 300px;
}

.slider-container.with-value {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--slider-bg-color, #e0e0e0);
  outline: none;
  transition: all 0.2s;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary-color, #1677ff);
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary-color, #1677ff);
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: none;
}

.slider::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

.slider-value {
  font-weight: 500;
  color: var(--text-color, #333);
  padding: 4px 8px;
  border-radius: 4px;
  background-color: var(--slider-value-bg, #f0f0f0);
  min-width: 60px;
  text-align: center;
}

/* 色彩选择器 */
.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 8px;
}

.color-swatch {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.color-swatch:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

.color-swatch.active {
  box-shadow: 0 0 0 2px var(--primary-color, #1677ff);
}

.color-swatch.active::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 16px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* 开关样式 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  margin-top: 2px;
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
  background-color: var(--switch-off-color, #ccc);
  border-radius: 24px;
  transition: 0.4s;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

input:checked + .toggle-slider {
  background-color: var(--primary-color, #1677ff);
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

/* 暗模式适配 */
@media (prefers-color-scheme: dark) {
  .settings-section {
    background-color: var(--panel-bg-color-dark, #1e1e1e);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  
  .section-title {
    color: var(--text-color-dark, #eee);
    border-bottom-color: var(--border-color-dark, #333);
  }
  
  .setting-label {
    color: var(--text-color-dark, #eee);
  }
  
  .setting-description {
    color: var(--text-color-light-dark, #aaa);
  }
  
  .slider {
    background: var(--slider-bg-color-dark, #444);
  }
  
  .slider-value {
    color: var(--text-color-dark, #eee);
    background-color: var(--slider-value-bg-dark, #333);
  }
  
  .toggle-slider {
    background-color: var(--switch-off-color-dark, #555);
  }
  
  .color-swatch {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }
  
  .color-swatch:hover {
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-item {
    flex-direction: column;
  }
  
  .setting-label {
    flex: none;
    margin-bottom: 8px;
    padding-top: 0;
  }
}
</style> 