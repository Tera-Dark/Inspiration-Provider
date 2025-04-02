<template>
  <div class="panel">
    <h2>Tag库管理</h2>
    
    <div class="tab-container">
      <div class="tab-buttons">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'import' }"
          @click="activeTab = 'import'"
        >导入</button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'manage' }"
          @click="activeTab = 'manage'"
        >管理</button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'preview' }"
          @click="activeTab = 'preview'"
        >预览</button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'edit' }"
          @click="activeTab = 'edit'"
        >在线编辑</button>
      </div>
      
      <!-- 导入标签库 -->
      <div class="tab-content" :class="{ active: activeTab === 'import' }">
        <div class="import-mode">
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
        </div>

        <!-- 新库模式 -->
        <div v-if="importMode === 'new'" class="library-name-input">
          <label for="library-name">新库名称</label>
          <input 
            type="text" 
            id="library-name" 
            v-model="newLibraryName" 
            placeholder="输入新标签库名称"
            class="form-control"
          />
        </div>

        <!-- 扩展模式 -->
        <div v-else class="library-select">
          <label for="extend-library">选择要扩展的库</label>
          <select 
            id="extend-library" 
            v-model="extendLibraryName" 
            class="form-control"
          >
            <option v-for="lib in libraries" :key="lib.name" :value="lib.name">
              {{ lib.name }}
            </option>
          </select>
        </div>
        
        <div class="import-controls">
          <input type="file" @change="handleFileSelect" accept=".json" class="form-control" />
        </div>
        
        <div class="import-actions">
          <button @click="importLibrary" class="primary-btn" :disabled="!fileSelected">导入</button>
          <button @click="clearImport" class="secondary-btn">清空</button>
        </div>
      </div>
      
      <!-- 管理标签库 -->
      <div class="tab-content" :class="{ active: activeTab === 'manage' }">
        <div class="library-actions">
          <div class="action-group">
            <input 
              type="text" 
              v-model="createLibraryName" 
              placeholder="新建库名称" 
              class="form-control"
            />
            <button @click="createNewLibrary" class="small-btn primary-btn">创建新库</button>
          </div>
          <button @click="deleteCurrentLibrary" class="small-btn secondary-btn">删除当前库</button>
        </div>
        
        <div class="advanced-actions">
          <div class="action-section">
            <h4>重命名库</h4>
            <div class="action-controls">
              <select v-model="renameSource" class="form-control small">
                <option value="">选择要重命名的库</option>
                <option v-for="lib in libraries" :key="`rename-${lib.name}`" :value="lib.name">
                  {{ lib.name }}
                </option>
              </select>
              <input 
                type="text" 
                v-model="renameTarget" 
                placeholder="新名称" 
                class="form-control small"
              />
              <button @click="renameLibrary" class="small-btn action-btn">重命名</button>
            </div>
          </div>
          
          <div class="action-section">
            <h4>复制库</h4>
            <div class="action-controls">
              <select v-model="duplicateSource" class="form-control small">
                <option value="">选择源库</option>
                <option v-for="lib in libraries" :key="`duplicate-${lib.name}`" :value="lib.name">
                  {{ lib.name }}
                </option>
              </select>
              <input 
                type="text" 
                v-model="duplicateTarget" 
                placeholder="新库名称" 
                class="form-control small"
              />
              <button @click="duplicateLibrary" class="small-btn action-btn">复制</button>
            </div>
          </div>
          
          <div class="action-section">
            <h4>合并库</h4>
            <div class="action-controls">
              <select v-model="mergeSource" class="form-control small">
                <option value="">选择源库</option>
                <option v-for="lib in libraries" :key="`merge-source-${lib.name}`" :value="lib.name">
                  {{ lib.name }}
                </option>
              </select>
              <select v-model="mergeTarget" class="form-control small">
                <option value="">选择目标库</option>
                <option v-for="lib in libraries" :key="`merge-target-${lib.name}`" :value="lib.name">
                  {{ lib.name }}
                </option>
              </select>
              <button @click="mergeLibraries" class="small-btn action-btn">合并</button>
            </div>
          </div>
          
          <div class="action-section">
            <h4>清理和优化</h4>
            <div class="action-controls">
              <select v-model="cleanupTarget" class="form-control small">
                <option value="">选择要清理的库</option>
                <option v-for="lib in libraries" :key="`cleanup-${lib.name}`" :value="lib.name">
                  {{ lib.name }}
                </option>
              </select>
              <button @click="cleanEmptyCategories" class="small-btn action-btn" title="删除没有标签的空分类">清理空分类</button>
              <button @click="cleanDuplicateTags" class="small-btn action-btn" title="删除重复的标签">去除重复标签</button>
            </div>
          </div>
        </div>
        
        <h3>库列表</h3>
        <div class="libraries-list">
          <div 
            v-for="library in libraries" 
            :key="library.name"
            class="library-item"
            :class="{ active: currentLibrary === library.name }"
            @click="switchLibrary(library.name)"
          >
            <span>{{ library.name }}</span>
            <span class="library-count">{{ library.count }} 个标签</span>
          </div>
          
          <div v-if="libraries.length === 0" class="empty-message">
            无可用标签库
          </div>
        </div>
      </div>
      
      <!-- 预览标签库 -->
      <div class="tab-content" :class="{ active: activeTab === 'preview' }">
        <div class="preview-stats">
          <div>当前库: <strong>{{ currentLibrary }}</strong></div>
          <div>标签总数: <strong>{{ tagCount }}</strong></div>
          <div>分类总数: <strong>{{ categoryCount }}</strong></div>
        </div>
        
        <div class="preview-filter">
          <input 
            type="text" 
            v-model="previewFilter" 
            placeholder="搜索标签..." 
            class="form-control"
          />
          <select v-model="previewCategory" class="form-control">
            <option value="all">全部分类</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>
        
        <div class="preview-display-options">
          <div class="display-option">
            <label>显示模式:</label>
            <div class="segmented-control">
              <button 
                :class="{ active: previewDisplayMode === 'category' }" 
                @click="previewDisplayMode = 'category'"
              >按分类</button>
              <button 
                :class="{ active: previewDisplayMode === 'list' }" 
                @click="previewDisplayMode = 'list'"
              >列表</button>
              <button 
                :class="{ active: previewDisplayMode === 'card' }" 
                @click="previewDisplayMode = 'card'"
              >卡片</button>
            </div>
          </div>
          
          <div class="display-option">
            <label>每页显示:</label>
            <select v-model="pageSize" class="page-size-select">
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
              <option :value="200">200</option>
              <option :value="500">500</option>
            </select>
          </div>
        </div>
        
        <div class="tag-preview">
          <div v-if="filteredPreviewTags.length === 0" class="empty-message">
            没有找到匹配的标签
          </div>
          
          <!-- 按分类显示模式 -->
          <template v-else-if="previewDisplayMode === 'category'">
            <div v-for="(tags, category) in paginatedGroupedTags" :key="category">
              <div class="category-indicator">{{ category }} ({{ tags.length }})</div>
              <div class="preview-tags-container">
                <div 
                  v-for="tag in tags" 
                  :key="`${category}-${tag.content}`"
                  class="preview-tag-item"
                >
                  <div class="preview-tag-text">{{ tag.content }}</div>
                  <div v-if="tag.subTitles && tag.subTitles.length > 0" class="preview-tag-subtitle">
                    {{ tag.subTitles.join(' / ') }}
                  </div>
                </div>
              </div>
            </div>
          </template>
          
          <!-- 列表显示模式 -->
          <div v-else-if="previewDisplayMode === 'list'" class="preview-list-view">
            <table class="preview-table">
              <thead>
                <tr>
                  <th>分类</th>
                  <th>标签</th>
                  <th>子标题</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(tag, index) in paginatedTags" :key="index">
                  <td>{{ tag.category }}</td>
                  <td>{{ tag.content }}</td>
                  <td>{{ tag.subTitles ? tag.subTitles.join(' / ') : '' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- 卡片显示模式 -->
          <div v-else class="preview-card-view">
            <div class="card-grid">
              <div 
                v-for="(tag, index) in paginatedTags" 
                :key="index"
                class="preview-card"
              >
                <div class="card-category">{{ tag.category }}</div>
                <div class="card-content">{{ tag.content }}</div>
                <div v-if="tag.subTitles && tag.subTitles.length > 0" class="card-subtitle">
                  {{ tag.subTitles.join(' / ') }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- 分页控件 -->
          <div v-if="filteredPreviewTags.length > 0" class="pagination">
            <button 
              class="page-btn" 
              @click="currentPage = 1" 
              :disabled="currentPage === 1"
            >首页</button>
            <button 
              class="page-btn" 
              @click="currentPage--" 
              :disabled="currentPage === 1"
            >上一页</button>
            <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
            <button 
              class="page-btn" 
              @click="currentPage++" 
              :disabled="currentPage === totalPages"
            >下一页</button>
            <button 
              class="page-btn" 
              @click="currentPage = totalPages" 
              :disabled="currentPage === totalPages"
            >末页</button>
          </div>
        </div>
      </div>
      
      <!-- 在线编辑 -->
      <div class="tab-content" :class="{ active: activeTab === 'edit' }">
        <div class="editor-container">
          <div class="editor-header">
            <div class="editor-title">
              <h3>标签库编辑器</h3>
              <div class="editor-subtitle">按照格式编辑标签，完成后可以导出或保存</div>
            </div>
            <div class="editor-actions">
              <button @click="exportEditorContent" class="action-btn">
                <span>导出JSON</span>
              </button>
              <button @click="saveEditorContent" class="action-btn primary">
                <span>保存到当前库</span>
              </button>
            </div>
          </div>
          
          <div class="editor-toolbar">
            <div class="toolbar-section">
              <label>编辑模式:</label>
              <div class="segmented-control">
                <button 
                  :class="{ active: editorMode === 'json' }" 
                  @click="switchEditorMode('json')"
                >JSON</button>
                <button 
                  :class="{ active: editorMode === 'text' }" 
                  @click="switchEditorMode('text')"
                >文本格式</button>
              </div>
            </div>
            
            <div class="toolbar-section">
              <label>目标库:</label>
              <select v-model="editorTargetLibrary" class="form-control small">
                <option v-for="lib in libraries" :key="lib.name" :value="lib.name">
                  {{ lib.name }}
                </option>
              </select>
            </div>
          </div>
          
          <div class="editor-main">
            <div class="editor-wrapper">
              <!-- JSON模式 -->
              <textarea 
                v-if="editorMode === 'json'"
                v-model="editorJsonContent"
                class="json-editor"
                placeholder="输入JSON格式的标签库内容..."
                @input="validateJson"
              ></textarea>
              
              <!-- 文本模式 -->
              <textarea 
                v-else
                v-model="editorTextContent"
                class="text-editor"
                placeholder="按照以下格式输入标签:
分类1:
标签1
标签2|子标题1,子标题2
分类2:
标签3
标签4|子标题3"
                @input="validateText"
              ></textarea>
            </div>
            
            <div class="editor-preview">
              <div class="preview-header">预览</div>
              <div class="preview-content">
                <div v-if="previewEditorContent.length === 0" class="empty-preview">
                  编辑内容后在此处预览
                </div>
                <div v-else class="tag-list-preview">
                  <div v-for="(category, index) in previewEditorCategories" :key="index" class="preview-category">
                    <div class="preview-category-name">{{ category }}</div>
                    <div class="preview-category-tags">
                      <div 
                        v-for="(tag, tagIndex) in getTagsByCategory(category)" 
                        :key="tagIndex"
                        class="preview-tag"
                      >
                        <div class="preview-tag-name">{{ tag.content }}</div>
                        <div v-if="tag.subTitles && tag.subTitles.length > 0" class="preview-tag-subtitles">
                          {{ tag.subTitles.join(', ') }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="editorError" class="editor-error">
            {{ editorError }}
          </div>
          
          <div class="editor-tips">
            <div class="tip-title">格式说明:</div>
            <ul class="tip-list">
              <li v-if="editorMode === 'json'">JSON格式: 使用标准JSON格式，包含 category, content 和可选的 subTitles 数组</li>
              <li v-else>文本格式: 每个分类以冒号结尾，标签每行一个，子标题使用 | 分隔并用逗号分隔多个子标题</li>
              <li>示例标签格式请参考预览区</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, inject, computed, onMounted } from 'vue';

export default defineComponent({
  name: 'TagLibraryPanel',
  setup() {
    const tagLibrary = inject('tagLibrary');
    const emitter = inject('emitter');
    
    // 标签库信息
    const libraries = ref([]);
    const currentLibrary = ref('');
    
    // 页签管理
    const activeTab = ref('manage');
    
    // 导入相关
    const newLibraryName = ref('');
    const fileContent = ref(null);
    const fileSelected = ref(false);
    
    // 新建库相关
    const createLibraryName = ref('');
    
    // 预览相关
    const previewFilter = ref('');
    const previewCategory = ref('all');
    
    // 导入模式
    const importMode = ref('new');
    const extendLibraryName = ref('');
    
    // 分页相关
    const pageSize = ref(20);
    const currentPage = ref(1);
    
    // 在线编辑相关
    const editorMode = ref('json');
    const editorJsonContent = ref('');
    const editorTextContent = ref('');
    const editorTargetLibrary = ref('');
    const editorError = ref('');
    const previewEditorContent = ref([]);
    
    // 库管理操作相关
    const renameSource = ref('');
    const renameTarget = ref('');
    const duplicateSource = ref('');
    const duplicateTarget = ref('');
    const mergeSource = ref('');
    const mergeTarget = ref('');
    const cleanupTarget = ref('');
    
    // 计算编辑器预览分类列表
    const previewEditorCategories = computed(() => {
      const categories = new Set();
      previewEditorContent.value.forEach(tag => {
        if (tag.category) {
          categories.add(tag.category);
        }
      });
      return Array.from(categories);
    });
    
    // 计算属性
    const categories = computed(() => {
      return tagLibrary.getCategories();
    });
    
    const tagCount = computed(() => {
      return tagLibrary.getTotalTagCount ? 
        tagLibrary.getTotalTagCount() : 
        (tagLibrary.getAllTags ? tagLibrary.getAllTags().length : 0);
    });
    
    const categoryCount = computed(() => {
      return categories.value.length;
    });
    
    const filteredPreviewTags = computed(() => {
      let result = tagLibrary.getAllTags();
      
      // 按分类过滤
      if (previewCategory.value !== 'all') {
        result = result.filter(tag => tag.category === previewCategory.value);
      }
      
      // 按关键词过滤
      if (previewFilter.value.trim()) {
        const filterLower = previewFilter.value.toLowerCase();
        result = result.filter(tag => 
          tag.content.toLowerCase().includes(filterLower) || 
          tag.category.toLowerCase().includes(filterLower) ||
          (tag.subTitles && tag.subTitles.some(st => st.toLowerCase().includes(filterLower)))
        );
      }
      
      return result;
    });
    
    const paginatedGroupedTags = computed(() => {
      const result = {};
      const startIndex = (currentPage.value - 1) * pageSize.value;
      const endIndex = Math.min(startIndex + pageSize.value, filteredPreviewTags.value.length);
      
      // 仅处理当前页的标签
      const paginatedTags = filteredPreviewTags.value.slice(startIndex, endIndex);
      
      // 按分类分组
      paginatedTags.forEach(tag => {
        if (!result[tag.category]) {
          result[tag.category] = [];
        }
        result[tag.category].push(tag);
      });
      
      return result;
    });
    
    // 分页的标签列表
    const paginatedTags = computed(() => {
      const startIndex = (currentPage.value - 1) * pageSize.value;
      const endIndex = Math.min(startIndex + pageSize.value, filteredPreviewTags.value.length);
      return filteredPreviewTags.value.slice(startIndex, endIndex);
    });
    
    // 总页数
    const totalPages = computed(() => {
      return Math.max(1, Math.ceil(filteredPreviewTags.value.length / pageSize.value));
    });
    
    const previewDisplayMode = ref('category');
    
    // 方法
    const loadLibraries = () => {
      try {
        libraries.value = tagLibrary.getLibraries().map(lib => ({
          name: lib,
          count: tagLibrary.getTagCountByLibrary ? 
            tagLibrary.getTagCountByLibrary(lib) : 
            (tagLibrary.getAllTags ? tagLibrary.getAllTags(lib).length : 0)
        }));
        currentLibrary.value = tagLibrary.getCurrentLibraryName();
      } catch (error) {
        console.error('加载标签库失败:', error);
        emitter.emit('notification', {
          type: 'error',
          message: `加载标签库失败: ${error.message}`
        });
      }
    };
    
    const handleFileSelect = (event) => {
      const file = event.target.files[0];
      if (!file) {
        fileSelected.value = false;
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          fileContent.value = JSON.parse(e.target.result);
          fileSelected.value = true;
        } catch (error) {
          emitter.emit('notification', {
            type: 'error',
            message: '文件解析失败，请确保是有效的JSON格式'
          });
          fileSelected.value = false;
        }
      };
      
      reader.readAsText(file);
    };
    
    const importLibrary = () => {
      if (!fileContent.value) {
        emitter.emit('notification', {
          type: 'error',
          message: '请先选择文件'
        });
        return;
      }
      
      try {
        if (importMode.value === 'new') {
          if (!newLibraryName.value.trim()) {
            emitter.emit('notification', {
              type: 'error',
              message: '请输入新库名称'
            });
            return;
          }
          
          tagLibrary.importLibrary(newLibraryName.value, fileContent.value);
          emitter.emit('notification', {
            type: 'success',
            message: `导入新库 "${newLibraryName.value}" 成功`
          });
        } else {
          if (!extendLibraryName.value) {
            emitter.emit('notification', {
              type: 'error',
              message: '请选择要扩展的库'
            });
            return;
          }
          
          tagLibrary.extendLibrary(extendLibraryName.value, fileContent.value);
          emitter.emit('notification', {
            type: 'success',
            message: `扩展库 "${extendLibraryName.value}" 成功`
          });
        }
        
        // 清空表单
        clearImport();
        
        // 刷新库列表
        loadLibraries();
        
        // 触发标签库更新事件
        emitter.emit('tagLibraryUpdated');
      } catch (error) {
        console.error('导入标签库失败:', error);
        emitter.emit('notification', {
          type: 'error',
          message: `导入标签库失败: ${error.message}`
        });
      }
    };
    
    const clearImport = () => {
      newLibraryName.value = '';
      fileContent.value = null;
      fileSelected.value = false;
      extendLibraryName.value = '';
      
      // 重置文件输入框
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
    };
    
    const createNewLibrary = () => {
      if (!createLibraryName.value.trim()) {
        emitter.emit('notification', {
          type: 'warning',
          message: '请输入新标签库名称'
        });
        return;
      }
      
      try {
        tagLibrary.createEmptyLibrary(createLibraryName.value);
        emitter.emit('notification', {
          type: 'success',
          message: `成功创建空标签库 "${createLibraryName.value}"`
        });
        
        // 刷新库列表
        loadLibraries();
        createLibraryName.value = '';
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `创建标签库失败: ${error.message}`
        });
      }
    };
    
    const deleteCurrentLibrary = () => {
      if (libraries.value.length <= 1) {
        emitter.emit('notification', {
          type: 'warning',
          message: '不能删除唯一的标签库'
        });
        return;
      }
      
      if (confirm(`确定要删除标签库 "${currentLibrary.value}" 吗？此操作不可撤销。`)) {
        try {
          tagLibrary.deleteLibrary(currentLibrary.value);
          emitter.emit('notification', {
            type: 'success',
            message: `成功删除标签库 "${currentLibrary.value}"`
          });
          
          // 刷新库列表
          loadLibraries();
        } catch (error) {
          emitter.emit('notification', {
            type: 'error',
            message: `删除标签库失败: ${error.message}`
          });
        }
      }
    };
    
    const switchLibrary = (libraryName) => {
      if (libraryName === currentLibrary.value) return;
      
      try {
        tagLibrary.switchLibrary(libraryName);
        currentLibrary.value = libraryName;
        
        emitter.emit('notification', {
          type: 'success',
          message: `已切换到标签库 "${libraryName}"`
        });
        
        // 通知其他组件库已切换
        emitter.emit('library-changed', libraryName);
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `切换标签库失败: ${error.message}`
        });
      }
    };
    
    // 切换编辑器模式
    const switchEditorMode = (mode) => {
      if (mode === editorMode.value) return;
      
      try {
        // 如果当前有内容，尝试在不同模式间转换
        if (mode === 'json' && editorTextContent.value.trim()) {
          // 从文本模式转到JSON模式
          const jsonData = convertTextToJson(editorTextContent.value);
          editorJsonContent.value = JSON.stringify(jsonData, null, 2);
        } else if (mode === 'text' && editorJsonContent.value.trim()) {
          // 从JSON模式转到文本模式
          const textData = convertJsonToText(JSON.parse(editorJsonContent.value));
          editorTextContent.value = textData;
        }
      } catch (error) {
        console.error('转换编辑模式失败:', error);
      }
      
      editorMode.value = mode;
    };
    
    // 导出JSON内容
    const exportEditorContent = () => {
      try {
        let jsonData;
        
        // 根据当前模式获取数据
        if (editorMode.value === 'json') {
          if (!editorJsonContent.value.trim()) {
            emitter.emit('notification', {
              type: 'warning',
              message: '没有可导出的内容'
            });
            return;
          }
          jsonData = JSON.parse(editorJsonContent.value);
        } else {
          if (!editorTextContent.value.trim()) {
            emitter.emit('notification', {
              type: 'warning',
              message: '没有可导出的内容'
            });
            return;
          }
          jsonData = convertTextToJson(editorTextContent.value);
        }
        
        // 创建下载
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tag-library-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        emitter.emit('notification', {
          type: 'success',
          message: 'JSON文件已导出'
        });
      } catch (error) {
        console.error('导出失败:', error);
        editorError.value = `导出失败: ${error.message}`;
        emitter.emit('notification', {
          type: 'error',
          message: `导出失败: ${error.message}`
        });
      }
    };
    
    // 保存到当前库
    const saveEditorContent = () => {
      try {
        let parsedData = [];
        
        if (editorMode.value === 'json') {
          if (!validateJson(editorJsonContent.value)) {
            return;
          }
          parsedData = JSON.parse(editorJsonContent.value);
        } else {
          if (!validateText(editorTextContent.value)) {
            return;
          }
          parsedData = convertTextToJson(editorTextContent.value);
        }
        
        if (parsedData.length === 0) {
          editorError.value = '没有有效的标签数据';
          return;
        }
        
        // 保存到当前库
        tagLibrary.extendLibrary(editorTargetLibrary.value, parsedData);
        
        editorError.value = '';
        
        emitter.emit('notification', {
          type: 'success',
          message: `保存到 "${editorTargetLibrary.value}" 成功`
        });
        
        // 触发更新事件
        emitter.emit('tagLibraryUpdated');
      } catch (error) {
        console.error('保存编辑内容失败:', error);
        editorError.value = `保存失败: ${error.message}`;
      }
    };
    
    // 验证JSON格式
    const validateJson = (json) => {
      if (!json.trim()) {
        editorError.value = '';
        previewEditorContent.value = [];
        return false;
      }
      
      try {
        const parsedData = JSON.parse(json);
        editorError.value = '';
        previewEditorContent.value = parsedData;
        return true;
      } catch (error) {
        editorError.value = `JSON格式错误: ${error.message}`;
        previewEditorContent.value = [];
        return false;
      }
    };
    
    // 验证文本格式并预览
    const validateText = (text) => {
      if (!text.trim()) {
        editorError.value = '';
        previewEditorContent.value = [];
        return false;
      }
      
      try {
        const jsonData = convertTextToJson(text);
        editorError.value = '';
        previewEditorContent.value = jsonData;
        return true;
      } catch (error) {
        editorError.value = `格式错误: ${error.message}`;
        previewEditorContent.value = [];
        return false;
      }
    };
    
    // 文本格式转JSON
    const convertTextToJson = (text) => {
      const lines = text.split('\n');
      const result = [];
      let currentCategory = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // 检查是否是分类行
        if (line.endsWith(':')) {
          currentCategory = line.slice(0, -1).trim();
        } else if (currentCategory) {
          // 标签行处理
          const parts = line.split('|');
          const content = parts[0].trim();
          let subTitles = [];
          
          if (parts.length > 1 && parts[1].trim()) {
            subTitles = parts[1].split(',').map(item => item.trim()).filter(Boolean);
          }
          
          result.push({
            category: currentCategory,
            content: content,
            subTitles: subTitles
          });
        }
      }
      
      return result;
    };
    
    // JSON转文本格式
    const convertJsonToText = (jsonData) => {
      const categories = {};
      
      // 按分类整理
      jsonData.forEach(tag => {
        if (!categories[tag.category]) {
          categories[tag.category] = [];
        }
        categories[tag.category].push(tag);
      });
      
      let result = '';
      
      // 生成文本
      Object.keys(categories).forEach(category => {
        result += `${category}:\n`;
        categories[category].forEach(tag => {
          if (tag.subTitles && tag.subTitles.length > 0) {
            result += `${tag.content}|${tag.subTitles.join(',')}\n`;
          } else {
            result += `${tag.content}\n`;
          }
        });
        result += '\n';
      });
      
      return result;
    };
    
    // 获取指定分类的标签
    const getTagsByCategory = (category) => {
      return previewEditorContent.value.filter(tag => tag.category === category);
    };
    
    // 重命名库
    const renameLibrary = () => {
      if (!renameSource.value) {
        emitter.emit('notification', {
          type: 'warning',
          message: '请选择要重命名的库'
        });
        return;
      }
      
      if (!renameTarget.value.trim()) {
        emitter.emit('notification', {
          type: 'warning',
          message: '请输入新的库名称'
        });
        return;
      }
      
      try {
        tagLibrary.renameLibrary(renameSource.value, renameTarget.value);
        emitter.emit('notification', {
          type: 'success',
          message: `重命名库 "${renameSource.value}" 为 "${renameTarget.value}" 成功`
        });
        
        // 清空表单
        renameSource.value = '';
        renameTarget.value = '';
        
        // 刷新库列表
        loadLibraries();
        
        // 触发更新事件
        emitter.emit('tagLibraryUpdated');
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `重命名库失败: ${error.message}`
        });
      }
    };
    
    // 复制库
    const duplicateLibrary = () => {
      if (!duplicateSource.value) {
        emitter.emit('notification', {
          type: 'warning',
          message: '请选择要复制的源库'
        });
        return;
      }
      
      if (!duplicateTarget.value.trim()) {
        emitter.emit('notification', {
          type: 'warning',
          message: '请输入新库名称'
        });
        return;
      }
      
      try {
        tagLibrary.duplicateLibrary(duplicateSource.value, duplicateTarget.value);
        emitter.emit('notification', {
          type: 'success',
          message: `复制库 "${duplicateSource.value}" 到 "${duplicateTarget.value}" 成功`
        });
        
        // 清空表单
        duplicateSource.value = '';
        duplicateTarget.value = '';
        
        // 刷新库列表
        loadLibraries();
        
        // 触发更新事件
        emitter.emit('tagLibraryUpdated');
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `复制库失败: ${error.message}`
        });
      }
    };
    
    // 合并库
    const mergeLibraries = () => {
      if (!mergeSource.value) {
        emitter.emit('notification', {
          type: 'warning',
          message: '请选择要合并的源库'
        });
        return;
      }
      
      if (!mergeTarget.value) {
        emitter.emit('notification', {
          type: 'warning',
          message: '请选择目标库'
        });
        return;
      }
      
      if (mergeSource.value === mergeTarget.value) {
        emitter.emit('notification', {
          type: 'warning',
          message: '源库和目标库不能相同'
        });
        return;
      }
      
      try {
        tagLibrary.mergeLibraries(mergeSource.value, mergeTarget.value);
        emitter.emit('notification', {
          type: 'success',
          message: `合并库 "${mergeSource.value}" 到 "${mergeTarget.value}" 成功`
        });
        
        // 清空表单
        mergeSource.value = '';
        mergeTarget.value = '';
        
        // 刷新库列表
        loadLibraries();
        
        // 触发更新事件
        emitter.emit('tagLibraryUpdated');
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `合并库失败: ${error.message}`
        });
      }
    };
    
    // 清理空分类
    const cleanEmptyCategories = () => {
      if (!cleanupTarget.value) {
        emitter.emit('notification', {
          type: 'warning',
          message: '请选择要清理的库'
        });
        return;
      }
      
      try {
        const count = tagLibrary.cleanEmptyCategories(cleanupTarget.value);
        
        emitter.emit('notification', {
          type: 'success',
          message: count > 0 
            ? `清理成功：删除了 ${count} 个空分类` 
            : '没有发现空分类'
        });
        
        // 如果清理了分类，刷新库列表和触发更新事件
        if (count > 0) {
          loadLibraries();
          emitter.emit('tagLibraryUpdated');
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
      if (!cleanupTarget.value) {
        emitter.emit('notification', {
          type: 'warning',
          message: '请选择要清理的库'
        });
        return;
      }
      
      try {
        const count = tagLibrary.cleanDuplicateTags(cleanupTarget.value);
        
        emitter.emit('notification', {
          type: 'success',
          message: count > 0 
            ? `清理成功：删除了 ${count} 个重复标签` 
            : '没有发现重复标签'
        });
        
        // 如果清理了标签，刷新库列表和触发更新事件
        if (count > 0) {
          loadLibraries();
          emitter.emit('tagLibraryUpdated');
        }
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `清理重复标签失败: ${error.message}`
        });
      }
    };
    
    // 生命周期钩子
    onMounted(() => {
      loadLibraries();
      
      // 编辑器初始化
      editorTargetLibrary.value = currentLibrary.value;
      
      // 监听标签库更新
      emitter.on('tagLibraryUpdated', () => {
        loadLibraries();
        // 重新加载预览数据
        if (activeTab.value === 'preview') {
          currentPage.value = 1; // 重置到第一页
        }
      });
    });
    
    return {
      activeTab,
      libraries,
      currentLibrary,
      newLibraryName,
      fileSelected,
      createLibraryName,
      previewFilter,
      previewCategory,
      categories,
      tagCount,
      categoryCount,
      filteredPreviewTags,
      paginatedGroupedTags,
      paginatedTags,
      totalPages,
      handleFileSelect,
      importLibrary,
      clearImport,
      createNewLibrary,
      deleteCurrentLibrary,
      switchLibrary,
      importMode,
      extendLibraryName,
      pageSize,
      currentPage,
      previewDisplayMode,
      editorMode,
      editorJsonContent,
      editorTextContent,
      editorTargetLibrary,
      previewEditorContent,
      previewEditorCategories,
      editorError,
      switchEditorMode,
      exportEditorContent,
      saveEditorContent,
      validateJson,
      validateText,
      getTagsByCategory,
      // 新增的库管理功能
      renameSource,
      renameTarget,
      renameLibrary,
      duplicateSource,
      duplicateTarget,
      duplicateLibrary,
      mergeSource,
      mergeTarget,
      mergeLibraries,
      cleanupTarget,
      cleanEmptyCategories,
      cleanDuplicateTags
    };
  }
});
</script>

