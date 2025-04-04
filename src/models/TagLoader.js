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
  }

  /**
   * 加载默认标签数据 (所长常规法典)
   * @returns {Promise<Object>} 默认标签数据
   */
  async loadDefaultTags() {
    try {
      console.log('正在加载所长常规法典...');
      
      // 尝试多个可能的文件名
      const possibleFileNames = [
        '/所长常规法典.json',
        '/@所长常规法典.json'
      ];
      
      let response = null;
      let fileLoaded = false;
      
      // 依次尝试加载不同文件名
      for (const fileName of possibleFileNames) {
        try {
          console.log(`尝试加载: ${fileName}`);
          response = await fetch(fileName);
          
          if (response.ok) {
            console.log(`成功找到并加载: ${fileName}`);
            fileLoaded = true;
            break;
          }
        } catch (err) {
          console.warn(`无法加载 ${fileName}: ${err.message}`);
        }
      }
      
      if (!fileLoaded || !response) {
        throw new Error('所有可能的所长常规法典文件名尝试均失败');
      }
      
      const data = await response.json();
      console.log('所长常规法典加载成功');
      return data;
    } catch (error) {
      console.error('加载所长常规法典失败:', error);
      // 如果加载失败，尝试加载示例标签
      console.log('尝试加载示例标签作为备选...');
      return this.loadExampleTags();
    }
  }

  /**
   * 加载示例标签数据
   * @returns {Promise<Object>} 示例标签数据
   */
  async loadExampleTags() {
    try {
      // 尝试从文件加载示例标签
      const possibleFileNames = [
        '/example_tags.json',
        '/@example_tags.json'
      ];
      
      let response = null;
      let fileLoaded = false;
      
      // 依次尝试加载不同文件名
      for (const fileName of possibleFileNames) {
        try {
          console.log(`尝试加载示例标签: ${fileName}`);
          response = await fetch(fileName);
          
          if (response.ok) {
            console.log(`成功找到并加载示例标签: ${fileName}`);
            fileLoaded = true;
            break;
          }
        } catch (err) {
          console.warn(`无法加载示例标签 ${fileName}: ${err.message}`);
        }
      }
      
      if (fileLoaded && response) {
        const data = await response.json();
        console.log('从文件加载示例标签数据成功');
        return data;
      }
      
      // 如果文件加载失败，使用内置示例
      console.log('从文件加载示例标签失败，使用内置示例');
      
      // 创建一个基本的示例标签库
      const exampleTags = {
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
      
      // 模拟网络请求的延迟
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('内置示例标签数据加载成功');
      return exampleTags;
    } catch (error) {
      console.error('加载示例标签数据失败:', error);
      // 如果加载失败，返回一个基本空对象，避免应用崩溃
      return {};
    }
  }
}

export default TagLoader; 