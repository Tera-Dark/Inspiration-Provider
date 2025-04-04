<template>
  <div class="import-panel">
    <div class="section">
      <h3>导入方式</h3>
      <div class="form-group">
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

      <!-- JSON导入部分 -->
      <div class="json-import">
        <!-- 新库模式 -->
        <div v-if="importMode === 'new'" class="form-group">
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
        <div v-else class="form-group">
          <label for="extend-library">选择要扩展的库</label>
          <select 
            id="extend-library" 
            v-model="selectedLibraryName" 
            class="form-control"
          >
            <option value="">-- 选择库 --</option>
            <option v-for="lib in libraries" :key="lib.name" :value="lib.name">
              {{ lib.name }} ({{ lib.count }} 个标签)
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="preset-json">预设JSON</label>
          <select 
            id="preset-json" 
            v-model="selectedPresetJson" 
            class="form-control"
            @change="handlePresetChange"
          >
            <option value="">-- 选择预设JSON --</option>
            <option value="default">所长常规法典</option>
          </select>
          <div class="info-text" v-if="selectedPresetJson">已选择预设: {{ getPresetName() }}</div>
        </div>
        
        <div class="form-group">
          <label for="import-file" class="file-label">
            <span>选择JSON文件</span>
            <input type="file" id="import-file" @change="handleFileSelect" accept=".json" />
          </label>
          <div v-if="fileSelected && !selectedPresetJson" class="selected-file">
            已选择文件
          </div>
        </div>
        
        <div class="action-group">
          <div v-if="importMode === 'new'" class="import-action">
            <button @click="importNewLibrary" class="btn primary-btn" :disabled="!fileSelected && !selectedPresetJson">创建新库</button>
          </div>
          <div v-else class="import-action">
            <button @click="extendExistingLibrary" class="btn primary-btn" :disabled="!fileSelected && !selectedPresetJson">扩展现有库</button>
          </div>
          <button @click="clearImport" class="btn secondary-btn">清空</button>
          <button @click="debugCheckFileContent" class="btn debug-btn">调试检查</button>
        </div>
      </div>
    </div>
      
    <!-- JSON导出部分 -->
    <div class="section">
      <h3>标签库导出</h3>
      <div class="export-panel">
        <div class="form-group">
          <label for="export-library">选择要导出的库</label>
          <select 
            id="export-library" 
            v-model="exportLibraryName" 
            class="form-control"
          >
            <option v-for="lib in libraries" :key="lib.name" :value="lib.name">
              {{ lib.name }}
            </option>
          </select>
        </div>
        
        <div class="action-group">
          <button @click="exportLibrary" class="btn primary-btn" :disabled="!exportLibraryName">导出为JSON</button>
          <button @click="exportCurrentLibrary" class="btn secondary-btn">导出当前库</button>
        </div>
      </div>
    </div>
      
    <!-- 文本转换导入部分 -->
    <div class="section">
      <h3>文本转换导入</h3>
      <div class="text-convert-import">
        <div class="card">
          <div class="card-header">
            <h4>文本标签转换工具</h4>
            <div class="format-selector">
              <label class="radio-item">
                <input type="radio" v-model="textFormat" value="auto">
                <span>自动检测</span>
              </label>
              <label class="radio-item">
                <input type="radio" v-model="textFormat" value="categoryLineTag">
                <span>分类换行标签</span>
              </label>
              <label class="radio-item">
                <input type="radio" v-model="textFormat" value="tagHashCategory">
                <span>标签#分类</span>
              </label>
              <label class="radio-item">
                <input type="radio" v-model="textFormat" value="commaCategory">
                <span>逗号分隔分类</span>
              </label>
              <label class="radio-item">
                <input type="radio" v-model="textFormat" value="characterTags">
                <span>法典标签格式</span>
              </label>
            </div>
          </div>
          
          <textarea 
            v-model="sourceText" 
            class="form-control" 
            rows="10" 
            placeholder="请粘贴需要转换的文本内容..."
          ></textarea>
          
          <div class="button-row">
            <button 
              class="btn primary-btn" 
              @click="convertTextToJson"
              :disabled="!sourceText.trim()"
            >
              转换为JSON
            </button>
            <button 
              class="btn secondary-btn" 
              @click="clearSourceText"
              :disabled="!sourceText.trim()"
            >
              清空输入
            </button>
          </div>
        </div>
        
        <div v-if="convertedJson" class="card">
          <div class="card-header">
            <h4>转换结果预览</h4>
            <div class="result-stats">
              发现 {{ countCategories() }} 个分类，{{ countTags() }} 个标签
            </div>
          </div>
          
          <textarea 
            v-model="jsonPreview" 
            class="form-control" 
            rows="10" 
            readonly
          ></textarea>
          
          <div class="button-row">
            <button 
              class="btn primary-btn" 
              @click="importConvertedJson"
            >
              导入转换后的JSON
            </button>
            <button 
              class="btn secondary-btn" 
              @click="copyJsonToClipboard"
            >
              复制JSON
            </button>
            <button 
              class="btn secondary-btn" 
              @click="clearConvertedJson"
            >
              清空结果
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, inject, computed } from 'vue';

