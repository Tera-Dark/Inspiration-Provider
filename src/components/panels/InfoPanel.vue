<template>
  <div class="panel">
    <h2>关于本工具</h2>
    
    <div class="info-content">
      <p>灵感提供机是一个分类Tag抽签工具，可以帮助创作者、设计师、游戏开发者等获取灵感。通过随机抽取不同分类的标签，激发创意思维，打破思维定式。</p>
      
      <h3>使用方法</h3>
      <ol class="instruction-list">
        <li>在<strong>设置</strong>面板中设置抽取数量</li>
        <li>选择要抽取的标签分类（或使用全部分类）</li>
        <li>可选：设置排除关键词，输入不想出现的关键词</li>
        <li>点击<strong>抽签</strong>按钮获取随机标签</li>
        <li>抽取结果将显示在右侧面板中</li>
        <li>您还可以在<strong>历史记录</strong>中查看和重用之前的抽取结果</li>
      </ol>
      
      <h3>功能特点</h3>
      <ul class="feature-list">
        <li>多分类标签库，包括人物特质、故事背景、情节元素等</li>
        <li>自定义抽取数量，根据需要设置同时抽取的标签数量</li>
        <li>分类筛选，可以选择从特定分类或全部分类中抽取标签</li>
        <li>历史记录功能，保存之前的抽取结果，方便查看和重用</li>
        <li>支持导入自定义的JSON格式标签库，方便扩展和个性化</li>
        <li>美观的界面设计，操作简单直观</li>
      </ul>
      
      <div class="version-info">
        <p>版本: 1.2.0</p>
        <p>基于Vue 3的重构版本</p>
        <p class="github-link">
          <a href="https://github.com/yourusername/tag-inspiration" target="_blank">
            GitHub 开源项目
          </a>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'InfoPanel'
});
</script>

<style scoped>
.panel {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 20px;
}

.panel h2 {
  color: #2c3e50;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eaeaea;
}

.info-content {
  color: #333;
  line-height: 1.6;
}

.info-content p {
  margin-bottom: 15px;
}

.info-content h3 {
  font-size: 1.1rem;
  margin: 20px 0 10px 0;
  color: #2c3e50;
}

.instruction-list,
.feature-list {
  margin-bottom: 20px;
  padding-left: 20px;
}

.instruction-list li,
.feature-list li {
  margin-bottom: 8px;
}

.version-info {
  margin-top: 30px;
  padding-top: 15px;
  border-top: 1px solid #eaeaea;
  font-size: 0.9rem;
  color: #7f8c8d;
}

.github-link {
  margin-top: 10px;
}

.github-link a {
  color: #3498db;
  text-decoration: none;
}

.github-link a:hover {
  text-decoration: underline;
}
</style> 