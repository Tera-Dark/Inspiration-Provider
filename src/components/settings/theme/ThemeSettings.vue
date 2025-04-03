<template>
  <div class="theme-settings">
    <div class="settings-section">
      <h3 class="section-title">主题选择</h3>
      
      <div class="settings-item">
        <div class="setting-label">主题模式</div>
        <div class="setting-control">
          <div class="toggle-group">
            <button 
              class="toggle-button" 
              :class="{ active: !darkMode }"
              @click="setDarkMode(false)"
            >
              浅色
            </button>
            <button 
              class="toggle-button" 
              :class="{ active: darkMode }"
              @click="setDarkMode(true)"
            >
              深色
            </button>
          </div>
          <div class="setting-description">
            选择应用程序的明暗主题
          </div>
        </div>
      </div>
      
      <div class="settings-item">
        <div class="setting-label">主题方案</div>
        <div class="setting-control">
          <div class="theme-grid">
            <div 
              v-for="theme in themes" 
              :key="theme.id"
              class="theme-option"
              :class="{ active: currentTheme === theme.id }"
              @click="setTheme(theme.id)"
            >
              <div class="theme-preview" :style="{ backgroundColor: theme.primary }">
                <div class="theme-accent" :style="{ backgroundColor: theme.secondary }"></div>
              </div>
              <div class="theme-name">{{ theme.name }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="settings-section">
      <h3 class="section-title">定制选项</h3>
      
      <div class="settings-item">
        <div class="setting-label">主色调</div>
        <div class="setting-control">
          <div class="color-picker">
            <input 
              type="color" 
              v-model="primaryColor" 
              @change="updateCustomColors"
              class="color-input"
            />
            <div class="color-value">{{ primaryColor }}</div>
          </div>
        </div>
      </div>
      
      <div class="settings-item">
        <div class="setting-label">次色调</div>
        <div class="setting-control">
          <div class="color-picker">
            <input 
              type="color" 
              v-model="secondaryColor" 
              @change="updateCustomColors"
              class="color-input"
            />
            <div class="color-value">{{ secondaryColor }}</div>
          </div>
        </div>
      </div>
      
      <div class="settings-item">
        <div class="setting-label">字体大小</div>
        <div class="setting-control">
          <div class="slider-control">
            <div class="slider-label">{{ fontSize }}px</div>
            <input 
              type="range" 
              v-model.number="fontSize" 
              min="12" 
              max="20" 
              step="1"
              @change="updateFontSize"
              class="range-slider"
            />
            <div class="slider-values">
              <span>12px</span>
              <span>16px</span>
              <span>20px</span>
            </div>
          </div>
          <div class="setting-description">
            调整应用程序的文本大小
          </div>
        </div>
      </div>
      
      <div class="settings-item">
        <div class="setting-label">边框圆角</div>
        <div class="setting-control">
          <div class="slider-control">
            <div class="slider-label">{{ borderRadius }}px</div>
            <input 
              type="range" 
              v-model.number="borderRadius" 
              min="0" 
              max="16" 
              step="1"
              @change="updateBorderRadius"
              class="range-slider"
            />
            <div class="slider-values">
              <span>0px</span>
              <span>8px</span>
              <span>16px</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="settings-item">
        <div class="setting-label">动画效果</div>
        <div class="setting-control">
          <div class="toggle-switch">
            <input 
              type="checkbox" 
              id="enableAnimations" 
              v-model="enableAnimations"
              @change="updateSettings"
            />
            <label for="enableAnimations"></label>
          </div>
          <div class="setting-description">
            启用或禁用界面动画效果
          </div>
        </div>
      </div>
    </div>
    
    <div class="settings-section">
      <h3 class="section-title">预览</h3>
      
      <div class="theme-preview-container">
        <div class="theme-preview-frame" :class="{ 'dark-preview': darkMode }">
          <div class="preview-header">
            <div class="preview-title">应用预览</div>
            <div class="preview-actions">
              <div class="preview-button"></div>
              <div class="preview-button"></div>
            </div>
          </div>
          <div class="preview-content">
            <div class="preview-sidebar">
              <div class="preview-nav-item active"></div>
              <div class="preview-nav-item"></div>
              <div class="preview-nav-item"></div>
            </div>
            <div class="preview-main">
              <div class="preview-card">
                <div class="preview-card-header"></div>
                <div class="preview-card-content"></div>
              </div>
              <div class="preview-controls">
                <div class="preview-button-primary"></div>
                <div class="preview-button-secondary"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="action-row">
        <button @click="resetToDefaults" class="action-button secondary">恢复默认</button>
        <button @click="applyChanges" class="action-button primary">应用更改</button>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, inject, computed, onMounted, watch } from 'vue';

