<template>
  <div class="storage-settings">
    <div class="settings-section">
      <h3 class="section-title">存储状态</h3>
      <div class="storage-status">
        <div class="status-item">
          <div class="status-label">已用空间</div>
          <div class="status-value">{{ storageSizeFormatted }}</div>
        </div>
        <div class="status-item">
          <div class="status-label">可用空间</div>
          <div class="status-value">{{ storageQuotaFormatted }}</div>
        </div>
        <div class="status-item full-width">
          <div class="status-label">存储使用率</div>
          <div class="progress-wrapper">
            <div class="progress-label">{{ storageUsagePercent }}%</div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{
                  width: `${storageUsagePercent}%`, 
                  backgroundColor: getProgressColor(storageUsagePercent)
                }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="settings-section">
      <h3 class="section-title">本地备份</h3>
      <div class="settings-item">
        <div class="setting-label">导出备份</div>
        <div class="setting-control">
          <button @click="backupToFile" class="action-button primary">导出所有数据</button>
          <div class="setting-description">将所有标签库和设置数据导出为备份文件</div>
        </div>
      </div>
      
      <div class="settings-item">
        <div class="setting-label">导入数据</div>
        <div class="setting-control">
          <button @click="importAllData" class="action-button secondary">导入备份文件</button>
          <div class="setting-description">从备份文件恢复所有数据</div>
        </div>
      </div>
    </div>
    
    <div class="settings-section danger-zone">
      <h3 class="section-title warning-text">危险操作</h3>
      <div class="settings-item">
        <div class="setting-label">清除数据</div>
        <div class="setting-control">
          <button @click="confirmClearStorage" class="action-button danger">清除所有数据</button>
          <div class="setting-description warning-text">
            警告：此操作将永久删除所有标签库和设置数据，无法恢复！
          </div>
        </div>
      </div>
      
      <div class="settings-item">
        <div class="setting-label">重置应用</div>
        <div class="setting-control">
          <button @click="confirmResetApp" class="action-button danger">重置应用</button>
          <div class="setting-description warning-text">
            警告：此操作将清除所有数据并恢复默认设置，应用将回到首次安装状态！
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, inject, computed, onMounted } from 'vue';

