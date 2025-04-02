/**
 * TagDrawer 类 - Vue重构版
 * 负责标签的抽取功能
 */

class TagDrawer {
  /**
   * 构造函数
   * @param {TagLibrary} tagLibrary - 标签库对象
   */
  constructor(tagLibrary) {
    this.tagLibrary = tagLibrary;
    // 初始化使用次数统计
    this.usageCount = this._loadUsageCount();
  }

  /**
   * 从localStorage加载标签使用统计
   * @private
   */
  _loadUsageCount() {
    try {
      const savedCount = localStorage.getItem('tagDrawer_usageCount');
      return savedCount ? JSON.parse(savedCount) : {};
    } catch (error) {
      console.error('加载标签使用统计失败:', error);
      return {};
    }
  }

  /**
   * 保存标签使用统计到localStorage
   * @private
   */
  _saveUsageCount() {
    try {
      localStorage.setItem('tagDrawer_usageCount', JSON.stringify(this.usageCount));
    } catch (error) {
      console.error('保存标签使用统计失败:', error);
    }
  }

  /**
   * 更新标签使用次数
   * @param {Array} tags - 使用的标签数组
   * @private
   */
  _updateUsageCount(tags) {
    if (!tags || !tags.length) return;
    
    tags.forEach(tag => {
      const key = `${tag.category}:${tag.tagContent}`;
      if (!this.usageCount[key]) {
        this.usageCount[key] = 0;
      }
      this.usageCount[key]++;
    });
    
    this._saveUsageCount();
  }

  /**
   * 抽取标签
   * @param {number} count - 抽取数量
   * @param {string} category - 分类名称
   * @param {Array} excludeTags - 排除的标签
   * @param {boolean} noRepeat - 是否避免重复抽取
   * @param {Object} options - 高级选项
   * @returns {Object} 抽取结果
   */
  drawTags(count, category = 'all', excludeTags = [], noRepeat = false, options = {}) {
    // 根据当前选择的分类获取标签池
    let tagPool = [];
    const currentLibrary = this.tagLibrary.getCurrentLibrary();
    
    if (category === 'all') {
      // 从所有分类中抽取
      for (const cat in currentLibrary) {
        currentLibrary[cat].forEach(tagItem => {
          // 获取标签内容（兼容新旧格式）
          let tagContent, tagSubTitles, tagCategory;
          
          if (typeof tagItem === 'object') {
            if (tagItem.content) {
              // 新格式
              tagContent = tagItem.content;
              tagSubTitles = tagItem.subTitles || [];
              tagCategory = tagItem.category || cat;
            } else if (tagItem.text) {
              // 旧格式
              tagContent = tagItem.text;
              tagSubTitles = tagItem.subTitle ? tagItem.subTitle.split(',') : [];
              tagCategory = cat;
            }
          } else {
            tagContent = tagItem;
            tagSubTitles = [];
            tagCategory = cat;
          }
          
          // 检查是否在排除列表中
          const isExcluded = excludeTags.some(excludeTag => 
            tagContent.toLowerCase().includes(excludeTag.toLowerCase()));
          
          // 检查是否已经抽取过（如果启用了不重复抽取）
          const isAlreadyDrawn = noRepeat && 
            this.tagLibrary.isTagInHistory(tagCategory, tagContent);
          
          if (!isExcluded && !isAlreadyDrawn) {
            tagPool.push({
              category: tagCategory,
              tagContent: tagContent,
              tagSubTitles: tagSubTitles
            });
          }
        });
      }
    } else if (currentLibrary[category]) {
      // 从指定分类中抽取
      currentLibrary[category].forEach(tagItem => {
        // 获取标签内容（兼容新旧格式）
        let tagContent, tagSubTitles;
        
        if (typeof tagItem === 'object') {
          if (tagItem.content) {
            // 新格式
            tagContent = tagItem.content;
            tagSubTitles = tagItem.subTitles || [];
          } else if (tagItem.text) {
            // 旧格式
            tagContent = tagItem.text;
            tagSubTitles = tagItem.subTitle ? tagItem.subTitle.split(',') : [];
          }
        } else {
          tagContent = tagItem;
          tagSubTitles = [];
        }
        
        // 检查是否在排除列表中
        const isExcluded = excludeTags.some(excludeTag => 
          tagContent.toLowerCase().includes(excludeTag.toLowerCase()));
        
        // 检查是否已经抽取过（如果启用了不重复抽取）
        const isAlreadyDrawn = noRepeat && 
          this.tagLibrary.isTagInHistory(category, tagContent);
        
        if (!isExcluded && !isAlreadyDrawn) {
          tagPool.push({
            category: category,
            tagContent: tagContent,
            tagSubTitles: tagSubTitles
          });
        }
      });
    }
    
    // 检查标签池是否为空
    if (tagPool.length === 0) {
      return { 
        success: false, 
        message: '没有可用的标签可抽取，请尝试更改分类或减少排除标签' 
      };
    }
    
    // 如果标签池数量小于请求数量，调整抽取数量
    const actualCount = Math.min(count, tagPool.length);
    
    // 随机抽取标签
    const drawnTags = [];
    
    // 判断是否使用权重
    const useWeights = options.useWeights === true;
    
    if (useWeights) {
      // 使用权重进行抽取
      // 为每个标签计算权重
      const weightedPool = tagPool.map(tag => {
        const key = `${tag.category}:${tag.tagContent}`;
        const usageCount = this.usageCount[key] || 0;
        // 使用次数越多，权重越高
        const weight = Math.min(usageCount * 0.2 + 1, 5); // 权重范围1-5
        return { tag, weight };
      });
      
      // 基于权重抽取
      for (let i = 0; i < actualCount; i++) {
        if (weightedPool.length === 0) break;
        
        // 计算权重总和
        const totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0);
        let randomValue = Math.random() * totalWeight;
        
        // 选择标签
        let selectedIndex = 0;
        for (let j = 0; j < weightedPool.length; j++) {
          randomValue -= weightedPool[j].weight;
          if (randomValue <= 0) {
            selectedIndex = j;
            break;
          }
        }
        
        // 获取并移除选中的标签
        const selected = weightedPool.splice(selectedIndex, 1)[0];
        drawnTags.push(selected.tag);
      }
    } else {
      // 传统随机抽取
      for (let i = 0; i < actualCount; i++) {
        // 随机选择一个索引
        const randomIndex = Math.floor(Math.random() * tagPool.length);
        
        // 获取标签并从池中移除
        const drawnTag = tagPool.splice(randomIndex, 1)[0];
        
        // 添加到结果
        drawnTags.push(drawnTag);
      }
    }
    
