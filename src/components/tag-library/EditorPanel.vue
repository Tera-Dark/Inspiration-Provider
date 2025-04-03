<template>
  <div class="editor-container">
    <div class="section">
      <div class="section-header">
        <div class="header-title">
          <h3>标签库编辑器</h3>
          <div class="header-subtitle">按照格式编辑标签，完成后可以导出或保存</div>
        </div>
        <div class="header-actions">
          <button @click="exportEditorContent" class="btn secondary-btn">
            <span>导出JSON</span>
          </button>
          <button @click="saveEditorContent" class="btn primary-btn">
            <span>保存到当前库</span>
          </button>
        </div>
      </div>
      
      <div class="editor-toolbar">
        <div class="toolbar-group">
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
        
        <div class="toolbar-group">
          <label>目标库:</label>
          <select v-model="editorTargetLibrary" class="form-control target-select">
            <option v-for="lib in libraries" :key="lib.name" :value="lib.name">
              {{ lib.name }}
            </option>
          </select>
          <button @click="loadCurrentLibrary" class="btn secondary-btn small-btn" title="加载当前库内容到编辑器">
            <span>加载库内容</span>
          </button>
        </div>
      </div>
      
      <div class="editor-main">
        <!-- JSON编辑模式 -->
        <div v-if="editorMode === 'json'" class="editor-wrapper">
          <textarea
            v-model="jsonContent"
            class="editor-textarea"
            placeholder="输入JSON格式的标签库内容..."
            @input="validateJson"
          ></textarea>
        </div>
        
        <!-- 文本编辑模式 -->
        <div v-else class="editor-wrapper">
          <textarea
            v-model="textContent"
            class="editor-textarea"
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
      </div>
      
      <div class="editor-footer">
        <div class="editor-status">
          <div v-if="editorError" class="error-message">{{ editorError }}</div>
          <div v-else-if="isValid" class="success-message">格式正确</div>
        </div>
        
        <div class="conversion-actions">
          <button 
            @click="convertFormat" 
            class="btn secondary-btn"
            :disabled="!isValid"
          >
            转换为{{ editorMode === 'json' ? '文本' : 'JSON' }}格式
          </button>
        </div>
      </div>
    </div>
    
    <div class="section preview-section">
      <div class="section-header">
        <div class="header-title">
          <h3>预览</h3>
          <div class="header-subtitle">编辑内容后在此处预览</div>
        </div>
        <div class="header-actions">
          <select v-model="selectedCategory" class="form-control" :disabled="!isValid || !hasCategories">
            <option value="">全部分类</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>
      </div>
      
      <div class="preview-content" v-if="isValid">
        <!-- 分类过滤预览 -->
        <div v-if="selectedCategory" class="category-preview">
          <h4>{{ selectedCategory }} <span class="tag-count">({{ filteredCategoryTags.length }} 个标签)</span></h4>
          <ul v-if="filteredCategoryTags.length > 0" class="tag-list">
            <li v-for="(tag, index) in filteredCategoryTags" :key="index" class="tag-item">
              <template v-if="typeof tag === 'string'">
                {{ tag }}
              </template>
              <template v-else>
                <div class="tag-content">{{ tag.content }}</div>
                <div v-if="tag.subTitles && tag.subTitles.length > 0" class="tag-subtitles">
                  {{ tag.subTitles.join(', ') }}
                </div>
              </template>
            </li>
          </ul>
          <div v-else class="empty-preview">该分类下没有标签</div>
        </div>
        
        <!-- 全部分类预览 -->
        <div v-else class="all-categories-preview">
          <div v-for="category in categories" :key="category" class="category-section">
            <h4>{{ category }} <span class="tag-count">({{ getCategoryTags(category).length }} 个标签)</span></h4>
            <ul class="tag-list">
              <li v-for="(tag, index) in getCategoryTags(category).slice(0, 5)" :key="index" class="tag-item">
                <template v-if="typeof tag === 'string'">
                  {{ tag }}
                </template>
                <template v-else>
                  <div class="tag-content">{{ tag.content }}</div>
                  <div v-if="tag.subTitles && tag.subTitles.length > 0" class="tag-subtitles">
                    {{ tag.subTitles.join(', ') }}
                  </div>
                </template>
              </li>
            </ul>
            <div v-if="getCategoryTags(category).length > 5" class="more-tags">
              还有 {{ getCategoryTags(category).length - 5 }} 个标签...
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-preview">
        <p>{{ editorError ? '请先修正格式错误' : '请输入有效内容以查看预览' }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, inject, watch } from 'vue';

