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
import { defineComponent, ref, computed, watch, inject } from 'vue';

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
    
    // 预览相关状态
    const previewFilter = ref('');
    const previewCategory = ref('all');
    const previewDisplayMode = ref('category');
    const pageSize = ref(20);
    const currentPage = ref(1);
    
    // 计算属性：分类列表
    const categories = computed(() => {
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
    
    return {
      previewFilter,
      previewCategory,
      previewDisplayMode,
      pageSize,
      currentPage,
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
  gap: var(--spacing-md, 15px);
}

.section {
  background-color: var(--panel-bg-color, #fff);
  border-radius: var(--border-radius-lg, 8px);
  box-shadow: var(--shadow-md, 0 1px 3px rgba(0, 0, 0, 0.1));
  padding: var(--spacing-lg, 20px);
  margin-bottom: var(--spacing-sm, 10px);
}

.section h3 {
  font-size: var(--font-size-lg, 1.2rem);
  color: var(--text-color, #333);
  margin-top: 0;
  margin-bottom: var(--spacing-md, 15px);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color, #eee);
}

.info-stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md, 15px);
}

.info-item {
  flex: 1;
  min-width: 150px;
  background-color: var(--bg-color-light, #f5f5f5);
  border-radius: var(--border-radius-sm, 4px);
  padding: 12px 15px;
}

.info-label {
  font-size: var(--font-size-sm, 0.9rem);
  color: var(--text-color-light, #666);
  display: block;
  margin-bottom: 5px;
}

.info-value {
  font-size: var(--font-size-md, 1rem);
  font-weight: 500;
  color: var(--text-color, #333);
}

.filter-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm, 10px);
}

.input-group {
  display: flex;
  gap: 10px;
  width: 100%;
}

.form-control {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: var(--border-radius-sm, 4px);
  font-size: var(--font-size-md, 1rem);
  color: var(--text-color, #333);
  background-color: var(--input-bg-color, #fff);
  transition: border-color 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color, #2196F3);
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.category-select {
  min-width: 150px;
}

.display-options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-lg, 20px);
  padding: var(--spacing-sm, 10px) 0;
}

.option-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.option-group label {
  font-size: var(--font-size-sm, 0.9rem);
  color: var(--text-color, #333);
  white-space: nowrap;
}

.segmented-control {
  display: flex;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  overflow: hidden;
}

.segmented-control button {
  padding: 8px 15px;
  border: none;
  background-color: var(--button-bg-color, #f5f5f5);
  color: var(--text-color, #333);
  cursor: pointer;
  font-size: var(--font-size-sm, 0.9rem);
  transition: all 0.2s;
}

.segmented-control button:hover {
  background-color: var(--button-hover-bg-color, #e5e5e5);
}

.segmented-control button.active {
  background-color: var(--primary-color, #1677ff);
  color: white;
}

.page-size-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: var(--border-radius-sm, 4px);
  font-size: var(--font-size-sm, 0.9rem);
  background-color: var(--input-bg-color, #fff);
  color: var(--text-color, #333);
}

.preview-section {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tag-preview-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.empty-message {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl, 30px);
  color: var(--text-color-light, #666);
  font-style: italic;
  background-color: var(--empty-bg-color, #f9f9f9);
  border-radius: var(--border-radius-sm, 4px);
  height: 200px;
}

.category-block {
  margin-bottom: var(--spacing-xl, 25px);
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm, 10px) 0;
  margin-bottom: var(--spacing-sm, 10px);
  border-bottom: 1px solid var(--border-color-light, #eee);
}

.category-name {
  font-weight: 600;
  color: var(--primary-color, #2196F3);
  font-size: var(--font-size-md, 1.05rem);
}

.category-count {
  font-size: var(--font-size-xs, 0.85rem);
  color: var(--text-color-light, #666);
  background-color: var(--count-bg-color, #f1f1f1);
  padding: 3px 8px;
  border-radius: 12px;
}

.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-item {
  background-color: var(--tag-bg-color, #f5f5f5);
  border-radius: var(--border-radius-md, 6px);
  padding: 10px 15px;
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
  max-width: 100%;
  transition: transform 0.1s;
}

.tag-item:hover {
  transform: translateY(-2px);
}

.tag-content {
  font-weight: 500;
  color: var(--text-color, #333);
  word-break: break-word;
}

.tag-subtitle {
  font-size: var(--font-size-xs, 0.8rem);
  color: var(--text-color-light, #666);
  margin-top: 4px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: var(--spacing-md, 15px);
}

.data-table th, .data-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid var(--border-color-light, #eee);
}

.data-table th {
  background-color: var(--table-header-bg-color, #f5f5f5);
  font-weight: 600;
  color: var(--text-color, #333);
  position: sticky;
  top: 0;
  z-index: 1;
}

.data-table tr:hover {
  background-color: var(--row-hover-bg-color, #f9f9f9);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-md, 15px);
  padding: var(--spacing-xs, 5px);
}

.tag-card {
  border: 1px solid var(--border-color, #eee);
  border-radius: var(--border-radius-lg, 8px);
  padding: var(--spacing-md, 15px);
  background-color: var(--card-bg-color, #fff);
  box-shadow: var(--shadow-sm, 0 2px 4px rgba(0, 0, 0, 0.05));
  transition: transform 0.2s, box-shadow 0.2s;
}

.tag-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md, 0 4px 8px rgba(0, 0, 0, 0.1));
}

.card-category {
  font-size: var(--font-size-xs, 0.85rem);
  color: var(--primary-color, #2196F3);
  margin-bottom: 8px;
}

.card-content {
  font-weight: 600;
  color: var(--text-color, #333);
  margin-bottom: 10px;
  word-break: break-word;
}

.card-subtitle {
  font-size: var(--font-size-xs, 0.8rem);
  color: var(--text-color-light, #666);
  padding-top: 8px;
  border-top: 1px dashed var(--border-color-light, #eee);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: var(--spacing-lg, 20px);
  padding: var(--spacing-md, 15px) 0;
  border-top: 1px solid var(--border-color-light, #eee);
}

.btn {
  padding: 10px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.12);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: var(--disabled-color, #e0e0e0);
}

.pagination-btn {
  margin: 0 5px;
  background-color: var(--button-bg-color, #f5f5f5);
  color: var(--text-color, #333);
  padding: 8px 14px;
}

.page-info {
  margin: 0 15px;
  color: var(--text-color, #333);
  font-weight: 500;
}

.list-view, .card-view {
  overflow-y: auto;
  max-height: 500px;
}

@media (max-width: 768px) {
  .section {
    padding: var(--spacing-md, 15px);
  }
  
  .input-group, .display-options {
    flex-direction: column;
  }
  
  .segmented-control {
    width: 100%;
  }
  
  .segmented-control button {
    flex: 1;
  }
  
  .card-grid {
    grid-template-columns: 1fr;
  }
  
  .pagination {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style> 