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

// 创建标签库服务实例
const tagLibrary = new TagLibrary({}, emitter);

// 示例标签数据 - 将来可以从服务器加载
const exampleTags = {
  artists: [
    "Da Vinci", "Van Gogh", "Monet", "Picasso", 
    "Rembrandt", "Kahlo", "O'Keeffe", "Dali"
  ],
  styles: [
    "Impressionism", "Cubism", "Surrealism", "Realism",
    "Expressionism", "Pop Art", "Minimalism", "Abstract"
  ]
};

// 异步加载标签数据并初始化应用
async function initApp() {
  try {
    // 加载标签数据
    const tagLoader = new TagLoader();
    
    // 加载所有预设库
    const defaultTags = await tagLoader.loadDefaultTags();
    const artistTags = await tagLoader.loadArtistTags();
    const lawTags = await tagLoader.loadLawTags();
    console.log('所有预设标签库数据加载完成');
    
    // 添加所有预设库到全局标签库实例
    tagLibrary.addLibrary('默认标签库', defaultTags);
    tagLibrary.addLibrary('画师标签库', artistTags);
    tagLibrary.addLibrary('所长常规法典库', lawTags);
    
    // 设置默认库
    tagLibrary.setCurrentLibrary('默认标签库');
    
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
    let tagLibEventProcessing = false;
    window.addEventListener('tagLibraryUpdated', () => {
      // 防止事件循环
      if (tagLibEventProcessing) {
        console.log('全局事件: 忽略重复的 tagLibraryUpdated 事件');
        return;
      }
      
      tagLibEventProcessing = true;
      console.log('全局事件: tagLibraryUpdated 被触发');
      
      // 将原生事件转发到mitt事件系统，确保所有组件能够接收到更新通知
      setTimeout(() => {
        emitter.emit('tagLibraryUpdated');
        tagLibEventProcessing = false;
      }, 10);
    });
    
    // 挂载应用
    app.mount('#app');
    console.log('应用已挂载到DOM');
  } catch (error) {
    console.error('应用初始化失败:', error);
    
    // 即使加载失败也继续初始化应用
    const app = createApp(App);
    app.provide('emitter', emitter);
    app.provide('tagLibrary', tagLibrary);
    app.mount('#app');
    console.log('Vue应用已挂载(标签库数据加载失败)');
  }
}

// 启动应用
initApp(); 