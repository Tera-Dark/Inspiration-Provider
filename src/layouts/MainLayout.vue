<template>
  <div class="container">
    <header>
      <h1>灵感提供机 - 分类Tag抽签工具</h1>
      <p class="subtitle">激发创意，打破思维定式</p>
    </header>
    
    <main>
      <slot></slot>
    </main>
    
    <footer>
      <p>灵感提供机 v2.0 | 基于Vue 3重构版本</p>
      <p class="github-link">
        <a href="https://github.com/yourusername/tag-inspiration" target="_blank">
          GitHub 开源项目
        </a>
      </p>
    </footer>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'MainLayout'
});
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px 0;
  border-bottom: 1px solid #eaeaea;
}

header h1 {
  font-size: 2.5rem;
  color: var(--text-color-dark, #333);
  margin-bottom: 10px;
}

.subtitle {
  color: #666;
  margin-top: 0.5rem;
}

footer {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eaeaea;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.github-link {
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.github-link a {
  color: var(--primary-color, #2196F3);
  text-decoration: none;
}

.github-link a:hover {
  text-decoration: underline;
}

.main-heading {
  font-weight: 600;
  color: var(--text-color-dark, #333);
}
</style> 