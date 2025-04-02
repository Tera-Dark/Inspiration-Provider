import { createApp } from 'vue';
import App from './App.vue';
import './assets/styles.css';
import './assets/main.css';

// 引入模型
import TagLibrary from './models/TagLibrary';
import TagDrawer from './models/TagDrawer';

// 引入事件总线
import eventBus from './utils/eventBus';

// 加载示例标签数据
const fetchExampleTags = async () => {
  try {
    const response = await fetch('/example_tags.json');
    if (!response.ok) {
      console.error('加载示例标签失败: 响应不成功', response.status, response.statusText);
      throw new Error('无法加载示例标签数据');
    }
    return await response.json();
  } catch (error) {
    console.error('加载示例标签失败:', error);
    return {};
  }
};

// 初始化应用
const initApp = async () => {
  // 加载示例标签数据
  const exampleTags = await fetchExampleTags();
  
  // 创建标签库和抽取器实例
  const tagLibrary = new TagLibrary(exampleTags);
  const tagDrawer = new TagDrawer(tagLibrary);
  
  // 创建Vue应用
  const app = createApp(App);
  
  // 提供依赖注入
  app.provide('tagLibrary', tagLibrary);
  app.provide('tagDrawer', tagDrawer);
  app.provide('emitter', eventBus);
  
  // 挂载应用
  app.mount('#app');
};

// 初始化应用
initApp().catch(error => {
  console.error('应用初始化失败:', error);
  document.body.innerHTML = `
    <div style="color: red; padding: 20px; text-align: center;">
      <h1>初始化失败</h1>
      <p>${error.message}</p>
    </div>
  `;
}); 