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
    
    // 缓存机制
    this.categoryCache = new Map(); // 用于缓存已加载的分类数据
    this.libraryMetadata = {}; // 存储库的元数据（分类列表、标签计数等）
    this.chunkedLibraries = new Set(); // 跟踪哪些库是使用分块存储的
    this.pendingCategoryLoads = new Map(); // 跟踪进行中的分类加载Promise
    
    // 初始化标签库
    this._init();
  }

  /**
   * 初始化标签库
   * @private
   */
  _init() {
    // 从本地存储加载标签库元数据
    this._loadLibraryMetadata();
    
    // 如果没有库，使用示例标签库作为默认库
    if (Object.keys(this.libraries).length === 0) {
      this.libraries = {
        [CONFIG.DEFAULTS.LIBRARY_NAME]: this.exampleTags
      };
      this._saveToStorage();
    }
  }

  /**
   * 加载库元数据 (轻量级操作，只加载库和分类的信息，不加载具体标签)
   * @private
   */
  _loadLibraryMetadata() {
    try {
      // 检查是否使用分块存储模式
      const storageMode = localStorage.getItem(`${CONFIG.STORAGE_KEYS.TAG_LIBRARIES}_mode`);
      
      if (storageMode === 'chunked') {
        // 使用分块存储模式
        console.log('使用分块存储模式加载标签库元数据');
        this._loadChunkedLibraryMetadata();
      } else {
        // 使用常规存储模式
        console.log('使用常规存储模式加载标签库数据');
        this._loadFromStorage();
      }
    } catch (error) {
      console.error('加载库元数据失败:', error);
      // 恢复到默认状态
      this.libraries = {};
      this.libraries[CONFIG.DEFAULTS.LIBRARY_NAME] = this.exampleTags;
      this.currentLibraryName = CONFIG.DEFAULTS.LIBRARY_NAME;
      this.drawnHistory = [];
    }
  }

  /**
   * 从分块存储中加载库元数据
   * @private
   */
  _loadChunkedLibraryMetadata() {
    // 加载库名列表
    const libNamesData = localStorage.getItem(`${CONFIG.STORAGE_KEYS.TAG_LIBRARIES}_libNames`);
    if (!libNamesData) {
      console.warn('未找到库名列表，切换回非分块模式');
      return this._loadFromStorage();
    }
    
    try {
      // 解析库名列表
      const { libraryNames } = JSON.parse(libNamesData);
      
      // 加载当前库名
      const metaData = localStorage.getItem(`${CONFIG.STORAGE_KEYS.TAG_LIBRARIES}_meta`);
      if (metaData) {
        const { currentLibraryName } = JSON.parse(metaData);
        this.currentLibraryName = currentLibraryName || CONFIG.DEFAULTS.LIBRARY_NAME;
      } else {
        this.currentLibraryName = CONFIG.DEFAULTS.LIBRARY_NAME;
      }
      
      // 加载历史记录
      const historyData = localStorage.getItem(`${CONFIG.STORAGE_KEYS.TAG_LIBRARIES}_history`);
      if (historyData) {
        const { drawnHistory } = JSON.parse(historyData);
        this.drawnHistory = drawnHistory || [];
      } else {
        this.drawnHistory = [];
      }
      
      // 初始化库元数据
      for (const libName of libraryNames) {
        // 使这些库成为"懒加载"占位符
        this.libraries[libName] = null; // null 表示未加载的库
        this.chunkedLibraries.add(libName);
        
        // 加载各库的分类列表元数据
        this._loadLibraryCategoriesMetadata(libName);
      }
      
      // 确保默认库存在
      if (!this.libraries[CONFIG.DEFAULTS.LIBRARY_NAME]) {
        this.libraries[CONFIG.DEFAULTS.LIBRARY_NAME] = this.exampleTags;
      }
      
      // 检查当前库是否有效
      if (!this.libraries[this.currentLibraryName]) {
        this.currentLibraryName = CONFIG.DEFAULTS.LIBRARY_NAME;
      }
      
      return true;
    } catch (error) {
      console.error('解析分块存储元数据失败:', error);
      return this._loadFromStorage(); // 回退到常规加载
    }
  }
  
  /**
   * 加载库的分类列表元数据
   * @private
   * @param {string} libName - 库名称
   */
  _loadLibraryCategoriesMetadata(libName) {
    try {
      // 加载分类列表
      const categoriesData = localStorage.getItem(`${CONFIG.STORAGE_KEYS.TAG_LIBRARIES}_lib_${libName}_categories`);
      if (categoriesData) {
        const { categories } = JSON.parse(categoriesData);
        
        // 存储分类元数据
        if (!this.libraryMetadata[libName]) {
          this.libraryMetadata[libName] = {};
        }
        this.libraryMetadata[libName].categories = categories;
        
        // 为每个分类创建懒加载占位符
        if (this.libraries[libName] === null) {
          this.libraries[libName] = {}; // 初始化为空对象
          
          // 为每个分类创建懒加载占位符
          for (const category of categories) {
            // 设置为非数组，表示尚未加载
            this.libraries[libName][category] = null;
          }
        }
      }
    } catch (error) {
      console.error(`加载库 "${libName}" 分类元数据失败:`, error);
    }
  }

  /**
   * 按需加载分类数据
   * @private
   * @param {string} libName - 库名称
   * @param {string} category - 分类名称
   * @returns {Promise<Array>} 加载完成的分类数据
   */
  async _loadCategoryOnDemand(libName, category) {
    // 检查缓存
    const cacheKey = `${libName}:${category}`;
    if (this.categoryCache.has(cacheKey)) {
      return this.categoryCache.get(cacheKey);
    }
    
    // 检查是否有正在进行的加载
    if (this.pendingCategoryLoads.has(cacheKey)) {
      return this.pendingCategoryLoads.get(cacheKey);
    }
    
    // 创建加载Promise
    const loadPromise = new Promise((resolve, reject) => {
      try {
        if (this.chunkedLibraries.has(libName)) {
          // 从分块存储加载
          const categoryData = localStorage.getItem(`${CONFIG.STORAGE_KEYS.TAG_LIBRARIES}_lib_${libName}_cat_${category}`);
          if (categoryData) {
            const { tags } = JSON.parse(categoryData);
            
            // 更新内存中的数据
            if (this.libraries[libName]) {
              this.libraries[libName][category] = tags;
            }
            
            // 更新缓存
            this.categoryCache.set(cacheKey, tags);
            
            resolve(tags);
          } else {
            // 找不到数据，返回空数组
            const emptyTags = [];
            this.categoryCache.set(cacheKey, emptyTags);
            resolve(emptyTags);
          }
        } else {
          // 库已经完全加载在内存中
          if (this.libraries[libName] && this.libraries[libName][category]) {
            const tags = this.libraries[libName][category];
            this.categoryCache.set(cacheKey, tags);
            resolve(tags);
          } else {
            // 找不到数据，返回空数组
            const emptyTags = [];
            this.categoryCache.set(cacheKey, emptyTags);
            resolve(emptyTags);
          }
        }
      } catch (error) {
        console.error(`加载分类 "${category}" 失败:`, error);
        reject(error);
      } finally {
        // 清除pending状态
        this.pendingCategoryLoads.delete(cacheKey);
      }
    });
    
    // 记录pending状态
    this.pendingCategoryLoads.set(cacheKey, loadPromise);
    
    return loadPromise;
  }

  /**
   * 获取指定库中的分类列表
   * @param {string} libraryName - 库名称
   * @returns {Array} 分类列表
   */
  getCategories(libraryName = null) {
    const libName = libraryName || this.currentLibraryName;
    
    // 检查是否有元数据缓存
    if (this.libraryMetadata[libName] && this.libraryMetadata[libName].categories) {
      return [...this.libraryMetadata[libName].categories];
    }
    
    // 如果没有元数据，则从库对象中获取
    const lib = this.libraries[libName];
    if (lib) {
      if (lib === null) {
        // 库尚未加载
        return [];
      }
      return Object.keys(lib);
    }
    
    return [];
  }

  /**
   * 获取指定分类的标签数据
   * @param {string} category - 分类名称
   * @param {string} libraryName - 库名称，默认为当前库
   * @returns {Promise<Array>} 标签数据
   */
  async getCategoryTags(category, libraryName = null) {
    const libName = libraryName || this.currentLibraryName;
    
    // 检查库是否存在
    if (!this.libraries[libName]) {
      return [];
    }
    
    // 检查分类是否存在
    if (this.libraries[libName] && 
        typeof this.libraries[libName] === 'object' && 
        category in this.libraries[libName]) {
      
      // 检查是否需要加载
      if (this.libraries[libName][category] === null || 
          (this.chunkedLibraries.has(libName) && !Array.isArray(this.libraries[libName][category]))) {
        // 需要加载该分类
        try {
          const tags = await this._loadCategoryOnDemand(libName, category);
          return tags || [];
        } catch (error) {
          console.error(`获取分类 "${category}" 的标签失败:`, error);
          return [];
        }
      } else {
        // 已经加载在内存中
        return this.libraries[libName][category] || [];
      }
    }
    
    return [];
  }

  /**
   * 预加载库的所有分类（在后台）
   * @param {string} libraryName - 库名称，默认为当前库
   * @returns {Promise<void>}
   */
  async preloadLibrary(libraryName = null) {
    const libName = libraryName || this.currentLibraryName;
    
    // 检查库是否存在
    if (!this.libraries[libName]) {
      return;
    }
    
    // 获取分类列表
    const categories = this.getCategories(libName);
    
    // 分批加载所有分类，避免一次加载太多导致界面卡顿
    const batchSize = 3; // 每批加载的分类数量
    
    for (let i = 0; i < categories.length; i += batchSize) {
      const batch = categories.slice(i, i + batchSize);
      
      // 并行加载一批分类
      await Promise.all(batch.map(category => 
        this._loadCategoryOnDemand(libName, category)
      ));
      
      // 如果不是最后一批，添加小延迟让UI有机会响应
      if (i + batchSize < categories.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    console.log(`库 "${libName}" 预加载完成`);
  }

  /**
   * 设置当前库
   * @param {string} libraryName - 库名称
   * @returns {Promise<boolean>} 是否设置成功
   */
  async setCurrentLibrary(libraryName) {
    if (this.libraries[libraryName]) {
      this.currentLibraryName = libraryName;
      
      // 如果是分块存储的库，启动后台预加载
      if (this.chunkedLibraries.has(libraryName)) {
        // 先确保分类元数据已加载
        this._loadLibraryCategoriesMetadata(libraryName);
        
        // 在后台开始预加载
        setTimeout(() => {
          this.preloadLibrary(libraryName)
            .catch(error => console.error(`预加载库 "${libraryName}" 失败:`, error));
        }, 100);
      }
      
      this._saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * 从本地存储加载数据
   * @private
   */
  _loadFromStorage() {
    try {
      // 尝试从localStorage加载数据
      const storageData = localStorage.getItem(CONFIG.STORAGE_KEYS.TAG_LIBRARIES);
      if (storageData) {
        console.time('从存储加载标签库数据');
        const parsedData = JSON.parse(storageData);
        this.libraries = parsedData.libraries || {};
        this.currentLibraryName = parsedData.currentLibraryName || CONFIG.DEFAULTS.LIBRARY_NAME;
        this.drawnHistory = parsedData.drawnHistory || [];
        
        // 确保默认库存在
        if (!this.libraries[CONFIG.DEFAULTS.LIBRARY_NAME]) {
          this.libraries[CONFIG.DEFAULTS.LIBRARY_NAME] = this.exampleTags;
        }
        
        // 记录加载的库和标签数量（诊断信息）
        const libraryCount = Object.keys(this.libraries).length;
        let totalTagCount = 0;
        for (const libName in this.libraries) {
          const lib = this.libraries[libName];
          for (const category in lib) {
            if (Array.isArray(lib[category])) {
              totalTagCount += lib[category].length;
            }
          }
        }
        
        console.log(`从存储加载了 ${libraryCount} 个标签库，共 ${totalTagCount} 个标签`);
        console.timeEnd('从存储加载标签库数据');
        
        // 检查当前选择的库是否存在，如果不存在则切换到默认库
        if (!this.libraries[this.currentLibraryName]) {
          this.currentLibraryName = CONFIG.DEFAULTS.LIBRARY_NAME;
        }
        
        return true;
      }
    } catch (error) {
      console.error('从存储加载标签库数据失败:', error);
      // 发出加载失败的通知
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('tagLibrary-load-error', {
          detail: { error: error.message }
        }));
      }
    }
    
    // 如果加载失败或没有存储数据，使用默认库
    this.libraries = {};
    this.libraries[CONFIG.DEFAULTS.LIBRARY_NAME] = this.exampleTags;
    this.currentLibraryName = CONFIG.DEFAULTS.LIBRARY_NAME;
    this.drawnHistory = [];
    
    return false;
  }

  /**
   * 保存数据到本地存储
   * @private
   */
  _saveToStorage() {
    try {
      console.time('保存标签库数据到存储');
      
      // 使用批处理方式保存数据，减少浏览器渲染阻塞
      const data = {
        libraries: this.libraries,
        currentLibraryName: this.currentLibraryName,
        drawnHistory: this.drawnHistory
      };
      
      // 记录最近使用的库到单独的存储项
      this._updateRecentLibraries(this.currentLibraryName);
      
      // 检查数据大小，如果过大则进行优化
      const jsonData = JSON.stringify(data);
      const dataSize = new Blob([jsonData]).size / (1024 * 1024); // 转换为MB
      
      if (dataSize > 4) { // 如果数据超过4MB，分块存储
        console.warn(`标签库数据较大 (${dataSize.toFixed(2)}MB)，正在尝试优化存储...`);
        this._optimizeStorage(data);
      } else {
        localStorage.setItem(CONFIG.STORAGE_KEYS.TAG_LIBRARIES, jsonData);
      }
      
      console.timeEnd('保存标签库数据到存储');
      
      // 触发标签库更新事件
      this._notifyLibraryUpdated();
      
      return true;
    } catch (error) {
      console.error('保存标签库数据到存储失败:', error);
      
      // 如果是配额错误，尝试优化存储
      if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.warn('存储空间不足，尝试优化存储...');
        try {
          const data = {
            libraries: this.libraries,
            currentLibraryName: this.currentLibraryName,
            drawnHistory: this.drawnHistory
          };
          this._optimizeStorage(data);
          
          // 优化后也需要触发更新事件
          this._notifyLibraryUpdated();
          
          return true;
        } catch (optimizeError) {
          console.error('存储优化失败:', optimizeError);
        }
      }
      
      // 发出存储失败的通知
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('tagLibrary-save-error', {
          detail: { error: error.message }
        }));
      }
      
      return false;
    }
  }
  
  /**
   * 通知标签库更新
   * @private
   */
  _notifyLibraryUpdated() {
    // 使用全局事件和防抖来减少重复通知
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      // 清除之前可能存在的定时器
      if (this._updateTimer) {
        clearTimeout(this._updateTimer);
      }
      
      // 设置新的定时器，确保短时间内的多次更改只触发一次更新事件
      this._updateTimer = setTimeout(() => {
        console.log('TagLibrary: 触发全局标签库更新事件');
        window.dispatchEvent(new CustomEvent('tagLibraryUpdated'));
        
        // 更新标记，表示库已经修改
        this._isLibraryModified = true;
        
        // 清除定时器引用
        this._updateTimer = null;
      }, 50);
    }
  }
  
  /**
   * 优化存储方法，将大型数据拆分为更小的块
   * @private
   * @param {Object} data - 要存储的数据对象
   */
  _optimizeStorage(data) {
    // 分离历史记录和库数据，单独存储
    localStorage.setItem(`${CONFIG.STORAGE_KEYS.TAG_LIBRARIES}_history`, JSON.stringify({ drawnHistory: data.drawnHistory }));
    localStorage.setItem(`${CONFIG.STORAGE_KEYS.TAG_LIBRARIES}_meta`, JSON.stringify({ 
      currentLibraryName: data.currentLibraryName 
    }));
    
    // 将每个库单独存储
    for (const libName in data.libraries) {
      try {
        localStorage.setItem(`${CONFIG.STORAGE_KEYS.TAG_LIBRARIES}_lib_${libName}`, 
          JSON.stringify({ library: data.libraries[libName] }));
      } catch (error) {
        console.error(`存储库 "${libName}" 失败:`, error);
        // 如果单个库太大，尝试分类存储
        if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
          this._storeLibraryInChunks(libName, data.libraries[libName]);
        }
      }
    }
    
    // 保存库名列表，用于加载时重建
    localStorage.setItem(`${CONFIG.STORAGE_KEYS.TAG_LIBRARIES}_libNames`, 
      JSON.stringify({ libraryNames: Object.keys(data.libraries) }));
    
    // 标记使用了分块存储模式
    localStorage.setItem(`${CONFIG.STORAGE_KEYS.TAG_LIBRARIES}_mode`, 'chunked');
  }
  
  /**
   * 将单个标签库按分类拆分存储
   * @private
   * @param {string} libName - 库名称
   * @param {Object} library - 库对象
   */
  _storeLibraryInChunks(libName, library) {
    // 存储分类列表
    const categories = Object.keys(library);
    localStorage.setItem(`${CONFIG.STORAGE_KEYS.TAG_LIBRARIES}_lib_${libName}_categories`, 
      JSON.stringify({ categories }));
    
    // 逐个存储分类
    for (const category of categories) {
      try {
        localStorage.setItem(`${CONFIG.STORAGE_KEYS.TAG_LIBRARIES}_lib_${libName}_cat_${category}`, 
          JSON.stringify({ tags: library[category] }));
      } catch (error) {
        console.error(`存储分类 "${category}" 失败:`, error);
      }
    }
  }
  
  /**
   * 更新最近使用的库记录
   * @private
   * @param {string} libraryName - 库名称
   */
  _updateRecentLibraries(libraryName) {
    try {
      // 获取最近使用的库列表
      let recentLibraries = [];
      const recentData = localStorage.getItem('recent_libraries');
      if (recentData) {
        recentLibraries = JSON.parse(recentData);
      }
      
      // 更新列表（将当前库放在最前面）
      recentLibraries = recentLibraries.filter(lib => lib !== libraryName);
      recentLibraries.unshift(libraryName);
      
      // 限制列表长度
      if (recentLibraries.length > 5) {
        recentLibraries = recentLibraries.slice(0, 5);
      }
      
      // 保存更新后的列表
      localStorage.setItem('recent_libraries', JSON.stringify(recentLibraries));
    } catch (error) {
      console.error('更新最近使用的库记录失败:', error);
    }
  }
  
  /**
   * 获取最近使用的库列表
   * @returns {Array} 最近使用的库名称数组
   */
  getRecentLibraries() {
    try {
      const recentData = localStorage.getItem('recent_libraries');
      if (recentData) {
        const recentLibraries = JSON.parse(recentData);
        // 过滤掉不存在的库
        return recentLibraries.filter(libName => this.libraries[libName]);
      }
    } catch (error) {
      console.error('获取最近使用的库记录失败:', error);
    }
    
    return [];
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
   * 获取所有库名称
   * @returns {Array} 库名称数组
   */
  getLibraryNames() {
    return Object.keys(this.libraries).sort();
  }

  /**
   * 获取指定名称的库
   * @param {string} libraryName - 库名称
   * @param {boolean} forceReload - 是否强制重新加载数据（忽略缓存）
   * @returns {Object} 库对象
   */
  getLibrary(libraryName, forceReload = false) {
    if (forceReload) {
      // 强制重新加载数据
      this._loadFromStorage();
    }
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
   * 设置库数据（更新或添加）
   * @param {string} libraryName - 库名称
   * @param {Object} libraryData - 库数据
   * @returns {boolean} 是否设置成功
   */
  setLibrary(libraryName, libraryData) {
    if (!libraryName || !libraryData || typeof libraryData !== 'object') {
      return false;
    }
    
    this.libraries[libraryName] = libraryData;
    this._saveToStorage();
    return true;
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
   * @param {Object} options - 抽取选项
   */
  addToHistory(tags, options = {}) {
    if (Array.isArray(tags) && tags.length > 0) {
      // 添加唯一ID
      const historyItem = {
        id: `hist_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        timestamp: Date.now(),
        tags: tags,
        libraryName: this.currentLibraryName,
        options: options
      };
      
      this.drawnHistory.unshift(historyItem);
      
      // 限制历史记录数量，根据设置的最大值
      const maxHistorySize = options.maxHistoryCount || 20;
      if (this.drawnHistory.length > maxHistorySize) {
        this.drawnHistory = this.drawnHistory.slice(0, maxHistorySize);
      }
      
      this._saveToStorage();
      
      // 添加通知 - 发送信号表明历史记录已更新
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('history-updated'));
      }
    }
  }

  /**
   * 获取历史记录
   * @returns {Array} 历史记录数组
   */
  getHistory() {
    // 确保总是返回数组，即使数据为空
    console.log('获取历史记录，当前数量:', this.drawnHistory.length);
    
    // 防止可能的引用类型问题，返回一个浅拷贝
    return [...this.drawnHistory];
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
   * 删除单个历史记录
   * @param {string} id - 历史记录项的ID
   * @returns {boolean} 是否成功删除
   */
  removeHistoryItem(id) {
    if (!id) {
      throw new Error('历史记录ID不能为空');
    }
    
    const initialLength = this.drawnHistory.length;
    this.drawnHistory = this.drawnHistory.filter(item => item.id !== id);
    
    // 检查是否删除了项目
    if (this.drawnHistory.length < initialLength) {
      this._saveToStorage();
      
      // 发送更新通知
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('history-updated'));
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * 清空历史记录
   * @returns {boolean} 是否成功清空
   */
  clearHistory() {
    try {
      this.drawnHistory = [];
      this._saveToStorage();
      
      // 发送更新通知
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('history-updated'));
      }
      
      return true;
    } catch (error) {
      console.error('清空历史记录失败:', error);
      return false;
    }
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
    if (this.libraries[libraryName]) {
      this.currentLibraryName = libraryName;
      this._saveToStorage();
      
      // 确保触发更新通知
      this._notifyLibraryUpdated();
      
      return true;
    }
    return false;
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
   * 移除标签
   * @param {string} category - 分类
   * @param {string} content - 标签内容
   * @param {string} libraryName - 可选，库名称，默认为当前库
   * @returns {boolean} 是否成功移除
   */
  removeTag(category, content, libraryName = null) {
    const libName = libraryName || this.currentLibraryName;
    const library = this.libraries[libName];
    
    if (!library) {
      console.error(`移除标签失败: 库 "${libName}" 不存在`);
      return false;
    }
    
    if (!library[category] || !Array.isArray(library[category])) {
      console.error(`移除标签失败: 分类 "${category}" 不存在或不是数组`);
      return false;
    }
    
    const originalLength = library[category].length;
    
    // 根据标签格式（字符串或对象）过滤
    library[category] = library[category].filter(tag => {
      if (typeof tag === 'string') {
        return tag !== content;
      } else {
        const tagContent = tag.content || tag.text || '';
        return tagContent !== content;
      }
    });
    
    // 如果长度变化，说明成功移除了标签
    if (library[category].length < originalLength) {
      this._saveToStorage();
      
      // 直接调用通知方法，确保更新传播到所有组件
      this._notifyLibraryUpdated();
      
      return true;
    }
    
    return false;
  }

  /**
   * 添加新分类
   * @param {string} libraryName - 库名称
   * @param {string} categoryName - 分类名称
   * @returns {boolean} 是否添加成功
   */
  addCategory(libraryName, categoryName) {
    if (!libraryName || !categoryName) {
      throw new Error('库名称和分类名称不能为空');
    }
    
    if (!this.libraries[libraryName]) {
      throw new Error(`库 "${libraryName}" 不存在`);
    }
    
    // 检查分类是否已存在
    if (this.libraries[libraryName][categoryName]) {
      throw new Error(`分类 "${categoryName}" 已存在于库 "${libraryName}" 中`);
    }
    
    // 添加新分类
    this.libraries[libraryName][categoryName] = [];
    
    // 保存更改
    this._saveToStorage();
    
    // 确保触发更新通知
    this._notifyLibraryUpdated();
    
    return true;
  }
  
  /**
   * 重命名分类
   * @param {string} libraryName - 库名称
   * @param {string} oldCategoryName - 原分类名称
   * @param {string} newCategoryName - 新分类名称
   * @returns {boolean} 是否重命名成功
   */
  renameCategory(libraryName, oldCategoryName, newCategoryName) {
    // 验证参数
    if (!libraryName || !oldCategoryName || !newCategoryName) {
      throw new Error('库名称、原分类名称和新分类名称不能为空');
    }
    
    if (!this.libraries[libraryName]) {
      throw new Error(`库 "${libraryName}" 不存在`);
    }
    
    if (!this.libraries[libraryName][oldCategoryName]) {
      throw new Error(`分类 "${oldCategoryName}" 不存在于库 "${libraryName}" 中`);
    }
    
    if (this.libraries[libraryName][newCategoryName]) {
      throw new Error(`分类 "${newCategoryName}" 已存在于库 "${libraryName}" 中`);
    }
    
    // 重命名分类（移动数据）
    this.libraries[libraryName][newCategoryName] = this.libraries[libraryName][oldCategoryName];
    delete this.libraries[libraryName][oldCategoryName];
    
    // 保存更改
    this._saveToStorage();
    
    // 确保触发更新通知
    this._notifyLibraryUpdated();
    
    return true;
  }
  
  /**
   * 删除分类
   * @param {string} libraryName - 库名称
   * @param {string} categoryName - 分类名称
   * @returns {boolean} 是否删除成功
   */
  deleteCategory(libraryName, categoryName) {
    // 验证参数
    if (!libraryName || !categoryName) {
      throw new Error('库名称和分类名称不能为空');
    }
    
    if (!this.libraries[libraryName]) {
      throw new Error(`库 "${libraryName}" 不存在`);
    }
    
    if (!this.libraries[libraryName][categoryName]) {
      throw new Error(`分类 "${categoryName}" 不存在于库 "${libraryName}" 中`);
    }
    
    // 删除分类
    delete this.libraries[libraryName][categoryName];
    
    // 保存更改
    this._saveToStorage();
    
    // 确保触发更新通知
    this._notifyLibraryUpdated();
    
    return true;
  }

  /**
   * 清除标签库缓存
   * @param {string} libraryName - 可选，库名称，清除特定库的缓存
   */
  clearCache(libraryName) {
    if (libraryName) {
      // 清除指定库的缓存
      for (const key of this.categoryCache.keys()) {
        if (key.startsWith(`${libraryName}:`)) {
          this.categoryCache.delete(key);
        }
      }
      
      // 如果库是分块模式的，重置懒加载状态
      if (this.chunkedLibraries.has(libraryName)) {
        this._loadLibraryCategoriesMetadata(libraryName);
      }
    } else {
      // 清除所有缓存
      this.categoryCache.clear();
      
      // 重置所有分块库的懒加载状态
      for (const libName of this.chunkedLibraries) {
        this._loadLibraryCategoriesMetadata(libName);
      }
    }
    
    // 触发更新通知
    this._notifyLibraryUpdated();
  }

  /**
   * 直接设置所有库数据
   * @param {Object} libraries - 包含所有库的对象
   * @param {boolean} saveToStorage - 是否保存到本地存储，默认为 true
   * @returns {boolean} 是否设置成功
   */
  setLibraries(libraries, saveToStorage = true) {
    if (!libraries || typeof libraries !== 'object') {
      return false;
    }
    
    this.libraries = libraries;
    
    if (saveToStorage) {
      this._saveToStorage();
    }
    
    return true;
  }
}

export default TagLibrary; 