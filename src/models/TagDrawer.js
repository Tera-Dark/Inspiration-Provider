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
   * @param {string|Array} category - 分类名称或分类数组
   * @param {Array} excludeTags - 排除的标签
   * @param {boolean} noRepeat - 是否避免重复抽取
   * @param {Object} options - 高级选项
   * @returns {Promise<Object>} 抽取结果
   */
  async drawTags(count, category = 'all', excludeTags = [], noRepeat = false, options = {}) {
    // 根据选择的库和分类获取标签池
    let tagPool = [];
    // 如果需要确保每个分类至少抽取一个，需要按分类维护独立的标签池
    let categoryPools = {};
    
    // 如果指定了库名，使用指定的库，否则使用当前库
    const libraryName = options.library || this.tagLibrary.getCurrentLibraryName();
    const targetLibrary = this.tagLibrary.getLibrary(libraryName);
    
    // 如果指定的库不存在或为空，则返回错误
    if (!targetLibrary) {
      return {
        success: false,
        message: `找不到标签库 "${libraryName}" 或该库为空`
      };
    }
    
    // 确定是否需要确保每个分类至少有一个标签
    // 仅当明确设置了ensureEachCategory为true，且category是一个非空数组时才启用
    const ensureEachCategory = options.ensureEachCategory === true && 
                              Array.isArray(category) && 
                              category.length > 1; // 至少需要两个分类才有意义
    
    console.log('抽取参数:', {
      count,
      categoryType: Array.isArray(category) ? 'array' : typeof category,
      categoryLength: Array.isArray(category) ? category.length : 0,
      ensureEachCategory,
      libraryName
    });
    
    try {
      if (category === 'all') {
        // 从所有分类中抽取
        const allCategories = this.tagLibrary.getCategories(libraryName);
        for (const cat of allCategories) {
          await this._addTagsToPoolAsync(libraryName, cat, tagPool, excludeTags, noRepeat);
        }
      } else if (Array.isArray(category) && category.length > 0) {
        // 从多个指定分类中抽取
        for (const cat of category) {
          await this._addTagsToPoolAsync(libraryName, cat, tagPool, excludeTags, noRepeat);
          
          // 如果需要确保每个分类至少抽取一个，则为每个分类维护单独的标签池
          if (ensureEachCategory) {
            categoryPools[cat] = [];
            await this._addTagsToPoolAsync(libraryName, cat, categoryPools[cat], excludeTags, noRepeat);
          }
        }
      } else if (typeof category === 'string' && category !== 'all') {
        // 从单个指定分类中抽取
        await this._addTagsToPoolAsync(libraryName, category, tagPool, excludeTags, noRepeat);
      }
      
      // 检查标签池是否为空
      if (tagPool.length === 0) {
        return { 
          success: false, 
          message: '没有可用的标签可抽取，请尝试更改分类或减少排除标签' 
        };
      }
      
      // 随机抽取标签
      const drawnTags = [];
      
      // 若启用了确保每个分类至少抽取一个的功能
      if (ensureEachCategory) {
        console.log('执行多分类平衡抽取');
        
        // 检查每个分类的标签池是否为空，如果有空的则报错
        const emptyCategories = [];
        for (const cat of category) {
          if (!categoryPools[cat] || categoryPools[cat].length === 0) {
            emptyCategories.push(cat);
          }
        }
        
        if (emptyCategories.length > 0) {
          return {
            success: false,
            message: `分类 "${emptyCategories.join(', ')}" 中没有可用的标签可抽取`
          };
        }
        
        // 首先从每个分类中抽取一个标签
        for (const cat of category) {
          if (categoryPools[cat] && categoryPools[cat].length > 0) {
            const randomIndex = Math.floor(Math.random() * categoryPools[cat].length);
            const selectedTag = categoryPools[cat][randomIndex];
            drawnTags.push(selectedTag);
            
            // 从总标签池中移除该标签，避免重复抽取
            for (let i = 0; i < tagPool.length; i++) {
              if (tagPool[i].category === selectedTag.category && 
                  tagPool[i].tagContent === selectedTag.tagContent) {
                tagPool.splice(i, 1);
                break;
              }
            }
          }
        }
        
        console.log(`已从${category.length}个分类中各抽取一个标签，当前已抽取标签数: ${drawnTags.length}`);
        
        // 计算还需要抽取的数量
        const remainingCount = Math.max(0, count - drawnTags.length);
        
        // 如果还需要抽取更多标签且标签池不为空，则从剩余的标签池中抽取
        if (remainingCount > 0 && tagPool.length > 0) {
          console.log(`继续从剩余标签池抽取${remainingCount}个标签`);
          // 从剩余的标签池中随机抽取剩余的标签
          this._drawRandomTags(tagPool, drawnTags, remainingCount, options.useWeights === true);
        }
      } else {
        // 如果未启用确保每个分类至少抽取一个的功能，则直接抽取指定数量的标签
        const actualCount = Math.min(count, tagPool.length);
        this._drawRandomTags(tagPool, drawnTags, actualCount, options.useWeights === true);
      }
      
      // 更新使用次数
      this._updateUsageCount(drawnTags);
      
      return {
        success: true,
        drawnTags
      };
    } catch (error) {
      console.error('抽取标签时发生错误:', error);
      return {
        success: false,
        message: `抽取失败: ${error.message}`
      };
    }
  }
  
  /**
   * 异步将分类中的标签添加到标签池
   * @private
   * @param {string} libraryName - 库名称
   * @param {string} category - 分类名称
   * @param {Array} pool - 标签池
   * @param {Array} excludeTags - 排除的标签
   * @param {boolean} noRepeat - 是否避免重复抽取
   */
  async _addTagsToPoolAsync(libraryName, category, pool, excludeTags, noRepeat) {
    try {
      // 异步获取分类标签
      const categoryTags = await this.tagLibrary.getCategoryTags(category, libraryName);
      
      if (!Array.isArray(categoryTags) || categoryTags.length === 0) {
        return;
      }
      
      categoryTags.forEach(tagItem => {
        // 获取标签内容（兼容新旧格式）
        let tagContent, tagSubTitles, tagCategory;
        
        if (typeof tagItem === 'object') {
          if (tagItem.content) {
            // 新格式
            tagContent = tagItem.content;
            tagSubTitles = tagItem.subTitles || [];
            tagCategory = tagItem.category || category;
          } else if (tagItem.text) {
            // 旧格式
            tagContent = tagItem.text;
            tagSubTitles = tagItem.subTitle ? tagItem.subTitle.split(',') : [];
            tagCategory = category;
          }
        } else {
          tagContent = tagItem;
          tagSubTitles = [];
          tagCategory = category;
        }
        
        // 检查是否在排除列表中
        const isExcluded = excludeTags.some(excludeTag => 
          tagContent.toLowerCase().includes(excludeTag.toLowerCase()));
        
        // 检查是否已经抽取过（如果启用了不重复抽取）
        const isAlreadyDrawn = noRepeat && 
          this.tagLibrary.isTagInHistory(tagCategory, tagContent);
        
        if (!isExcluded && !isAlreadyDrawn) {
          pool.push({
            category: tagCategory,
            tagContent: tagContent,
            tagSubTitles: tagSubTitles
          });
        }
      });
    } catch (error) {
      console.error(`从分类 "${category}" 加载标签失败:`, error);
      throw error;
    }
  }
  
  /**
   * 抽取标签的公共接口
   * @param {Object} options - 抽取选项
   * @returns {Promise<Array>} 抽取的标签数组
   */
  async draw(options = {}) {
    const count = options.count || 3;
    const category = options.category || 'all'; // 现在直接使用category参数
    const excludeKeywords = options.excludeKeywords || [];
    const noDuplicates = options.noDuplicates !== false;
    
    console.log('TagDrawer.draw接收到的选项:', {
      count,
      category,
      excludeKeywordCount: excludeKeywords.length,
      noDuplicates,
      ensureEachCategory: options.ensureEachCategory
    });
    
    try {
      const result = await this.drawTags(count, category, excludeKeywords, noDuplicates, options);
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      // 转换为统一格式
      return result.drawnTags.map(tag => ({
        category: tag.category,
        content: tag.tagContent,
        subTitles: tag.tagSubTitles
      }));
    } catch (error) {
      console.error('抽取标签失败:', error);
      throw error;
    }
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

  /**
   * 从标签池中随机抽取指定数量的标签
   * @private
   * @param {Array} tagPool - 标签池
   * @param {Array} drawnTags - 已抽取的标签数组
   * @param {number} count - 要抽取的数量
   * @param {boolean} useWeights - 是否使用权重
   */
  _drawRandomTags(tagPool, drawnTags, count, useWeights) {
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
      for (let i = 0; i < count; i++) {
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
        
        // 添加到抽取结果
        drawnTags.push(weightedPool[selectedIndex].tag);
        
        // 从标签池中移除
        weightedPool.splice(selectedIndex, 1);
      }
    } else {
      // 普通随机抽取
      for (let i = 0; i < count; i++) {
        if (tagPool.length === 0) break;
        const randomIndex = Math.floor(Math.random() * tagPool.length);
        drawnTags.push(tagPool[randomIndex]);
        tagPool.splice(randomIndex, 1);
      }
    }
  }
}

export default TagDrawer; 