/**
 * TagLibrary 类 - Vue重构版
 * 负责管理标签库数据和提供标签操作的接口
 */

// 默认配置
const CONFIG = {
  DEFAULTS: {
    LIBRARY_NAME: 'default'
  },
  STORAGE_KEYS: {
    TAG_LIBRARIES: 'tag_libraries',
    CURRENT_LIBRARY_NAME: 'current_library_name',
    HISTORY: 'drawn_history'
  }
};

class TagLibrary {
  /**
   * 构造函数
   * @param {Object} exampleTags - 示例标签数据
   */
  constructor(exampleTags = {}) {
    this.libraries = {};
    this.currentLibraryName = CONFIG.DEFAULTS.LIBRARY_NAME;
    this.exampleTags = exampleTags;
    this.drawnHistory = [];
    
    // 初始化标签库
    this._init();
  }

  /**
   * 初始化标签库
   * @private
   */
  _init() {
    // 从本地存储加载标签库
    this._loadFromStorage();
    
    // 如果没有库，使用示例标签库作为默认库
    if (Object.keys(this.libraries).length === 0) {
      this.libraries = {
        [CONFIG.DEFAULTS.LIBRARY_NAME]: this.exampleTags
      };
      this._saveToStorage();
    }
  }

  /**
   * 从本地存储加载库
   * @private
   */
  _loadFromStorage() {
    const savedLibraries = localStorage.getItem(CONFIG.STORAGE_KEYS.TAG_LIBRARIES);
    const savedLibraryName = localStorage.getItem(CONFIG.STORAGE_KEYS.CURRENT_LIBRARY_NAME);
    const savedHistory = localStorage.getItem(CONFIG.STORAGE_KEYS.HISTORY);
    
    if (savedLibraries) {
      try {
        this.libraries = JSON.parse(savedLibraries);
      } catch (e) {
        console.error('解析标签库数据失败', e);
        this.libraries = {};
      }
    }
    
    if (savedLibraryName && this.libraries[savedLibraryName]) {
      this.currentLibraryName = savedLibraryName;
    }
    
    if (savedHistory) {
      try {
        this.drawnHistory = JSON.parse(savedHistory);
      } catch (e) {
        console.error('解析历史记录失败', e);
        this.drawnHistory = [];
      }
    }
  }