export default defineComponent({
  name: 'ThemeSettings',
  
  setup() {
    const emitter = inject('emitter');
    
    // 主题设置
    const darkMode = ref(false);
    const currentTheme = ref('blue');
    const primaryColor = ref('#2196F3');
    const secondaryColor = ref('#37474F');
    const fontSize = ref(16);
    const borderRadius = ref(8);
    const enableAnimations = ref(true);
    
    // 预定义主题列表
    const themes = ref([
      { id: 'blue', name: '默认蓝', primary: '#2196F3', secondary: '#37474F' },
      { id: 'indigo', name: '靛蓝', primary: '#3F51B5', secondary: '#263238' },
      { id: 'purple', name: '紫色', primary: '#9C27B0', secondary: '#37474F' },
      { id: 'teal', name: '青色', primary: '#009688', secondary: '#455A64' },
      { id: 'green', name: '绿色', primary: '#4CAF50', secondary: '#2E7D32' },
      { id: 'amber', name: '琥珀', primary: '#FFC107', secondary: '#5D4037' },
      { id: 'orange', name: '橙色', primary: '#FF9800', secondary: '#4E342E' },
      { id: 'red', name: '红色', primary: '#F44336', secondary: '#37474F' },
      { id: 'custom', name: '自定义', primary: '#2196F3', secondary: '#37474F' }
    ]);
    
    // 加载设置
    const loadSettings = () => {
      try {
        const storedSettings = localStorage.getItem('theme_settings');
        if (storedSettings) {
          const settings = JSON.parse(storedSettings);
          darkMode.value = settings.darkMode || false;
          currentTheme.value = settings.theme || 'blue';
          primaryColor.value = settings.primaryColor || '#2196F3';
          secondaryColor.value = settings.secondaryColor || '#37474F';
          fontSize.value = settings.fontSize || 16;
          borderRadius.value = settings.borderRadius || 8;
          enableAnimations.value = settings.enableAnimations !== undefined ? settings.enableAnimations : true;
          
          // 应用主题设置
          applyTheme();
        }
      } catch (error) {
        console.error('加载主题设置失败', error);
      }
    };
    
    // 保存设置
    const saveSettings = () => {
      try {
        const settings = {
          darkMode: darkMode.value,
          theme: currentTheme.value,
          primaryColor: primaryColor.value,
          secondaryColor: secondaryColor.value,
          fontSize: fontSize.value,
          borderRadius: borderRadius.value,
          enableAnimations: enableAnimations.value
        };
        
        localStorage.setItem('theme_settings', JSON.stringify(settings));
      } catch (error) {
        console.error('保存主题设置失败', error);
      }
    };
    
    // 应用主题
    const applyTheme = () => {
      // 应用深色/浅色模式
      document.body.classList.toggle('dark-mode', darkMode.value);
      
      // 设置CSS变量
      const root = document.documentElement;
      const selectedTheme = themes.value.find(t => t.id === currentTheme.value) || themes.value[0];
      
      // 应用颜色
      root.style.setProperty('--primary-color', currentTheme.value === 'custom' ? primaryColor.value : selectedTheme.primary);
      root.style.setProperty('--secondary-color', currentTheme.value === 'custom' ? secondaryColor.value : selectedTheme.secondary);
      
      // 计算颜色变体（简化实现）
      const primaryRGB = hexToRgb(currentTheme.value === 'custom' ? primaryColor.value : selectedTheme.primary);
      if (primaryRGB) {
        root.style.setProperty('--primary-color-light', `rgba(${primaryRGB.r}, ${primaryRGB.g}, ${primaryRGB.b}, 0.1)`);
        root.style.setProperty('--primary-hover-color', darkenColor(currentTheme.value === 'custom' ? primaryColor.value : selectedTheme.primary, 10));
      }
      
      // 应用字体大小
      root.style.setProperty('--base-font-size', `${fontSize.value}px`);
      
      // 应用边框圆角
      root.style.setProperty('--border-radius-small', `${Math.max(2, borderRadius.value / 2)}px`);
      root.style.setProperty('--border-radius-medium', `${borderRadius.value}px`);
      root.style.setProperty('--border-radius-large', `${borderRadius.value * 1.5}px`);
      
      // 应用动画设置
      if (!enableAnimations.value) {
        root.style.setProperty('--transition-standard', 'none');
      } else {
        root.style.setProperty('--transition-standard', '0.2s ease');
      }
    };
    
    // 设置深色模式
    const setDarkMode = (value) => {
      darkMode.value = value;
      updateSettings();
    };
    
    // 设置主题
    const setTheme = (themeId) => {
      currentTheme.value = themeId;
      
      // 如果不是自定义主题，更新颜色值
      if (themeId !== 'custom') {
        const theme = themes.value.find(t => t.id === themeId);
        if (theme) {
          primaryColor.value = theme.primary;
          secondaryColor.value = theme.secondary;
        }
      }
      
      updateSettings();
    };
    
    // 更新自定义颜色
    const updateCustomColors = () => {
      currentTheme.value = 'custom';
      updateSettings();
    };
    
    // 更新字体大小
    const updateFontSize = () => {
      updateSettings();
    };
    
    // 更新边框圆角
    const updateBorderRadius = () => {
      updateSettings();
    };
    
    // 更新所有设置
    const updateSettings = () => {
      saveSettings();
      applyTheme();
    };
    
    // 应用更改
    const applyChanges = () => {
      updateSettings();
      emitter.emit('theme-changed', {
        darkMode: darkMode.value,
        theme: currentTheme.value,
        primaryColor: primaryColor.value,
        secondaryColor: secondaryColor.value
      });
      
      emitter.emit('notification', {
        type: 'success',
        message: '主题设置已应用'
      });
    };
    
    // 重置为默认设置
    const resetToDefaults = () => {
      if (confirm('确定要恢复默认主题设置吗？')) {
        darkMode.value = false;
        currentTheme.value = 'blue';
        primaryColor.value = '#2196F3';
        secondaryColor.value = '#37474F';
        fontSize.value = 16;
        borderRadius.value = 8;
        enableAnimations.value = true;
        
        updateSettings();
        
        emitter.emit('notification', {
          type: 'success',
          message: '已恢复默认主题设置'
        });
      }
    };
    
    // 辅助函数：十六进制转RGB
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };
    
    // 辅助函数：加深颜色
    const darkenColor = (hex, percent) => {
      const rgb = hexToRgb(hex);
      if (!rgb) return hex;
      
      const darken = (val) => Math.max(0, Math.floor(val * (1 - percent / 100)));
      
      return `#${
        (darken(rgb.r) | (darken(rgb.g) << 8) | (darken(rgb.b) << 16))
          .toString(16)
          .padStart(6, '0')
      }`;
    };
    
    // 初始化
    onMounted(() => {
      loadSettings();
    });
    
    // 监听暗黑模式变化
    watch(darkMode, (newValue) => {
      emitter.emit('dark-mode-toggle', newValue);
    });
    
    return {
      darkMode,
      currentTheme,
      primaryColor,
      secondaryColor,
      fontSize,
      borderRadius,
      enableAnimations,
      themes,
      setDarkMode,
      setTheme,
      updateCustomColors,
      updateFontSize,
      updateBorderRadius,
      updateSettings,
      applyChanges,
      resetToDefaults
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

.toggle-group {
  display: inline-flex;
  border-radius: var(--border-radius-small, 4px);
  overflow: hidden;
  border: 1px solid var(--border-color, #ddd);
}

.toggle-button {
  padding: 0.5rem 1rem;
  background-color: var(--bg-color-light, #f5f5f5);
  border: none;
  color: var(--text-color, #333);
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.toggle-button.active {
  background-color: var(--primary-color, #2196F3);
  color: white;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 1rem;
  margin-top: 0.5rem;
}

.theme-option {
  cursor: pointer;
  border-radius: var(--border-radius-small, 4px);
  overflow: hidden;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.theme-option.active {
  border-color: var(--primary-color, #2196F3);
}

.theme-preview {
  height: 60px;
  position: relative;
}

.theme-accent {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 20px;
}

.theme-name {
  text-align: center;
  padding: 0.5rem 0;
  font-size: 0.8rem;
  color: var(--text-color, #333);
  background-color: var(--bg-color-light, #f5f5f5);
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.color-input {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: var(--border-radius-small, 4px);
  cursor: pointer;
  overflow: hidden;
}

.color-value {
  font-family: monospace;
  font-size: 0.9rem;
  color: var(--text-color, #333);
}

.slider-control {
  width: 100%;
  max-width: 300px;
}

.slider-label {
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.range-slider {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--border-color, #ddd);
  outline: none;
  border-radius: 2px;
}

.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary-color, #2196F3);
  cursor: pointer;
}

.range-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary-color, #2196F3);
  cursor: pointer;
  border: none;
}

.slider-values {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-color-light, #666);
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-switch label {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--border-color, #ccc);
  transition: 0.4s;
  border-radius: 24px;
}

.toggle-switch label:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

.toggle-switch input:checked + label {
  background-color: var(--primary-color, #2196F3);
}

.toggle-switch input:checked + label:before {
  transform: translateX(26px);
}

.theme-preview-container {
  margin: 1rem 0;
}

.theme-preview-frame {
  border-radius: var(--border-radius-medium, 8px);
  overflow: hidden;
  border: 1px solid var(--border-color, #ddd);
  background-color: var(--bg-color-light, #f5f5f5);
}

.dark-preview {
  background-color: var(--bg-color-dark, #333);
  border-color: var(--border-color-dark, #444);
}

.preview-header {
  background-color: var(--primary-color, #2196F3);
  color: white;
  padding: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-title {
  font-weight: 500;
}

.preview-actions {
  display: flex;
  gap: 0.5rem;
}

.preview-button {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
}

.preview-content {
  display: flex;
  height: 180px;
}

.preview-sidebar {
  width: 60px;
  background-color: var(--secondary-color, #37474F);
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.preview-nav-item {
  width: 32px;
  height: 6px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.preview-nav-item.active {
  background-color: white;
}

.preview-main {
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.preview-card {
  background-color: white;
  border-radius: var(--border-radius-small, 4px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  height: 100px;
}

.dark-preview .preview-card {
  background-color: #1f1f1f;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.preview-card-header {
  background-color: var(--primary-color, #2196F3);
  height: 24px;
}

.preview-card-content {
  padding: 0.75rem;
}

.preview-controls {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.preview-button-primary {
  width: 60px;
  height: 24px;
  background-color: var(--primary-color, #2196F3);
  border-radius: var(--border-radius-small, 4px);
}

.preview-button-secondary {
  width: 60px;
  height: 24px;
  background-color: var(--secondary-color, #37474F);
  border-radius: var(--border-radius-small, 4px);
}

.action-row {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.action-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius-small, 4px);
  border: none;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.primary {
  background-color: var(--primary-color, #2196F3);
  color: white;
}

.primary:hover {
  background-color: var(--primary-hover-color, #1976D2);
}

.secondary {
  background-color: var(--bg-color-light, #f5f5f5);
  color: var(--text-color, #333);
  border: 1px solid var(--border-color, #ddd);
}

.secondary:hover {
  background-color: var(--bg-color, #eee);
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

:global(.dark-mode) .toggle-group {
  border-color: var(--border-color-dark, #444);
}

:global(.dark-mode) .toggle-button {
  background-color: var(--bg-color-light-dark, #333);
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .theme-name {
  color: var(--text-color-dark, #e0e0e0);
  background-color: var(--bg-color-light-dark, #333);
}

:global(.dark-mode) .color-value {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .range-slider {
  background: var(--border-color-dark, #444);
}

:global(.dark-mode) .slider-values {
  color: var(--text-color-light-dark, #aaa);
}

:global(.dark-mode) .toggle-switch label {
  background-color: var(--border-color-dark, #444);
}

:global(.dark-mode) .secondary {
  background-color: var(--bg-color-light-dark, #333);
  border-color: var(--border-color-dark, #444);
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .secondary:hover {
  background-color: var(--bg-color-dark, #444);
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
  
  .theme-grid {
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  }
}
</style> 