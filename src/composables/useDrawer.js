import { ref, inject } from 'vue';

/**
 * 抽签功能组合式API
 * 提供抽签相关的状态和方法
 */
export function useDrawer() {
  const emitter = inject('emitter');
  const tagLibrary = inject('tagLibrary');
  const tagDrawer = inject('tagDrawer');
  
  // 抽签设置状态
  const drawCount = ref(3);
  const selectedCategory = ref('all');
  const selectedLibrary = ref('default');
  const excludeKeywords = ref('');
  const noDuplicates = ref(true);
  const useWeights = ref(false);
  const showAnimation = ref(false);
  const animationIntensity = ref(60);
  const maxHistoryCount = ref(20);
  const ensureEachCategory = ref(false);
  
  // 抽签结果
  const drawnTags = ref([]);
  
  // 加载用户设置
  const loadSettings = () => {
    const userSettings = localStorage.getItem('drawer_settings');
    if (userSettings) {
      try {
        const settings = JSON.parse(userSettings);
        
        // 应用设置
        if (typeof settings.defaultDrawCount === 'number') {
          drawCount.value = settings.defaultDrawCount;
        }
        
        if (typeof settings.noDuplicates === 'boolean') {
          noDuplicates.value = settings.noDuplicates;
        }
        
        if (typeof settings.useWeights === 'boolean') {
          useWeights.value = settings.useWeights;
        }
        
        if (typeof settings.showAnimation === 'boolean') {
          showAnimation.value = settings.showAnimation;
        }
        
        if (typeof settings.animationIntensity === 'number') {
          animationIntensity.value = settings.animationIntensity;
        }
        
        if (typeof settings.maxHistoryCount === 'number') {
          maxHistoryCount.value = settings.maxHistoryCount;
        }
        
        if (typeof settings.ensureEachCategory === 'boolean') {
          ensureEachCategory.value = settings.ensureEachCategory;
        }
      } catch (e) {
        console.error('加载抽签设置失败', e);
      }
    }
    
    // 设置默认库
    const libraries = tagLibrary.getLibraryNames();
    if (libraries && libraries.length > 0) {
      selectedLibrary.value = tagLibrary.getCurrentLibrary() || libraries[0];
    }
  };
  
  // 保存设置
  const saveSettings = () => {
    localStorage.setItem('drawer_settings', JSON.stringify({
      drawCount: drawCount.value,
      noDuplicates: noDuplicates.value,
      useWeights: useWeights.value,
      showAnimation: showAnimation.value,
      animationIntensity: animationIntensity.value,
      maxHistoryCount: maxHistoryCount.value,
      ensureEachCategory: ensureEachCategory.value
    }));
  };
  
  // 执行抽签
  const drawTags = () => {
    try {
      // 解析排除关键词
      const excludeList = excludeKeywords.value
        ? excludeKeywords.value.split(',').map(kw => kw.trim())
        : [];
      
      // 设置抽取选项
      const options = {
        count: parseInt(drawCount.value),
        category: selectedCategory.value === 'all' ? null : selectedCategory.value,
        library: selectedLibrary.value,
        excludeKeywords: excludeList,
        noDuplicates: noDuplicates.value,
        useWeights: useWeights.value,
        showAnimation: showAnimation.value,
        animationIntensity: animationIntensity.value,
        maxHistoryCount: maxHistoryCount.value,
        ensureEachCategory: ensureEachCategory.value
      };
      
      console.log('执行抽签，选项:', options);
      
      // 执行抽取
      const result = tagDrawer.draw(options);
      console.log('抽签结果:', result);
      
      // 播放动画效果（如果启用）
      if (showAnimation.value) {
        playDrawAnimation();
      }
      
      // 更新结果
      drawnTags.value = result;
      
      // 发布抽取结果事件
      emitter.emit('tags-drawn', result);
      console.log('已发送tags-drawn事件');
      
      // 保存到历史记录
      console.log('将结果保存到历史记录');
      const saveResult = tagLibrary.addToHistory(result, options);
      console.log('历史记录保存结果:', saveResult ? '成功' : '失败');
      
      // 通知抽取成功
      emitter.emit('notification', {
        type: 'success',
        message: `成功抽取了 ${result.length} 个标签`
      });
      console.log('抽签流程完成');
      
      return result;
    } catch (error) {
      console.error('抽签失败:', error);
      emitter.emit('notification', {
        type: 'error',
        message: `抽取失败: ${error.message}`
      });
      return [];
    }
  };
  
  // 播放抽取动画
  const playDrawAnimation = () => {
    emitter.emit('play-draw-animation', animationIntensity.value);
  };
  
  // 测试动画效果
  const testAnimation = () => {
    if (showAnimation.value) {
      playDrawAnimation();
    }
  };
  
  // 重置结果
  const resetResult = () => {
    drawnTags.value = [];
    emitter.emit('tags-reset');
  };
  
  // 增减数量
  const increaseCount = () => {
    if (drawCount.value < 10) {
      drawCount.value++;
      saveSettings();
    }
  };
  
  const decreaseCount = () => {
    if (drawCount.value > 1) {
      drawCount.value--;
      saveSettings();
    }
  };
  
  // 复制抽签结果
  const copyResultTags = (contentOnly = false) => {
    if (!drawnTags.value || drawnTags.value.length === 0) return;
    
    let tagsText = '';
    
    if (contentOnly) {
      // 只复制内容部分，用英文逗号分隔
      tagsText = drawnTags.value.map(tag => tag.content).join(',');
    } else {
      // 复制完整格式，每行之间用英文逗号分隔
      tagsText = drawnTags.value.map(tag => {
        let text = `【${tag.category}】${tag.content}`;
        if (tag.subTitles && tag.subTitles.length > 0) {
          text += ` (${tag.subTitles.join(' / ')})`;
        }
        return text;
      }).join(',');
    }
    
    // 复制到剪贴板
    navigator.clipboard.writeText(tagsText)
      .then(() => {
        emitter.emit('notification', {
          type: 'success',
          message: contentOnly ? '已复制内容到剪贴板' : '已复制完整结果到剪贴板'
        });
      })
      .catch(err => {
        console.error('复制失败:', err);
        emitter.emit('notification', {
          type: 'error',
          message: '复制失败，请手动复制'
        });
      });
  };
  
  // 获取分类列表
  const getCategories = () => {
    return tagLibrary.getCategories(selectedLibrary.value) || [];
  };
  
  // 获取库列表
  const getLibraries = () => {
    return tagLibrary.getLibraryNames() || ['default'];
  };
  
  // 处理库变更
  const handleLibraryChange = () => {
    // 刷新分类列表
    selectedCategory.value = 'all';
  };
  
  // 刷新数据
  const refreshData = () => {
    // 刷新分类和库数据
    emitter.emit('library-data-refresh');
  };
  
  return {
    // 状态
    drawCount,
    selectedCategory,
    selectedLibrary,
    excludeKeywords,
    noDuplicates,
    useWeights,
    showAnimation,
    animationIntensity,
    maxHistoryCount,
    ensureEachCategory,
    drawnTags,
    
    // 方法
    loadSettings,
    saveSettings,
    drawTags,
    playDrawAnimation,
    testAnimation,
    resetResult,
    increaseCount,
    decreaseCount,
    copyResultTags,
    getCategories,
    getLibraries,
    handleLibraryChange,
    refreshData
  };
} 