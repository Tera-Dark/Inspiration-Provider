/**
 * TagLoader 类
 * 负责加载标签数据
 */

class TagLoader {
  /**
   * 构造函数
   */
  constructor() {
    // 初始化
    // 获取当前部署的基础路径
    this.basePath = import.meta.env.BASE_URL || '/';
    console.log('当前部署的基础路径:', this.basePath);
  }

  /**
   * 加载默认标签库
   * @returns {Promise<Object>} 标签库数据
   */
  async loadDefaultTags() {
    try {
      // 尝试多个可能的路径
      return await this._tryLoadJsonFile([
        // 首先尝试assets目录
        `${this.basePath}assets/default.json`,
        // 然后尝试根目录
        `${this.basePath}default.json`,
        // 再尝试public目录
        `${this.basePath}public/default.json`,
        // 尝试不带基础路径的版本
        '/assets/default.json',
        '/default.json',
        '/public/default.json',
        // 尝试完整GitHub Pages路径
        '/Inspiration-Provider/assets/default.json',
        '/Inspiration-Provider/default.json',
        '/Inspiration-Provider/public/default.json'
      ], '默认标签库');
    } catch (error) {
      console.error('加载默认标签库失败:', error);
      return {};
    }
  }

  /**
   * 加载画师标签库
   * @returns {Promise<Object>} 标签库数据
   */
  async loadArtistTags() {
    try {
      // 尝试多个可能的路径
      return await this._tryLoadJsonFile([
        // 首先尝试assets目录
        `${this.basePath}assets/artists.json`,
        // 然后尝试根目录
        `${this.basePath}artists.json`,
        // 再尝试public目录
        `${this.basePath}public/artists.json`,
        // 尝试不带基础路径的版本
        '/assets/artists.json',
        '/artists.json',
        '/public/artists.json',
        // 尝试完整GitHub Pages路径
        '/Inspiration-Provider/assets/artists.json',
        '/Inspiration-Provider/artists.json',
        '/Inspiration-Provider/public/artists.json'
      ], '画师标签库');
    } catch (error) {
      console.error('加载画师标签库失败:', error);
      return {};
    }
  }

  /**
   * 加载所长常规法典
   * @returns {Promise<Object>} 标签库数据
   */
  async loadLawTags() {
    try {
      // 尝试多个可能的路径
      return await this._tryLoadJsonFile([
        // 首先尝试assets目录
        `${this.basePath}assets/所长常规法典.json`,
        // 然后尝试根目录
        `${this.basePath}所长常规法典.json`,
        // 再尝试public目录
        `${this.basePath}public/所长常规法典.json`,
        // 尝试不带基础路径的版本
        '/assets/所长常规法典.json',
        '/所长常规法典.json',
        '/public/所长常规法典.json',
        // 尝试完整GitHub Pages路径
        '/Inspiration-Provider/assets/所长常规法典.json',
        '/Inspiration-Provider/所长常规法典.json',
        '/Inspiration-Provider/public/所长常规法典.json'
      ], '所长常规法典');
    } catch (error) {
      console.error('加载所长常规法典失败:', error);
      return {};
    }
  }

  /**
   * 尝试从多个可能的路径加载JSON文件
   * @param {Array<string>} paths - 可能的路径列表
   * @param {string} resourceName - 资源名称（用于日志）
   * @returns {Promise<Object>} 加载的JSON数据
   */
  async _tryLoadJsonFile(paths, resourceName) {
    console.log(`尝试加载${resourceName}...`);
    
    let response = null;
    let fileLoaded = false;
    let errors = [];
    
    // 依次尝试加载不同路径
    for (const path of paths) {
      try {
        console.log(`尝试从路径加载: ${path}`);
        response = await fetch(path, { cache: 'no-cache' });
        
        if (response.ok) {
          console.log(`成功找到并加载: ${path}`);
          fileLoaded = true;
          break;
        } else {
          const error = `状态码: ${response.status}`;
          console.warn(`无法从 ${path} 加载: ${error}`);
          errors.push({ path, error });
        }
      } catch (err) {
        console.warn(`无法从 ${path} 加载: ${err.message}`);
        errors.push({ path, error: err.message });
      }
    }
    
    if (!fileLoaded || !response) {
      console.error(`所有${resourceName}路径尝试均失败:`, errors);
      if (resourceName === '所长常规法典' || resourceName === '默认标签库') {
        console.log(`使用内置基本标签作为${resourceName}备选...`);
        return this._createBasicTags();
      }
      return {};
    }
    
    const data = await response.json();
    console.log(`${resourceName}加载成功`);
    return data;
  }

  /**
   * 创建基本的标签数据(内置)
   * @returns {Object} 基本标签数据
   */
  _createBasicTags() {
    console.log('创建内置基本标签');
    
    // 创建一个基本的标签库
    const basicTags = {
      '人物特质': [
        { content: '勇敢', subTitles: ['无畏', '坚强'] },
        { content: '聪明', subTitles: ['智慧', '机智'] },
        { content: '善良', subTitles: ['仁慈', '富有同情心'] },
        { content: '忠诚', subTitles: ['忠实', '可靠'] }
      ],
      '故事背景': [
        { content: '中世纪', subTitles: ['城堡', '骑士'] },
        { content: '未来世界', subTitles: ['科技', '太空'] },
        { content: '现代都市', subTitles: ['城市', '生活'] },
        { content: '奇幻世界', subTitles: ['魔法', '异域'] }
      ],
      '情节元素': [
        { content: '冒险', subTitles: ['探索', '挑战'] },
        { content: '爱情', subTitles: ['浪漫', '感情'] },
        { content: '神秘', subTitles: ['谜团', '悬疑'] },
        { content: '冲突', subTitles: ['矛盾', '对抗'] }
      ],
      '创作主题': [
        { content: '成长', subTitles: ['蜕变', '进步'] },
        { content: '自我发现', subTitles: ['觉醒', '领悟'] },
        { content: '友谊', subTitles: ['情谊', '互助'] },
        { content: '生存', subTitles: ['求生', '挣扎'] }
      ]
    };
    
    console.log('内置基本标签创建成功');
    return basicTags;
  }

  /**
   * 加载示例标签数据（与loadDefaultTags完全一致，全部使用所长常规法典）
   * @returns {Promise<Object>} 示例标签数据
   */
  async loadExampleTags() {
    return this.loadDefaultTags();
  }
}

export default TagLoader; 