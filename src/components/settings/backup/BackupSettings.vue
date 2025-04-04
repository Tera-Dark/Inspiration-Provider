<template>
  <div class="backup-settings">
    <div class="settings-section">
      <h3 class="section-title">自动备份</h3>
      
      <div class="settings-item">
        <div class="setting-label">启用自动备份</div>
        <div class="setting-control">
          <div class="toggle-switch">
            <input 
              type="checkbox" 
              id="autoBackup" 
              v-model="autoBackup"
              @change="saveSettings"
            />
            <label for="autoBackup"></label>
          </div>
          <div class="setting-description">
            定期自动备份所有标签库和设置数据
          </div>
        </div>
      </div>
      
      <div class="settings-item" v-if="autoBackup">
        <div class="setting-label">备份频率</div>
        <div class="setting-control">
          <div class="input-group">
            <select v-model="backupFrequency" @change="saveSettings" class="select-input">
              <option value="daily">每天</option>
              <option value="weekly">每周</option>
              <option value="monthly">每月</option>
            </select>
          </div>
          <div class="setting-description">
            选择自动备份的频率
          </div>
        </div>
      </div>
      
      <div class="settings-item" v-if="autoBackup">
        <div class="setting-label">保留备份数</div>
        <div class="setting-control">
          <div class="input-group">
            <input 
              type="number" 
              v-model="maxBackups" 
              @change="saveSettings"
              min="1" 
              max="20" 
              class="number-input"
            />
          </div>
          <div class="setting-description">
            保留的最大备份数量，超过将自动删除最早的备份
          </div>
        </div>
      </div>
    </div>
    
    <div class="settings-section">
      <h3 class="section-title">备份管理</h3>
      
      <div v-if="backups.length === 0" class="empty-state">
        <div class="empty-message">没有可用的备份</div>
      </div>
      
      <div v-else class="backup-list">
        <div class="backup-item" v-for="(backup, index) in backups" :key="index">
          <div class="backup-info">
            <div class="backup-name">{{ backup.name }}</div>
            <div class="backup-meta">
              <span class="backup-date">{{ formatDate(backup.date) }}</span>
              <span class="backup-size">{{ formatBytes(backup.size) }}</span>
            </div>
          </div>
          <div class="backup-actions">
            <button @click="restoreBackup(backup)" class="action-button secondary">
              恢复
            </button>
            <button @click="downloadBackup(backup)" class="action-button primary">
              下载
            </button>
            <button @click="deleteBackup(backup)" class="action-button danger">
              删除
            </button>
          </div>
        </div>
      </div>
      
      <div class="action-row">
        <button @click="createBackup" class="action-button primary">
          立即创建备份
        </button>
      </div>
    </div>
    
    <div class="settings-section">
      <h3 class="section-title">云同步</h3>
      
      <div class="settings-item">
        <div class="setting-label">Google Drive 同步</div>
        <div class="setting-control">
          <div class="toggle-switch">
            <input 
              type="checkbox" 
              id="googleDriveSync" 
              v-model="googleDriveSync"
              @change="saveSettings"
            />
            <label for="googleDriveSync"></label>
          </div>
          <div class="setting-description">
            将备份文件自动同步到 Google Drive
          </div>
        </div>
      </div>
      
      <div class="settings-item" v-if="googleDriveSync">
        <div class="setting-label">账号状态</div>
        <div class="setting-control">
          <div v-if="googleAccountConnected" class="account-status connected">
            <span class="account-label">已连接</span>
            <span class="account-name">{{ googleAccountName }}</span>
            <button @click="disconnectGoogleAccount" class="action-button small danger">
              断开连接
            </button>
          </div>
          <div v-else class="account-status">
            <button @click="connectGoogleAccount" class="action-button primary">
              连接账号
            </button>
          </div>
        </div>
      </div>
      
      <div class="settings-item">
        <div class="setting-label">OneDrive 同步</div>
        <div class="setting-control">
          <div class="toggle-switch">
            <input 
              type="checkbox" 
              id="oneDriveSync" 
              v-model="oneDriveSync"
              @change="saveSettings"
            />
            <label for="oneDriveSync"></label>
          </div>
          <div class="setting-description">
            将备份文件自动同步到 OneDrive
          </div>
        </div>
      </div>
      
      <div class="settings-item" v-if="oneDriveSync">
        <div class="setting-label">账号状态</div>
        <div class="setting-control">
          <div v-if="oneDriveAccountConnected" class="account-status connected">
            <span class="account-label">已连接</span>
            <span class="account-name">{{ oneDriveAccountName }}</span>
            <button @click="disconnectOneDriveAccount" class="action-button small danger">
              断开连接
            </button>
          </div>
          <div v-else class="account-status">
            <button @click="connectOneDriveAccount" class="action-button primary">
              连接账号
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 添加数据清除功能区域 -->
    <div class="settings-section danger-zone">
      <h3 class="section-title">数据清除</h3>
      
      <div class="warning-text">
        <strong>警告：</strong> 以下操作会删除数据，请谨慎操作。所有操作无法撤销。
      </div>
      
      <div class="settings-item">
        <div class="setting-label">清除历史记录</div>
        <div class="setting-control">
          <button @click="clearHistory" class="action-button warning">
            清除历史记录
          </button>
          <div class="setting-description">
            删除所有抽签历史记录，不影响标签库数据。
          </div>
        </div>
      </div>
      
      <div class="settings-item">
        <div class="setting-label">清除标签库</div>
        <div class="setting-control">
          <div class="select-action">
            <select v-model="selectedLibraryToClear" class="select-input">
              <option value="">-- 选择要清除的库 --</option>
              <option v-for="lib in libraries" :key="lib" :value="lib">
                {{ lib }}
              </option>
            </select>
            <button 
              @click="clearSelectedLibrary" 
              class="action-button warning"
              :disabled="!selectedLibraryToClear"
            >
              清除选中的库
            </button>
          </div>
          <div class="setting-description">
            删除指定标签库的所有数据。
          </div>
        </div>
      </div>
      
      <div class="settings-item">
        <div class="setting-label">清除所有数据</div>
        <div class="setting-control">
          <button @click="clearAllData" class="action-button danger">
            清除所有数据
          </button>
          <div class="setting-description">
            删除所有标签库、历史记录和设置。此操作将重置整个应用。
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, inject, onMounted, computed } from 'vue';

