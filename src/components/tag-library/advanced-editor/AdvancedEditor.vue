<template>
  <div class="advanced-editor" v-if="show">
    <div class="modal-overlay" @click="closeEditor">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>标签库高级管理器</h3>
          <div class="header-actions">
            <button class="refresh-btn" @click="triggerRefresh" title="刷新内容" :disabled="isLoading">
              <span class="refresh-icon" :class="{ 'refreshing': isLoading }">↻</span>
            </button>
            <button class="close-btn" @click="closeEditor">&times;</button>
          </div>
        </div>
        
        <div class="modal-body">
          <div class="library-selector">
            <label>当前库:</label>
            <select v-model="currentLibraryName" class="form-control" @change="loadSelectedLibrary(false)" :disabled="isLoading">
              <option v-for="lib in libraryNames" :key="`editor-${lib}`" :value="lib">{{ lib }}</option>
            </select>
            <div v-if="isLoading" class="loading-indicator">
              <span class="spinner"></span>
            </div>
          </div>
          
          <div class="editor-layout" v-if="currentLibraryName">
            <!-- 左侧分类面板 -->
            <div class="category-panel">
              <div class="panel-header">
                <h4>分类管理</h4>
                <button class="btn-icon add-btn" @click="showAddCategoryModal = true" title="添加分类" :disabled="isLoading">+</button>
              </div>
              
              <div class="category-list">
                <div 
                  v-for="category in categoriesList" 
                  :key="`cat-${refreshTrigger}-${category}`" 
                  class="category-item"
                  :class="{ active: selectedCategory === category }"
                  @click="selectCategory(category)"
                >
                  <span class="category-name">{{ category }}</span>
                  <span class="tag-count">{{ getCategoryTagCount(category) }}</span>
                  <div class="category-actions">
                    <button class="btn-icon edit-btn" @click.stop="startEditCategory(category)" title="重命名" :disabled="isLoading">✎</button>
                    <button class="btn-icon delete-btn" @click.stop="confirmDeleteCategory(category)" title="删除" :disabled="isLoading">×</button>
                  </div>
                </div>
              </div>
              
              <div class="empty-message" v-if="categoriesList.length === 0">
                没有分类，请添加一个新分类
              </div>
            </div>
            
            <!-- 右侧标签面板 -->
            <div class="tags-panel">
              <div class="panel-header" v-if="selectedCategory">
                <h4>{{ selectedCategory }} 中的标签</h4>
                <button class="btn-icon add-btn" @click="showAddTagModal = true" title="添加标签" :disabled="isLoading">+</button>
              </div>
              
              <div class="tag-list" v-if="selectedCategory">
                <div 
                  v-for="(tag, index) in currentCategoryTags" 
                  :key="`tag-${refreshTrigger}-${selectedCategory}-${index}`" 
                  class="tag-item"
                >
                  <div class="tag-content">
                    {{ getTagDisplayContent(tag) }}
                  </div>
                  <div class="tag-actions">
                    <button class="btn-icon edit-btn" @click="startEditTag(tag, index)" title="编辑" :disabled="isLoading">✎</button>
                    <button class="btn-icon delete-btn" @click="deleteTag(index)" title="删除" :disabled="isLoading">×</button>
                  </div>
                </div>
              </div>
              
              <div class="empty-message" v-else-if="categoriesList.length > 0">
                请从左侧选择一个分类
              </div>
              
              <div class="empty-message" v-else>
                没有可显示的标签
              </div>
            </div>
          </div>
          
          <div class="empty-library" v-else>
            请选择一个标签库
          </div>
        </div>
        
        <!-- 添加/编辑标签模态框 -->
        <div class="modal" v-if="showTagModal">
          <div class="modal-content">
            <div class="modal-header">
              <h4>{{ isEditingTag ? '编辑标签' : '添加标签' }}</h4>
              <button class="close-btn" @click="closeTagModal">&times;</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>标签内容:</label>
                <input type="text" v-model="tagForm.content" class="form-control" placeholder="输入标签内容" :disabled="isLoading">
              </div>
              
              <div class="form-group">
                <label>子标题 (可选，用逗号分隔):</label>
                <input type="text" v-model="tagForm.subTitles" class="form-control" placeholder="子标题1,子标题2" :disabled="isLoading">
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="closeTagModal" :disabled="isLoading">取消</button>
              <button class="btn btn-primary" @click="saveTag" :disabled="isLoading">
                <span v-if="isLoading" class="spinner-sm"></span>
                保存
              </button>
            </div>
          </div>
        </div>
        
        <!-- 添加/编辑分类模态框 -->
        <div class="modal" v-if="showCategoryModal">
          <div class="modal-content">
            <div class="modal-header">
              <h4>{{ isEditingCategory ? '重命名分类' : '添加分类' }}</h4>
              <button class="close-btn" @click="closeCategoryModal">&times;</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>分类名称:</label>
                <input type="text" v-model="categoryForm.name" class="form-control" placeholder="输入分类名称" :disabled="isLoading">
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="closeCategoryModal" :disabled="isLoading">取消</button>
              <button class="btn btn-primary" @click="saveCategory" :disabled="isLoading">
                <span v-if="isLoading" class="spinner-sm"></span>
                保存
              </button>
            </div>
          </div>
        </div>
        
        <!-- 确认删除模态框 -->
        <div class="modal" v-if="showDeleteConfirmModal">
          <div class="modal-content">
            <div class="modal-header">
              <h4>确认删除</h4>
              <button class="close-btn" @click="cancelDelete">&times;</button>
            </div>
            <div class="modal-body">
              <p>{{ deleteConfirmMessage }}</p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="cancelDelete" :disabled="isLoading">取消</button>
              <button class="btn btn-danger" @click="confirmDelete" :disabled="isLoading">
                <span v-if="isLoading" class="spinner-sm"></span>
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, inject, watch, onMounted, onUnmounted } from 'vue';