export default defineComponent({
  name: 'StorageSettings',
  setup() {
    const emitter = inject('emitter');
    const tagLibrary = inject('tagLibrary');
    
    // 存储统计
    const storageSize = ref(0);
    const storageQuota = ref(0);
    
    // 计算属性
    const storageSizeFormatted = computed(() => {
      return formatBytes(storageSize.value);
    });
    
    const storageQuotaFormatted = computed(() => {
      return formatBytes(storageQuota.value);
    });
    
    const storageUsagePercent = computed(() => {
      if (storageQuota.value === 0) return 0;
      return Math.round((storageSize.value / storageQuota.value) * 100);
    });
    
    // 检查存储健康状态
    const checkStorageHealth = async () => {
      try {
        // 尝试访问localStorage
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        
        // 如果支持StorageManager API，获取配额信息
        if (navigator.storage && navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          storageSize.value = estimate.usage || 0;
          storageQuota.value = estimate.quota || 0;
        } else {
          // 计算localStorage大小
          let size = 0;
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            size += (key.length + value.length) * 2; // 近似值，UTF-16 编码
          }
          storageSize.value = size;
          storageQuota.value = 5 * 1024 * 1024; // 假设 5MB 限制
        }
      } catch (error) {
        console.error('存储检查失败', error);
      }
    };
    
    // 格式化字节大小
    const formatBytes = (bytes, decimals = 2) => {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };
    
    // 进度条颜色
    const getProgressColor = (percentage) => {
      if (percentage > 90) return 'var(--danger-color, #f44336)';
      if (percentage > 70) return 'var(--warning-color, #ff9800)';
      return 'var(--success-color, #4caf50)';
    };
    
    // 导出备份文件
    const backupToFile = () => {
      try {
        // 获取所有库数据
        const allData = tagLibrary.exportAllData ? 
                        tagLibrary.exportAllData() : 
                        { libraries: {} };
        
        // 创建下载链接
        const dataStr = JSON.stringify(allData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // 创建下载链接并触发点击
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `tag-library-backup-${timestamp}.json`;
        a.href = url;
        a.click();
        
        // 释放URL对象
        URL.revokeObjectURL(url);
        
        emitter.emit('notification', {
          type: 'success',
          message: '备份文件已成功导出'
        });
      } catch (error) {
        console.error('导出备份失败', error);
        emitter.emit('notification', {
          type: 'error',
          message: `导出备份失败: ${error.message}`
        });
      }
    };
    
    // 从文件导入数据
    const importAllData = () => {
      // 点击导入按钮，打开文件选择器
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json';
      
      fileInput.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!confirm('警告：导入操作可能覆盖现有数据。确定要继续吗？')) {
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            // 导入数据
            if (tagLibrary.importAllData) {
              tagLibrary.importAllData(data);
              
              emitter.emit('notification', {
                type: 'success',
                message: '数据导入成功'
              });
              
              // 刷新存储健康状态
              checkStorageHealth();
            } else {
              throw new Error('标签库不支持导入功能');
            }
          } catch (error) {
            console.error('导入数据失败', error);
            emitter.emit('notification', {
              type: 'error',
              message: `导入失败: ${error.message}`
            });
          }
        };
        
        reader.readAsText(file);
      };
      
      fileInput.click();
    };
    
    // 清除所有数据
    const confirmClearStorage = () => {
      if (confirm('警告: 确定要清除所有数据吗？此操作无法撤销!')) {
        try {
          if (tagLibrary.clearAllData) {
            tagLibrary.clearAllData();
          } else {
            localStorage.clear();
          }
          
          emitter.emit('notification', {
            type: 'success',
            message: '已清除所有数据，即将重新加载页面'
          });
          
          // 重新加载页面
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (error) {
          console.error('清除数据失败', error);
          emitter.emit('notification', {
            type: 'error',
            message: `清除数据失败: ${error.message}`
          });
        }
      }
    };
    
    // 重置应用
    const confirmResetApp = () => {
      if (confirm('警告：这将清除所有数据并恢复初始设置，应用将回到首次安装状态。确定要继续吗？')) {
        try {
          // 清除所有本地存储
          localStorage.clear();
          
          // 重置为默认设置
          const defaultSettings = {
            // 默认设置
            fontSize: 16,
            themeColor: '#2196F3',
            darkMode: false,
            // 其他默认设置...
          };
          
          // 保存默认设置
          localStorage.setItem('general_settings', JSON.stringify(defaultSettings));
          
          emitter.emit('notification', {
            type: 'success',
            message: '应用已重置，将在3秒后刷新页面'
          });
          
          // 3秒后刷新页面
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } catch (error) {
          console.error('重置应用失败', error);
          emitter.emit('notification', {
            type: 'error',
            message: `重置应用失败: ${error.message}`
          });
        }
      }
    };
    
    // 初始化
    onMounted(() => {
      checkStorageHealth();
    });
    
    return {
      storageSizeFormatted,
      storageQuotaFormatted,
      storageUsagePercent,
      getProgressColor,
      backupToFile,
      importAllData,
      confirmClearStorage,
      confirmResetApp
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

.storage-status {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.status-item {
  flex: 0 0 calc(50% - 0.5rem);
  background-color: var(--bg-color-light, #f5f5f5);
  border-radius: var(--border-radius-small, 4px);
  padding: 0.75rem;
}

.full-width {
  flex: 0 0 100%;
}

.status-label {
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
  margin-bottom: 0.25rem;
}

.status-value {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-color, #333);
}

.progress-wrapper {
  margin-top: 0.5rem;
}

.progress-label {
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.progress-bar {
  height: 8px;
  background-color: var(--border-color, #ddd);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--primary-color, #2196F3);
  border-radius: 4px;
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

.danger {
  background-color: var(--danger-color, #f44336);
  color: white;
}

.danger:hover {
  background-color: var(--danger-hover-color, #d32f2f);
}

.warning-text {
  color: var(--danger-color, #f44336);
}

.danger-zone {
  border: 1px solid var(--danger-color-light, rgba(244, 67, 54, 0.3));
  background-color: var(--danger-color-lighter, rgba(244, 67, 54, 0.05));
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

:global(.dark-mode) .status-item {
  background-color: var(--bg-color-light-dark, #333);
}

:global(.dark-mode) .status-label {
  color: var(--text-color-light-dark, #aaa);
}

:global(.dark-mode) .status-value {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .progress-bar {
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

:global(.dark-mode) .danger-zone {
  border-color: rgba(244, 67, 54, 0.5);
  background-color: rgba(244, 67, 54, 0.1);
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
  
  .status-item {
    flex: 0 0 100%;
  }
}
</style> 