  /**
   * 保存库到本地存储
   * @private
   */
  _saveToStorage() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.TAG_LIBRARIES, JSON.stringify(this.libraries));
    localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_LIBRARY_NAME, this.currentLibraryName);
    localStorage.setItem(CONFIG.STORAGE_KEYS.HISTORY, JSON.stringify(this.drawnHistory));
  }

  /**
   * 获取当前库
   * @returns {Object} 当前标签库
   */
  getCurrentLibrary() {
    return this.libraries[this.currentLibraryName] || {};
  }

  /**
   * 获取当前库名称
   * @returns {string} 当前库名称
   */
  getCurrentLibraryName() {
    return this.currentLibraryName;
  }

  /**
   * 设置当前库
   * @param {string} libraryName - 库名称
   * @returns {boolean} 是否设置成功
   */
  setCurrentLibrary(libraryName) {
    if (this.libraries[libraryName]) {
      this.currentLibraryName = libraryName;
      this._saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * 获取所有库名称
   * @returns {Array} 库名称数组
   */
  getLibraryNames() {
    return Object.keys(this.libraries).sort();
  }

  /**
   * 获取指定名称的库
   * @param {string} libraryName - 库名称
   * @returns {Object} 库对象
   */
  getLibrary(libraryName) {
    return this.libraries[libraryName] || {};
  }

  /**
   * 添加新库
   * @param {string} libraryName - 库名称
   * @param {Object} libraryData - 库数据
   * @returns {boolean} 是否添加成功
   */
  addLibrary(libraryName, libraryData) {
    if (libraryName && libraryData && typeof libraryData === 'object') {
      this.libraries[libraryName] = libraryData;
      this._saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * 删除库
   * @param {string} libraryName - 库名称
   * @returns {boolean} 是否删除成功
   */
  deleteLibrary(libraryName) {
    if (libraryName && this.libraries[libraryName] && libraryName !== CONFIG.DEFAULTS.LIBRARY_NAME) {
      delete this.libraries[libraryName];
      
      // 如果删除的是当前库，则切换到默认库
      if (this.currentLibraryName === libraryName) {
        this.currentLibraryName = CONFIG.DEFAULTS.LIBRARY_NAME;
      }
      
      this._saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * 获取当前库的所有分类
   * @returns {Array} 分类数组
   */
  getCategories() {
    return Object.keys(this.getCurrentLibrary());
  }

  /**
   * 获取当前库的标签总数
   * @returns {number} 标签总数
   */
  getTotalTagCount() {
    const currentLibrary = this.getCurrentLibrary();
    let count = 0;
    
    for (const category in currentLibrary) {
      if (Array.isArray(currentLibrary[category])) {
        count += currentLibrary[category].length;
      }
    }
    
    return count;
  }

  /**
   * 获取指定库的标签总数
   * @param {string} libraryName - 库名称
   * @returns {number} 标签总数
   */
  getTagCountByLibrary(libraryName) {
    const library = this.libraries[libraryName] || {};
    let count = 0;
    
    for (const category in library) {
      if (Array.isArray(library[category])) {
        count += library[category].length;
      }
    }
    
    return count;
  }

  /**
   * 添加到历史记录
   * @param {Array} tags - 抽取的标签
   */
  addToHistory(tags) {
    if (Array.isArray(tags) && tags.length > 0) {
      this.drawnHistory.unshift({
        timestamp: Date.now(),
        tags: tags,
        libraryName: this.currentLibraryName
      });
      
      // 最多保存20条历史记录
      if (this.drawnHistory.length > 20) {
        this.drawnHistory = this.drawnHistory.slice(0, 20);
      }
      
      this._saveToStorage();
    }
  }

  /**
   * 获取历史记录
   * @returns {Array} 历史记录数组
   */
  getHistory() {
    return this.drawnHistory;
  }

  /**
   * 设置历史记录
   * @param {Array} history - 新的历史记录数组
   */
  setHistory(history) {
    if (Array.isArray(history)) {
      this.drawnHistory = history;
      this._saveToStorage();
    }
  }

  /**
   * 清空历史记录
   */
  clearHistory() {
    this.drawnHistory = [];
    this._saveToStorage();
  }

  /**
   * 检查标签是否在历史记录中
   * @param {string} category - 分类
   * @param {string} content - 标签内容
   * @returns {boolean} 是否在历史记录中
   */
  isTagInHistory(category, content) {
    return this.drawnHistory.some(item => 
      item.tags.some(tag => 
        tag.category === category && tag.tagContent === content
      )
    );
  }

  /**
   * 获取当前库中的所有标签
   * @param {string} [libraryName] - 可选，库名称，默认为当前库
   * @returns {Array} 标签数组
   */
  getAllTags(libraryName = null) {
    const lib = libraryName ? this.libraries[libraryName] : this.getCurrentLibrary();
    if (!lib) return [];
    
    const tags = [];
    
    for (const category in lib) {
      if (Array.isArray(lib[category])) {
        lib[category].forEach(tag => {
          // 兼容新旧格式
          if (typeof tag === 'object') {
            if (tag.content) {
              tags.push({
                category,
                content: tag.content,
                subTitles: tag.subTitles || []
              });
            } else if (tag.text) {
              tags.push({
                category,
                content: tag.text,
                subTitles: tag.subTitle ? tag.subTitle.split(',') : []
              });
            }
          } else {
            tags.push({
              category,
              content: tag,
              subTitles: []
            });
          }
        });
      }
    }
    
    return tags;
  }

  /**
   * 获取所有库
   * @returns {Array} 所有库名称的数组
   */
  getLibraries() {
    return Object.keys(this.libraries);
  }

  /**
   * 切换到指定库
   * @param {string} libraryName - 库名称
   * @returns {boolean} 是否切换成功
   */
  switchLibrary(libraryName) {
    return this.setCurrentLibrary(libraryName);
  }

  /**
   * 创建空标签库
   * @param {string} libraryName - 库名称
   * @returns {boolean} 是否创建成功
   */
  createEmptyLibrary(libraryName) {
    if (!libraryName) {
      throw new Error('库名称不能为空');
    }
    
    if (this.libraries[libraryName]) {
      throw new Error(`库 "${libraryName}" 已存在`);
    }
    
    this.libraries[libraryName] = {};
    this._saveToStorage();
    return true;
  }

  /**
   * 导入库
   * @param {string} libraryName - 库名称
   * @param {Object} data - 库数据
   */
  importLibrary(libraryName, data) {
    if (!libraryName || !data) {
      throw new Error('库名称和数据不能为空');
    }
    
    if (this.libraries[libraryName]) {
      throw new Error(`库 "${libraryName}" 已存在`);
    }
    
    this.libraries[libraryName] = data;
    this._saveToStorage();
  }

  /**
   * 扩展现有库
   * @param {string} libraryName - 库名称
   * @param {Object} data - 要添加的数据
   */
  extendLibrary(libraryName, data) {
    if (!libraryName || !data) {
      throw new Error('库名称和数据不能为空');
    }
    
    if (!this.libraries[libraryName]) {
      throw new Error(`库 "${libraryName}" 不存在`);
    }
    
    // 合并数据
    const existingLibrary = this.libraries[libraryName];
    
    // 检查数据格式
    if (Array.isArray(data)) {
      // 如果是数组格式（在线编辑的格式）
      // 按照分类重组数据
      const categorizedData = {};
      data.forEach(tag => {
        if (!tag.category || !tag.content) return;
        
        if (!categorizedData[tag.category]) {
          categorizedData[tag.category] = [];
        }
        
        categorizedData[tag.category].push({
          content: tag.content,
          subTitles: tag.subTitles || []
        });
      });
      
      // 合并到现有库
      for (const category in categorizedData) {
        if (!existingLibrary[category]) {
          existingLibrary[category] = [];
        }
        
        if (!Array.isArray(existingLibrary[category])) {
          existingLibrary[category] = [];
        }
        
        // 合并并去重
        const existingContents = new Set(existingLibrary[category].map(item => 
          typeof item === 'string' ? item : item.content || item.text
        ));
        
        categorizedData[category].forEach(tag => {
          // 如果内容不存在才添加
          if (!existingContents.has(tag.content)) {
            existingLibrary[category].push(tag);
          }
        });
      }
    } else if (typeof data === 'object') {
      // 如果是对象格式（JSON文件导入的格式）
      // 遍历新数据中的所有分类
      for (const category in data) {
        // 如果现有库中没有这个分类，则创建
        if (!existingLibrary[category]) {
          existingLibrary[category] = [];
        }
        
        // 确保分类是数组
        if (!Array.isArray(existingLibrary[category])) {
          existingLibrary[category] = [];
        }
        
        // 合并标签并去重
        if (Array.isArray(data[category])) {
          // 获取现有内容集合
          const existingContents = new Set(existingLibrary[category].map(item => 
            typeof item === 'string' ? item : item.content || item.text
          ));
          
          // 只添加不存在的标签
          data[category].forEach(tag => {
            const content = typeof tag === 'string' ? tag : tag.content || tag.text;
            if (content && !existingContents.has(content)) {
              existingLibrary[category].push(tag);
            }
          });
        }
      }
    }
    
    this._saveToStorage();
  }

  /**
   * 重命名标签库
   * @param {string} oldName - 原库名称
   * @param {string} newName - 新库名称
   * @returns {boolean} 是否重命名成功
   */
  renameLibrary(oldName, newName) {
    // 验证参数
    if (!oldName || !newName) {
      throw new Error('原库名称和新库名称不能为空');
    }
    
    if (!this.libraries[oldName]) {
      throw new Error(`库 "${oldName}" 不存在`);
    }
    
    if (this.libraries[newName]) {
      throw new Error(`库 "${newName}" 已存在`);
    }
    
    // 重命名库
    this.libraries[newName] = this.libraries[oldName];
    delete this.libraries[oldName];
    
    // 如果当前库是被重命名的库，更新当前库名称
    if (this.currentLibraryName === oldName) {
      this.currentLibraryName = newName;
    }
    
    // 保存更改
    this._saveToStorage();
    return true;
  }
  
  /**
   * 复制标签库
   * @param {string} sourceName - 源库名称
   * @param {string} targetName - 目标库名称
   * @returns {boolean} 是否复制成功
   */
  duplicateLibrary(sourceName, targetName) {
    // 验证参数
    if (!sourceName || !targetName) {
      throw new Error('源库名称和目标库名称不能为空');
    }
    
    if (!this.libraries[sourceName]) {
      throw new Error(`源库 "${sourceName}" 不存在`);
    }
    
    if (this.libraries[targetName]) {
      throw new Error(`目标库 "${targetName}" 已存在`);
    }
    
    // 复制库（深拷贝）
    this.libraries[targetName] = JSON.parse(JSON.stringify(this.libraries[sourceName]));
    
    // 保存更改
    this._saveToStorage();
    return true;
  }
  
  /**
   * 合并两个标签库
   * @param {string} sourceLibrary - 源库名称
   * @param {string} targetLibrary - 目标库名称
   * @returns {boolean} 是否合并成功
   */
  mergeLibraries(sourceLibrary, targetLibrary) {
    // 验证参数
    if (!sourceLibrary || !targetLibrary) {
      throw new Error('源库名称和目标库名称不能为空');
    }
    
    if (!this.libraries[sourceLibrary]) {
      throw new Error(`源库 "${sourceLibrary}" 不存在`);
    }
    
    if (!this.libraries[targetLibrary]) {
      throw new Error(`目标库 "${targetLibrary}" 不存在`);
    }
    
    // 使用扩展库方法将源库合并到目标库
    this.extendLibrary(targetLibrary, this.libraries[sourceLibrary]);
    return true;
  }

  /**
   * 清理空分类
   * @param {string} libraryName - 库名称，默认为当前库
   * @returns {number} 清理的空分类数量
   */
  cleanEmptyCategories(libraryName = null) {
    const lib = libraryName ? this.libraries[libraryName] : this.getCurrentLibrary();
    const targetLibName = libraryName || this.currentLibraryName;
    
    if (!lib) {
      throw new Error(`库 "${targetLibName}" 不存在`);
    }
    
    let count = 0;
    
    // 清理空分类
    for (const category in lib) {
      if (!Array.isArray(lib[category]) || lib[category].length === 0) {
        delete lib[category];
        count++;
      }
    }
    
    // 保存更改
    if (count > 0) {
      this._saveToStorage();
    }
    
    return count;
  }
  
  /**
   * 清理重复标签
   * @param {string} libraryName - 库名称，默认为当前库
   * @returns {number} 清理的重复标签数量
   */
  cleanDuplicateTags(libraryName = null) {
    const lib = libraryName ? this.libraries[libraryName] : this.getCurrentLibrary();
    const targetLibName = libraryName || this.currentLibraryName;
    
    if (!lib) {
      throw new Error(`库 "${targetLibName}" 不存在`);
    }
    
    let totalRemoved = 0;
    
    // 清理各分类中的重复标签
    for (const category in lib) {
      if (!Array.isArray(lib[category])) continue;
      
      // 记录已有内容
      const uniqueContents = new Set();
      const uniqueTags = [];
      
      // 过滤保留唯一标签
      lib[category].forEach(tag => {
        const content = typeof tag === 'string' ? tag : tag.content || tag.text;
        
        if (content && !uniqueContents.has(content)) {
          uniqueContents.add(content);
          uniqueTags.push(tag);
        } else {
          totalRemoved++;
        }
      });
      
      // 更新为去重后的数组
      lib[category] = uniqueTags;
    }
    
    // 保存更改
    if (totalRemoved > 0) {
      this._saveToStorage();
    }
    
    return totalRemoved;
  }
  
  /**
   * 移动分类
   * @param {string} oldCategory - 旧分类名称
   * @param {string} newCategory - 新分类名称
   * @param {string} libraryName - 库名称，默认为当前库
   * @returns {boolean} 是否移动成功
   */
  moveCategory(oldCategory, newCategory, libraryName = null) {
    if (!oldCategory || !newCategory) {
      throw new Error('分类名称不能为空');
    }
    
    const lib = libraryName ? this.libraries[libraryName] : this.getCurrentLibrary();
    const targetLibName = libraryName || this.currentLibraryName;
    
    if (!lib) {
      throw new Error(`库 "${targetLibName}" 不存在`);
    }
    
    if (!lib[oldCategory] || !Array.isArray(lib[oldCategory])) {
      throw new Error(`分类 "${oldCategory}" 不存在或不是有效的标签数组`);
    }
    
    // 如果新分类不存在，创建它
    if (!lib[newCategory]) {
      lib[newCategory] = [];
    }
    
    // 确保新分类是数组
    if (!Array.isArray(lib[newCategory])) {
      lib[newCategory] = [];
    }
    
    // 移动标签
    lib[newCategory] = [...lib[newCategory], ...lib[oldCategory]];
    
    // 删除旧分类
    delete lib[oldCategory];
    
    // 保存更改
    this._saveToStorage();
    return true;
  }
  
  /**
   * 移除指定标签
   * @param {string} category - 分类名称
   * @param {string} content - 标签内容
   * @param {string} libraryName - 库名称，默认为当前库
   * @returns {boolean} 是否删除成功
   */
  removeTag(category, content, libraryName = null) {
    if (!category || !content) {
      throw new Error('分类和标签内容不能为空');
    }
    
    const lib = libraryName ? this.libraries[libraryName] : this.getCurrentLibrary();
    const targetLibName = libraryName || this.currentLibraryName;
    
    if (!lib) {
      throw new Error(`库 "${targetLibName}" 不存在`);
    }
    
    if (!lib[category] || !Array.isArray(lib[category])) {
      throw new Error(`分类 "${category}" 不存在或不是有效的标签数组`);
    }
    
    // 查找并移除标签
    const initialLength = lib[category].length;
    lib[category] = lib[category].filter(tag => {
      const tagContent = typeof tag === 'string' ? tag : tag.content || tag.text;
      return tagContent !== content;
    });
    
    // 检查是否有标签被移除
    if (lib[category].length < initialLength) {
      this._saveToStorage();
      return true;
    }
    
    return false;
  }
}

export default TagLibrary; 