export default defineComponent({
  name: 'ImportPanel',
  props: {
    libraries: {
      type: Array,
      required: true
    }
  },
  emits: ['library-updated'],
  setup(props, { emit }) {
    const tagLibrary = inject('tagLibrary');
    const emitter = inject('emitter');
    
    // 导入相关状态
    const importMode = ref('new');
    const newLibraryName = ref('');
    const selectedLibraryName = ref('');
    const fileContent = ref(null);
    const fileSelected = ref(false);
    
    // 新增的文本转换相关状态
    const sourceText = ref('');
    const convertedJson = ref(null);
    const textFormat = ref('auto');
    
    // 转换后的JSON预览
    const jsonPreview = computed(() => {
      if (!convertedJson.value) return '';
      return JSON.stringify(convertedJson.value, null, 2);
    });
    
    // 导出相关状态
    const exportLibraryName = ref('');
    
    // 预设JSON相关状态
    const selectedPresetJson = ref('');
    
    // 添加一个变量用于存储预设JSON的内容
    const presetFileContent = ref(null);
    
    // 获取预设名称
    const getPresetName = () => {
      if (selectedPresetJson.value === 'default') {
        return '所长常规法典';
      }
      return '';
    };
    
    // 添加一个直接使用预设数据的功能
    const usePresetData = (preset) => {
      try {
        console.log('使用内置预设数据:', preset);
        
        // 我们现在只使用所长常规法典，不再需要内置预设数据
        return false;
      } catch (error) {
        console.error('加载内置预设失败:', error);
        showNotification('error', '加载内置预设失败');
        return false;
      }
    };
    
    // 处理预设JSON选择变更
    const handlePresetChange = async () => {
      if (!selectedPresetJson.value) {
        presetFileContent.value = null;
        return;
      }
      
      try {
        // 先尝试使用内置预设数据
        if (usePresetData(selectedPresetJson.value)) {
          console.log('使用内置预设数据成功');
          return;
        }
        
        // 根据选择加载不同的JSON文件
        let jsonUrl = '';
        if (selectedPresetJson.value === 'default') {
          // 尝试多个可能的路径
          const possiblePaths = [
            '/所长常规法典.json',
            './所长常规法典.json',
            './public/所长常规法典.json', 
            '../public/所长常规法典.json',
            '../../public/所长常规法典.json',
            '/public/所长常规法典.json'
          ];
          
          let foundPath = false;
          
          for (const path of possiblePaths) {
            try {
              const resp = await fetch(path, { cache: 'no-cache' });
              if (resp.ok) {
                jsonUrl = path;
                console.log(`找到所长常规法典路径: ${path}`);
                foundPath = true;
                break;
              }
            } catch (e) {
              console.warn(`尝试路径 ${path} 失败:`, e);
            }
          }
          
          if (!foundPath) {
            console.error('未能找到所长常规法典文件，尝试直接获取当前数据');
            try {
              // 尝试从TagLibrary直接获取数据
              if (tagLibrary && tagLibrary.getLibrary) {
                const defaultLib = tagLibrary.getLibrary('所长常规法典库');
                if (defaultLib && Object.keys(defaultLib).length > 0) {
                  console.log('直接从TagLibrary获取法典数据成功');
                  presetFileContent.value = defaultLib;
                  showNotification('success', `已加载法典数据: ${getPresetName()}`);
                  return;
                }
              }
              throw new Error('无法找到所长常规法典数据');
            } catch (err) {
              throw new Error('无法获取所长常规法典数据: ' + err.message);
            }
          }
        }
        
        console.log(`使用路径加载JSON: ${jsonUrl}`);
        
        // 获取JSON文件内容
        const response = await fetch(jsonUrl, { cache: 'no-cache' });
        if (!response.ok) {
          throw new Error(`无法加载预设JSON: ${response.statusText}`);
        }
        
        // 解析JSON内容
        const content = await response.json();
        console.log('JSON内容加载成功:', Object.keys(content).length, '个分类');
        
        presetFileContent.value = content;
        
        showNotification('success', `已加载预设JSON: ${getPresetName()}`);
      } catch (error) {
        console.error('加载预设JSON失败:', error);
        showNotification('error', `加载预设JSON失败: ${error.message}`);
        presetFileContent.value = null;
        selectedPresetJson.value = '';
      }
    };
    
    // 处理文件选择
    const handleFileSelect = (event) => {
      console.log('文件选择器触发事件');
      
      const file = event.target.files[0];
      if (!file) {
        console.log('没有选择文件');
        fileSelected.value = false;
        fileContent.value = null;
        return;
      }
      
      console.log('选择的文件:', file.name, file.type, file.size + ' 字节');
      
      // 检查文件类型
      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        console.log('文件类型不是JSON');
        showNotification('error', '请选择JSON文件');
        fileSelected.value = false;
        fileContent.value = null;
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          let jsonText = e.target.result;
          console.log('读取到文件内容，长度:', jsonText.length);
          
          // 尝试解析JSON
          const content = JSON.parse(jsonText);
          console.log('JSON解析成功，分类数:', Object.keys(content).length);
          
          // 验证JSON格式
          if (typeof content !== 'object' || content === null) {
            throw new Error('无效的JSON格式：必须是一个对象');
          }
          
          // 检查是否至少有一个分类，且每个分类都是数组
          let hasValidCategory = false;
          let invalidCategories = [];
          
          for (const category in content) {
            if (!Array.isArray(content[category])) {
              invalidCategories.push(category);
              continue;
            }
            hasValidCategory = true;
            console.log(`分类 "${category}" 包含 ${content[category].length} 个标签`);
          }
          
          if (invalidCategories.length > 0) {
            console.error('发现无效分类:', invalidCategories);
            throw new Error(`以下分类的内容不是数组: ${invalidCategories.join(', ')}`);
          }
          
          if (!hasValidCategory) {
            throw new Error('JSON文件必须包含至少一个分类');
          }
          
          // 存储解析后的内容
          fileContent.value = content;
          fileSelected.value = true;
          showNotification('success', '文件加载成功');
          
          // 清除预设选择，因为现在使用的是上传的文件
          selectedPresetJson.value = '';
          
          console.log('文件内容已成功加载到fileContent中');
        } catch (error) {
          console.error('解析JSON失败:', error);
          showNotification('error', `无法解析文件: ${error.message}`);
          fileSelected.value = false;
          fileContent.value = null;
          
          // 清空文件输入，让用户可以重新选择
          const fileInput = document.querySelector('input[type="file"]');
          if (fileInput) {
            fileInput.value = '';
          }
        }
      };
      
      reader.onerror = (error) => {
        console.error('读取文件失败:', error);
        showNotification('error', '读取文件失败');
        fileSelected.value = false;
        fileContent.value = null;
      };
      
      console.log('开始读取文件...');
      reader.readAsText(file);
    };
    
    // 清空导入表单
    const clearImport = () => {
      newLibraryName.value = '';
      selectedLibraryName.value = '';
      fileContent.value = null;
      fileSelected.value = false;
      selectedPresetJson.value = '';
      presetFileContent.value = null;
      
      // 清空文件输入，让用户可以重新选择
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = '';
      }
    };
    
    // 显示通知消息
    const showNotification = (type, message) => {
      emitter.emit('notification', { type, message });
    };
    
    // 清空源文本
    const clearSourceText = () => {
      sourceText.value = '';
    };
    
    // 清空转换结果
    const clearConvertedJson = () => {
      convertedJson.value = null;
    };
    
    // 计算分类数量
    const countCategories = () => {
      if (!convertedJson.value) return 0;
      return Object.keys(convertedJson.value).length;
    };
    
    // 计算标签总数
    const countTags = () => {
      if (!convertedJson.value) return 0;
      let count = 0;
      for (const category in convertedJson.value) {
        count += convertedJson.value[category].length;
      }
      return count;
    };
    
    // 将文本转换为JSON
    const convertTextToJson = () => {
      if (!sourceText.value.trim()) {
        showNotification('warning', '请先输入要转换的文本内容');
        return;
      }
      
      try {
        let format = textFormat.value;
        
        // 如果是自动检测，尝试确定格式
        if (format === 'auto') {
          format = detectTextFormat(sourceText.value);
        }
        
        // 根据格式转换文本
        switch (format) {
          case 'categoryLineTag':
            convertedJson.value = convertCategoryLineTagFormat(sourceText.value);
            break;
          case 'tagHashCategory':
            convertedJson.value = convertTagHashCategoryFormat(sourceText.value);
            break;
          case 'commaCategory':
            convertedJson.value = convertCommaCategoryFormat(sourceText.value);
            break;
          case 'characterTags':
            convertedJson.value = convertCharacterTagsFormat(sourceText.value);
            break;
          default:
            showNotification('error', '无法识别的文本格式');
            return;
        }
        
        showNotification('success', '文本转换成功');
      } catch (error) {
        console.error('转换失败:', error);
        showNotification('error', '转换失败: ' + error.message);
      }
    };
    
    // 自动检测文本格式
    const detectTextFormat = (text) => {
      // 检查是否包含 ● 开头的行，表示法典标签格式
      if (/^●.+$/m.test(text)) {
        return 'characterTags';
      }
      
      // 检查是否包含 #标记，判断是否是 标签#分类 格式
      if (/#[\u4e00-\u9fa5_a-zA-Z0-9]+/.test(text)) {
        return 'tagHashCategory';
      }
      
      // 检查是否有逗号和空格分隔的格式
      const lines = text.split('\n').filter(line => line.trim());
      for (const line of lines) {
        if (/,.*\s+[\u4e00-\u9fa5_a-zA-Z0-9]+$/.test(line)) {
          return 'commaCategory';
        }
      }
      
      // 默认使用分类换行标签格式
      return 'categoryLineTag';
    };
    
    // 转换 分类换行标签 格式
    const convertCategoryLineTagFormat = (text) => {
      const result = {};
      let currentCategory = null;
      
      const lines = text.split('\n');
      
      for (let line of lines) {
        line = line.trim();
        if (!line) {
          // 空行，重置当前分类
          currentCategory = null;
          continue;
        }
        
        // 如果当前没有分类，则这一行作为新分类
        if (currentCategory === null) {
          currentCategory = line;
          result[currentCategory] = [];
        } else {
          // 否则，这一行是标签内容
          if (!result[currentCategory]) {
            result[currentCategory] = [];
          }
          
          result[currentCategory].push({
            category: currentCategory,
            subTitles: [],
            content: line
          });
        }
      }
      
      return result;
    };
    
    // 转换 标签#分类 格式
    const convertTagHashCategoryFormat = (text) => {
      const result = {};
      const lines = text.split('\n');
      
      for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        // 匹配格式: 标签内容 #分类
        const match = line.match(/^(.+?)\s+#([\u4e00-\u9fa5_a-zA-Z0-9]+)$/);
        if (match) {
          const [, content, category] = match;
          
          if (!result[category]) {
            result[category] = [];
          }
          
          result[category].push({
            category,
            subTitles: [],
            content: content.trim()
          });
        }
      }
      
      return result;
    };
    
    // 转换 逗号分隔分类 格式
    const convertCommaCategoryFormat = (text) => {
      const result = {};
      const lines = text.split('\n');
      
      for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        // 匹配格式: 标签1,标签2,标签3 分类
        const match = line.match(/^(.+?)\s+([\u4e00-\u9fa5_a-zA-Z0-9]+)$/);
        if (match) {
          const [, tagsStr, category] = match;
          const tags = tagsStr.split(',').map(tag => tag.trim()).filter(tag => tag);
          
          if (!result[category]) {
            result[category] = [];
          }
          
          for (const tag of tags) {
            result[category].push({
              category,
              subTitles: [],
              content: tag
            });
          }
        }
      }
      
      return result;
    };
    
    // 转换法典标签格式
    const convertCharacterTagsFormat = (text) => {
      // 输出结果对象
      const result = {};
      
      // 按行分割输入文本
      const lines = text.split('\n');
      
      // 查找第一个大分类作为主分类
      let mainCategory = null;
      for (const line of lines) {
        if (line.trim().startsWith('●')) {
          mainCategory = line.trim().substring(1).trim();
          break;
        }
      }
      
      if (!mainCategory) {
        throw new Error('找不到主分类(以●开头的行)');
      }
      
      // 初始化结果对象
      result[mainCategory] = [];
      
      // 逐行处理内容
      let currentCategory = null; // 当前分类（最近的一个●行）
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 跳过空行
        if (!line) continue;
        
        // 如果是分类行，更新当前分类
        if (line.startsWith('●')) {
          currentCategory = line.substring(1).trim();
          continue;
        }
        
        // 如果没有当前分类，跳过
        if (!currentCategory) continue;
        
        // 检查是否是项目名行（不包含逗号）且下一行有标签内容
        if (!line.includes(',') && i + 1 < lines.length) {
          const itemName = line;
          const nextLine = lines[i + 1].trim();
          
          // 确认下一行确实是标签内容（含有逗号）
          if (nextLine && nextLine.includes(',')) {
            // 添加到主分类下
            result[mainCategory].push({
              content: nextLine,
              subTitles: [
                itemName,                // 项目名称
                currentCategory,         // 直接上级分类
              ].filter(item => item !== mainCategory) // 过滤掉与主分类重复的内容
            });
            
            // 跳过已处理的标签内容行
            i++;
          }
        }
      }
      
      return result;
    };
    
    // 导入新库
    const importNewLibrary = () => {
      if (!fileContent.value) {
        showNotification('warning', '请先选择JSON文件或预设');
        return;
      }
      
      if (!newLibraryName.value) {
        showNotification('warning', '请输入新库名称');
        return;
      }
      
      try {
        console.log('开始创建新库:', newLibraryName.value);
        console.log('数据类型:', typeof fileContent.value);
        console.log('分类数量:', Object.keys(fileContent.value).length);
        
        // 检查数据格式
        if (typeof fileContent.value !== 'object' || fileContent.value === null) {
          throw new Error('无效的数据格式：数据必须是一个对象');
        }
        
        // 检查库名是否已存在
        const existingLibraries = props.libraries.map(lib => lib.name);
        if (existingLibraries.includes(newLibraryName.value)) {
          throw new Error(`库名 "${newLibraryName.value}" 已存在，请使用不同的名称`);
        }
        
        // 使用添加库方法或导入库方法
        if (tagLibrary.importLibrary) {
          console.log('使用importLibrary方法');
          tagLibrary.importLibrary(newLibraryName.value, fileContent.value);
        } else if (tagLibrary.addLibrary) {
          console.log('使用addLibrary方法');
          const result = tagLibrary.addLibrary(newLibraryName.value, fileContent.value);
          if (!result) {
            throw new Error('添加库失败，请查看控制台获取更多信息');
          }
        } else {
          throw new Error('缺少导入库的API，请确保标签库提供必要的方法');
        }
        
        console.log('新库创建成功:', newLibraryName.value);
        showNotification('success', `成功创建新库 "${newLibraryName.value}"`);
        
        // 清空表单
        clearImport();
        
        // 通知父组件库已更新
        emit('library-updated');
        // 通知预览面板更新
        emitter.emit('tagLibraryUpdated');
      } catch (error) {
        console.error('创建新库失败:', error);
        showNotification('error', `创建新库失败: ${error.message}`);
      }
    };
    
    // 将上传的数据扩展到现有库
    const extendExistingLibrary = () => {
      console.log('点击了扩展现有库按钮');
      
      if (!fileContent.value && !presetFileContent.value) {
        console.error('没有要导入的数据');
        showNotification('error', '没有要导入的数据，请先选择文件或预设');
        return;
      }
      
      // 获取要导入的数据（优先使用上传的文件内容）
      const importData = fileContent.value || presetFileContent.value;
      console.log('要导入的数据:', Object.keys(importData));
      
      if (!selectedLibraryName.value) {
        console.error('未选择目标库');
        showNotification('error', '请选择要扩展的目标库');
        return;
      }
      
      console.log('目标库:', selectedLibraryName.value);
      
      try {
        // 获取当前库的数据
        const currentLibrary = tagLibrary.getLibrary(selectedLibraryName.value);
        if (!currentLibrary) {
          throw new Error(`找不到库: ${selectedLibraryName.value}`);
        }
        
        console.log('当前库数据:', Object.keys(currentLibrary));
        
        // 合并数据
        const mergedLibrary = { ...currentLibrary };
        let addedCategories = 0;
        let addedTags = 0;
        
        // 遍历导入数据的每个分类
        for (const category in importData) {
          if (Array.isArray(importData[category])) {
            // 如果现有库中没有这个分类，直接添加
            if (!mergedLibrary[category]) {
              mergedLibrary[category] = [...importData[category]];
              addedCategories++;
              addedTags += importData[category].length;
              console.log(`添加新分类: ${category}，包含 ${importData[category].length} 个标签`);
            } 
            // 如果分类已存在，合并标签并去重
            else {
              // 创建一个Set用于去重
              const existingTags = new Set(mergedLibrary[category]);
              const originalCount = existingTags.size;
              
              // 添加新标签并去重
              importData[category].forEach(tag => existingTags.add(tag));
              
              // 更新合并后的库
              mergedLibrary[category] = Array.from(existingTags);
              
              // 计算新增的标签数量
              const addedToCategory = existingTags.size - originalCount;
              addedTags += addedToCategory;
              
              console.log(`更新现有分类: ${category}，添加了 ${addedToCategory} 个标签`);
            }
          } else {
            console.warn(`跳过无效分类: ${category}，它不是一个数组`);
          }
        }
        
        // 保存合并后的库
        console.log('保存合并后的库:', Object.keys(mergedLibrary));
        tagLibrary.setLibrary(selectedLibraryName.value, mergedLibrary);
        tagLibrary._saveToStorage();
        
        // 显示成功提示
        const successMessage = `成功扩展库 "${selectedLibraryName.value}"：新增 ${addedCategories} 个分类和 ${addedTags} 个标签`;
        console.log(successMessage);
        showNotification('success', successMessage);
        
        // 重置文件选择状态
        fileSelected.value = false;
        fileContent.value = null;
        selectedPresetJson.value = '';
        presetFileContent.value = null;
        
        // 清空文件输入，让用户可以重新选择
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
          fileInput.value = '';
        }
        
        // 更新库列表（可能添加了新库）
        updateLibraryList();
        
        // 发送更新事件
        emit('library-updated');
        emitter.emit('tagLibraryUpdated');
      } catch (error) {
        console.error('扩展库失败:', error);
        showNotification('error', `扩展库失败: ${error.message}`);
      }
    };
    
    // 原来的importLibrary函数可以移除或改造为根据模式调用上面两个函数
    const importLibrary = () => {
      if (importMode.value === 'new') {
        importNewLibrary();
      } else {
        extendExistingLibrary();
      }
    };
    
    // 导入转换后的JSON
    const importConvertedJson = () => {
      if (!convertedJson.value) {
        showNotification('warning', '没有可导入的数据');
        return;
      }
      
      try {
        // 获取当前库名
        const libraryName = tagLibrary.getCurrentLibraryName();
        
        // 使用扩展库方法导入数据
        tagLibrary.extendLibrary(libraryName, convertedJson.value);
        
        // 通知预览面板更新
        emitter.emit('tagLibraryUpdated');
        
        showNotification('success', '数据导入成功');
      } catch (error) {
        console.error('导入失败:', error);
        showNotification('error', '导入失败: ' + error.message);
      }
    };
    
    // 复制JSON到剪贴板
    const copyJsonToClipboard = () => {
      if (!convertedJson.value) {
        showNotification('warning', '没有可复制的数据');
        return;
      }
      
      try {
        const jsonText = JSON.stringify(convertedJson.value, null, 2);
        navigator.clipboard.writeText(jsonText).then(() => {
          showNotification('success', '已复制到剪贴板');
        });
      } catch (error) {
        console.error('复制失败:', error);
        showNotification('error', '复制失败: ' + error.message);
      }
    };
    
    // 导出库为JSON文件
    const exportLibrary = () => {
      if (!exportLibraryName.value) {
        showNotification('warning', '请先选择要导出的库');
        return;
      }
      
      try {
        // 获取库数据
        let libraryData = tagLibrary.getLibrary(exportLibraryName.value);
        
        // 检查库数据
        if (!libraryData || Object.keys(libraryData).length === 0) {
          throw new Error(`库 "${exportLibraryName.value}" 数据为空或不存在`);
        }
        
        // 转换为JSON
        const jsonData = JSON.stringify(libraryData, null, 2);
        
        // 创建Blob和下载链接
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // 创建下载链接并点击
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportLibraryName.value}.json`;
        document.body.appendChild(a);
        a.click();
        
        // 清理
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        
        showNotification('success', `库 "${exportLibraryName.value}" 导出成功`);
      } catch (error) {
        console.error('导出库失败:', error);
        showNotification('error', `导出库失败: ${error.message}`);
      }
    };
    
    // 导出当前库
    const exportCurrentLibrary = () => {
      // 获取当前库名
      const currentLibName = tagLibrary.getCurrentLibraryName();
      if (!currentLibName) {
        showNotification('warning', '当前没有选择的库');
        return;
      }
      
      // 设置导出库名并调用导出方法
      exportLibraryName.value = currentLibName;
      exportLibrary();
    };
    
    // 添加调试检查功能
    const debugCheckFileContent = () => {
      console.log('=== 调试检查文件内容状态 ===');
      console.log('fileContent 是否为null:', fileContent.value === null);
      console.log('fileSelected 状态:', fileSelected.value);
      console.log('selectedLibraryName:', selectedLibraryName.value);
      console.log('selectedPresetJson:', selectedPresetJson.value);
      console.log('presetFileContent 是否为null:', presetFileContent.value === null);
      
      if (fileContent.value) {
        console.log('上传文件内容摘要:');
        console.log('- 分类数:', Object.keys(fileContent.value).length);
        for (const category in fileContent.value) {
          if (Array.isArray(fileContent.value[category])) {
            console.log(`- ${category}: ${fileContent.value[category].length} 个标签`);
          } else {
            console.log(`- ${category}: 无效格式 (${typeof fileContent.value[category]})`);
          }
        }
      }
      
      if (presetFileContent.value) {
        console.log('预设JSON内容摘要:');
        console.log('- 分类数:', Object.keys(presetFileContent.value).length);
        for (const category in presetFileContent.value) {
          if (Array.isArray(presetFileContent.value[category])) {
            console.log(`- ${category}: ${presetFileContent.value[category].length} 个标签`);
          } else {
            console.log(`- ${category}: 无效格式 (${typeof presetFileContent.value[category]})`);
          }
        }
      }
      
      // 检查DOM元素
      const fileInput = document.querySelector('input[type="file"]');
      console.log('文件输入元素:', fileInput ? '已找到' : '未找到');
      if (fileInput) {
        console.log('文件输入值:', fileInput.value);
      }
      
      // 检查库列表
      console.log('可用库列表:');
      props.libraries.forEach(lib => {
        console.log(`- ${lib.name}: ${lib.count} 个标签`);
      });
      
      // 弹出提示
      showNotification('info', '请查看控制台以获取调试信息');
    };
    
    return {
      importMode,
      newLibraryName,
      selectedLibraryName,
      fileSelected,
      fileContent,
      presetFileContent,
      handleFileSelect,
      clearImport,
      importNewLibrary,
      extendExistingLibrary,
      sourceText,
      convertedJson,
      textFormat,
      jsonPreview,
      countCategories,
      countTags,
      convertTextToJson,
      clearSourceText,
      clearConvertedJson,
      importConvertedJson,
      copyJsonToClipboard,
      exportLibraryName,
      exportLibrary,
      exportCurrentLibrary,
      selectedPresetJson,
      handlePresetChange,
      getPresetName,
      debugCheckFileContent
    };
  }
});
</script>

<style scoped>
.import-panel {
  background-color: var(--panel-bg-color, #fff);
  border-radius: var(--border-radius-lg, 8px);
  padding: var(--spacing-md, 15px);
  margin-bottom: var(--spacing-lg, 20px);
}

.section {
  background-color: var(--panel-bg-color, #fff);
  border-radius: var(--border-radius-lg, 8px);
  box-shadow: var(--shadow-md, 0 1px 3px rgba(0, 0, 0, 0.1));
  padding: var(--spacing-lg, 20px);
  margin-bottom: var(--spacing-lg, 20px);
}

.section h3 {
  font-size: var(--font-size-lg, 1.2rem);
  color: var(--text-color, #333);
  margin-top: 0;
  margin-bottom: var(--spacing-md, 15px);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color, #eee);
}

.form-group {
  margin-bottom: var(--spacing-md, 15px);
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: var(--text-color, #333);
  font-weight: 500;
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg, 20px);
  margin-bottom: var(--spacing-sm, 10px);
}

.radio-item {
  display: flex;
  align-items: center;
}

.radio-item input {
  margin-right: 8px;
  cursor: pointer;
}

.radio-item label, .radio-item span {
  cursor: pointer;
  margin-bottom: 0;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: var(--border-radius-sm, 4px);
  font-size: var(--font-size-md, 1rem);
  color: var(--text-color, #333);
  background-color: var(--input-bg-color, #fff);
  transition: border-color 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color, #2196F3);
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

textarea.form-control {
  min-height: 150px;
  resize: vertical;
}

.card {
  background-color: var(--panel-bg-color, #fff);
  border-radius: var(--border-radius-md, 6px);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
  margin-bottom: var(--spacing-md, 15px);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--panel-header-bg-color, #f9f9f9);
  border-bottom: 1px solid var(--border-color, #eee);
}

.card-header h4 {
  margin: 0;
  font-size: var(--font-size-md, 1rem);
  color: var(--text-color, #333);
}

.format-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.file-label {
  display: inline-block;
  padding: 10px 15px;
  background-color: var(--secondary-color, #f1f1f1);
  color: var(--text-color, #333);
  border-radius: var(--border-radius-sm, 4px);
  cursor: pointer;
  transition: background-color 0.2s;
}

.file-label:hover {
  background-color: var(--secondary-hover-color, #e1e1e1);
}

.file-label input {
  display: none;
}

.selected-file {
  margin-top: 10px;
  padding: 8px 12px;
  background-color: var(--success-bg-color, #e8f5e9);
  color: var(--success-color, #4CAF50);
  border-radius: var(--border-radius-sm, 4px);
  font-size: var(--font-size-sm, 0.9rem);
}

.action-group, .button-row {
  display: flex;
  gap: 10px;
  margin-top: var(--spacing-md, 15px);
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
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.12);
}

.primary-btn {
  background-color: var(--primary-color, #1677ff);
  color: white;
}

.primary-btn:hover {
  background-color: var(--primary-hover-color, #0958d9);
}

.primary-btn:disabled {
  background-color: var(--disabled-color, #ccc);
  cursor: not-allowed;
  opacity: 0.7;
  transform: none;
  box-shadow: none;
}

.secondary-btn {
  background-color: var(--bg-color-light, #f0f0f0);
  color: var(--text-color, #333);
}

.secondary-btn:hover {
  background-color: var(--bg-color-dark, #e0e0e0);
}

.text-convert-import {
  display: flex;
  flex-direction: column;
}

.result-stats {
  font-size: var(--font-size-sm, 0.9rem);
  color: var(--color-text-secondary, #666);
}

.export-panel {
  margin-top: var(--spacing-sm, 10px);
}

.info-text {
  font-size: 0.9rem;
  color: var(--text-color-light, #666);
  margin-top: 5px;
}

.import-action {
  margin-right: 10px;
  display: inline-block;
}

.debug-btn {
  background-color: #673ab7;
  color: white;
}

.debug-btn:hover {
  background-color: #5e35b1;
}

@media (max-width: 768px) {
  .section {
    padding: var(--spacing-md, 15px);
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .format-selector {
    margin-top: 10px;
  }
  
  .action-group, .button-row {
    flex-direction: column;
  }
  
  .action-group button, .button-row button {
    width: 100%;
  }
}
</style> 