<template>
  <div class="panel">
    <h2>关于应用</h2>
    
    <div class="info-content">
      <div class="info-section">
        <div class="info-title">标签抽签工具</div>
        <p>版本 1.2.3</p>
        <p>一个用于管理和随机抽取标签的工具，适用于创意激发。随机选择等场景。支持多标签库、历史记录、权重抽取等高级功能。</p>
      </div>
      
      <div class="info-section">
        <div class="info-title">开发信息</div>
        <h4>开发者: 蘭</h4>
        <p>联系邮箱: 3503146143@qq.com</p>
        <p>更新日志: <a href="#" class="update-link" @click.prevent="openUpdateLog">查看</a></p>
      </div>
      
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
        <div class="github-link">
          <a href="https://github.com/Tera-Dark/Inspiration-Provider" target="_blank">
            GitHub 开源项目
          </a>
        </div>
      </div>
    </div>
    
    <!-- 更新日志弹窗 -->
    <div v-if="showUpdateLog" class="update-log-modal">
      <div class="update-log-content">
        <div class="update-log-header">
          <h3>更新日志</h3>
          <button class="close-btn" @click="closeUpdateLog">×</button>
        </div>
        <div class="update-log-body">
          <div class="version-entry">
            <div class="version-header">版本 1.2.3 (2024-04-08)</div>
            <ul class="version-changes">
              <li>修复高级编辑器标签管理功能</li>
              <li>优化事件处理机制，解决循环刷新问题</li>
              <li>增强表单验证和错误处理</li>
              <li>改进标签库数据处理逻辑</li>
              <li>添加详细日志记录，便于问题排查</li>
              <li>提升应用整体稳定性</li>
            </ul>
          </div>
          <div class="version-entry">
            <div class="version-header">版本 1.2.2 (2024-04-07)</div>
            <ul class="version-changes">
              <li>优化权重添加器功能</li>
              <li>改进所长常规法典库的支持</li>
              <li>优化标签库预览界面布局</li>
              <li>修复对象格式标签的解析问题</li>
              <li>增强深色模式显示效果</li>
            </ul>
          </div>
          <div class="version-entry">
            <div class="version-header">版本 1.2.1 (2024-04-04)</div>
            <ul class="version-changes">
              <li>添加标签格式转换工具</li>
              <li>支持多种文本格式导入</li>
              <li>优化移动端适配</li>
              <li>改进用户界面交互</li>
              <li>优化数据处理性能</li>
            </ul>
          </div>
          <div class="version-entry">
            <div class="version-header">版本 1.2.0 (2024-04-01)</div>
            <ul class="version-changes">
              <li>新增权重添加器功能</li>
              <li>标签库管理系统升级</li>
              <li>深色模式优化</li>
              <li>本地数据存储增强</li>
              <li>响应式设计改进</li>
            </ul>
          </div>
          <div class="version-entry">
            <div class="version-header">版本 1.1.0 (2024-03-31)</div>
            <ul class="version-changes">
              <li>新增标签权重功能</li>
              <li>新增历史记录管理</li>
              <li>改进用户界面交互</li>
              <li>修复多项已知问题</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'InfoPanel',
  setup() {
    const showUpdateLog = ref(false);
    
    const openUpdateLog = () => {
      showUpdateLog.value = true;
    };
    
    const closeUpdateLog = () => {
      showUpdateLog.value = false;
    };
    
    return {
      showUpdateLog,
      openUpdateLog,
      closeUpdateLog
    };
  }
});
</script>

<style scoped>
.panel {
  background-color: var(--panel-bg-color, #fff);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 20px;
  position: relative;
}

.panel h2 {
  color: var(--text-color-dark, #333);
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eaeaea;
}

.info-content {
  color: var(--text-color, #333);
  line-height: 1.6;
}

.info-content p {
  margin-bottom: 15px;
}

.info-section {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border-color-light, #eee);
}

.info-title {
  font-size: 1.2rem;
  margin-bottom: 10px;
  color: var(--text-color-dark, #333);
  font-weight: 600;
}

.info-section h4 {
  font-size: 1rem;
  margin-bottom: 8px;
  margin-top: 16px;
  color: var(--text-color-dark, #333);
}

.info-content h3 {
  font-size: 1.1rem;
  margin: 20px 0 10px 0;
  color: var(--text-color-dark, #333);
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
  border-top: 1px solid var(--border-color-light, #eee);
  font-size: 0.9rem;
  color: var(--text-color-light, #666);
}

.github-link {
  margin-top: 10px;
}

.github-link a {
  color: var(--primary-color, #2196F3);
  text-decoration: none;
}

.github-link a:hover {
  text-decoration: underline;
}

.update-link {
  color: var(--primary-color, #2196F3);
  text-decoration: none;
  cursor: pointer;
}

.update-link:hover {
  text-decoration: underline;
}

/* 更新日志弹窗样式 */
.update-log-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.update-log-content {
  background-color: var(--panel-bg-color, #fff);
  width: 80%;
  max-width: 600px;
  max-height: 80vh;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.update-log-header {
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color-light, #eee);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.update-log-header h3 {
  margin: 0;
  color: var(--text-color-dark, #333);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-color-light, #666);
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--text-color-dark, #333);
}

.update-log-body {
  padding: 20px;
  overflow-y: auto;
  max-height: 60vh;
}

.version-entry {
  margin-bottom: 20px;
}

.version-header {
  font-weight: 600;
  color: var(--primary-color, #2196F3);
  margin-bottom: 8px;
  padding-bottom: 5px;
  border-bottom: 1px dashed var(--border-color-light, #eee);
}

.version-changes {
  padding-left: 20px;
  margin: 10px 0;
}

.version-changes li {
  margin-bottom: 5px;
}

/* 深色模式样式 */
:global(.dark-mode) .panel {
  background-color: var(--panel-bg-color-dark, #2d2d2d);
}

:global(.dark-mode) .panel h2 {
  color: var(--text-color-dark-mode, #e0e0e0);
  border-bottom-color: var(--border-color-dark-mode, #3d3d3d);
}

:global(.dark-mode) .info-content,
:global(.dark-mode) .instruction-list li,
:global(.dark-mode) .feature-list li {
  color: var(--text-color-dark-mode, #e0e0e0);
}

:global(.dark-mode) .info-title,
:global(.dark-mode) .info-section h4,
:global(.dark-mode) .info-content h3 {
  color: var(--text-color-dark-mode, #e0e0e0);
}

:global(.dark-mode) .info-section,
:global(.dark-mode) .version-info {
  border-color: var(--border-color-dark-mode, #3d3d3d);
}

:global(.dark-mode) .github-link a,
:global(.dark-mode) .update-link {
  color: var(--primary-color, #42a5f5);
}

:global(.dark-mode) .update-log-content {
  background-color: var(--panel-bg-color-dark, #2d2d2d);
}

:global(.dark-mode) .update-log-header {
  border-bottom-color: var(--border-color-dark-mode, #3d3d3d);
}

:global(.dark-mode) .update-log-header h3 {
  color: var(--text-color-dark-mode, #e0e0e0);
}

:global(.dark-mode) .close-btn {
  color: var(--text-color-light-dark-mode, #aaa);
}

:global(.dark-mode) .close-btn:hover {
  color: var(--text-color-dark-mode, #e0e0e0);
}

:global(.dark-mode) .version-header {
  color: var(--primary-color, #42a5f5);
  border-bottom-color: var(--border-color-dark-mode, #3d3d3d);
}

:global(.dark-mode) .version-changes li {
  color: var(--text-color-dark-mode, #e0e0e0);
}
</style> 