export default defineComponent({
  name: 'EditorPanel',
  props: {
    libraries: {
      type: Array,
      default: () => []
    },
    currentLibrary: {
      type: String,
      default: ''
    }
  },
  emits: ['library-updated'],
  setup(props, { emit }) {
    const tagLibrary = inject('tagLibrary');
    const emitter = inject('emitter');
    
    // 编辑器状态
    const editorMode = ref('json');
    const jsonContent = ref('');
    const textContent = ref('');
    const editorTargetLibrary = ref('');
    const editorError = ref('');
    const jsonValid = ref(false);
    const textValid = ref(false);
    const selectedCategory = ref('');
    const libraryData = ref(null);
    
    // 判断当前编辑内容是否有效
    const isValid = computed(() => {
      return editorMode.value === 'json' ? jsonValid.value : textValid.value;
    });
    
    // 获取当前编辑内容的所有分类
    const categories = computed(() => {
      if (!isValid.value) return [];
      return Object.keys(libraryData.value || {}).sort();
    });
    
    // 是否有分类
    const hasCategories = computed(() => {
      return categories.value.length > 0;
    });
    
    // 根据当前选择的分类过滤标签
    const filteredCategoryTags = computed(() => {
      if (!selectedCategory.value || !libraryData.value) return [];
      return libraryData.value[selectedCategory.value] || [];
    });
    
    // 初始化
    const init = () => {
      if (props.currentLibrary) {
        editorTargetLibrary.value = props.currentLibrary;
        // 不再自动加载库内容
      }
    };
    
    // 加载当前库到编辑器
    const loadCurrentLibrary = async () => {
      if (!editorTargetLibrary.value) {
        editorError.value = '请选择目标库';
        return;
      }
      
      try {
        const library = tagLibrary.getLibrary(editorTargetLibrary.value);
        
        if (editorMode.value === 'json') {
          jsonContent.value = JSON.stringify(library, null, 2);
          validateJson();
        } else {
          textContent.value = convertJsonToText(library);
          validateText();
        }
        
        libraryData.value = library;
        selectedCategory.value = '';
        
        emitter.emit('notification', {
          type: 'success',
          message: `已加载 "${editorTargetLibrary.value}" 库到编辑器`
        });
      } catch (error) {
        editorError.value = `加载库失败: ${error.message}`;
        emitter.emit('notification', {
          type: 'error',
          message: `加载库失败: ${error.message}`
        });
      }
    };
    
    // 验证JSON格式
    const validateJson = () => {
      try {
        if (!jsonContent.value.trim()) {
          jsonValid.value = false;
          editorError.value = '';
          libraryData.value = null;
          return;
        }
        
        const parsed = JSON.parse(jsonContent.value);
        jsonValid.value = true;
        editorError.value = '';
        libraryData.value = parsed;
        
        // 触发通知
        emitter.emit('notification', {
          type: 'success',
          message: '格式验证成功'
        });
      } catch (error) {
        jsonValid.value = false;
        editorError.value = `JSON格式错误: ${error.message}`;
        libraryData.value = null;
      }
    };
    
    // 验证文本格式
    const validateText = () => {
      try {
        if (!textContent.value.trim()) {
          textValid.value = false;
          editorError.value = '';
          libraryData.value = null;
          return;
        }
        
        const parsed = convertTextToJson(textContent.value);
        textValid.value = true;
        editorError.value = '';
        libraryData.value = parsed;
        
        // 触发通知
        emitter.emit('notification', {
          type: 'success',
          message: '格式验证成功'
        });
      } catch (error) {
        textValid.value = false;
        editorError.value = `文本格式错误: ${error.message}`;
        libraryData.value = null;
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
        if (editorMode.value === 'json' && jsonValid.value) {
          // 从JSON转换为文本
          const jsonData = JSON.parse(jsonContent.value);
          textContent.value = convertJsonToText(jsonData);
          editorMode.value = 'text';
          textValid.value = true;
        } else if (editorMode.value === 'text' && textValid.value) {
          // 从文本转换为JSON
          const jsonData = convertTextToJson(textContent.value);
          jsonContent.value = JSON.stringify(jsonData, null, 2);
          editorMode.value = 'json';
          jsonValid.value = true;
        }
      } catch (error) {
        editorError.value = `格式转换失败: ${error.message}`;
      }
    };
    
    // 切换编辑器模式
    const switchEditorMode = (mode) => {
      if (mode === editorMode.value) return;
      
      try {
        if (mode === 'json' && textValid.value) {
          // 从文本格式转到JSON模式
          const jsonData = convertTextToJson(textContent.value);
          jsonContent.value = JSON.stringify(jsonData, null, 2);
          editorMode.value = 'json';
          jsonValid.value = true;
        } else if (mode === 'text' && jsonValid.value) {
          // 从JSON模式转到文本格式
          const jsonData = JSON.parse(jsonContent.value);
          textContent.value = convertJsonToText(jsonData);
          editorMode.value = 'text';
          textValid.value = true;
        } else {
          editorMode.value = mode;
        }
      } catch (error) {
        editorError.value = `切换模式失败: ${error.message}`;
      }
    };
    
    // 获取指定分类的标签
    const getCategoryTags = (category) => {
      if (!libraryData.value || !libraryData.value[category]) return [];
      
      // 确保返回的数据是数组
      const tags = libraryData.value[category];
      if (!Array.isArray(tags)) return [];
      
      return tags;
    };
    
    // 导出编辑器内容
    const exportEditorContent = () => {
      try {
        let content, filename, type;
        
        if (!isValid.value) {
          throw new Error('当前内容格式无效，无法导出');
        }
        
        if (editorMode.value === 'json') {
          content = jsonContent.value;
          filename = `tag_library_${Date.now()}.json`;
          type = 'application/json';
        } else {
          content = textContent.value;
          filename = `tag_library_${Date.now()}.txt`;
          type = 'text/plain';
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
        if (!editorTargetLibrary.value) {
          throw new Error('请选择目标库');
        }
        
        if (!isValid.value) {
          throw new Error('当前内容格式无效，无法保存');
        }
        
        // 验证库数据的结构
        if (!libraryData.value || typeof libraryData.value !== 'object') {
          throw new Error('库数据必须是有效的对象');
        }
        
        // 检查至少有一个分类
        const categories = Object.keys(libraryData.value);
        if (categories.length === 0) {
          throw new Error('库数据必须至少包含一个分类');
        }
        
        // 检查所有分类内容是否为数组
        for (const category of categories) {
          if (!Array.isArray(libraryData.value[category])) {
            throw new Error(`分类 "${category}" 的内容必须是数组`);
          }
        }
        
        // 使用标签库API保存数据
        let saveSuccess = false;
        
        if (tagLibrary.setLibrary) {
          saveSuccess = tagLibrary.setLibrary(editorTargetLibrary.value, libraryData.value);
        } else if (tagLibrary.addLibrary) {
          // 兼容旧版接口，使用addLibrary
          saveSuccess = tagLibrary.addLibrary(editorTargetLibrary.value, libraryData.value);
        } else {
          throw new Error('缺少保存库的API，请确保标签库提供必要的方法');
        }
        
        if (!saveSuccess) {
          throw new Error('保存库操作未成功完成，可能是因为数据格式问题');
        }
        
        emitter.emit('notification', {
          type: 'success',
          message: `已成功保存到"${editorTargetLibrary.value}"库`
        });
        
        // 触发库更新事件
        emit('library-updated');
      } catch (error) {
        editorError.value = `保存失败: ${error.message}`;
        emitter.emit('notification', {
          type: 'error',
          message: `保存失败: ${error.message}`
        });
      }
    };
    
    // 监听当前库的变化
    watch(() => props.currentLibrary, (newVal) => {
      if (newVal) {
        editorTargetLibrary.value = newVal;
      }
    });
    
    // 初始化
    init();
    
    return {
      editorMode,
      jsonContent,
      textContent,
      editorTargetLibrary,
      editorError,
      isValid,
      categories,
      hasCategories,
      selectedCategory,
      filteredCategoryTags,
      
      loadCurrentLibrary,
      validateJson,
      validateText,
      switchEditorMode,
      convertFormat,
      getCategoryTags,
      exportEditorContent,
      saveEditorContent
    };
  }
});
</script>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section {
  background-color: var(--panel-bg-color, #fff);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.header-title h3 {
  margin: 0 0 6px;
  font-size: 1.2rem;
  color: var(--text-color-dark, #333);
}

.header-subtitle {
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 10px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.12);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.primary-btn {
  background-color: var(--primary-color, #1677ff);
  color: white;
}

.primary-btn:hover {
  background-color: var(--primary-hover-color, #0958d9);
}

.secondary-btn {
  background-color: var(--bg-color-light, #f0f0f0);
  color: var(--text-color, #333);
}

.secondary-btn:hover {
  background-color: var(--bg-color-dark, #e0e0e0);
}

.small-btn {
  padding: 8px 12px;
  font-size: 0.9rem;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-group label {
  font-weight: 500;
  color: var(--text-color, #333);
}

.segmented-control {
  display: flex;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  overflow: hidden;
}

.segmented-control button {
  padding: 8px 15px;
  background-color: var(--bg-color-light, #f5f5f5);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.segmented-control button.active {
  background-color: var(--primary-color, #1677ff);
  color: white;
}

.segmented-control button:hover:not(.active) {
  background-color: var(--bg-color-dark, #e0e0e0);
}

.form-control {
  padding: 6px 8px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  background-color: var(--bg-color-light, #f5f5f5);
  color: var(--text-color, #333);
}

.target-select {
  min-width: 120px;
}

.editor-main {
  height: 300px;
  margin-bottom: 16px;
}

.editor-wrapper {
  height: 100%;
}

.editor-textarea {
  width: 100%;
  height: 100%;
  padding: 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  resize: none;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-color, #333);
  background-color: var(--bg-color-light, #f9f9f9);
}

.editor-textarea:focus {
  outline: none;
  border-color: var(--primary-color, #1677ff);
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.editor-status {
  font-size: 0.9rem;
}

.error-message {
  color: var(--error-color, #f5222d);
}

.success-message {
  color: var(--success-color, #52c41a);
}

.preview-section {
  max-height: 400px;
  overflow-y: auto;
}

.preview-content {
  margin-top: 16px;
}

.category-section {
  margin-bottom: 20px;
}

.category-section h4,
.category-preview h4 {
  margin: 0 0 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-color-light, #eee);
  color: var(--text-color-dark, #333);
  font-size: 1rem;
  display: flex;
  align-items: center;
}

.tag-count {
  font-size: 0.8rem;
  font-weight: normal;
  color: var(--text-color-light, #666);
  margin-left: 8px;
}

.tag-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tag-item {
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 4px;
  background-color: var(--bg-color-light, #f5f5f5);
  color: var(--text-color, #333);
}

.tag-content {
  font-weight: 500;
}

.tag-subtitles {
  margin-top: 4px;
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
  font-style: italic;
}

.more-tags {
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
  padding: 4px 0;
}

.empty-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  color: var(--text-color-light, #666);
  font-style: italic;
}

/* 深色模式适配 */
:global(.dark-mode) .section {
  background-color: var(--panel-bg-color-dark, #2d2d2d);
}

:global(.dark-mode) .header-title h3 {
  color: var(--text-color-dark-mode, #e0e0e0);
}

:global(.dark-mode) .header-subtitle {
  color: var(--text-color-light-dark-mode, #aaa);
}

:global(.dark-mode) .toolbar-group label {
  color: var(--text-color-dark-mode, #e0e0e0);
}

:global(.dark-mode) .segmented-control {
  border-color: var(--border-color-dark-mode, #444);
}

:global(.dark-mode) .segmented-control button:not(.active) {
  background-color: var(--bg-color-dark-dark, #333);
  color: var(--text-color-dark-mode, #e0e0e0);
}

:global(.dark-mode) .form-control {
  background-color: var(--bg-color-dark-dark, #333);
  border-color: var(--border-color-dark-mode, #444);
  color: var(--text-color-dark-mode, #e0e0e0);
}

:global(.dark-mode) .editor-textarea {
  background-color: var(--bg-color-dark-dark, #1f1f1f);
  border-color: var(--border-color-dark-mode, #444);
  color: var(--text-color-dark-mode, #e0e0e0);
}

:global(.dark-mode) .editor-textarea:focus {
  border-color: var(--primary-color, #177ddc);
  box-shadow: 0 0 0 2px rgba(23, 125, 220, 0.2);
}

:global(.dark-mode) .secondary-btn {
  background-color: var(--bg-color-dark-dark, #333);
  color: var(--text-color-dark-mode, #e0e0e0);
}

:global(.dark-mode) .secondary-btn:hover {
  background-color: var(--bg-color-darker-dark, #444);
}

:global(.dark-mode) .category-section h4,
:global(.dark-mode) .category-preview h4 {
  color: var(--text-color-dark-mode, #e0e0e0);
  border-bottom-color: var(--border-color-dark-mode, #3d3d3d);
}

:global(.dark-mode) .tag-count {
  color: var(--text-color-light-dark-mode, #aaa);
}

:global(.dark-mode) .tag-item {
  background-color: var(--bg-color-dark-dark, #333);
  color: var(--text-color-dark-mode, #e0e0e0);
}

:global(.dark-mode) .tag-subtitles {
  color: var(--text-color-light-dark-mode, #aaa);
}

:global(.dark-mode) .more-tags,
:global(.dark-mode) .empty-preview {
  color: var(--text-color-light-dark-mode, #aaa);
}
</style> 