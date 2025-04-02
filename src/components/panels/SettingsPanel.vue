<template>
  <div class="panel">
    <div class="panel-header">
      <h2>设置</h2>
    </div>
    <div class="panel-content">
      <div class="settings-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id" 
          :class="['tab-btn', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.name }}
        </button>
      </div>
      
      <!-- 标签库管理 -->
      <div class="tab-content" v-show="activeTab === 'library'">
        <div class="library-control">
          <div class="form-group">
            <label for="library-select">当前标签库</label>
            <select id="library-select" v-model="currentLibrary" class="form-control">
              <option v-for="lib in libraryNames" :key="lib" :value="lib">
                {{ lib }} ({{ getTagCountByLibrary(lib) }}个标签)
              </option>
            </select>
          </div>
          
          <div class="library-stats" v-if="currentLibrary">
            <div class="stat-item">
              <span class="stat-label">分类数:</span>
              <span class="stat-value">{{ currentCategories.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">标签总数:</span>
              <span class="stat-value">{{ totalTagCount }}</span>
            </div>
          </div>
        </div>
        
        <div class="setting-card">
          <h3>库管理</h3>
          <div class="form-group">
            <input 
              type="text" 
              v-model="createLibraryName" 
              placeholder="新库名称" 
              class="form-control"
            />
            <button @click="createEmptyLibrary" class="btn btn-primary" :disabled="!createLibraryName">创建空库</button>
          </div>
          
          <button @click="deleteCurrentLibrary" class="btn btn-danger" :disabled="libraryNames.length <= 1">删除当前库</button>
        </div>
        
        <div class="setting-card">
          <h3>高级管理</h3>
          
          <div class="advanced-section">
            <h4>复制标签库</h4>
            <div class="form-group">
              <div class="input-group">
                <select v-model="duplicateSource" class="form-control">
                  <option value="">选择源库</option>
                  <option v-for="lib in libraryNames" :key="`dup-${lib}`" :value="lib">{{ lib }}</option>
                </select>
                <input
                  type="text"
                  v-model="duplicateTarget"
                  placeholder="新库名称"
                  class="form-control"
                />
                <button @click="duplicateLibrary" class="btn btn-primary" :disabled="!duplicateSource || !duplicateTarget">复制</button>
              </div>
            </div>
          </div>
          
          <div class="advanced-section">
            <h4>重命名标签库</h4>
            <div class="form-group">
              <div class="input-group">
                <select v-model="renameSource" class="form-control">
                  <option value="">选择要重命名的库</option>
                  <option v-for="lib in libraryNames" :key="`rename-${lib}`" :value="lib">{{ lib }}</option>
                </select>
                <input
                  type="text"
                  v-model="renameTarget"
                  placeholder="新名称"
                  class="form-control"
                />
                <button @click="renameLibrary" class="btn btn-primary" :disabled="!renameSource || !renameTarget">重命名</button>
              </div>
            </div>
          </div>
          
          <div class="advanced-section">
            <h4>合并标签库</h4>
            <div class="form-group">
              <div class="input-group">
                <select v-model="mergeSource" class="form-control">
                  <option value="">选择源库</option>
                  <option v-for="lib in libraryNames" :key="`merge-src-${lib}`" :value="lib">{{ lib }}</option>
                </select>
                <select v-model="mergeTarget" class="form-control">
                  <option value="">选择目标库</option>
                  <option v-for="lib in libraryNames" :key="`merge-tgt-${lib}`" :value="lib">{{ lib }}</option>
                </select>
                <button @click="mergeLibraries" class="btn btn-primary" :disabled="!mergeSource || !mergeTarget || mergeSource === mergeTarget">合并</button>
              </div>
              <div class="help-text">将源库中的标签合并到目标库中，自动去除重复标签</div>
            </div>
          </div>
          
          <div class="advanced-section">
            <h4>清理与优化</h4>
            <div class="form-group">
              <div class="input-group">
                <select v-model="cleanupTarget" class="form-control">
                  <option value="">选择要清理的库</option>
                  <option v-for="lib in libraryNames" :key="`cleanup-${lib}`" :value="lib">{{ lib }}</option>
                </select>
                <button @click="cleanEmptyCategories" class="btn btn-secondary" :disabled="!cleanupTarget">清理空分类</button>
                <button @click="cleanDuplicateTags" class="btn btn-secondary" :disabled="!cleanupTarget">去除重复标签</button>
              </div>
            </div>
          </div>
          
          <div class="advanced-section">
            <h4>分类管理</h4>
            <div class="form-group">
              <div class="input-group">
                <select v-model="categoryManageLib" class="form-control">
                  <option value="">选择标签库</option>
                  <option v-for="lib in libraryNames" :key="`cat-lib-${lib}`" :value="lib">{{ lib }}</option>
                </select>
              </div>
              
              <div v-if="categoryManageLib" class="category-manager">
                <div class="category-list">
                  <div class="list-header">分类列表</div>
                  <div v-if="libCategories.length === 0" class="empty-message">
                    没有分类
                  </div>
                  <div v-else class="category-items">
                    <div 
                      v-for="category in libCategories" 
                      :key="category"
                      class="category-item"
                      @click="selectCategory(category)"
                      :class="{ active: selectedCategory === category }"
                    >
                      {{ category }}
                      <span class="badge">{{ getCategoryTagCount(category) }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="category-actions">
                  <div class="action-group">
                    <input
                      type="text"
                      v-model="newCategoryName"
                      placeholder="新分类名称"
                      class="form-control"
                    />
                    <button 
                      @click="moveSelectedCategory" 
                      class="btn btn-secondary"
                      :disabled="!selectedCategory || !newCategoryName"
                    >
                      移动分类
                    </button>
                  </div>
                  <div class="help-text">将选中分类及其标签移动到新分类</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="setting-card">
          <h3>导入标签库</h3>
          <div class="radio-group">
            <div class="radio-item">
              <input type="radio" id="import-new" v-model="importMode" value="new">
              <label for="import-new">创建新库</label>
            </div>
            <div class="radio-item">
              <input type="radio" id="import-extend" v-model="importMode" value="extend">
              <label for="import-extend">扩展现有库</label>
            </div>
          </div>
          
          <div v-if="importMode === 'new'" class="form-group">
            <input 
              type="text" 
              v-model="newLibraryName" 
              placeholder="新库名称" 
              class="form-control"
            />
          </div>
          <div v-else class="form-group">
            <select v-model="extendLibraryName" class="form-control">
              <option disabled value="">选择要扩展的库</option>
              <option v-for="lib in libraryNames" :key="lib" :value="lib">
                {{ lib }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <input 
              type="file" 
              id="import-file" 
              @change="handleFileImport" 
              accept=".json" 
              class="form-control"
            />
          </div>
          
          <div class="button-group">
            <button 
              @click="importLibrary" 
              class="btn btn-primary" 
              :disabled="!selectedFile || (importMode === 'new' && !newLibraryName) || (importMode === 'extend' && !extendLibraryName)"
            >
              导入
            </button>
            <button @click="exportLibrary" class="btn btn-secondary">导出当前库</button>
          </div>
        </div>
        
        <div class="setting-card">
          <h3>高级管理</h3>
          <p class="description">标签库高级管理工具，可对标签进行批量处理、分类管理等操作</p>
          <button @click="openAdvancedEditor" class="btn btn-primary">打开高级编辑器</button>
        </div>
      </div>
      
      <!-- 用户偏好设置 -->
      <div class="tab-content" v-show="activeTab === 'preference'">
        <div class="setting-card">
          <h3>界面设置</h3>
          
          <div class="option-item">
            <label class="switch-container">
              <input type="checkbox" v-model="settings.darkMode" class="toggle-switch" />
              <span class="switch-slider"></span>
              <span class="switch-text">深色模式</span>
            </label>
            <p class="option-description">切换深色/浅色主题</p>
          </div>
          
          <div class="option-item">
            <label class="switch-container">
              <input type="checkbox" v-model="settings.compactLayout" class="toggle-switch" />
              <span class="switch-slider"></span>
              <span class="switch-text">紧凑布局</span>
            </label>
            <p class="option-description">减小界面元素间距，显示更多内容</p>
          </div>
          
          <div class="option-item">
            <label>字体大小</label>
            <div class="slider-container">
              <input 
                type="range" 
                v-model.number="settings.fontSize" 
                min="12" 
                max="18" 
                step="1" 
                class="slider-control"
              />
              <span class="slider-value">{{ settings.fontSize }}px</span>
            </div>
            <p class="option-description">调整界面整体字体大小</p>
          </div>
          
          <div class="option-item">
            <label>主题颜色</label>
            <div class="color-selector">
              <div 
                v-for="color in themeColors" 
                :key="color.value"
                class="color-option"
                :class="{ active: settings.themeColor === color.value }"
                :style="{ backgroundColor: color.hex }"
                @click="settings.themeColor = color.value"
              ></div>
            </div>
          </div>
        </div>
        
        <div class="setting-card">
          <h3>历史记录</h3>
          
          <div class="option-item">
            <label class="switch-container">
              <input type="checkbox" v-model="settings.autoSave" class="toggle-switch" />
              <span class="switch-slider"></span>
              <span class="switch-text">自动保存历史记录</span>
            </label>
            <p class="option-description">自动记录每次抽签结果，便于后续查看和分析</p>
          </div>
          
          <div class="option-item">
            <label>最大历史记录数量</label>
            <div class="range-with-value">
              <input 
                type="range" 
                v-model.number="settings.maxHistorySize" 
                min="5" 
                max="500"
                step="5"
                class="slider-control"
              />
              <input 
                type="number" 
                v-model.number="settings.maxHistorySize" 
                min="5" 
                max="500" 
                class="form-control small"
              />
            </div>
            <p class="option-description">设置历史记录的最大存储数量，过多记录可能占用较多存储空间</p>
          </div>
          
          <div class="button-group">
            <button @click="clearHistory" class="btn btn-danger">
              <span class="btn-icon">🗑️</span> 清空历史记录
            </button>
            <button @click="exportHistory" class="btn btn-secondary">
              <span class="btn-icon">📤</span> 导出历史记录
            </button>
            <button @click="importHistory" class="btn btn-secondary">
              <span class="btn-icon">📥</span> 导入历史记录
            </button>
          </div>
          
          <div class="form-group history-import" v-if="showHistoryImport">
            <input 
              type="file" 
              id="history-file" 
              @change="handleHistoryFileSelect" 
              accept=".json" 
              class="form-control"
            />
            <button 
              @click="mergeHistoryRecords" 
              class="btn btn-primary" 
              :disabled="!historyFile"
            >
              导入历史
            </button>
          </div>
        </div>

        <div class="setting-card">
          <h3>抽签行为</h3>
          
          <div class="option-item">
            <label class="switch-container">
              <input type="checkbox" v-model="settings.allowDuplicates" class="toggle-switch" />
              <span class="switch-slider"></span>
              <span class="switch-text">允许重复抽取</span>
            </label>
            <p class="option-description">允许同一标签在一次抽取中多次出现</p>
          </div>
          
          <div class="option-item">
            <label class="switch-container">
              <input type="checkbox" v-model="settings.showConfetti" class="toggle-switch" />
              <span class="switch-slider"></span>
              <span class="switch-text">显示抽取动画</span>
            </label>
            <p class="option-description">抽取标签时显示视觉特效和动画</p>
          </div>
          
          <div class="option-item">
            <label>默认抽取数量</label>
            <input 
              type="number" 
              v-model.number="settings.defaultDrawCount" 
              min="1" 
              max="50" 
              class="form-control small"
            />
            <p class="option-description">设置每次抽取的默认标签数量</p>
          </div>
        </div>
      </div>
      
      <!-- 数据与备份 -->
      <div class="tab-content" v-show="activeTab === 'data'">
        <div class="setting-card">
          <h3>数据存储</h3>
          
          <div class="option-item">
            <label>存储位置</label>
            <select v-model="settings.storageType" class="form-control">
              <option value="local">浏览器本地存储</option>
              <option value="cloud" disabled>云端同步（即将推出）</option>
              <option value="file" disabled>本地文件（即将推出）</option>
            </select>
          </div>
          
          <div class="option-item storage-stats">
            <div class="stat-item">
              <span class="stat-label">已用空间:</span>
              <span class="stat-value">{{ usedStorage || '计算中...' }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">可用空间:</span>
              <span class="stat-value">{{ availableStorage || '计算中...' }}</span>
            </div>
          </div>
        </div>
        
        <div class="setting-card">
          <h3>备份与恢复</h3>
          <p class="description">备份所有数据，包括标签库、历史记录和设置</p>
          
          <div class="button-group">
            <button @click="backupAllData" class="btn btn-primary">备份所有数据</button>
            <button @click="importBackup" class="btn btn-secondary">导入备份</button>
          </div>
          
          <div class="form-group backup-import" v-if="showBackupImport">
            <input 
              type="file" 
              id="backup-file" 
              @change="handleBackupFileSelect" 
              accept=".json" 
              class="form-control"
            />
            <button 
              @click="restoreFromBackup" 
              class="btn btn-primary" 
              :disabled="!backupFile"
            >
              恢复备份
            </button>
          </div>
        </div>
        
        <div class="setting-card danger-zone">
          <h3>危险区域</h3>
          <p class="description">这些操作将永久删除数据，无法恢复</p>
          
          <div class="button-group">
            <button @click="clearAllData" class="btn btn-danger">清空所有数据</button>
            <button @click="resetSettings" class="btn btn-danger">恢复默认设置</button>
          </div>
        </div>
      </div>
      
      <!-- 关于 -->
      <div class="tab-content" v-show="activeTab === 'about'">
        <div class="setting-card about-info">
          <h3>关于应用</h3>
          <div class="app-info">
            <p class="app-name">标签抽签工具</p>
            <p class="app-version">版本 1.2.0</p>
            <p class="app-description">
              一个用于管理和随机抽取标签的工具，适用于创意激发、随机选择等场景。支持多标签库、历史记录、权重抽取等高级功能。
            </p>
          </div>
          
          <div class="developer-info">
            <h4>开发信息</h4>
            <p>开发者: 蘭</p>
            <p>联系邮箱: 3503146143@qq.com</p>
            <p>更新日志: <a href="#" @click.prevent="showChangelog">查看</a></p>
          </div>
        </div>
        
        <div class="setting-card">
          <h3>系统诊断</h3>
          <div class="diagnostics-report">
            <div class="diag-item">
              <span class="diag-label">浏览器:</span>
              <span class="diag-value">{{ systemInfo.browser }}</span>
            </div>
            <div class="diag-item">
              <span class="diag-label">操作系统:</span>
              <span class="diag-value">{{ systemInfo.os }}</span>
            </div>
            <div class="diag-item">
              <span class="diag-label">本地存储:</span>
              <span class="diag-value" :class="{ error: !systemInfo.localStorage }">
                {{ systemInfo.localStorage ? '可用' : '不可用' }}
              </span>
            </div>
            <div class="diag-item">
              <span class="diag-label">IndexedDB:</span>
              <span class="diag-value" :class="{ error: !systemInfo.indexedDB }">
                {{ systemInfo.indexedDB ? '可用' : '不可用' }}
              </span>
            </div>
          </div>
          
          <button @click="runDiagnostics" class="btn btn-primary">刷新诊断信息</button>
          <button @click="generateDebugReport" class="btn btn-secondary">生成调试报告</button>
        </div>
      </div>
      
      <div class="settings-actions">
        <button @click="saveSettings" class="btn btn-primary save-btn">保存设置</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, inject, watch, reactive, onMounted } from 'vue';

export default {
  name: 'SettingsPanel',
  setup() {
    // 获取共享的标签库实例
    const tagLibrary = inject('tagLibrary');
    const emitter = inject('emitter');
    
    // 标签页设置
    const tabs = [
      { id: 'library', name: '标签库' },
      { id: 'preference', name: '用户偏好' },
      { id: 'data', name: '数据与备份' },
      { id: 'about', name: '关于' }
    ];
    const activeTab = ref('library');
    
    // 当前库设置
    const currentLibrary = ref(tagLibrary.getCurrentLibraryName ? tagLibrary.getCurrentLibraryName() : 'default');
    
    // 导入相关状态
    const selectedFile = ref(null);
    const newLibraryName = ref('');
    const createLibraryName = ref('');
    const importMode = ref('new');
    const extendLibraryName = ref('');
    
    // 历史记录导入相关状态
    const showHistoryImport = ref(false);
    const historyFile = ref(null);
    
    // 备份导入相关状态
    const showBackupImport = ref(false);
    const backupFile = ref(null);
    
    // 高级管理相关状态
    const duplicateSource = ref('');
    const duplicateTarget = ref('');
    const renameSource = ref('');
    const renameTarget = ref('');
    const mergeSource = ref('');
    const mergeTarget = ref('');
    const cleanupTarget = ref('');
    const categoryManageLib = ref('');
    const selectedCategory = ref('');
    const newCategoryName = ref('');
    
    // 主题色选项
    const themeColors = [
      { value: 'blue', hex: '#1677ff' },
      { value: 'green', hex: '#52c41a' },
      { value: 'purple', hex: '#722ed1' },
      { value: 'pink', hex: '#eb2f96' },
      { value: 'orange', hex: '#fa8c16' }
    ];
    
    // 存储信息
    const usedStorage = ref(null);
    const availableStorage = ref(null);
    
    // 系统诊断信息
    const systemInfo = reactive({
      browser: '',
      os: '',
      localStorage: true,
      indexedDB: true
    });
    
    // 计算属性：所有库名称
    const libraryNames = computed(() => {
      return tagLibrary.getLibraryNames ? tagLibrary.getLibraryNames() : 
             (tagLibrary.getLibraries ? tagLibrary.getLibraries() : []);
    });
    
    // 计算属性：当前库的分类
    const currentCategories = computed(() => {
      return tagLibrary.getCategories ? tagLibrary.getCategories() : 
             (tagLibrary.getCurrentLibrary ? Object.keys(tagLibrary.getCurrentLibrary()) : []);
    });
    
    // 计算属性：选定库的分类
    const libCategories = computed(() => {
      if (!categoryManageLib.value) return [];
      const lib = tagLibrary.getLibrary ? tagLibrary.getLibrary(categoryManageLib.value) : {};
      return Object.keys(lib);
    });
    
    // 计算属性：标签总数
    const totalTagCount = computed(() => {
      return tagLibrary.getTotalTagCount ? 
        tagLibrary.getTotalTagCount() : 
        (tagLibrary.getAllTags ? tagLibrary.getAllTags().length : 0);
    });
    
    // 获取指定库的标签数量
    const getTagCountByLibrary = (libraryName) => {
      if (!libraryName) return 0;
      return tagLibrary.getTagCountByLibrary ? 
        tagLibrary.getTagCountByLibrary(libraryName) : 
        (tagLibrary.getAllTags ? tagLibrary.getAllTags(libraryName).length : 0);
    };
    
    // 获取分类标签数量
    const getCategoryTagCount = (category) => {
      if (!categoryManageLib.value || !category) return 0;
      
      const lib = tagLibrary.getLibrary ? tagLibrary.getLibrary(categoryManageLib.value) : {};
      if (!lib[category] || !Array.isArray(lib[category])) return 0;
      
      return lib[category].length;
    };
    
    // 监听库切换
    watch(currentLibrary, (newLibraryName) => {
      if (tagLibrary.switchLibrary) {
        tagLibrary.switchLibrary(newLibraryName);
        emitter.emit('notification', {
          message: `已切换到 "${newLibraryName}" 标签库`,
          type: 'info'
        });
      }
    });
    
    // 处理文件导入
    const handleFileImport = (event) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        selectedFile.value = files[0];
      } else {
        selectedFile.value = null;
      }
    };
    
    // 创建空库
    const createEmptyLibrary = () => {
      if (!createLibraryName.value) return;
      
      try {
        if (tagLibrary.createEmptyLibrary) {
          tagLibrary.createEmptyLibrary(createLibraryName.value);
          emitter.emit('notification', {
            type: 'success',
            message: `成功创建空标签库 "${createLibraryName.value}"`
          });
          
          // 切换到新创建的库
          currentLibrary.value = createLibraryName.value;
          createLibraryName.value = '';
        } else {
          throw new Error('标签库不支持此操作');
        }
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `创建标签库失败: ${error.message}`
        });
      }
    };
    
    // 删除当前库
    const deleteCurrentLibrary = () => {
      if (libraryNames.value.length <= 1) {
        emitter.emit('notification', {
          type: 'warning',
          message: '不能删除唯一的标签库'
        });
        return;
      }
      
      if (confirm(`确定要删除标签库 "${currentLibrary.value}" 吗？此操作不可撤销。`)) {
        try {
          if (tagLibrary.deleteLibrary) {
            tagLibrary.deleteLibrary(currentLibrary.value);
            emitter.emit('notification', {
              type: 'success',
              message: `成功删除标签库 "${currentLibrary.value}"`
            });
            
            // 自动切换到第一个可用的库
            if (libraryNames.value.length > 0) {
              currentLibrary.value = libraryNames.value[0];
            }
          } else {
            throw new Error('标签库不支持此操作');
          }
        } catch (error) {
          emitter.emit('notification', {
            type: 'error',
            message: `删除标签库失败: ${error.message}`
          });
        }
      }
    };
    
    // 导入库
    const importLibrary = () => {
      if (!selectedFile.value) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          
          if (importMode.value === 'new') {
            if (!newLibraryName.value.trim()) {
              emitter.emit('notification', {
                type: 'warning',
                message: '请输入新标签库名称'
              });
              return;
            }
            
            // 创建新库
            if (tagLibrary.addLibrary) {
              tagLibrary.addLibrary(newLibraryName.value, jsonData);
              emitter.emit('notification', {
                type: 'success',
                message: `成功导入标签库 "${newLibraryName.value}"`
              });
              
              // 切换到新导入的库
              currentLibrary.value = newLibraryName.value;
            } else {
              throw new Error('标签库不支持此操作');
            }
          } else {
            if (!extendLibraryName.value) {
              emitter.emit('notification', {
                type: 'warning',
                message: '请选择要扩展的库'
              });
              return;
            }
            
            // 扩展现有库
            if (tagLibrary.extendLibrary) {
              tagLibrary.extendLibrary(extendLibraryName.value, jsonData);
              emitter.emit('notification', {
                type: 'success',
                message: `成功扩展标签库 "${extendLibraryName.value}"`
              });
              
              // 切换到扩展的库
              currentLibrary.value = extendLibraryName.value;
            } else {
              throw new Error('标签库不支持此操作');
            }
          }
          
          // 重置表单
          newLibraryName.value = '';
          extendLibraryName.value = '';
          selectedFile.value = null;
          if (document.getElementById('import-file')) {
            document.getElementById('import-file').value = '';
          }
        } catch (error) {
          emitter.emit('notification', {
            type: 'error',
            message: `导入失败：${error.message}`
          });
          console.error('导入库失败', error);
        }
      };
      
      reader.onerror = () => {
        emitter.emit('notification', {
          type: 'error',
          message: '导入失败：文件读取错误'
        });
      };
      
      reader.readAsText(selectedFile.value);
    };
    
    // 导出当前库
    const exportLibrary = () => {
      const libraryData = tagLibrary.getLibrary ? tagLibrary.getLibrary(currentLibrary.value) : {};
      if (!libraryData || Object.keys(libraryData).length === 0) {
        emitter.emit('notification', {
          type: 'error',
          message: '导出失败：当前库为空'
        });
        return;
      }
      
      // 创建下载链接
      const dataStr = JSON.stringify(libraryData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // 创建临时下载链接
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentLibrary.value}_tags.json`;
      document.body.appendChild(a);
      a.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        emitter.emit('notification', {
          type: 'success',
          message: `已导出 "${currentLibrary.value}" 标签库`
        });
      }, 100);
    };
    
    // 重命名标签库
    const renameLibrary = () => {
      if (!renameSource.value || !renameTarget.value) return;
      
      try {
        if (tagLibrary.renameLibrary) {
          tagLibrary.renameLibrary(renameSource.value, renameTarget.value);
          
          emitter.emit('notification', {
            type: 'success',
            message: `成功将标签库 "${renameSource.value}" 重命名为 "${renameTarget.value}"`
          });
          
          // 如果当前库是被重命名的库，更新引用
          if (currentLibrary.value === renameSource.value) {
            currentLibrary.value = renameTarget.value;
          }
          
          // 清空输入
          renameSource.value = '';
          renameTarget.value = '';
        } else {
          throw new Error('标签库不支持此操作');
        }
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `重命名标签库失败: ${error.message}`
        });
      }
    };
    
    // 复制标签库
    const duplicateLibrary = () => {
      if (!duplicateSource.value || !duplicateTarget.value) return;
      
      try {
        if (tagLibrary.duplicateLibrary) {
          tagLibrary.duplicateLibrary(duplicateSource.value, duplicateTarget.value);
          
          emitter.emit('notification', {
            type: 'success',
            message: `成功将标签库 "${duplicateSource.value}" 复制为 "${duplicateTarget.value}"`
          });
          
          // 切换到新复制的库
          currentLibrary.value = duplicateTarget.value;
          
          // 清空输入
          duplicateSource.value = '';
          duplicateTarget.value = '';
        } else {
          throw new Error('标签库不支持此操作');
        }
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `复制标签库失败: ${error.message}`
        });
      }
    };
    
    // 合并标签库
    const mergeLibraries = () => {
      if (!mergeSource.value || !mergeTarget.value || mergeSource.value === mergeTarget.value) return;
      
      try {
        if (tagLibrary.mergeLibraries) {
          tagLibrary.mergeLibraries(mergeSource.value, mergeTarget.value);
          
          emitter.emit('notification', {
            type: 'success',
            message: `成功将标签库 "${mergeSource.value}" 合并到 "${mergeTarget.value}"`
          });
          
          // 切换到合并后的库
          currentLibrary.value = mergeTarget.value;
          
          // 清空输入
          mergeSource.value = '';
          mergeTarget.value = '';
        } else {
          throw new Error('标签库不支持此操作');
        }
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `合并标签库失败: ${error.message}`
        });
      }
    };
    
    // 清理空分类
    const cleanEmptyCategories = () => {
      if (!cleanupTarget.value) return;
      
      try {
        if (tagLibrary.cleanEmptyCategories) {
          const count = tagLibrary.cleanEmptyCategories(cleanupTarget.value);
          
          emitter.emit('notification', {
            type: 'success',
            message: count > 0 
              ? `成功清理 ${count} 个空分类` 
              : `标签库 "${cleanupTarget.value}" 中没有空分类`
          });
          
          // 清空输入
          cleanupTarget.value = '';
        } else {
          throw new Error('标签库不支持此操作');
        }
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `清理空分类失败: ${error.message}`
        });
      }
    };
    
    // 清理重复标签
    const cleanDuplicateTags = () => {
      if (!cleanupTarget.value) return;
      
      try {
        if (tagLibrary.cleanDuplicateTags) {
          const count = tagLibrary.cleanDuplicateTags(cleanupTarget.value);
          
          emitter.emit('notification', {
            type: 'success',
            message: count > 0 
              ? `成功清理 ${count} 个重复标签` 
              : `标签库 "${cleanupTarget.value}" 中没有重复标签`
          });
          
          // 清空输入
          cleanupTarget.value = '';
        } else {
          throw new Error('标签库不支持此操作');
        }
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `清理重复标签失败: ${error.message}`
        });
      }
    };
    
    // 选择分类
    const selectCategory = (category) => {
      selectedCategory.value = selectedCategory.value === category ? '' : category;
    };
    
    // 移动分类
    const moveSelectedCategory = () => {
      if (!categoryManageLib.value || !selectedCategory.value || !newCategoryName.value) return;
      
      if (selectedCategory.value === newCategoryName.value) {
        emitter.emit('notification', {
          type: 'warning',
          message: '新分类名称不能与当前分类相同'
        });
        return;
      }
      
      try {
        if (tagLibrary.moveCategory) {
          tagLibrary.moveCategory(selectedCategory.value, newCategoryName.value, categoryManageLib.value);
          
          emitter.emit('notification', {
            type: 'success',
            message: `成功将分类 "${selectedCategory.value}" 移动到 "${newCategoryName.value}"`
          });
          
          // 清空表单
          selectedCategory.value = '';
          newCategoryName.value = '';
        } else {
          throw new Error('标签库不支持此操作');
        }
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `移动分类失败: ${error.message}`
        });
      }
    };
    
    // 监听分类管理的库选择变化
    watch(categoryManageLib, () => {
      selectedCategory.value = '';
      newCategoryName.value = '';
    });
    
    // 打开高级编辑器
    const openAdvancedEditor = () => {
      emitter.emit('open-advanced-editor', currentLibrary.value);
    };
    
    // 默认设置
    const defaultSettings = {
      darkMode: false,
      autoSave: true,
      maxHistorySize: 50,
      storageType: 'local',
      showWelcomeOnStartup: true,
      compactLayout: false,
      themeColor: 'blue',
      fontSize: 14,
      allowDuplicates: false,
      showConfetti: true,
      defaultDrawCount: 3
    };
    
    // 用户设置
    const settings = reactive({ ...defaultSettings });
    
    // 加载保存的设置
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('tagDrawer_settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          Object.assign(settings, parsed);
        }
        
        // 兼容旧版本，确保新添加的设置项有默认值
        if (settings.fontSize === undefined) settings.fontSize = defaultSettings.fontSize;
        if (settings.allowDuplicates === undefined) settings.allowDuplicates = defaultSettings.allowDuplicates;
        if (settings.showConfetti === undefined) settings.showConfetti = defaultSettings.showConfetti;
        if (settings.defaultDrawCount === undefined) settings.defaultDrawCount = defaultSettings.defaultDrawCount;
      } catch (error) {
        console.error('加载设置失败:', error);
      }
    };
    
    // 保存设置
    const saveSettings = () => {
      try {
        localStorage.setItem('tagDrawer_settings', JSON.stringify(settings));
        
        // 通知其他组件设置已更改
        emitter.emit('settings-changed', settings);
        
        emitter.emit('notification', {
          type: 'success',
          message: '设置已保存'
        });
        
        // 应用主题设置
        applyThemeSettings();
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `保存设置失败: ${error.message}`
        });
      }
    };
    
    // 应用主题设置
    const applyThemeSettings = () => {
      // 应用深色模式
      if (settings.darkMode) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
      
      // 应用主题色
      document.documentElement.style.setProperty('--primary-color', getThemeColorHex(settings.themeColor));
      
      // 应用布局设置
      if (settings.compactLayout) {
        document.body.classList.add('compact-layout');
        document.documentElement.style.setProperty('--spacing-base', '8px');
        document.documentElement.style.setProperty('--card-padding', '12px');
      } else {
        document.body.classList.remove('compact-layout');
        document.documentElement.style.setProperty('--spacing-base', '16px');
        document.documentElement.style.setProperty('--card-padding', '16px');
      }
      
      // 应用字体大小
      document.documentElement.style.setProperty('--base-font-size', `${settings.fontSize}px`);
      
      // 触发全局设置更新事件
      emitter.emit('settings-updated', settings);
    };
    
    // 获取主题色的十六进制值
    const getThemeColorHex = (colorName) => {
      const colorObj = themeColors.find(c => c.value === colorName);
      return colorObj ? colorObj.hex : '#1677ff';
    };
    
    // 重置设置到默认值
    const resetSettings = () => {
      if (confirm('确定要恢复所有设置到默认值吗？')) {
        Object.assign(settings, defaultSettings);
        saveSettings();
      }
    };
    
    // 清空历史记录
    const clearHistory = () => {
      if (confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
        try {
          // 清空本地存储中的历史记录
          localStorage.setItem('tagHistory', JSON.stringify([]));
          
          // 如果使用标签库内置历史功能，也清除它
          if (tagLibrary.clearHistory) {
            tagLibrary.clearHistory();
          }
          
          emitter.emit('history-updated');
          emitter.emit('notification', {
            type: 'success',
            message: '历史记录已清空'
          });
        } catch (error) {
          emitter.emit('notification', {
            type: 'error',
            message: `清空历史记录失败: ${error.message}`
          });
        }
      }
    };
    
    // 计算存储使用情况
    const calculateStorageUsage = () => {
      try {
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          const value = localStorage.getItem(key);
          total += key.length + value.length;
        }
        
        // 转换为 KB
        const usedKB = (total / 1024).toFixed(2);
        usedStorage.value = `${usedKB} KB`;
        
        // 估计可用空间 (大多数浏览器限制在 5-10MB 左右)
        const maxStorage = 5 * 1024; // 5MB
        const availableKB = (maxStorage - total / 1024).toFixed(2);
        availableStorage.value = `${availableKB} KB`;
      } catch (error) {
        console.error('计算存储使用情况失败:', error);
        usedStorage.value = '计算失败';
        availableStorage.value = '计算失败';
      }
    };
    
    // 备份所有数据
    const backupAllData = () => {
      try {
        const libraries = {};
        if (tagLibrary.getLibraries) {
          const libraryNames = tagLibrary.getLibraries();
          libraryNames.forEach(name => {
            libraries[name] = tagLibrary.getLibrary(name);
          });
        }
        
        const backupData = {
          version: '1.0.0',
          date: new Date().toISOString(),
          settings: settings,
          libraries: libraries,
          history: JSON.parse(localStorage.getItem('tagHistory') || '[]')
        };
        
        // 创建下载链接
        const dataStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // 创建临时下载链接
        const a = document.createElement('a');
        a.href = url;
        a.download = `tagDrawer_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        
        // 清理
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          emitter.emit('notification', {
            type: 'success',
            message: '所有数据已备份'
          });
        }, 100);
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `备份失败: ${error.message}`
        });
      }
    };
    
    // 显示导入备份界面
    const importBackup = () => {
      showBackupImport.value = true;
    };
    
    // 处理备份文件选择
    const handleBackupFileSelect = (event) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        backupFile.value = files[0];
      } else {
        backupFile.value = null;
      }
    };
    
    // 从备份恢复
    const restoreFromBackup = () => {
      if (!backupFile.value) return;
      
      if (!confirm('恢复备份将覆盖所有现有数据，包括标签库、历史记录和设置。确定要继续吗？')) {
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backupData = JSON.parse(e.target.result);
          
          // 验证备份数据格式
          if (!backupData.version || !backupData.libraries) {
            throw new Error('无效的备份文件格式');
          }
          
          // 恢复设置
          if (backupData.settings) {
            Object.assign(settings, backupData.settings);
            localStorage.setItem('tagDrawer_settings', JSON.stringify(settings));
          }
          
          // 恢复标签库
          if (backupData.libraries && tagLibrary.restoreFromBackup) {
            tagLibrary.restoreFromBackup(backupData.libraries);
          } else if (backupData.libraries) {
            // 手动恢复
            const libraries = backupData.libraries;
            for (const name in libraries) {
              if (libraries.hasOwnProperty(name) && tagLibrary.addLibrary) {
                tagLibrary.addLibrary(name, libraries[name]);
              }
            }
          }
          
          // 恢复历史记录
          if (backupData.history) {
            localStorage.setItem('tagHistory', JSON.stringify(backupData.history));
          }
          
          emitter.emit('notification', {
            type: 'success',
            message: '成功从备份恢复数据'
          });
          
          // 刷新界面
          window.location.reload();
        } catch (error) {
          emitter.emit('notification', {
            type: 'error',
            message: `恢复失败：${error.message}`
          });
          console.error('恢复备份失败', error);
        }
      };
      
      reader.onerror = () => {
        emitter.emit('notification', {
          type: 'error',
          message: '恢复失败：文件读取错误'
        });
      };
      
      reader.readAsText(backupFile.value);
    };
    
    // 清理应用数据
    const clearAllData = () => {
      if (confirm('警告：这将删除所有应用数据，包括标签库、历史记录和设置。此操作不可恢复！确定要继续吗？')) {
        try {
          // 清除所有数据
          localStorage.removeItem('tagDrawer_settings');
          localStorage.removeItem('tagHistory');
          localStorage.removeItem('tag_libraries');
          localStorage.removeItem('current_library_name');
          
          emitter.emit('notification', {
            type: 'success',
            message: '所有数据已清空，页面将在3秒后刷新'
          });
          
          // 3秒后刷新页面
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } catch (error) {
          emitter.emit('notification', {
            type: 'error',
            message: `清空数据失败: ${error.message}`
          });
        }
      }
    };
    
    // 运行系统诊断
    const runDiagnostics = () => {
      // 检测浏览器
      const ua = navigator.userAgent;
      let browserMatch;
      if (ua.includes('Chrome') && (browserMatch = ua.match(/Chrome\/(\d+\.\d+)/))) {
        systemInfo.browser = `Chrome ${browserMatch[1]}`;
      } else if (ua.includes('Firefox') && (browserMatch = ua.match(/Firefox\/(\d+\.\d+)/))) {
        systemInfo.browser = `Firefox ${browserMatch[1]}`;
      } else if (ua.includes('Safari') && !ua.includes('Chrome') && (browserMatch = ua.match(/Version\/(\d+\.\d+)/))) {
        systemInfo.browser = `Safari ${browserMatch[1]}`;
      } else if (ua.includes('Edge') && (browserMatch = ua.match(/Edge\/(\d+\.\d+)/))) {
        systemInfo.browser = `Edge ${browserMatch[1]}`;
      } else {
        systemInfo.browser = '未知浏览器';
      }
      
      // 检测操作系统
      if (ua.includes('Windows')) {
        systemInfo.os = 'Windows';
      } else if (ua.includes('Mac')) {
        systemInfo.os = 'macOS';
      } else if (ua.includes('Linux')) {
        systemInfo.os = 'Linux';
      } else if (ua.includes('Android')) {
        systemInfo.os = 'Android';
      } else if (ua.includes('iPhone') || ua.includes('iPad')) {
        systemInfo.os = 'iOS';
      } else {
        systemInfo.os = '未知系统';
      }
      
      // 测试本地存储
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        systemInfo.localStorage = true;
      } catch (e) {
        systemInfo.localStorage = false;
      }
      
      // 测试 IndexedDB
      try {
        systemInfo.indexedDB = !!window.indexedDB;
      } catch (e) {
        systemInfo.indexedDB = false;
      }
      
      emitter.emit('notification', {
        type: 'success',
        message: '系统诊断完成'
      });
      
      calculateStorageUsage();
    };
    
    // 生成调试报告
    const generateDebugReport = () => {
      try {
        // 收集调试信息
        const debugInfo = {
          systemInfo: systemInfo,
          storage: {
            used: usedStorage.value,
            available: availableStorage.value
          },
          settings: settings,
          libraryCount: libraryNames.value.length,
          totalTagCount: totalTagCount.value,
          browser: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            cookiesEnabled: navigator.cookieEnabled
          }
        };
        
        // 创建下载链接
        const dataStr = JSON.stringify(debugInfo, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // 创建临时下载链接
        const a = document.createElement('a');
        a.href = url;
        a.download = `tagDrawer_debug_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        
        // 清理
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          emitter.emit('notification', {
            type: 'success',
            message: '调试报告已生成'
          });
        }, 100);
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `生成调试报告失败: ${error.message}`
        });
      }
    };
    
    // 显示更新日志
    const showChangelog = () => {
      const changelog = `
版本 1.2.0 (2025/04/02)
- 优化抽取动画效果，支持自定义动画强度
- 新增标签权重系统，常用标签可以被更容易抽到
- 修复历史记录不能正常显示的问题
- 增强高级设置功能，支持自定义历史记录保存数量
- 改进动画播放机制，提高动画效果稳定性
- 优化标签抽取逻辑，提高随机性
- 改进UI响应速度和用户体验

版本 1.1.0 (2025/04/01)
- 新增深色模式
- 新增多标签库管理功能
- 增加标签导入导出功能
- 改进抽签UI和交互体验
- 修复已知bug

版本 1.0.0 (2025/03/31)
- 初始版本发布
- 基础标签抽取功能
- 标签分类管理
- 简单历史记录
      `.trim();
      
      alert(changelog);
    };
    
    // 当组件挂载时
    onMounted(() => {
      loadSettings();
      applyThemeSettings();
      runDiagnostics();
      calculateStorageUsage();
    });
    
    // 导出历史记录
    const exportHistory = () => {
      try {
        // 获取历史记录数据
        const historyData = localStorage.getItem('tagHistory') || '[]';
        const historyArray = JSON.parse(historyData);
        
        if (historyArray.length === 0) {
          emitter.emit('notification', {
            type: 'warning',
            message: '没有可导出的历史记录'
          });
          return;
        }
        
        // 创建下载链接
        const blob = new Blob([historyData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // 创建临时下载链接
        const a = document.createElement('a');
        a.href = url;
        a.download = `tag_history_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        
        // 清理
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          emitter.emit('notification', {
            type: 'success',
            message: '历史记录已导出'
          });
        }, 100);
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `导出历史记录失败: ${error.message}`
        });
      }
    };
    
    // 导入历史记录 - 打开文件选择器
    const importHistory = () => {
      showHistoryImport.value = true;
    };
    
    // 处理历史记录文件选择
    const handleHistoryFileSelect = (event) => {
      const file = event.target.files[0];
      if (file) {
        historyFile.value = file;
      }
    };
    
    // 合并历史记录
    const mergeHistoryRecords = () => {
      if (!historyFile.value) {
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          // 读取上传的历史记录
          const importedHistory = JSON.parse(e.target.result);
          
          if (!Array.isArray(importedHistory)) {
            throw new Error('无效的历史记录格式');
          }
          
          // 获取现有历史记录
          const existingHistory = JSON.parse(localStorage.getItem('tagHistory') || '[]');
          
          // 合并历史记录，避免重复
          const mergedHistory = [];
          const idSet = new Set();
          
          // 先添加现有历史的ID到集合中
          existingHistory.forEach(item => idSet.add(item.id));
          
          // 添加现有历史
          mergedHistory.push(...existingHistory);
          
          // 添加新导入的历史记录（避免重复）
          importedHistory.forEach(item => {
            if (!idSet.has(item.id)) {
              mergedHistory.push(item);
              idSet.add(item.id);
            }
          });
          
          // 按时间排序
          mergedHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          
          // 保存到本地存储
          localStorage.setItem('tagHistory', JSON.stringify(mergedHistory));
          
          // 通知其他组件
          emitter.emit('history-updated');
          
          emitter.emit('notification', {
            type: 'success',
            message: `成功导入 ${importedHistory.length} 条历史记录`
          });
          
          // 重置状态
          showHistoryImport.value = false;
          historyFile.value = null;
          document.getElementById('history-file').value = '';
          
        } catch (error) {
          emitter.emit('notification', {
            type: 'error',
            message: `导入历史记录失败: ${error.message}`
          });
        }
      };
      
      reader.onerror = () => {
        emitter.emit('notification', {
          type: 'error',
          message: '读取文件失败'
        });
      };
      
      reader.readAsText(historyFile.value);
    };
    
    return {
      tabs,
      activeTab,
      settings,
      systemInfo,
      usedStorage,
      availableStorage,
      backupFile,
      showBackupImport,
      historyFile,
      showHistoryImport,
      themeColors,
      libraryNames,
      libCategories,
      currentLibrary,
      selectedFile,
      newLibraryName,
      createLibraryName,
      importMode,
      extendLibraryName,
      duplicateSource,
      duplicateTarget,
      renameSource,
      renameTarget,
      mergeSource,
      mergeTarget,
      cleanupTarget,
      categoryManageLib,
      selectedCategory,
      newCategoryName,
      currentCategories,
      totalTagCount,
      getTagCountByLibrary,
      getCategoryTagCount,
      selectCategory,
      moveSelectedCategory,
      handleFileImport,
      createEmptyLibrary,
      deleteCurrentLibrary,
      importLibrary,
      exportLibrary,
      duplicateLibrary,
      renameLibrary,
      mergeLibraries,
      cleanEmptyCategories,
      cleanDuplicateTags,
      openAdvancedEditor,
      saveSettings,
      resetSettings,
      clearHistory,
      exportHistory,
      importHistory,
      handleHistoryFileSelect,
      mergeHistoryRecords,
      backupAllData,
      importBackup,
      handleBackupFileSelect,
      restoreFromBackup,
      clearAllData,
      runDiagnostics,
      generateDebugReport,
      showChangelog
    };
  }
};
</script>

