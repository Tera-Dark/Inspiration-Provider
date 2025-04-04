import { createApp } from 'vue';
import App from './App.vue';
import './assets/styles.css';
import './assets/main.css';

// 引入模型
import TagLibrary from './models/TagLibrary';
import TagDrawer from './models/TagDrawer';
import TagLoader from './models/TagLoader';

// 在main.js的开头添加一些日志记录，追踪应用初始化和事件触发
console.log('应用初始化中...');

// 引入mitt
import mitt from 'mitt';

// 创建事件总线
const emitter = mitt();
console.log('事件总线(mitt)已创建');

// 异步加载标签数据并初始化应用
async function initApp() {
  try {
    // 加载标签数据
    const tagLoader = new TagLoader();
    
    // 加载所长常规法典作为默认库
    const defaultTags = await tagLoader.loadDefaultTags();
    console.log('所长常规法典数据加载完成');
    
    // 初始化标签库对象
    const tagLibrary = new TagLibrary({});
    
    // 添加默认库
    tagLibrary.addLibrary('所长常规法典库', defaultTags);
    
    // 设置默认库
    tagLibrary.setCurrentLibrary('所长常规法典库');
    
    // 初始化抽取器
    const tagDrawer = new TagDrawer(tagLibrary);
    console.log('标签库和抽取器已初始化');
    
    // 创建Vue应用
    const app = createApp(App);
    console.log('Vue应用实例已创建');
    
    // 注入依赖
    app.provide('emitter', emitter);
    app.provide('tagLibrary', tagLibrary);
    app.provide('tagDrawer', tagDrawer);
    console.log('所有依赖已注入到应用中');
    
    // 添加全局事件监听器，用于调试
    window.addEventListener('history-updated', () => {
      console.log('全局事件: history-updated 被触发');
    });
    
    window.addEventListener('tags-drawn', () => {
      console.log('全局事件: tags-drawn 被触发');
    });
    
    // 添加标签库更新事件监听器
    window.addEventListener('tagLibraryUpdated', () => {
      console.log('全局事件: tagLibraryUpdated 被触发');
      // 将原生事件转发到mitt事件系统，确保所有组件能够接收到更新通知
      emitter.emit('tagLibraryUpdated');
    });
    
    // 挂载应用
    app.mount('#app');
    console.log('应用已挂载到DOM');
  } catch (error) {
    console.error('应用初始化失败:', error);
  }
}

// 启动应用
initApp(); 