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
  
  // 抽签结果
  const drawnTags = ref([]);
  
  // 加载用户设置
  const loadSettings = () => {
    const userSettings = localStorage.getItem('drawer_settings');
    if (userSettings) {
      try {
        const settings = JSON.parse(userSettings);
        drawCount.value = settings.drawCount || 3;
        noDuplicates.value = settings.noDuplicates !== false;
        useWeights.value = settings.useWeights || false;
        showAnimation.value = settings.showAnimation || false;
        animationIntensity.value = settings.animationIntensity || 60;
        maxHistoryCount.value = settings.maxHistoryCount || 20;
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
      maxHistoryCount: maxHistoryCount.value
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
        maxHistoryCount: maxHistoryCount.value
      };
      
      // 执行抽取
      const result = tagDrawer.draw(options);
      
      // 播放动画效果（如果启用）
      if (showAnimation.value) {
        playDrawAnimation();
      }
      
      // 更新结果
      drawnTags.value = result;
      
      // 发布抽取结果事件
      emitter.emit('tags-drawn', result);
      
      // 保存到历史记录
      tagLibrary.addToHistory(result, options);
      
      emitter.emit('notification', {
        type: 'success',
        message: `成功抽取了 ${result.length} 个标签`
      });
      
      return result;
    } catch (error) {
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
    handleLibraryChange
  };
} 