<style scoped>
.panel {
  height: 100%;
  overflow-y: auto;
  background-color: var(--panel-bg-color, #ffffff);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color, #eee);
}

.panel-header h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 500;
  color: var(--text-color, #333);
}

.panel-content {
  padding: 20px;
}

/* 标签页样式 */
.settings-tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border-color, #eee);
  overflow-x: auto;
}

.tab-btn {
  padding: 10px 16px;
  background-color: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.3s;
  margin-right: 5px;
  color: var(--text-color-light, #666);
  white-space: nowrap;
}

.tab-btn:hover {
  color: var(--primary-color, #1677ff);
  background-color: var(--bg-color-light, #f5f5f5);
}

.tab-btn.active {
  color: var(--primary-color, #1677ff);
  border-bottom: 2px solid var(--primary-color, #1677ff);
  background-color: transparent;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 设置卡片样式 */
.setting-card {
  background-color: var(--card-bg-color, #ffffff);
  border: 1px solid var(--border-color, #eee);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.setting-card h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-color, #333);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color, #eee);
}

.setting-card h4 {
  margin-top: 16px;
  margin-bottom: 10px;
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-color, #333);
}

.description {
  color: var(--text-color-light, #666);
  font-size: 0.9rem;
  margin-bottom: 16px;
}

/* 表单控件 */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-color, #333);
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  font-size: 0.95rem;
  background-color: var(--bg-color-light, #f9f9f9);
  color: var(--text-color, #333);
  transition: border-color 0.3s, box-shadow 0.3s;
}

.form-control:focus {
  border-color: var(--primary-color, #1677ff);
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  outline: none;
}

.form-control.small {
  width: 120px;
}

/* 按钮样式 */
.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.3s;
}

.btn-primary {
  background-color: var(--primary-color, #1677ff);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-color-dark, #0958d9);
}

.btn-secondary {
  background-color: var(--bg-color-light, #f5f5f5);
  color: var(--text-color, #333);
  border: 1px solid var(--border-color, #ddd);
}

.btn-secondary:hover {
  background-color: var(--bg-color-dark, #e0e0e0);
}

.btn-danger {
  background-color: var(--danger-color, #ff4d4f);
  color: white;
}

.btn-danger:hover {
  background-color: var(--danger-color-dark, #d9363e);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

/* 库管理样式 */
.library-control {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.library-stats {
  display: flex;
  gap: 16px;
  background-color: var(--bg-color-light, #f5f5f5);
  padding: 12px 16px;
  border-radius: 4px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  color: var(--text-color-light, #666);
}

.stat-value {
  font-weight: 500;
  color: var(--primary-color, #1677ff);
}

/* 选项项目样式 */
.option-item {
  margin-bottom: 24px;
  position: relative;
}

.option-item:last-child {
  margin-bottom: 0;
}

.option-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-color, #333);
}

.option-description {
  margin-top: 6px;
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
  line-height: 1.4;
}

/* 切换开关 */
.switch-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
}

.toggle-switch {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.switch-slider {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
  background-color: var(--bg-color-dark, #ccc);
  border-radius: 10px;
  transition: all 0.3s;
  flex-shrink: 0;
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  border-radius: 50%;
  transition: all 0.3s;
}

.toggle-switch:checked + .switch-slider {
  background-color: var(--primary-color, #1677ff);
}

.toggle-switch:checked + .switch-slider:before {
  transform: translateX(20px);
}

.toggle-switch:focus + .switch-slider {
  box-shadow: 0 0 1px var(--primary-color, #1677ff);
}

.switch-text {
  margin-left: 12px;
  user-select: none;
}

/* 主题色选择器 */
.theme-colors-container {
  margin-top: 12px;
}

.theme-colors {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}

.color-option {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.2s, border-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: var(--text-color, #333);
  transform: scale(1.1);
}

.color-check {
  color: white;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* 滑块控件 */
.slider-control {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--bg-color-dark, #ddd);
  outline: none;
  transition: all 0.3s;
}

.slider-control::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary-color, #1677ff);
  cursor: pointer;
  transition: all 0.3s;
}

.slider-control::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary-color, #1677ff);
  cursor: pointer;
  transition: all 0.3s;
}

.slider-control:hover::-webkit-slider-thumb {
  transform: scale(1.1);
}

.slider-control:hover::-moz-range-thumb {
  transform: scale(1.1);
}

.font-size-slider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.size-label {
  color: var(--text-color-light, #666);
  font-size: 0.9rem;
}

.size-value {
  font-weight: 500;
  min-width: 45px;
  text-align: right;
}

.range-with-value {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 10px;
}

.range-with-value .slider-control {
  flex: 1;
}

.range-with-value .form-control {
  width: 80px;
}

/* 按钮图标 */
.btn-icon {
  margin-right: 6px;
  font-size: 1rem;
}

/* 存储统计 */
.storage-stats {
  background-color: var(--bg-color-light, #f5f5f5);
  padding: 12px 16px;
  border-radius: 4px;
  margin-top: 8px;
}

/* 备份导入表单 */
.backup-import,
.history-import {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px dashed var(--border-color);
  border-radius: var(--border-radius-small);
  background-color: var(--bg-color-lighter);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.backup-import input[type="file"],
.history-import input[type="file"] {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-small);
  background-color: var(--bg-color);
}

:global(.dark-mode) .backup-import,
:global(.dark-mode) .history-import {
  background-color: var(--bg-color-lighter-dark);
  border-color: var(--border-color-dark-mode);
}

:global(.dark-mode) .backup-import input[type="file"],
:global(.dark-mode) .history-import input[type="file"] {
  background-color: var(--bg-color-dark-mode);
  border-color: var(--border-color-dark-mode);
  color: var(--text-color-dark);
}

/* 危险区域 */
.danger-zone {
  border-color: var(--danger-color-light, #ffccc7);
  background-color: rgba(255, 77, 79, 0.05);
}

.danger-zone h3 {
  color: var(--danger-color, #ff4d4f);
}

/* 关于信息 */
.about-info .app-name {
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 4px;
}

.about-info .app-version {
  color: var(--text-color-light, #666);
  margin-bottom: 12px;
}

.about-info .app-description {
  margin-bottom: 20px;
  line-height: 1.5;
}

.developer-info {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color, #eee);
}

.developer-info p {
  margin-bottom: 8px;
}

.developer-info a {
  color: var(--primary-color, #1677ff);
  text-decoration: none;
}

.developer-info a:hover {
  text-decoration: underline;
}

/* 诊断报告 */
.diagnostics-report {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.diag-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color, #eee);
}

.diag-item:last-child {
  border-bottom: none;
}

.diag-label {
  color: var(--text-color-light, #666);
}

.diag-value {
  font-weight: 500;
}

.diag-value.error {
  color: var(--danger-color, #ff4d4f);
}

/* 导入模式 */
.radio-group {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 底部保存按钮 */
.settings-actions {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid var(--border-color, #eee);
}

.save-btn {
  min-width: 120px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .settings-tabs {
    flex-wrap: wrap;
  }
  
  .button-group {
    flex-direction: column;
  }
  
  .library-stats,
  .storage-stats {
    flex-direction: column;
    gap: 8px;
  }
}

/* 深色模式适配 */
:global(.dark-theme) .panel {
  background-color: var(--panel-bg-color-dark, #1f1f1f);
}

:global(.dark-theme) .panel-header {
  border-bottom-color: var(--border-color-dark, #333);
}

:global(.dark-theme) .panel-header h2 {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-theme) .settings-tabs {
  border-bottom-color: var(--border-color-dark, #333);
}

:global(.dark-theme) .tab-btn {
  color: var(--text-color-light-dark, #999);
}

:global(.dark-theme) .tab-btn:hover {
  background-color: var(--bg-color-light-dark, #2c2c2c);
}

:global(.dark-theme) .setting-card {
  background-color: var(--card-bg-color-dark, #2c2c2c);
  border-color: var(--border-color-dark, #333);
}

:global(.dark-theme) .setting-card h3,
:global(.dark-theme) .setting-card h4 {
  color: var(--text-color-dark, #e0e0e0);
  border-bottom-color: var(--border-color-dark, #333);
}

:global(.dark-theme) .description {
  color: var(--text-color-light-dark, #999);
}

:global(.dark-theme) .form-group label {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-theme) .form-control {
  background-color: var(--bg-color-light-dark, #2c2c2c);
  border-color: var(--border-color-dark, #434343);
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-theme) .btn-secondary {
  background-color: var(--bg-color-light-dark, #2c2c2c);
  color: var(--text-color-dark, #e0e0e0);
  border-color: var(--border-color-dark, #434343);
}

:global(.dark-theme) .btn-secondary:hover {
  background-color: var(--bg-color-dark-dark, #1f1f1f);
}

:global(.dark-theme) .library-stats,
:global(.dark-theme) .storage-stats,
:global(.dark-theme) .backup-import {
  background-color: var(--bg-color-light-dark, #2c2c2c);
}

:global(.dark-theme) .stat-label,
:global(.dark-theme) .diag-label {
  color: var(--text-color-light-dark, #999);
}

:global(.dark-theme) .danger-zone {
  background-color: rgba(255, 77, 79, 0.1);
  border-color: rgba(255, 77, 79, 0.3);
}

:global(.dark-theme) .diag-item {
  border-bottom-color: var(--border-color-dark, #333);
}

:global(.dark-theme) .settings-actions {
  border-top-color: var(--border-color-dark, #333);
}

:global(.dark-theme) .developer-info {
  border-top-color: var(--border-color-dark, #333);
}

/* 深色模式样式改进 */
:global(.dark-theme) .option-description {
  color: var(--text-color-light-dark, #aaa);
}

:global(.dark-theme) .switch-slider {
  background-color: var(--bg-color-dark-dark, #555);
}

:global(.dark-theme) .toggle-switch:checked + .switch-slider {
  background-color: var(--primary-color, #1677ff);
}

:global(.dark-theme) .color-option {
  border-color: transparent;
}

:global(.dark-theme) .color-option.active {
  border-color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-theme) .slider-control {
  background: var(--bg-color-dark-dark, #555);
}

:global(.dark-theme) .size-label {
  color: var(--text-color-light-dark, #aaa);
}

:global(.dark-theme) .radio-item {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-theme) input[type="radio"] {
  accent-color: var(--primary-color, #1677ff);
}

:global(.dark-theme) .button-group .btn-danger {
  background-color: var(--danger-color-dark, #d9363e);
}

:global(.dark-theme) .button-group .btn-danger:hover {
  background-color: var(--danger-color, #ff4d4f);
}

:global(.dark-theme) a {
  color: var(--primary-color-light, #40a9ff);
}

/* 新增样式 */
.advanced-section {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px dashed var(--border-color, #eee);
}

.advanced-section:last-child {
  margin-bottom: 0;
  border-bottom: none;
  padding-bottom: 0;
}

.advanced-section h4 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 1rem;
  color: var(--text-color, #333);
}

.input-group {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.help-text {
  margin-top: 8px;
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
}

/* 分类管理样式 */
.category-manager {
  margin-top: 15px;
  border: 1px solid var(--border-color, #eee);
  border-radius: 6px;
  overflow: hidden;
}

.category-list {
  max-height: 300px;
  overflow-y: auto;
}

.list-header {
  padding: 10px 15px;
  background-color: var(--bg-color-light, #f5f5f5);
  border-bottom: 1px solid var(--border-color, #eee);
  font-weight: 500;
}

.empty-message {
  padding: 20px;
  text-align: center;
  color: var(--text-color-light, #666);
}

.category-items {
  padding: 10px;
}

.category-item {
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 5px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s;
}

.category-item:hover {
  background-color: var(--bg-color-light, #f5f5f5);
}

.category-item.active {
  background-color: var(--primary-color-light, rgba(24, 144, 255, 0.1));
  color: var(--primary-color, #1677ff);
}

.badge {
  background-color: var(--bg-color-light, #f5f5f5);
  color: var(--text-color-light, #666);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.category-actions {
  padding: 15px;
  background-color: var(--bg-color-light, #f9f9f9);
  border-top: 1px solid var(--border-color, #eee);
}

.action-group {
  display: flex;
  gap: 10px;
}

/* 深色模式高级功能适配 */
:global(.dark-theme) .advanced-section {
  border-bottom-color: var(--border-color-dark, #333);
}

:global(.dark-theme) .advanced-section h4 {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-theme) .help-text {
  color: var(--text-color-light-dark, #999);
}

:global(.dark-theme) .category-manager {
  border-color: var(--border-color-dark, #333);
}

:global(.dark-theme) .list-header {
  background-color: var(--bg-color-light-dark, #2c2c2c);
  border-bottom-color: var(--border-color-dark, #333);
}

:global(.dark-theme) .category-item:hover {
  background-color: var(--bg-color-light-dark, #2c2c2c);
}

:global(.dark-theme) .category-item.active {
  background-color: rgba(24, 144, 255, 0.2);
}

:global(.dark-theme) .badge {
  background-color: var(--bg-color-light-dark, #2c2c2c);
  color: var(--text-color-light-dark, #999);
}

:global(.dark-theme) .category-actions {
  background-color: var(--bg-color-light-dark, #2c2c2c);
  border-top-color: var(--border-color-dark, #333);
}

:global(.dark-theme) .empty-message {
  color: var(--text-color-light-dark, #999);
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.slider-value {
  font-weight: 500;
  min-width: 45px;
  text-align: right;
}

.color-selector {
  display: flex;
  gap: 16px;
}

/* 字体大小滑块 */
.slider-container {
  display: flex;
  align-items: center;
  width: 100%;
  margin: 8px 0;
  gap: 10px;
}

.slider-control {
  flex: 1;
  height: 4px;
  background: var(--bg-color-light, #f0f0f0);
  border-radius: 4px;
  appearance: none;
  outline: none;
}

.slider-control::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary-color, #1677ff);
  cursor: pointer;
  transition: background 0.2s;
}

.slider-control::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 50%;
  background: var(--primary-color, #1677ff);
  cursor: pointer;
  transition: background 0.2s;
}

.slider-control:focus::-webkit-slider-thumb {
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.2);
}

.slider-value {
  font-weight: 500;
  min-width: 45px;
  text-align: right;
  color: var(--text-color, #333);
}

/* 颜色选择器 */
.color-selector {
  display: flex;
  gap: 12px;
  margin: 8px 0;
  flex-wrap: wrap;
}

.color-option {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.2s, border-color 0.2s;
}

.color-option.active {
  border-color: var(--text-color, #333);
  transform: scale(1.1);
}

.color-option:hover {
  transform: scale(1.1);
}

:global(.dark-mode) .slider-value {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .slider-control {
  background: var(--bg-color-light-dark, #2c2c2c);
}

:global(.dark-mode) .color-option.active {
  border-color: var(--text-color-dark, #e0e0e0);
}
</style> 