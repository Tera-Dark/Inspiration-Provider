<template>
  <div class="preview-container">
    <div class="section">
      <h3>库信息</h3>
      <div class="info-stats">
        <div class="info-item">
          <span class="info-label">当前库:</span>
          <span class="info-value">{{ currentLibrary }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">标签总数:</span>
          <span class="info-value">{{ tagCount }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">分类总数:</span>
          <span class="info-value">{{ categoryCount }}</span>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h3>搜索与筛选</h3>
      <div class="filter-container">
        <div class="form-group">
          <div class="input-group">
            <input 
              type="text" 
              v-model="previewFilter" 
              placeholder="搜索标签..." 
              class="form-control"
            />
            <select v-model="previewCategory" class="form-control category-select">
              <option value="all">全部分类</option>
              <option v-for="category in categories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </div>
        </div>
        
        <div class="display-options">
          <div class="option-group">
            <label>显示模式:</label>
            <div class="segmented-control">
              <button 
                :class="{ active: previewDisplayMode === 'category' }" 
                @click="previewDisplayMode = 'category'"
              >按分类</button>
              <button 
                :class="{ active: previewDisplayMode === 'list' }" 
                @click="previewDisplayMode = 'list'"
              >列表</button>
              <button 
                :class="{ active: previewDisplayMode === 'card' }" 
                @click="previewDisplayMode = 'card'"
              >卡片</button>
            </div>
          </div>
          
          <div class="option-group">
            <label>每页显示:</label>
            <select v-model="pageSize" class="page-size-select">
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
              <option :value="200">200</option>
              <option :value="500">500</option>
            </select>
          </div>
        </div>
      </div>
    </div>
    
    <div class="section preview-section">
      <h3>标签预览</h3>
      <div class="tag-preview-container">
        <div v-if="filteredPreviewTags.length === 0" class="empty-message">
          没有找到匹配的标签
        </div>
        
        <!-- 按分类显示模式 -->
        <template v-else-if="previewDisplayMode === 'category'">
          <div v-for="(tags, category) in paginatedGroupedTags" :key="category" class="category-block">
            <div class="category-header">
              <span class="category-name">{{ category }}</span>
              <span class="category-count">{{ tags.length }} 个标签</span>
            </div>
            <div class="tag-grid">
              <div 
                v-for="tag in tags" 
                :key="`${category}-${tag.content}`"
                class="tag-item"
              >
                <div class="tag-content">{{ tag.content }}</div>
                <div v-if="tag.subTitles && tag.subTitles.length > 0" class="tag-subtitle">
                  {{ tag.subTitles.join(' / ') }}
                </div>
              </div>
            </div>
          </div>
        </template>
        
        <!-- 列表显示模式 -->
        <div v-else-if="previewDisplayMode === 'list'" class="list-view">
          <table class="data-table">
            <thead>
              <tr>
                <th>分类</th>
                <th>标签</th>
                <th>子标题</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(tag, index) in paginatedTags" :key="index">
                <td>{{ tag.category }}</td>
                <td>{{ tag.content }}</td>
                <td>{{ tag.subTitles ? tag.subTitles.join(' / ') : '' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- 卡片显示模式 -->
        <div v-else class="card-view">
          <div class="card-grid">
            <div 
              v-for="(tag, index) in paginatedTags" 
              :key="index"
              class="tag-card"
            >
              <div class="card-category">{{ tag.category }}</div>
              <div class="card-content">{{ tag.content }}</div>
              <div v-if="tag.subTitles && tag.subTitles.length > 0" class="card-subtitle">
                {{ tag.subTitles.join(' / ') }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- 分页控件 -->
        <div v-if="filteredPreviewTags.length > 0" class="pagination">
          <button 
            class="btn pagination-btn" 
            @click="currentPage = 1" 
            :disabled="currentPage === 1"
          >首页</button>
          <button 
            class="btn pagination-btn" 
            @click="currentPage--" 
            :disabled="currentPage === 1"
          >上一页</button>
          <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
          <button 
            class="btn pagination-btn" 
            @click="currentPage++" 
            :disabled="currentPage === totalPages"
          >下一页</button>
          <button 
            class="btn pagination-btn" 
            @click="currentPage = totalPages" 
            :disabled="currentPage === totalPages"
          >末页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, inject, onMounted, onUnmounted } from 'vue';

export default defineComponent({
  name: 'PreviewPanel',
  props: {
    currentLibrary: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const tagLibrary = inject('tagLibrary');
    const emitter = inject('emitter');
    
    // 预览相关状态
    const previewFilter = ref('');
    const previewCategory = ref('all');
    const previewDisplayMode = ref('category');
    const pageSize = ref(20);
    const currentPage = ref(1);
    const refreshTrigger = ref(0);
    
    // 计算属性：分类列表
    const categories = computed(() => {
      // 使用refreshTrigger强制重新计算
      refreshTrigger.value;
      try {
        // 先尝试使用获取指定库分类的方法
        if (tagLibrary.getCategories) {
          const cats = tagLibrary.getCategories(props.currentLibrary);
          if (Array.isArray(cats)) return cats;
        }
        
        // 后备：直接从库对象中提取分类
        const library = tagLibrary.getLibrary(props.currentLibrary);
        return library ? Object.keys(library) : [];
      } catch (error) {
        console.error('获取分类失败:', error);
        return [];
      }
    });
    
    // 计算属性：标签总数
    const tagCount = computed(() => {
      // 使用refreshTrigger强制重新计算
      refreshTrigger.value;
      try {
        // 先尝试使用获取指定库标签数量的方法
        if (tagLibrary.getTagCountByLibrary) {
          return tagLibrary.getTagCountByLibrary(props.currentLibrary);
        } 
        
        // 尝试通过获取所有标签计算
        if (tagLibrary.getAllTags) {
          const tags = tagLibrary.getAllTags(props.currentLibrary);
          return Array.isArray(tags) ? tags.length : 0;
        }
        
        // 后备：手动计算标签数量
        const library = tagLibrary.getLibrary(props.currentLibrary);
        if (!library) return 0;
        
        let count = 0;
        for (const category in library) {
          if (Array.isArray(library[category])) {
            count += library[category].length;
          }
        }
        return count;
      } catch (error) {
        console.error('获取标签总数失败:', error);
        return 0;
      }
    });
    
    // 计算属性：分类总数
    const categoryCount = computed(() => {
      return categories.value.length;
    });
    
    // 筛选后的标签
    const filteredPreviewTags = computed(() => {
      // 使用refreshTrigger强制重新计算
      refreshTrigger.value;
      try {
        // 获取所有标签
        let allTags = [];
        
        if (tagLibrary.getAllTags) {
          // 使用现有的API获取所有标签
          allTags = tagLibrary.getAllTags(props.currentLibrary);
        } else {
          // 后备方案：手动构造标签列表
          const library = tagLibrary.getLibrary(props.currentLibrary);
          if (!library) return [];
          
          // 将每个分类的标签添加到列表中，附加分类信息
          for (const category in library) {
            if (!Array.isArray(library[category])) continue;
            
            allTags = allTags.concat(
              library[category].map(tag => {
                if (typeof tag === 'string') {
                  return { category, content: tag };
                } else {
                  return { 
                    category, 
                    content: tag.content || '',
                    subTitles: tag.subTitles || [] 
                  };
                }
              })
            );
          }
        }
        
        // 确保所有标签都包含必要的字段
        allTags = allTags.map(tag => ({
          category: tag.category || '',
          content: tag.content || '',
          subTitles: Array.isArray(tag.subTitles) ? tag.subTitles : []
        }));
        
        // 应用筛选条件
        return allTags.filter(tag => {
          // 分类筛选
          if (previewCategory.value !== 'all' && tag.category !== previewCategory.value) {
            return false;
          }
          
          // 关键词筛选
          if (previewFilter.value) {
            const filter = previewFilter.value.toLowerCase();
            const content = (tag.content || '').toLowerCase();
            const subTitles = (tag.subTitles || []).join(' ').toLowerCase();
            
            return content.includes(filter) || subTitles.includes(filter);
          }
          
          return true;
        });
      } catch (error) {
        console.error('处理标签数据失败:', error);
        return [];
      }
    });
    
    // 计算总页数
    const totalPages = computed(() => {
      return Math.max(1, Math.ceil(filteredPreviewTags.value.length / pageSize.value));
    });
    
    // 列表/卡片模式下的分页标签
    const paginatedTags = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      return filteredPreviewTags.value.slice(start, end);
    });
    
    // 分类模式下按分类分组的标签
    const groupedTags = computed(() => {
      const grouped = {};
      
      filteredPreviewTags.value.forEach(tag => {
        if (!grouped[tag.category]) {
          grouped[tag.category] = [];
        }
        grouped[tag.category].push(tag);
      });
      
      return grouped;
    });
    
    // 分类模式下分页后的分组标签
    const paginatedGroupedTags = computed(() => {
      const result = {};
      let count = 0;
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      
      // 遍历所有分类
      for (const category in groupedTags.value) {
        const tags = groupedTags.value[category];
        
        // 如果当前总数已经超过了结束位置，不再继续处理
        if (count >= end) break;
        
        // 如果添加当前分类的所有标签后会超过开始位置
        if (count + tags.length > start) {
          // 计算应该添加的标签数量
          const startOffset = Math.max(0, start - count);
          const endOffset = Math.min(tags.length, end - count);
          
          // 添加指定范围的标签
          result[category] = tags.slice(startOffset, endOffset);
        }
        
        // 更新计数
        count += tags.length;
      }
      
      return result;
    });
    
    // 监听过滤条件变化，重置分页
    watch([previewFilter, previewCategory, previewDisplayMode], () => {
      currentPage.value = 1;
    });
    
    // 监听当前库变化，重置分页和过滤条件
    watch(() => props.currentLibrary, () => {
      currentPage.value = 1;
      previewFilter.value = '';
      previewCategory.value = 'all';
    });
    
    // 添加刷新数据的方法
    const refreshData = () => {
      // 递增刷新触发器，强制计算属性重新计算
      refreshTrigger.value++;
      // 重置到第一页，确保用户看到最新的数据
      currentPage.value = 1;
    };
    
    // 监听标签库更新事件
    onMounted(() => {
      // 监听全局标签库更新事件
      emitter.on('tagLibraryUpdated', refreshData);
    });
    
    // 组件卸载时移除事件监听
    onUnmounted(() => {
      emitter.off('tagLibraryUpdated', refreshData);
    });
    
    return {
      previewFilter,
      previewCategory,
      previewDisplayMode,
      pageSize,
      currentPage,
      refreshTrigger,
      categories,
      tagCount,
      categoryCount,
      filteredPreviewTags,
      totalPages,
      paginatedTags,
      paginatedGroupedTags
    };
  }
});
</script>

<style scoped>
.preview-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section {
  background-color: var(--section-bg-color, #f9f9f9);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.section h3 {
  padding: 12px 16px;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-color, #333);
  border-bottom: 1px solid var(--border-color-light, #eee);
  background-color: var(--section-header-bg, rgba(0, 0, 0, 0.02));
}

.info-stats {
  padding: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-weight: 500;
  color: var(--text-color-light, #666);
}

.info-value {
  font-weight: 600;
  color: var(--text-color, #333);
}

.filter-container {
  padding: 16px;
}

.form-group {
  margin-bottom: 15px;
}

.input-group {
  display: flex;
  gap: 10px;
}

.form-control {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  background-color: var(--input-bg-color, #fff);
  color: var(--text-color, #333);
  font-size: 0.9rem;
  transition: all 0.3s;
}

.form-control:focus {
  border-color: var(--primary-color, #1677ff);
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
  outline: none;
}

.category-select {
  width: auto;
  min-width: 120px;
}

.display-options {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
  justify-content: space-between;
}

.option-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.option-group label {
  font-weight: 500;
  white-space: nowrap;
  color: var(--text-color, #333);
}

.segmented-control {
  display: flex;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  overflow: hidden;
}

.segmented-control button {
  padding: 8px 14px;
  border: none;
  background: none;
  border-right: 1px solid var(--border-color, #ddd);
  color: var(--text-color, #333);
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.segmented-control button:last-child {
  border-right: none;
}

.segmented-control button:hover:not(.active) {
  background-color: var(--hover-bg-color, rgba(0, 0, 0, 0.03));
}

.segmented-control button.active {
  background-color: var(--primary-color, #1677ff);
  color: white;
}

.page-size-select {
  padding: 6px 10px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  background-color: var(--input-bg-color, #fff);
  color: var(--text-color, #333);
}

.preview-section {
  margin-bottom: 20px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.tag-preview-container {
  padding: 0;
  overflow: hidden;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.empty-message {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
  font-size: 1.1rem;
  color: var(--text-color-light, #666);
  text-align: center;
  background-color: rgba(0, 0, 0, 0.02);
  margin: 16px;
  border-radius: 8px;
}

.empty-message::before {
  content: '🔍';
  font-size: 1.5rem;
  margin-right: 8px;
  opacity: 0.7;
}

.category-block {
  margin-bottom: 24px;
  background-color: var(--card-bg-color, #fff);
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background-color: var(--primary-bg-light, rgba(0, 0, 0, 0.02));
  border-bottom: 1px solid var(--border-color-light, #eee);
}

.category-name {
  font-weight: 600;
  color: var(--text-color, #333);
  font-size: 1.05rem;
  display: flex;
  align-items: center;
}

.category-name::before {
  content: '📂';
  margin-right: 8px;
  font-size: 1.1rem;
}

.category-count {
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
  background-color: var(--tag-bg-color, #f0f0f0);
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 500;
}

.tag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  padding: 16px;
}

.tag-item {
  background-color: var(--card-bg-color, #fff);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tag-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

.tag-content {
  font-weight: 500;
  color: var(--text-color, #333);
  margin-bottom: 6px;
  word-break: break-word;
  overflow-wrap: break-word;
  line-height: 1.4;
}

.tag-subtitle {
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
  word-break: break-word;
  overflow-wrap: break-word;
  line-height: 1.3;
}

.list-view {
  overflow-x: auto;
  padding: 5px 16px 16px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.data-table th {
  text-align: left;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color, #ddd);
  font-weight: 600;
  color: var(--text-color, #333);
  background-color: var(--table-header-bg, rgba(0, 0, 0, 0.02));
}

.data-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color-light, #eee);
  color: var(--text-color, #333);
  vertical-align: top;
  word-break: break-word;
  overflow-wrap: break-word;
  line-height: 1.4;
}

.data-table th:nth-child(1),
.data-table td:nth-child(1) {
  width: 20%;
}

.data-table th:nth-child(2),
.data-table td:nth-child(2) {
  width: 35%;
}

.data-table th:nth-child(3),
.data-table td:nth-child(3) {
  width: 45%;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 16px;
}

.tag-card {
  background-color: var(--card-bg-color, #fff);
  border-radius: 8px;
  padding: 18px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  transition: all 0.2s;
  height: 100%;
  overflow: hidden;
}

.tag-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.card-category {
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color-light, #eee);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-content {
  font-weight: 500;
  color: var(--text-color, #333);
  margin-bottom: 10px;
  font-size: 1.05rem;
  word-break: break-word;
  overflow-wrap: break-word;
  line-height: 1.4;
  flex: 1;
}

.card-subtitle {
  font-size: 0.85rem;
  color: var(--text-color-light, #666);
  word-break: break-word;
  overflow-wrap: break-word;
  line-height: 1.3;
  max-height: 4em;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color-light, #eee);
}

.pagination-btn {
  background-color: var(--secondary-bg-color, #f0f0f0);
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  padding: 6px 12px;
  color: var(--text-color, #333);
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background-color: var(--secondary-hover-color, #e6e6e6);
  transform: translateY(-1px);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: var(--text-color, #333);
  font-weight: 500;
  min-width: 60px;
  text-align: center;
}

/* 暗模式适配 */
@media (prefers-color-scheme: dark) {
  .section {
    background-color: var(--section-bg-color-dark, #252525);
  }
  
  .section h3 {
    color: var(--text-color-dark, #eee);
    border-bottom-color: var(--border-color-dark, #333);
    background-color: var(--section-header-bg-dark, rgba(255, 255, 255, 0.03));
  }
  
  .info-label {
    color: var(--text-color-light-dark, #aaa);
  }
  
  .info-value {
    color: var(--text-color-dark, #eee);
  }
  
  .form-control, .page-size-select {
    background-color: var(--input-bg-color-dark, #333);
    border-color: var(--border-color-dark, #444);
    color: var(--text-color-dark, #eee);
  }
  
  .form-control:focus {
    border-color: var(--primary-color, #1677ff);
    box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2);
  }
  
  .segmented-control {
    border-color: var(--border-color-dark, #444);
  }
  
  .segmented-control button {
    color: var(--text-color-dark, #eee);
    border-right-color: var(--border-color-dark, #444);
  }
  
  .segmented-control button:hover:not(.active) {
    background-color: var(--hover-bg-color-dark, rgba(255, 255, 255, 0.05));
  }
  
  .empty-message {
    color: var(--text-color-light-dark, #aaa);
    background-color: rgba(255, 255, 255, 0.03);
  }
  
  .category-header {
    border-bottom-color: var(--border-color-dark, #333);
  }
  
  .category-name {
    color: var(--text-color-dark, #eee);
  }
  
  .category-count {
    color: var(--text-color-dark, #eee);
    background-color: var(--tag-bg-color-dark, #3a3a3a);
  }
  
  .tag-item {
    background-color: var(--card-bg-color-dark, #2a2a2a);
  }
  
  .tag-content, .card-content {
    color: var(--text-color-dark, #eee);
  }
  
  .tag-subtitle, .card-subtitle, .card-category {
    color: var(--text-color-light-dark, #aaa);
  }
  
  .data-table th {
    color: var(--text-color-dark, #eee);
    border-bottom-color: var(--border-color-dark, #444);
    background-color: var(--table-header-bg-dark, rgba(255, 255, 255, 0.05));
  }
  
  .data-table td {
    color: var(--text-color-dark, #eee);
    border-bottom-color: var(--border-color-dark, #333);
  }
  
  .tag-card {
    background-color: var(--card-bg-color-dark, #2a2a2a);
  }
  
  .card-category {
    border-bottom-color: var(--border-color-dark, #333);
  }
  
  .pagination {
    border-top-color: var(--border-color-dark, #333);
  }
  
  .pagination-btn {
    background-color: var(--secondary-bg-color-dark, #2c2c2c);
    color: var(--text-color-dark, #eee);
    border-color: var(--border-color-dark, #444);
  }
  
  .pagination-btn:hover:not(:disabled) {
    background-color: var(--secondary-hover-color-dark, #3c3c3c);
  }
  
  .page-info {
    color: var(--text-color-dark, #eee);
  }
  
  :global(.dark-mode) .category-block {
    background-color: var(--bg-color-dark, #1e1e1e);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  }
  
  :global(.dark-mode) .category-header {
    background-color: var(--section-header-bg-dark, rgba(255, 255, 255, 0.03));
    border-bottom-color: var(--border-color-dark, #333);
  }
  
  :global(.dark-mode) .category-name {
    color: var(--text-color-dark, #eee);
  }
  
  :global(.dark-mode) .tag-grid {
    background-color: var(--bg-color-dark, #1e1e1e);
  }
  
  :global(.dark-mode) .card-content,
  :global(.dark-mode) .tag-content {
    color: var(--text-color-dark, #eee);
  }
  
  :global(.dark-mode) .card-subtitle,
  :global(.dark-mode) .tag-subtitle {
    color: var(--text-color-light-dark, #aaa);
  }
  
  :global(.dark-mode) .empty-message {
    color: var(--text-color-light-dark, #888);
    background-color: rgba(255, 255, 255, 0.03);
  }
}

@media (max-width: 768px) {
  .display-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .option-group {
    width: 100%;
    justify-content: space-between;
  }
  
  .segmented-control {
    flex-grow: 1;
    justify-content: space-between;
  }
  
  .segmented-control button {
    flex: 1;
    padding: 6px 8px;
    text-align: center;
  }
}
</style> 