export default {
  name: 'AdvancedEditor',
  props: {
    show: {
      type: Boolean,
      required: true
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    // 注入依赖
    const tagLibrary = inject('tagLibrary');
    const emitter = inject('emitter');
    
    // 编辑器状态
    const editorMode = ref('json');
    const editorJsonContent = ref('');
    const editorTextContent = ref('');
    const editorTargetLibrary = ref('');
    const editorError = ref('');
    const editorJsonValid = ref(false);
    const editorTextValid = ref(false);
    const selectedViewCategory = ref('');
    const categoryList = ref([]);
    const filteredContent = ref('');
    const filteredTextContent = ref('');
    const currentLibraryName = ref('');
    const categories = ref([]);
    const selectedCategory = ref('');
    const showTagModal = ref(false);
    const showCategoryModal = ref(false);
    const isEditingTag = ref(false);
    const isEditingCategory = ref(false);
    const editingTagIndex = ref(-1);
    const tagForm = ref({ content: '', subTitles: '' });
    const categoryForm = ref({ name: '', originalName: '' });
    const deleteConfirmMessage = ref('');
    const deleteType = ref('');
    const deleteTarget = ref(null);
    const showAddCategoryModal = ref(false);
    const showDeleteConfirmModal = ref(false);
    const isLoading = ref(false);
    
    // 使用ref创建一个响应式变量，用于触发重新渲染
    const refreshTrigger = ref(0);
    
    // 手动触发刷新函数
    const triggerRefresh = () => {
      try {
        // 设置加载状态
        isLoading.value = true;
        
        // 强制从本地存储重新加载所有标签库数据
        tagLibrary._loadFromStorage();
        
        // 获取当前库名称
        const libName = currentLibraryName.value;
        
        // 清空当前选择的库
        currentLibraryName.value = '';
        
        // 使用setTimeout确保DOM更新
        setTimeout(() => {
          // 重新选择当前库，触发库加载
          currentLibraryName.value = libName;
          
          // 提示用户
          emitter.emit('notification', {
            type: 'success',
            message: '数据刷新成功'
          });
          
          // 重置加载状态
          isLoading.value = false;
        }, 100);
      } catch (error) {
        console.error('刷新失败:', error);
        emitter.emit('notification', {
          type: 'error',
          message: '刷新失败: ' + (error.message || '未知错误')
        });
        isLoading.value = false;
      }
    };
    
    // 计算属性：所有库名称
    const libraryNames = computed(() => {
      return tagLibrary.getLibraryNames ? tagLibrary.getLibraryNames() : 
             (tagLibrary.getLibraries ? tagLibrary.getLibraries() : []);
    });
    
    // 计算属性：当前库中的所有分类
    const libraryData = computed(() => {
      if (!currentLibraryName.value) return {};
      try {
        const library = tagLibrary.getLibrary(currentLibraryName.value);
        return library || {};
      } catch (error) {
        console.error('获取库数据失败:', error);
        return {};
      }
    });
    
    // 计算属性：当前库中的所有分类
    const categoriesList = computed(() => {
      try {
        if (!libraryData.value) return [];
        return Object.keys(libraryData.value).sort();
      } catch (error) {
        console.error('获取分类列表失败:', error);
        return [];
      }
    });
    
    // 计算属性：当前选中分类的标签
    const currentCategoryTags = computed(() => {
      try {
        if (!selectedCategory.value || !libraryData.value) return [];
        const categoryTags = libraryData.value[selectedCategory.value];
        if (!Array.isArray(categoryTags)) return [];
        
        // 确保所有标签格式一致，便于处理
        return categoryTags.map(tag => {
          if (typeof tag === 'string') {
            return { content: tag, subTitles: [] };
          }
          return {
            content: tag.content || '',
            subTitles: Array.isArray(tag.subTitles) ? tag.subTitles : []
          };
        });
      } catch (error) {
        console.error('获取当前分类标签失败:', error);
        return [];
      }
    });
    
    // 获取分类中的标签数量
    const getCategoryTagCount = (category) => {
      if (!libraryData.value || !libraryData.value[category]) return 0;
      return Array.isArray(libraryData.value[category]) ? libraryData.value[category].length : 0;
    };
    
    // 获取标签的显示内容
    const getTagDisplayContent = (tag) => {
      if (typeof tag === 'string') {
        return tag;
      }
      
      let content = tag.content || '';
      if (tag.subTitles && Array.isArray(tag.subTitles) && tag.subTitles.length > 0) {
        content += ` [${tag.subTitles.join(', ')}]`;
      }
      return content;
    };
    
    // 关闭编辑器
    const closeEditor = () => {
      emit('close');
      selectedViewCategory.value = '';
      editorError.value = '';
      currentLibraryName.value = '';
      categories.value = [];
      selectedCategory.value = '';
      showTagModal.value = false;
      showCategoryModal.value = false;
      deleteConfirmMessage.value = '';
    };
    
    // 加载库到编辑器
    const loadSelectedLibrary = (silent = false) => {
      if (!currentLibraryName.value) return;
      
      try {
        isLoading.value = true;
        
        // 使用标准方法获取库数据
        const library = tagLibrary.getLibrary(currentLibraryName.value);
        
        if (!library) {
          throw new Error(`无法加载库 "${currentLibraryName.value}"`);
        }
        
        // 获取所有分类
        const cats = Object.keys(library).sort();
        categoryList.value = cats;
        
        if (editorMode.value === 'json') {
          editorJsonContent.value = JSON.stringify(library, null, 2);
          validateJson();
        } else {
          editorTextContent.value = convertJsonToText(library);
          validateText();
        }
        
        selectedViewCategory.value = '';
        
        // 更新分类列表
        categories.value = cats;
        
        // 如果当前选中的分类不存在于新加载的库中，清空选择
        if (selectedCategory.value && !cats.includes(selectedCategory.value)) {
          selectedCategory.value = '';
        }
        
        // 如果没有选中分类且存在分类，自动选择第一个分类
        if (!selectedCategory.value && cats.length > 0) {
          selectedCategory.value = cats[0];
        }
        
        // 更新刷新计数器，强制重新渲染
        refreshTrigger.value++;
        
        // 只在非静默模式下显示通知
        if (!silent) {
          emitter.emit('notification', {
            type: 'success',
            message: `已加载 "${currentLibraryName.value}" 库到编辑器`
          });
        }
      } catch (error) {
        editorError.value = `加载库失败: ${error.message}`;
        if (!silent) {
          emitter.emit('notification', {
            type: 'error',
            message: `加载库失败: ${error.message}`
          });
        }
      } finally {
        isLoading.value = false;
      }
    };
    
    // 验证JSON格式
    const validateJson = () => {
      try {
        if (!editorJsonContent.value.trim()) {
          editorJsonValid.value = false;
          editorError.value = '';
          filteredContent.value = '';
          return;
        }
        
        JSON.parse(editorJsonContent.value);
        editorJsonValid.value = true;
        editorError.value = '';
        
        if (selectedViewCategory.value) {
          filterCategoryContent();
        }
      } catch (error) {
        editorJsonValid.value = false;
        editorError.value = `JSON格式错误: ${error.message}`;
        filteredContent.value = '';
      }
    };
    
    // 验证文本格式
    const validateText = () => {
      try {
        if (!editorTextContent.value.trim()) {
          editorTextValid.value = false;
          editorError.value = '';
          filteredTextContent.value = '';
          return;
        }
        
        // 尝试转换为JSON，如果成功则验证通过
        const jsonData = convertTextToJson(editorTextContent.value);
        editorTextValid.value = true;
        editorError.value = '';
        
        if (selectedViewCategory.value) {
          filterTextCategoryContent();
        }
      } catch (error) {
        editorTextValid.value = false;
        editorError.value = `文本格式错误: ${error.message}`;
        filteredTextContent.value = '';
      }
    };
    
    // 把JSON格式转成文本格式
    const convertJsonToText = (jsonData) => {
      let result = '';
      
      // 遍历所有分类
      for (const category in jsonData) {
        result += `${category}:\n`;
        
        // 遍历分类下的所有标签
        if (Array.isArray(jsonData[category])) {
          jsonData[category].forEach(tag => {
            if (typeof tag === 'string') {
              result += `${tag}\n`;
            } else if (tag && typeof tag === 'object') {
              const content = tag.content || '';
              let line = content;
              
              // 如果有子标题，添加到行后面
              if (tag.subTitles && Array.isArray(tag.subTitles) && tag.subTitles.length > 0) {
                line += `|${tag.subTitles.join(',')}`;
              }
              
              result += `${line}\n`;
            }
          });
        }
        
        // 添加空行分隔不同分类
        result += '\n';
      }
      
      return result.trim();
    };
    
    // 把文本格式转成JSON格式
    const convertTextToJson = (text) => {
      const lines = text.split('\n');
      const result = {};
      
      let currentCategory = null;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 跳过空行
        if (!line) continue;
        
        // 检查是否是分类行（以冒号结尾）
        if (line.endsWith(':')) {
          currentCategory = line.substring(0, line.length - 1).trim();
          result[currentCategory] = [];
        } 
        // 处理标签行
        else if (currentCategory) {
          // 检查是否含有子标题（使用|分隔）
          if (line.includes('|')) {
            const [content, subTitlesStr] = line.split('|');
            const tag = {
              content: content.trim()
            };
            
            // 处理子标题（以逗号分隔）
            if (subTitlesStr && subTitlesStr.trim()) {
              tag.subTitles = subTitlesStr.split(',').map(s => s.trim());
            }
            
            result[currentCategory].push(tag);
          } else {
            // 没有子标题的情况，直接添加字符串
            result[currentCategory].push(line);
          }
        } else {
          throw new Error(`第 ${i+1} 行没有对应的分类`);
        }
      }
      
      return result;
    };
    
    // 转换当前编辑器格式
    const convertFormat = () => {
      try {
        if (editorMode.value === 'json' && editorJsonValid.value) {
          // 从JSON转换为文本
          const jsonData = JSON.parse(editorJsonContent.value);
          editorTextContent.value = convertJsonToText(jsonData);
          editorMode.value = 'text';
          editorTextValid.value = true;
          selectedViewCategory.value = '';
        } else if (editorMode.value === 'text' && editorTextValid.value) {
          // 从文本转换为JSON
          const jsonData = convertTextToJson(editorTextContent.value);
          editorJsonContent.value = JSON.stringify(jsonData, null, 2);
          editorMode.value = 'json';
          editorJsonValid.value = true;
          selectedViewCategory.value = '';
        }
      } catch (error) {
        editorError.value = `格式转换失败: ${error.message}`;
      }
    };
    
    // 筛选当前选中分类的内容（JSON模式）
    const filterCategoryContent = () => {
      try {
        if (!selectedViewCategory.value || !editorJsonValid.value) {
          filteredContent.value = '';
          return;
        }
        
        const jsonData = JSON.parse(editorJsonContent.value);
        if (jsonData && jsonData[selectedViewCategory.value]) {
          filteredContent.value = JSON.stringify(jsonData[selectedViewCategory.value], null, 2);
        } else {
          filteredContent.value = '未找到该分类的数据';
        }
      } catch (error) {
        filteredContent.value = `筛选失败: ${error.message}`;
      }
    };
    
    // 筛选当前选中分类的内容（文本模式）
    const filterTextCategoryContent = () => {
      try {
        if (!selectedViewCategory.value || !editorTextValid.value) {
          filteredTextContent.value = '';
          return;
        }
        
        const lines = editorTextContent.value.split('\n');
        let found = false;
        let result = [];
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          if (line === `${selectedViewCategory.value}:`) {
            found = true;
            continue;
          }
          
          if (found) {
            if (!line) {
              break; // 遇到空行结束当前分类
            }
            
            if (!line.endsWith(':')) { // 不是下一个分类的开始
              result.push(line);
            } else {
              break; // 遇到下一个分类结束
            }
          }
        }
        
        if (result.length > 0) {
          filteredTextContent.value = result.join('\n');
        } else {
          filteredTextContent.value = '未找到该分类的数据';
        }
      } catch (error) {
        filteredTextContent.value = `筛选失败: ${error.message}`;
      }
    };
    
    // 获取当前分类的标签数量（JSON模式）
    const getCategoryTagsCount = () => {
      try {
        if (!selectedViewCategory.value || !editorJsonValid.value) return 0;
        
        const jsonData = JSON.parse(editorJsonContent.value);
        if (jsonData && jsonData[selectedViewCategory.value] && Array.isArray(jsonData[selectedViewCategory.value])) {
          return jsonData[selectedViewCategory.value].length;
        }
        return 0;
      } catch (error) {
        return 0;
      }
    };
    
    // 获取当前分类的标签数量（文本模式）
    const getTextCategoryTagsCount = () => {
      try {
        if (!selectedViewCategory.value || !filteredTextContent.value) return 0;
        
        if (filteredTextContent.value === '未找到该分类的数据') return 0;
        
        const lines = filteredTextContent.value.split('\n');
        return lines.filter(line => line.trim()).length;
      } catch (error) {
        return 0;
      }
    };
    
    // 导出编辑器内容
    const exportEditorContent = () => {
      try {
        let content, filename, type;
        
        if (editorMode.value === 'json' && editorJsonValid.value) {
          content = editorJsonContent.value;
          filename = `tag_library_${Date.now()}.json`;
          type = 'application/json';
        } else if (editorMode.value === 'text' && editorTextValid.value) {
          content = editorTextContent.value;
          filename = `tag_library_${Date.now()}.txt`;
          type = 'text/plain';
        } else {
          throw new Error('当前内容格式无效，无法导出');
        }
        
        // 创建Blob对象
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        
        // 创建下载链接并点击
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        emitter.emit('notification', {
          type: 'success',
          message: `成功导出${editorMode.value === 'json' ? 'JSON' : '文本'}格式文件`
        });
      } catch (error) {
        editorError.value = `导出失败: ${error.message}`;
        emitter.emit('notification', {
          type: 'error',
          message: `导出失败: ${error.message}`
        });
      }
    };
    
    // 保存编辑器内容到指定的库
    const saveEditorContent = () => {
      try {
        if (!currentLibraryName.value) {
          throw new Error('请选择目标库');
        }
        
        let libraryData;
        
        if (editorMode.value === 'json' && editorJsonValid.value) {
          libraryData = JSON.parse(editorJsonContent.value);
        } else if (editorMode.value === 'text' && editorTextValid.value) {
          libraryData = convertTextToJson(editorTextContent.value);
        } else {
          throw new Error('当前内容格式无效，无法保存');
        }
        
        // 使用标签库API保存数据 - 改用addLibrary方法
        if (tagLibrary.setLibrary) {
          tagLibrary.setLibrary(currentLibraryName.value, libraryData);
        } else {
          // 兼容旧版接口，使用addLibrary
          tagLibrary.addLibrary(currentLibraryName.value, libraryData);
        }
        
        emitter.emit('notification', {
          type: 'success',
          message: `已成功保存到"${currentLibraryName.value}"库`
        });
        
        // 触发库更新事件
        emitter.emit('tagLibraryUpdated');
      } catch (error) {
        editorError.value = `保存失败: ${error.message}`;
        emitter.emit('notification', {
          type: 'error',
          message: `保存失败: ${error.message}`
        });
      }
    };
    
    // 监听选中分类的变化
    watch(selectedViewCategory, () => {
      if (editorMode.value === 'json') {
        filterCategoryContent();
      } else {
        filterTextCategoryContent();
      }
    });
    
    // 切换编辑器模式
    const switchEditorMode = (mode) => {
      if (mode === editorMode.value) return;
      
      try {
        if (mode === 'json' && editorTextValid.value) {
          // 从文本格式转到JSON模式
          const jsonData = convertTextToJson(editorTextContent.value);
          editorJsonContent.value = JSON.stringify(jsonData, null, 2);
          validateJson();
        } else if (mode === 'text' && editorJsonValid.value) {
          // 从JSON模式转到文本格式
          const jsonData = JSON.parse(editorJsonContent.value);
          editorTextContent.value = convertJsonToText(jsonData);
          validateText();
        }
        
        editorMode.value = mode;
        selectedViewCategory.value = ''; // 重置选中的分类
      } catch (error) {
        editorError.value = `切换模式失败: ${error.message}`;
      }
    };
    
    // 选择分类
    const selectCategory = (category) => {
      selectedCategory.value = category;
    };
    
    // 开始编辑标签
    const startEditTag = (tag, index) => {
      isEditingTag.value = true;
      editingTagIndex.value = index;
      
      // 规范化标签对象，确保无论何种格式都能正确编辑
      if (typeof tag === 'string') {
        tagForm.value = {
          content: tag,
          subTitles: ''
        };
      } else {
        tagForm.value = {
          content: tag.content || '',
          subTitles: Array.isArray(tag.subTitles) && tag.subTitles.length > 0 
            ? tag.subTitles.join(',') 
            : ''
        };
      }
      
      showTagModal.value = true;
    };
    
    // 添加标签模态框
    const showAddTagModal = ref(false);
    watch(showAddTagModal, (newVal) => {
      if (newVal) {
        isEditingTag.value = false;
        editingTagIndex.value = -1;
        tagForm.value = {
          content: '',
          subTitles: ''
        };
        showTagModal.value = true;
        showAddTagModal.value = false;
      }
    });
    
    // 关闭标签模态框
    const closeTagModal = () => {
      showTagModal.value = false;
      tagForm.value = {
        content: '',
        subTitles: ''
      };
    };
    
    // 保存标签
    const saveTag = () => {
      if (!tagForm.value.content.trim()) {
        emitter.emit('notification', {
          type: 'error',
          message: '标签内容不能为空'
        });
        return;
      }
      
      try {
        isLoading.value = true;
        
        // 准备标签对象
        let tagObj;
        
        // 始终使用对象结构保存，确保子标题正确保存
        tagObj = {
          content: tagForm.value.content.trim(),
          subTitles: tagForm.value.subTitles.trim() 
            ? tagForm.value.subTitles.split(',').map(s => s.trim()).filter(s => s)
            : []
        };
        
        // 获取当前库数据的副本
        const libData = JSON.parse(JSON.stringify(libraryData.value || {}));
        
        // 确保分类存在且为数组
        if (!Array.isArray(libData[selectedCategory.value])) {
          libData[selectedCategory.value] = [];
        }
        
        // 更新库数据
        if (isEditingTag.value && editingTagIndex.value >= 0) {
          // 编辑现有标签
          libData[selectedCategory.value][editingTagIndex.value] = tagObj;
        } else {
          // 添加新标签
          libData[selectedCategory.value].push(tagObj);
        }
        
        // 保存到标签库
        let saveSuccess = false;
        if (tagLibrary.setLibrary) {
          saveSuccess = tagLibrary.setLibrary(currentLibraryName.value, libData);
        } else if (tagLibrary.addLibrary) {
          saveSuccess = tagLibrary.addLibrary(currentLibraryName.value, libData);
        } else {
          throw new Error('缺少更新库的API，请确保标签库提供必要的方法');
        }
        
        if (saveSuccess === false) {
          throw new Error('保存操作未成功完成');
        }
        
        emitter.emit('notification', {
          type: 'success',
          message: isEditingTag.value ? '标签更新成功' : '标签添加成功'
        });
        
        // 关闭模态框
        closeTagModal();
        
        // 使用相同的刷新方法重载当前库
        triggerRefresh();
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `保存标签失败: ${error.message}`
        });
        isLoading.value = false;
      }
    };
    
    // 删除标签
    const deleteTag = (index) => {
      deleteType.value = 'tag';
      deleteTarget.value = index;
      deleteConfirmMessage.value = `确定要删除此标签吗？此操作不可恢复。`;
      showDeleteConfirmModal.value = true;
    };
    
    // 开始编辑分类
    const startEditCategory = (category) => {
      isEditingCategory.value = true;
      categoryForm.value = {
        name: category,
        originalName: category
      };
      showCategoryModal.value = true;
    };
    
    // 关闭分类模态框
    const closeCategoryModal = () => {
      showCategoryModal.value = false;
      categoryForm.value = {
        name: '',
        originalName: ''
      };
      showAddCategoryModal.value = false;
    };
    
    // 保存分类
    const saveCategory = () => {
      if (!categoryForm.value.name.trim()) {
        emitter.emit('notification', {
          type: 'error',
          message: '分类名称不能为空'
        });
        return;
      }
      
      try {
        isLoading.value = true;
        
        const newName = categoryForm.value.name.trim();
        
        // 获取当前库数据的副本
        const libData = JSON.parse(JSON.stringify(libraryData.value || {}));
        
        // 检查是否有重复名称
        const allCategories = Object.keys(libData);
        if (allCategories.includes(newName) && (!isEditingCategory.value || newName !== categoryForm.value.originalName)) {
          emitter.emit('notification', {
            type: 'error',
            message: `分类 "${newName}" 已存在`
          });
          isLoading.value = false;
          return;
        }
        
        let saveSuccess = false;
        
        if (isEditingCategory.value) {
          // 重命名分类
          const originalName = categoryForm.value.originalName;
          
          if (originalName === newName) {
            // 名称没有变化，直接返回成功
            emitter.emit('notification', {
              type: 'success',
              message: '分类名称未更改'
            });
            closeCategoryModal();
            return;
          }
          
          // 使用API重命名分类
          if (tagLibrary.renameCategory) {
            saveSuccess = tagLibrary.renameCategory(currentLibraryName.value, originalName, newName);
            if (!saveSuccess) {
              throw new Error(`无法重命名分类 "${originalName}" 为 "${newName}"`);
            }
          } else {
            // 手动实现重命名
            if (!(originalName in libData)) {
              throw new Error(`分类 "${originalName}" 不存在`);
            }
            
            // 保存标签内容
            const tags = [...(libData[originalName] || [])];
            
            // 创建新分类并复制内容
            libData[newName] = tags;
            
            // 删除旧分类
            delete libData[originalName];
            
            // 保存到标签库
            if (tagLibrary.setLibrary) {
              saveSuccess = tagLibrary.setLibrary(currentLibraryName.value, libData);
            } else if (tagLibrary.addLibrary) {
              saveSuccess = tagLibrary.addLibrary(currentLibraryName.value, libData);
            } else {
              throw new Error('缺少更新库的API，请确保标签库提供必要的方法');
            }
            
            if (saveSuccess === false) {
              throw new Error('保存操作未成功完成');
            }
          }
          
          // 更新当前选中的分类
          if (selectedCategory.value === originalName) {
            selectedCategory.value = newName;
          }
        } else {
          // 添加新分类
          if (tagLibrary.addCategory) {
            saveSuccess = tagLibrary.addCategory(currentLibraryName.value, newName);
            if (!saveSuccess) {
              throw new Error(`无法添加分类 "${newName}"`);
            }
          } else {
            // 手动添加分类
            libData[newName] = [];
            
            // 保存到标签库
            if (tagLibrary.setLibrary) {
              saveSuccess = tagLibrary.setLibrary(currentLibraryName.value, libData);
            } else if (tagLibrary.addLibrary) {
              saveSuccess = tagLibrary.addLibrary(currentLibraryName.value, libData);
            } else {
              throw new Error('缺少更新库的API，请确保标签库提供必要的方法');
            }
            
            if (saveSuccess === false) {
              throw new Error('保存操作未成功完成');
            }
          }
          
          // 自动选择新创建的分类
          selectedCategory.value = newName;
        }
        
        emitter.emit('notification', {
          type: 'success',
          message: isEditingCategory.value ? '分类重命名成功' : '分类添加成功'
        });
        
        // 关闭模态框
        closeCategoryModal();
        
        // 使用相同的刷新方法重载当前库
        triggerRefresh();
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `保存分类失败: ${error.message}`
        });
        isLoading.value = false;
      }
    };
    
    // 确认删除分类
    const confirmDeleteCategory = (category) => {
      deleteType.value = 'category';
      deleteTarget.value = category;
      deleteConfirmMessage.value = `确定要删除分类 "${category}" 吗？此操作将删除该分类下的所有标签，且不可恢复。`;
      showDeleteConfirmModal.value = true;
    };
    
    // 取消删除
    const cancelDelete = () => {
      showDeleteConfirmModal.value = false;
      deleteType.value = '';
      deleteTarget.value = null;
      deleteConfirmMessage.value = '';
    };
    
    // 确认删除
    const confirmDelete = () => {
      try {
        isLoading.value = true;
        
        // 获取当前库数据的副本
        const libData = JSON.parse(JSON.stringify(libraryData.value || {}));
        
        if (deleteType.value === 'category') {
          // 删除分类
          const category = deleteTarget.value;
          
          if (tagLibrary.deleteCategory) {
            const success = tagLibrary.deleteCategory(currentLibraryName.value, category);
            if (success === false) {
              throw new Error(`无法删除分类 "${category}"`);
            }
          } else {
            // 手动删除分类
            if (category in libData) {
              delete libData[category];
              
              // 保存到标签库
              let saveSuccess = false;
              if (tagLibrary.setLibrary) {
                saveSuccess = tagLibrary.setLibrary(currentLibraryName.value, libData);
              } else if (tagLibrary.addLibrary) {
                saveSuccess = tagLibrary.addLibrary(currentLibraryName.value, libData);
              } else {
                throw new Error('缺少更新库的API，请确保标签库提供必要的方法');
              }
              
              if (saveSuccess === false) {
                throw new Error('保存操作未成功完成');
              }
            } else {
              throw new Error(`分类 "${category}" 不存在`);
            }
          }
          
          // 如果删除的是当前选中的分类，清空选择
          if (selectedCategory.value === category) {
            selectedCategory.value = '';
          }
          
          emitter.emit('notification', {
            type: 'success',
            message: `分类 "${category}" 已删除`
          });
        } else if (deleteType.value === 'tag') {
          // 删除标签
          const index = deleteTarget.value;
          
          if (selectedCategory.value && Array.isArray(libData[selectedCategory.value])) {
            // 移除指定索引的标签
            libData[selectedCategory.value].splice(index, 1);
            
            // 保存到标签库
            let saveSuccess = false;
            if (tagLibrary.setLibrary) {
              saveSuccess = tagLibrary.setLibrary(currentLibraryName.value, libData);
            } else if (tagLibrary.addLibrary) {
              saveSuccess = tagLibrary.addLibrary(currentLibraryName.value, libData);
            } else {
              throw new Error('缺少更新库的API，请确保标签库提供必要的方法');
            }
            
            if (saveSuccess === false) {
              throw new Error('保存操作未成功完成');
            }
            
            emitter.emit('notification', {
              type: 'success',
              message: '标签已删除'
            });
          } else {
            throw new Error('无法找到要删除的标签');
          }
        }
        
        // 关闭确认框
        cancelDelete();
        
        // 使用相同的刷新方法重载当前库
        triggerRefresh();
      } catch (error) {
        emitter.emit('notification', {
          type: 'error',
          message: `删除失败: ${error.message}`
        });
        cancelDelete();
        isLoading.value = false;
      }
    };
    
    // 替换之前的监听器和事件处理
    // 在setup方法中添加以下代码，监视库名称变化
    watch(libraryNames, (newNames) => {
      // 如果有库但还没有选择，自动选择第一个库
      if (newNames.length > 0 && !currentLibraryName.value) {
        currentLibraryName.value = newNames[0];
        loadSelectedLibrary();
      }
    }, { immediate: true });
    
    // 监听当前库名称变化，加载对应库的数据
    watch(currentLibraryName, (newName) => {
      if (newName) {
        // 这个变更是由用户主动选择触发的，显示通知
        loadSelectedLibrary(false);
      } else {
        // 清空相关数据
        categories.value = [];
        selectedCategory.value = '';
      }
    });
    
    // 监听当前分类变更，自动更新UI
    watch(selectedCategory, () => {
      // 分类变更不需要额外操作，计算属性会自动处理
    });
    
    // 在外部事件发生时刷新内容
    onMounted(() => {
      // 设置全局事件监听
      if (typeof window !== 'undefined') {
        window.addEventListener('storage', handleStorageChange);
      }
      
      // 全局标签库更新事件
      emitter.on('tagLibraryUpdated', () => {
        if (props.show) { // 只有在显示状态才执行刷新
          // 延迟执行刷新，确保所有状态都已更新
          setTimeout(triggerRefresh, 100);
        }
      });
      
      // 监听显示状态变化
      watch(() => props.show, (newVal) => {
        if (newVal) {
          // 当面板显示时，先重载数据再刷新
          tagLibrary._loadFromStorage();
          // 延迟执行确保组件完全挂载
          setTimeout(triggerRefresh, 100);
        }
      }, { immediate: true });
    });
    
    onUnmounted(() => {
      // 清理事件监听
      emitter.off('tagLibraryUpdated');
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
      }
    });
    
    // 处理其他标签页对localStorage的变更
    const handleStorageChange = (event) => {
      if (event.key === 'tag_libraries' && props.show) {
        // 当本地存储中的标签库数据被其他页面更改时刷新
        console.log('检测到标签库数据被其他页面更改，刷新数据');
        triggerRefresh();
      }
    };
    
    return {
      libraryNames,
      editorMode,
      editorTargetLibrary,
      selectedViewCategory,
      categoryList,
      editorJsonContent,
      editorTextContent,
      editorError,
      editorJsonValid,
      editorTextValid,
      filteredContent,
      filteredTextContent,
      currentLibraryName,
      categories,
      categoriesList,
      selectedCategory,
      currentCategoryTags,
      showTagModal,
      showCategoryModal,
      showDeleteConfirmModal,
      showAddCategoryModal,
      tagForm,
      categoryForm,
      isEditingTag,
      isEditingCategory,
      deleteConfirmMessage,
      isLoading,
      refreshTrigger, // 导出刷新触发器
      
      closeEditor,
      loadSelectedLibrary,
      validateJson,
      validateText,
      switchEditorMode,
      convertFormat,
      exportEditorContent,
      saveEditorContent,
      getCategoryTagsCount,
      getTextCategoryTagsCount,
      selectCategory,
      startEditTag,
      closeTagModal,
      saveTag,
      deleteTag,
      startEditCategory,
      closeCategoryModal,
      saveCategory,
      confirmDeleteCategory,
      cancelDelete,
      confirmDelete,
      getCategoryTagCount,
      getTagDisplayContent,
      triggerRefresh
    };
  }
};
</script>