<style scoped>
.panel {
  background-color: var(--panel-bg-color, #ffffff);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.panel h2 {
  color: var(--text-color, #333);
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color, #eee);
  font-size: 1.3rem;
  font-weight: 500;
}

.panel h3 {
  font-size: 1.1rem;
  margin: 15px 0 10px 0;
  color: var(--text-color, #333);
  font-weight: 500;
}

/* 标签页样式 */
.tab-container {
  width: 100%;
}

.tab-buttons {
  display: flex;
  margin-bottom: 15px;
  border-bottom: 1px solid var(--border-color, #eee);
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
  display: none;
  padding: 10px 0;
}

.tab-content.active {
  display: block;
}

/* 表单控件 */
.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  font-size: 0.95rem;
  margin-bottom: 10px;
  background-color: var(--bg-color-light, #f9f9f9);
  color: var(--text-color, #333);
  transition: border-color 0.3s, box-shadow 0.3s;
}

.form-control:focus {
  border-color: var(--primary-color, #1677ff);
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  outline: none;
}

.library-name-input {
  margin-bottom: 15px;
}

.library-name-input label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-color, #333);
}

.import-controls {
  margin-bottom: 15px;
}

.import-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

/* 按钮样式 */
.primary-btn {
  background-color: var(--primary-color, #1677ff);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.primary-btn:hover {
  background-color: var(--primary-color-dark, #0958d9);
}

.primary-btn:disabled {
  background-color: var(--disabled-color, #ccc);
  cursor: not-allowed;
}

.secondary-btn {
  background-color: var(--danger-color, #ff4d4f);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.secondary-btn:hover {
  background-color: var(--danger-color-dark, #d9363e);
}

.small-btn {
  padding: 8px 12px;
  font-size: 0.9rem;
}

/* 库管理样式 */
.library-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  gap: 10px;
}

.action-group {
  display: flex;
  gap: 10px;
  align-items: center;
  flex: 1;
}

.action-group .form-control {
  margin-bottom: 0;
}

.libraries-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border-color, #eee);
  border-radius: 4px;
}

.library-item {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color, #eee);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s;
}

.library-item:last-child {
  border-bottom: none;
}

.library-item:hover {
  background-color: var(--hover-color, #e6f7ff);
}

.library-item.active {
  background-color: var(--primary-color-light, #e6f4ff);
  font-weight: 500;
  border-left: 3px solid var(--primary-color, #1677ff);
}

.library-count {
  color: var(--text-color-light, #666);
  font-size: 0.9rem;
}

/* 预览样式 */
.preview-stats {
  display: flex;
  justify-content: space-between;
  background-color: var(--bg-color-light, #f5f5f5);
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
}

.preview-stats > div {
  flex: 1;
  min-width: 150px;
}

.preview-stats strong {
  color: var(--primary-color, #1677ff);
}

.preview-filter {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.tag-preview {
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid var(--border-color, #eee);
  border-radius: 4px;
  padding: 16px;
}

.category-indicator {
  font-size: 0.95rem;
  color: var(--text-color-light, #666);
  font-weight: 500;
  margin: 15px 0 10px 0;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--border-color, #eee);
}

.category-indicator:first-child {
  margin-top: 0;
}

.preview-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.preview-tag-item {
  background-color: var(--bg-color-light, #f5f5f5);
  border: 1px solid var(--border-color, #eee);
  border-radius: 4px;
  padding: 10px 14px;
  transition: transform 0.2s, box-shadow 0.2s;
  min-width: 100px;
  text-align: center;
}

.preview-tag-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-color: var(--primary-color-light, #91caff);
}

.preview-tag-text {
  font-weight: 500;
  color: var(--text-color, #333);
}

.preview-tag-subtitle {
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
  margin-top: 5px;
}

.empty-message {
  color: var(--text-color-light, #666);
  text-align: center;
  padding: 30px 0;
  font-style: italic;
}

.tip {
  color: var(--text-color-light, #666);
  text-align: center;
  font-style: italic;
  padding: 30px 0;
}

/* 深色模式样式 */
:global(.dark-mode) .panel {
  background-color: var(--panel-bg-color-dark, #1f1f1f);
}

:global(.dark-mode) .panel h2,
:global(.dark-mode) .panel h3 {
  color: var(--text-color-dark, #e0e0e0);
  border-bottom-color: var(--border-color-dark, #333);
}

:global(.dark-mode) .tab-buttons {
  border-bottom-color: var(--border-color-dark, #333);
}

:global(.dark-mode) .tab-btn {
  color: var(--text-color-light-dark, #999);
}

:global(.dark-mode) .tab-btn:hover {
  background-color: var(--bg-color-light-dark, #2c2c2c);
}

:global(.dark-mode) .form-control {
  background-color: var(--bg-color-light-dark, #2c2c2c);
  border-color: var(--border-color-dark, #434343);
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .library-name-input label {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .libraries-list {
  border-color: var(--border-color-dark, #333);
}

:global(.dark-mode) .library-item {
  border-color: var(--border-color-dark, #333);
}

:global(.dark-mode) .library-item:hover {
  background-color: var(--hover-color-dark, #165996);
}

:global(.dark-mode) .library-item.active {
  background-color: rgba(24, 144, 255, 0.15);
}

:global(.dark-mode) .library-count {
  color: var(--text-color-light-dark, #999);
}

:global(.dark-mode) .preview-stats {
  background-color: var(--bg-color-light-dark, #2c2c2c);
}

:global(.dark-mode) .tag-preview {
  border-color: var(--border-color-dark, #333);
}

:global(.dark-mode) .category-indicator {
  color: var(--text-color-light-dark, #999);
  border-bottom-color: var(--border-color-dark, #333);
}

:global(.dark-mode) .preview-tag-item {
  background-color: var(--bg-color-light-dark, #2c2c2c);
  border-color: var(--border-color-dark, #333);
}

:global(.dark-mode) .preview-tag-text {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .preview-tag-subtitle,
:global(.dark-mode) .empty-message,
:global(.dark-mode) .tip {
  color: var(--text-color-light-dark, #999);
}

@media (max-width: 768px) {
  .preview-filter,
  .import-actions,
  .library-actions {
    flex-direction: column;
  }
  
  .preview-stats {
    flex-direction: column;
    gap: 5px;
  }
}

/* 在线编辑器样式 */
.editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.editor-title h3 {
  margin: 0 0 5px 0;
  font-size: 1.1rem;
}

.editor-subtitle {
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
}

.editor-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  padding: 8px 12px;
  background-color: var(--bg-color-light, #f5f5f5);
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s;
}

.action-btn:hover {
  background-color: var(--bg-color-dark, #e0e0e0);
}

.action-btn.primary {
  background-color: var(--primary-color, #1677ff);
  border-color: var(--primary-color, #1677ff);
  color: white;
}

.action-btn.primary:hover {
  background-color: var(--primary-color-dark, #0958d9);
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--bg-color-light, #f5f5f5);
  padding: 10px 16px;
  border-radius: 4px;
  flex-wrap: wrap;
  gap: 10px;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-section label {
  font-size: 0.9rem;
  color: var(--text-color, #333);
}

.form-control.small {
  width: 150px;
  margin-bottom: 0;
  padding: 6px 10px;
  font-size: 0.9rem;
}

.segmented-control {
  display: flex;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  overflow: hidden;
}

.segmented-control button {
  padding: 6px 12px;
  background-color: var(--bg-color-light, #f9f9f9);
  border: none;
  border-right: 1px solid var(--border-color, #ddd);
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.segmented-control button:last-child {
  border-right: none;
}

.segmented-control button.active {
  background-color: var(--primary-color, #1677ff);
  color: white;
}

.editor-main {
  display: flex;
  flex: 1;
  gap: 20px;
  min-height: 300px;
}

.editor-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.json-editor, .text-editor {
  flex: 1;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  padding: 16px;
  font-family: monospace;
  font-size: 0.9rem;
  resize: none;
  background-color: var(--bg-color-light, #f9f9f9);
  color: var(--text-color, #333);
}

.json-editor:focus, .text-editor:focus {
  outline: none;
  border-color: var(--primary-color, #1677ff);
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.editor-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  overflow: hidden;
}

.preview-header {
  padding: 10px 16px;
  background-color: var(--bg-color-light, #f5f5f5);
  border-bottom: 1px solid var(--border-color, #ddd);
  font-weight: 500;
}

.preview-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background-color: white;
}

.empty-preview {
  color: var(--text-color-light, #999);
  font-style: italic;
  text-align: center;
  padding: 40px 0;
}

.tag-list-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-category {
  margin-bottom: 16px;
}

.preview-category-name {
  font-size: 0.95rem;
  font-weight: 500;
  margin-bottom: 8px;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--border-color, #eee);
  color: var(--text-color, #333);
}

.preview-category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.preview-tag {
  background-color: var(--bg-color-light, #f5f5f5);
  border: 1px solid var(--border-color, #eee);
  border-radius: 4px;
  padding: 8px 12px;
}

.preview-tag-name {
  font-weight: 500;
  font-size: 0.9rem;
  color: var(--text-color, #333);
}

.preview-tag-subtitles {
  font-size: 0.8rem;
  color: var(--text-color-light, #666);
  margin-top: 5px;
}

.editor-error {
  padding: 10px 16px;
  background-color: rgba(245, 34, 45, 0.05);
  border: 1px solid rgba(245, 34, 45, 0.2);
  border-radius: 4px;
  color: var(--danger-color, #ff4d4f);
  font-size: 0.9rem;
}

.editor-tips {
  padding: 10px 16px;
  background-color: rgba(24, 144, 255, 0.05);
  border: 1px solid rgba(24, 144, 255, 0.2);
  border-radius: 4px;
}

.tip-title {
  font-weight: 500;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: var(--text-color, #333);
}

.tip-list {
  padding-left: 20px;
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
}

.tip-list li {
  margin-bottom: 5px;
}

.tip-list li:last-child {
  margin-bottom: 0;
}

/* 分页控件样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  gap: 10px;
}

.page-btn {
  padding: 6px 12px;
  background-color: var(--bg-color-light, #f5f5f5);
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn:not(:disabled):hover {
  background-color: var(--hover-color, #e6f7ff);
  border-color: var(--primary-color, #1677ff);
}

.page-info {
  font-size: 0.9rem;
  color: var(--text-color-light, #666);
}

/* 预览模式控件 */
.preview-display-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  background-color: var(--bg-color-light, #f5f5f5);
  padding: 10px 16px;
  border-radius: 4px;
  flex-wrap: wrap;
  gap: 10px;
}

.display-option {
  display: flex;
  align-items: center;
  gap: 10px;
}

.display-option label {
  font-size: 0.9rem;
  color: var(--text-color, #333);
}

.page-size-select {
  padding: 5px 10px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  font-size: 0.9rem;
  background-color: var(--bg-color, #fff);
}

/* 列表视图样式 */
.preview-list-view {
  overflow-x: auto;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
}

.preview-table th,
.preview-table td {
  padding: 10px 16px;
  text-align: left;
  border-bottom: 1px solid var(--border-color, #eee);
}

.preview-table th {
  background-color: var(--bg-color-light, #f5f5f5);
  font-weight: 500;
  color: var(--text-color, #333);
}

.preview-table tr:hover td {
  background-color: var(--hover-color, #e6f7ff);
}

/* 卡片视图样式 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.preview-card {
  border: 1px solid var(--border-color, #eee);
  border-radius: 6px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.preview-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-small, 0 2px 8px rgba(0, 0, 0, 0.1));
}

.card-category {
  padding: 10px 12px;
  background-color: var(--primary-color-light, #e6f4ff);
  color: var(--primary-color, #1677ff);
  font-size: 0.85rem;
  font-weight: 500;
  border-bottom: 1px solid var(--border-color, #eee);
}

.card-content {
  padding: 12px;
  font-weight: 500;
  color: var(--text-color, #333);
}

.card-subtitle {
  padding: 0 12px 12px;
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
}

/* 导入模式样式 */
.import-mode {
  margin-bottom: 20px;
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.radio-item label {
  cursor: pointer;
}

/* 高级功能区域 */
.advanced-actions {
  margin-top: 20px;
  margin-bottom: 20px;
  border: 1px solid var(--border-color, #eee);
  border-radius: 6px;
  padding: 16px;
  background-color: var(--bg-color-light, #f9f9f9);
}

.action-section {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px dashed var(--border-color, #eee);
}

.action-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.action-section h4 {
  margin: 0 0 10px 0;
  font-size: 1rem;
  color: var(--text-color, #333);
  font-weight: 500;
}

.action-controls {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.action-btn {
  background-color: var(--primary-color, #1677ff);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s;
  min-width: 70px;
  text-align: center;
}

.action-btn:hover {
  background-color: var(--primary-color-dark, #0958d9);
}

/* 深色模式适配 */
:global(.dark-mode) .advanced-actions {
  background-color: var(--bg-color-light-dark, #2c2c2c);
  border-color: var(--border-color-dark, #333);
}

:global(.dark-mode) .action-section {
  border-color: var(--border-color-dark, #333);
}

:global(.dark-mode) .action-section h4 {
  color: var(--text-color-dark, #e0e0e0);
}
</style> 