export default defineComponent({
  name: 'BackupSettings',
  
  setup() {
    const emitter = inject('emitter');
    const tagLibrary = inject('tagLibrary');
    
    // 自动备份设置
    const autoBackup = ref(false);
    const backupFrequency = ref('daily');
    const maxBackups = ref(5);
    
    // 云同步设置
    const googleDriveSync = ref(false);
    const googleAccountConnected = ref(false);
    const googleAccountName = ref('');
    
    const oneDriveSync = ref(false);
    const oneDriveAccountConnected = ref(false);
    const oneDriveAccountName = ref('');
    
    // 备份列表
    const backups = ref([]);
    
    // 数据清除相关
    const libraries = ref([]);
    const selectedLibraryToClear = ref('');
    
    // 加载设置
    const loadSettings = () => {
      try {
        const storedSettings = localStorage.getItem('backup_settings');
        if (storedSettings) {
          const settings = JSON.parse(storedSettings);
          autoBackup.value = settings.autoBackup || false;
          backupFrequency.value = settings.backupFrequency || 'daily';
          maxBackups.value = settings.maxBackups || 5;
          googleDriveSync.value = settings.googleDriveSync || false;
          oneDriveSync.value = settings.oneDriveSync || false;
        }
        
        // 加载账号连接状态
        const googleAccount = localStorage.getItem('google_account');
        if (googleAccount) {
          const account = JSON.parse(googleAccount);
          googleAccountConnected.value = account.connected || false;
          googleAccountName.value = account.name || '';
        }
        
        const oneDriveAccount = localStorage.getItem('onedrive_account');
        if (oneDriveAccount) {
          const account = JSON.parse(oneDriveAccount);
          oneDriveAccountConnected.value = account.connected || false;
          oneDriveAccountName.value = account.name || '';
        }
        
        // 加载备份列表
        loadBackups();
      } catch (error) {
        console.error('加载备份设置失败', error);
      }
    };
    
    // 保存设置
    const saveSettings = () => {
      try {
        const settings = {
          autoBackup: autoBackup.value,
          backupFrequency: backupFrequency.value,
          maxBackups: maxBackups.value,
          googleDriveSync: googleDriveSync.value,
          oneDriveSync: oneDriveSync.value
        };
        
        localStorage.setItem('backup_settings', JSON.stringify(settings));
        
        // 如果启用自动备份，设置备份计划
        if (autoBackup.value) {
          scheduleBackup();
        }
        
        emitter.emit('notification', {
          type: 'success',
          message: '备份设置已保存'
        });
      } catch (error) {
        console.error('保存备份设置失败', error);
        emitter.emit('notification', {
          type: 'error',
          message: `保存设置失败: ${error.message}`
        });
      }
    };
    
    // 加载备份列表
    const loadBackups = () => {
      try {
        const storedBackups = localStorage.getItem('backups');
        if (storedBackups) {
          backups.value = JSON.parse(storedBackups);
        }
      } catch (error) {
        console.error('加载备份列表失败', error);
        backups.value = [];
      }
    };
    
    // 格式化日期
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString();
    };
    
    // 格式化文件大小
    const formatBytes = (bytes, decimals = 2) => {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };
    
    // 创建备份
    const createBackup = async () => {
      try {
        // 获取所有库数据
        const allData = tagLibrary.exportAllData ? 
                        tagLibrary.exportAllData() : 
                        { libraries: {} };
        
        const dataStr = JSON.stringify(allData);
        const timestamp = new Date().toISOString();
        const backupName = `备份_${new Date().toLocaleDateString().replace(/\//g, '-')}`;
        
        // 创建备份对象
        const newBackup = {
          id: `backup_${Date.now()}`,
          name: backupName,
          date: timestamp,
          size: dataStr.length,
          data: dataStr
        };
        
        // 添加到备份列表
        backups.value.push(newBackup);
        
        // 如果超过最大备份数，删除最早的备份
        if (backups.value.length > maxBackups.value) {
          backups.value.sort((a, b) => new Date(a.date) - new Date(b.date));
          backups.value.splice(0, backups.value.length - maxBackups.value);
        }
        
        // 保存备份列表
        localStorage.setItem('backups', JSON.stringify(backups.value));
        
        // 如果启用云同步，同步备份
        if (googleDriveSync.value && googleAccountConnected.value) {
          // 同步到 Google Drive (模拟)
          console.log('同步备份到 Google Drive');
        }
        
        if (oneDriveSync.value && oneDriveAccountConnected.value) {
          // 同步到 OneDrive (模拟)
          console.log('同步备份到 OneDrive');
        }
        
        emitter.emit('notification', {
          type: 'success',
          message: '备份创建成功'
        });
      } catch (error) {
        console.error('创建备份失败', error);
        emitter.emit('notification', {
          type: 'error',
          message: `创建备份失败: ${error.message}`
        });
      }
    };
    
    // 恢复备份
    const restoreBackup = (backup) => {
      if (confirm('确定要从此备份恢复数据吗？当前数据将被覆盖。')) {
        try {
          // 解析备份数据
          const data = JSON.parse(backup.data);
          
          // 恢复数据
          if (tagLibrary.importAllData) {
            tagLibrary.importAllData(data);
            
            emitter.emit('notification', {
              type: 'success',
              message: '数据已成功恢复'
            });
          } else {
            throw new Error('标签库不支持导入功能');
          }
        } catch (error) {
          console.error('恢复备份失败', error);
          emitter.emit('notification', {
            type: 'error',
            message: `恢复备份失败: ${error.message}`
          });
        }
      }
    };
    
    // 下载备份
    const downloadBackup = (backup) => {
      try {
        // 创建下载链接
        const blob = new Blob([backup.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // 创建下载链接并触发点击
        const a = document.createElement('a');
        a.download = `${backup.name.replace(/\s/g, '-')}.json`;
        a.href = url;
        a.click();
        
        // 释放URL对象
        URL.revokeObjectURL(url);
        
        emitter.emit('notification', {
          type: 'success',
          message: '备份文件已下载'
        });
      } catch (error) {
        console.error('下载备份失败', error);
        emitter.emit('notification', {
          type: 'error',
          message: `下载备份失败: ${error.message}`
        });
      }
    };
    
    // 删除备份
    const deleteBackup = (backup) => {
      if (confirm('确定要删除此备份吗？')) {
        try {
          // 从备份列表中移除
          const index = backups.value.findIndex(b => b.id === backup.id);
          if (index !== -1) {
            backups.value.splice(index, 1);
            
            // 保存备份列表
            localStorage.setItem('backups', JSON.stringify(backups.value));
            
            emitter.emit('notification', {
              type: 'success',
              message: '备份已删除'
            });
          }
        } catch (error) {
          console.error('删除备份失败', error);
          emitter.emit('notification', {
            type: 'error',
            message: `删除备份失败: ${error.message}`
          });
        }
      }
    };
    
    // 设置备份计划
    const scheduleBackup = () => {
      // 在实际应用中，这里应该设置定时备份
      console.log(`设置自动备份计划: ${backupFrequency.value}`);
    };
    
    // 连接 Google 账号
    const connectGoogleAccount = () => {
      // 模拟连接 Google 账号
      setTimeout(() => {
        googleAccountConnected.value = true;
        googleAccountName.value = 'user@gmail.com';
        
        // 保存账号信息
        localStorage.setItem('google_account', JSON.stringify({
          connected: true,
          name: 'user@gmail.com'
        }));
        
        emitter.emit('notification', {
          type: 'success',
          message: 'Google Drive 账号已连接'
        });
      }, 1000);
    };
    
    // 断开 Google 账号
    const disconnectGoogleAccount = () => {
      if (confirm('确定要断开 Google Drive 连接吗？')) {
        googleAccountConnected.value = false;
        googleAccountName.value = '';
        
        // 保存账号信息
        localStorage.setItem('google_account', JSON.stringify({
          connected: false,
          name: ''
        }));
        
        emitter.emit('notification', {
          type: 'success',
          message: 'Google Drive 账号已断开连接'
        });
      }
    };
    
    // 连接 OneDrive 账号
    const connectOneDriveAccount = () => {
      // 模拟连接 OneDrive 账号
      setTimeout(() => {
        oneDriveAccountConnected.value = true;
        oneDriveAccountName.value = 'user@outlook.com';
        
        // 保存账号信息
        localStorage.setItem('onedrive_account', JSON.stringify({
          connected: true,
          name: 'user@outlook.com'
        }));
        
        emitter.emit('notification', {
          type: 'success',
          message: 'OneDrive 账号已连接'
        });
      }, 1000);
    };
    
    // 断开 OneDrive 账号
    const disconnectOneDriveAccount = () => {
      if (confirm('确定要断开 OneDrive 连接吗？')) {
        oneDriveAccountConnected.value = false;
        oneDriveAccountName.value = '';
        
        // 保存账号信息
        localStorage.setItem('onedrive_account', JSON.stringify({
          connected: false,
          name: ''
        }));
        
        emitter.emit('notification', {
          type: 'success',
          message: 'OneDrive 账号已断开连接'
        });
      }
    };
    
    // 加载所有标签库名称
    const loadLibraryNames = () => {
      try {
        if (tagLibrary && tagLibrary.getLibraryNames) {
          libraries.value = tagLibrary.getLibraryNames();
        } else {
          libraries.value = [];
        }
      } catch (error) {
        console.error('加载标签库名称失败', error);
        libraries.value = [];
      }
    };
    
    // 清除历史记录
    const clearHistory = () => {
      if (confirm('确定要清除所有历史记录吗？此操作无法撤销。')) {
        try {
          if (tagLibrary && tagLibrary.clearHistory) {
            tagLibrary.clearHistory();
            
            emitter.emit('notification', {
              type: 'success',
              message: '已清除所有历史记录'
            });
          } else {
            throw new Error('清除历史记录功能不可用');
          }
        } catch (error) {
          console.error('清除历史记录失败', error);
          emitter.emit('notification', {
            type: 'error',
            message: `清除历史记录失败: ${error.message}`
          });
        }
      }
    };
    
    // 清除选中的标签库
    const clearSelectedLibrary = () => {
      if (!selectedLibraryToClear.value) {
        emitter.emit('notification', {
          type: 'warning',
          message: '请先选择要清除的标签库'
        });
        return;
      }
      
      if (confirm(`确定要清除"${selectedLibraryToClear.value}"标签库吗？此操作无法撤销。`)) {
        try {
          if (tagLibrary && tagLibrary.deleteLibrary) {
            const result = tagLibrary.deleteLibrary(selectedLibraryToClear.value);
            
            if (result) {
              // 刷新库列表
              loadLibraryNames();
              selectedLibraryToClear.value = '';
              
              emitter.emit('notification', {
                type: 'success',
                message: `已清除"${selectedLibraryToClear.value}"标签库`
              });
              
              // 触发标签库更新事件
              emitter.emit('tagLibraryUpdated');
            } else {
              throw new Error('无法清除默认标签库或库不存在');
            }
          } else {
            throw new Error('清除标签库功能不可用');
          }
        } catch (error) {
          console.error('清除标签库失败', error);
          emitter.emit('notification', {
            type: 'error',
            message: `清除标签库失败: ${error.message}`
          });
        }
      }
    };
    
    // 清除所有数据
    const clearAllData = () => {
      if (confirm('警告：确定要清除所有数据吗？这将删除所有标签库、历史记录和设置，此操作无法撤销！')) {
        try {
          // 清除所有本地存储
          localStorage.clear();
          
          emitter.emit('notification', {
            type: 'success',
            message: '已清除所有数据，即将重新加载页面'
          });
          
          // 延迟一秒后重新加载页面
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (error) {
          console.error('清除所有数据失败', error);
          emitter.emit('notification', {
            type: 'error',
            message: `清除所有数据失败: ${error.message}`
          });
        }
      }
    };
    
    // 初始化
    onMounted(() => {
      loadSettings();
      loadLibraryNames();
    });
    
    return {
      autoBackup,
      backupFrequency,
      maxBackups,
      googleDriveSync,
      googleAccountConnected,
      googleAccountName,
      oneDriveSync,
      oneDriveAccountConnected,
      oneDriveAccountName,
      backups,
      saveSettings,
      formatDate,
      formatBytes,
      createBackup,
      restoreBackup,
      downloadBackup,
      deleteBackup,
      connectGoogleAccount,
      disconnectGoogleAccount,
      connectOneDriveAccount,
      disconnectOneDriveAccount,
      libraries,
      selectedLibraryToClear,
      clearHistory,
      clearSelectedLibrary,
      clearAllData
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
  border-radius: 12px;
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

.input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.select-input, .number-input {
  padding: 0.5rem;
  border-radius: var(--border-radius-small, 4px);
  border: 1px solid var(--border-color, #ddd);
  font-size: 0.9rem;
  background-color: var(--bg-color-light, #f5f5f5);
  color: var(--text-color, #333);
}

.select-input {
  min-width: 120px;
}

.number-input {
  width: 80px;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--text-color-light, #666);
  background-color: var(--bg-color-light, #f5f5f5);
  border-radius: var(--border-radius-small, 4px);
}

.backup-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.backup-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background-color: var(--bg-color-light, #f5f5f5);
  border-radius: var(--border-radius-small, 4px);
}

.backup-info {
  flex: 1;
}

.backup-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: var(--text-color, #333);
}

.backup-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
}

.backup-actions {
  display: flex;
  gap: 0.5rem;
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

.action-button.small {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
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

.action-row {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}

.account-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.account-status.connected {
  background-color: var(--success-color-lighter, rgba(76, 175, 80, 0.1));
  padding: 0.5rem 0.75rem;
  border-radius: var(--border-radius-small, 4px);
  border: 1px solid var(--success-color-light, rgba(76, 175, 80, 0.3));
}

.account-label {
  color: var(--success-color, #4caf50);
  font-weight: 500;
  font-size: 0.85rem;
}

.account-name {
  font-weight: 500;
  color: var(--text-color, #333);
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

:global(.dark-mode) .toggle-switch label {
  background-color: var(--border-color-dark, #444);
}

:global(.dark-mode) .select-input,
:global(.dark-mode) .number-input {
  background-color: var(--bg-color-light-dark, #333);
  border-color: var(--border-color-dark, #444);
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .empty-state {
  background-color: var(--bg-color-light-dark, #333);
  color: var(--text-color-light-dark, #aaa);
}

:global(.dark-mode) .backup-item {
  background-color: var(--bg-color-light-dark, #333);
}

:global(.dark-mode) .backup-name {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .backup-meta {
  color: var(--text-color-light-dark, #aaa);
}

:global(.dark-mode) .secondary {
  background-color: var(--bg-color-light-dark, #333);
  border-color: var(--border-color-dark, #444);
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .secondary:hover {
  background-color: var(--bg-color-dark, #444);
}

:global(.dark-mode) .account-status.connected {
  background-color: rgba(76, 175, 80, 0.15);
  border-color: rgba(76, 175, 80, 0.4);
}

:global(.dark-mode) .account-name {
  color: var(--text-color-dark, #e0e0e0);
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
  
  .backup-item {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .backup-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

/* 数据清除区域样式 */
.danger-zone {
  border: 1px solid var(--danger-color-light, rgba(244, 67, 54, 0.3));
  background-color: var(--danger-color-lighter, rgba(244, 67, 54, 0.05));
}

.warning-text {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: rgba(255, 193, 7, 0.1);
  border-left: 4px solid var(--warning-color, #ffc107);
  border-radius: 2px;
  color: var(--text-color-dark, #333);
}

.select-action {
  display: flex;
  align-items: center;
  gap: 8px;
}

.select-action .select-input {
  flex: 1;
}

.action-button.warning {
  background-color: var(--warning-color, #ffc107);
  color: #333;
}

.action-button.warning:hover {
  background-color: #e6ac00;
}

.action-button.danger {
  background-color: var(--danger-color, #f44336);
  color: white;
}

.action-button.danger:hover {
  background-color: var(--danger-hover-color, #d32f2f);
}

/* 响应式设计调整 */
@media (max-width: 768px) {
  .select-action {
    flex-direction: column;
    align-items: stretch;
  }
  
  .select-action .select-input {
    margin-bottom: 8px;
  }
}
</style> 