<style scoped>
.advanced-editor {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-container {
  background-color: var(--panel-bg-color, #fff);
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color, #eee);
  background-color: var(--primary-color-light, #f0f7ff);
}

.modal-header h3, 
.modal-header h4 {
  margin: 0;
  color: var(--text-color-dark, #333);
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-color-light, #666);
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--text-color-dark, #333);
}

.modal-body {
  flex: 1;
  overflow: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.library-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.library-selector label {
  font-weight: 500;
  color: var(--text-color, #333);
}

.form-control {
  padding: 10px 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  background-color: var(--bg-color-light, #f5f5f5);
  color: var(--text-color, #333);
  min-width: 200px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-control:focus {
  border-color: var(--primary-color, #1677ff);
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  outline: none;
}

.editor-layout {
  display: flex;
  gap: 20px;
  flex: 1;
  min-height: 400px;
}

.category-panel,
.tags-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color-light, #f5f5f5);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--primary-color-light, #e6f7ff);
  border-bottom: 1px solid var(--border-color, #eee);
}

.panel-header h4 {
  margin: 0;
  font-size: 1rem;
  color: var(--text-color, #333);
  font-weight: 600;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background-color: var(--primary-color, #1677ff);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  transition: all 0.3s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.btn-icon:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 3px 7px rgba(0, 0, 0, 0.15);
}

.add-btn {
  background-color: var(--success-color, #52c41a);
}

.edit-btn {
  background-color: var(--warning-color, #faad14);
}

.delete-btn {
  background-color: var(--error-color, #f5222d);
}

.category-list,
.tag-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.category-item,
.tag-item {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  margin-bottom: 10px;
  border-radius: 6px;
  background-color: var(--bg-color, #fff);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
}

.category-item {
  cursor: pointer;
}

.category-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
}

.category-item.active {
  background-color: var(--primary-color, #1677ff);
  color: white;
}

.category-item.active .tag-count {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.category-name,
.tag-content {
  flex: 1;
  margin-right: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.tag-count {
  font-size: 12px;
  padding: 3px 8px;
  background-color: var(--bg-color-dark, #e0e0e0);
  border-radius: 12px;
  margin-right: 10px;
}

.category-actions,
.tag-actions {
  display: flex;
  gap: 8px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.category-item:hover .category-actions,
.tag-item:hover .tag-actions {
  opacity: 1;
}

.empty-message,
.empty-library {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: var(--text-color-light, #666);
  font-style: italic;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 6px;
  margin: 10px 0;
}

/* 模态框样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  animation: fadeIn 0.2s forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background-color: var(--panel-bg-color, #fff);
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s forwards;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color, #eee);
  background-color: var(--bg-color-light, #f5f5f5);
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-color, #333);
}

.btn {
  padding: 10px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}

.btn-primary {
  background-color: var(--primary-color, #1677ff);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-hover-color, #4096ff);
}

.btn-secondary {
  background-color: var(--bg-color-dark, #e0e0e0);
  color: var(--text-color, #333);
}

.btn-secondary:hover {
  background-color: #d0d0d0;
}

.btn-danger {
  background-color: var(--error-color, #f5222d);
  color: white;
}

.btn-danger:hover {
  background-color: #ff4d4f;
}

/* 深色模式样式 */
:global(.dark-mode) .modal-container,
:global(.dark-mode) .modal-content {
  background-color: var(--panel-bg-color-dark, #2d2d2d);
}

:global(.dark-mode) .modal-header {
  border-bottom-color: var(--border-color-dark-mode, #3d3d3d);
  background-color: var(--primary-color-dark, #003a8c);
}

:global(.dark-mode) .modal-header h3,
:global(.dark-mode) .modal-header h4 {
  color: var(--text-color-dark-mode, #e0e0e0);
}

:global(.dark-mode) .close-btn {
  color: var(--text-color-light-dark-mode, #aaa);
}

:global(.dark-mode) .close-btn:hover {
  color: var(--text-color-dark-mode, #e0e0e0);
}

:global(.dark-mode) .library-selector label,
:global(.dark-mode) .form-group label {
  color: var(--text-color-dark-mode, #e0e0e0);
}

:global(.dark-mode) .form-control {
  background-color: var(--bg-color-dark-dark, #333);
  border-color: var(--border-color-dark-mode, #444);
  color: var(--text-color-dark-mode, #e0e0e0);
}

:global(.dark-mode) .category-panel,
:global(.dark-mode) .tags-panel {
  background-color: var(--bg-color-dark-dark, #333);
}

:global(.dark-mode) .panel-header {
  background-color: var(--primary-color-dark, #003a8c);
  border-bottom-color: var(--border-color-dark-mode, #444);
}

:global(.dark-mode) .panel-header h4 {
  color: var(--text-color-dark-mode, #e0e0e0);
}

:global(.dark-mode) .category-item,
:global(.dark-mode) .tag-item {
  background-color: var(--bg-color-dark, #444);
  color: var(--text-color-dark-mode, #e0e0e0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

:global(.dark-mode) .tag-count {
  background-color: var(--bg-color-darker-dark, #222);
  color: var(--text-color-light-dark-mode, #aaa);
}

:global(.dark-mode) .empty-message,
:global(.dark-mode) .empty-library {
  color: var(--text-color-light-dark-mode, #aaa);
  background-color: rgba(255, 255, 255, 0.03);
}

:global(.dark-mode) .modal-footer {
  border-top-color: var(--border-color-dark-mode, #3d3d3d);
  background-color: var(--bg-color-dark-dark, #383838);
}

:global(.dark-mode) .btn-secondary {
  background-color: var(--bg-color-darker-dark, #222);
  color: var(--text-color-dark-mode, #e0e0e0);
}

:global(.dark-mode) .btn-secondary:hover {
  background-color: #2a2a2a;
}

@media (max-width: 768px) {
  .editor-layout {
    flex-direction: column;
  }
  
  .category-panel, 
  .tags-panel {
    min-height: 300px;
  }
  
  .btn-icon {
    width: 28px;
    height: 28px;
  }
  
  .modal-content {
    width: 95%;
  }
  
  .form-control {
    min-width: auto;
    width: 100%;
  }
  
  /* 优化移动端布局 */
  .modal-container {
    width: 100%;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
  }
  
  .library-selector {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .library-selector select {
    width: 100%;
  }
  
  .modal-header {
    padding: 12px 16px;
  }
  
  .modal-body {
    padding: 12px;
  }
  
  .modal .modal-content {
    max-width: 100%;
    border-radius: 0;
    height: 100%;
  }
}

.loading-indicator {
  display: inline-flex;
  align-items: center;
  margin-left: 10px;
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-color, #1677ff);
  animation: spin 0.8s linear infinite;
}

.spinner-sm {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
  margin-right: 6px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.btn-icon:disabled, 
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 深色模式加载指示器 */
:global(.dark-mode) .spinner {
  border-color: rgba(255, 255, 255, 0.1);
  border-top-color: var(--primary-color, #1677ff);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.refresh-btn {
  background: none;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-color-light, #666);
  transition: all 0.3s;
  font-size: 18px;
}

.refresh-btn:hover:not(:disabled) {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--text-color-dark, #333);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-icon {
  display: inline-block;
  transition: transform 0.3s ease;
}

.refresh-btn:hover:not(:disabled) .refresh-icon {
  transform: rotate(180deg);
}

/* 深色模式刷新按钮 */
:global(.dark-mode) .refresh-btn:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.1);
}

.refreshing {
  animation: spinning 1s linear infinite;
}

@keyframes spinning {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style> 