    // 更新使用次数统计
    this._updateUsageCount(drawnTags);
    
    // 添加到历史记录（如果需要）
    const shouldSaveHistory = options.saveHistory !== false;
    if (shouldSaveHistory) {
      this.tagLibrary.addToHistory(drawnTags);
    }
    
    return { 
      success: true, 
      drawnTags: drawnTags,
      message: `成功抽取了 ${drawnTags.length} 个标签` 
    };
  }

  /**
   * 抽取标签（简化接口）
   * @param {Object} options - 抽取选项
   * @returns {Array} 抽取的标签数组
   */
  draw(options = {}) {
    const count = options.count || 3;
    const category = options.category || 'all';
    const excludeKeywords = options.excludeKeywords || [];
    const noDuplicates = options.noDuplicates !== false;
    
    const result = this.drawTags(count, category, excludeKeywords, noDuplicates, options);
    
    if (!result.success) {
      throw new Error(result.message);
    }
    
    // 转换为统一格式
    return result.drawnTags.map(tag => ({
      category: tag.category,
      content: tag.tagContent,
      subTitles: tag.tagSubTitles
    }));
  }

  /**
   * 获取历史记录
   * @returns {Array} 历史记录数组
   */
  getHistory() {
    return this.tagLibrary.getHistory();
  }

  /**
   * 清空历史记录
   */
  clearHistory() {
    this.tagLibrary.clearHistory();
  }

  /**
   * 删除指定索引的历史记录
   * @param {number} index - 要删除的历史记录索引
   */
  removeHistoryItem(index) {
    const history = this.getHistory();
    if (index >= 0 && index < history.length) {
      history.splice(index, 1);
      this.tagLibrary.setHistory(history);
    } else {
      throw new Error('无效的历史记录索引');
    }
  }
}

export default TagDrawer; 