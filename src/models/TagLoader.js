/**
 * TagLoader 类
 * 负责加载示例标签数据
 */

class TagLoader {
  /**
   * 构造函数
   */
  constructor() {
    // 初始化
  }

  /**
   * 加载示例标签数据
   * @returns {Promise<Object>} 示例标签数据
   */
  async loadExampleTags() {
    try {
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
      
      console.log('示例标签数据加载成功');
      return exampleTags;
    } catch (error) {
      console.error('加载示例标签数据失败:', error);
      // 如果加载失败，返回一个基本空对象，避免应用崩溃
      return {};
    }
  }
}

export default TagLoader; 