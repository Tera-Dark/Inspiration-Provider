<template>
  <div class="weight-adder">
    <div class="weight-adder-content">
      <!-- 控制面板 -->
      <div class="control-panel" :class="{ 'mobile': isMobile }">
        <div class="panel-header">
          <h3 class="panel-title">权重设置</h3>
        </div>
        
        <div class="form-content">
          <!-- Tag输入分割功能 -->
          <div class="section">
            <h3>Tag输入与分割</h3>
            <textarea 
              class="tag-input" 
              v-model="tagInput" 
              placeholder="输入Tags，系统将自动分割中英文，并添加随机权重..."
              rows="4"
            ></textarea>
            <div class="tag-input-actions">
              <button @click="processTagInput" class="secondary-button">
                <span class="button-icon">✂️</span> 分割并添加权重
              </button>
              <button @click="clearTagInput" class="small-button">
                清空
              </button>
            </div>
          </div>

          <!-- 库选择功能 -->
          <div class="section">
            <h3>选择库</h3>
            <div class="library-bar">
              <div class="library-selector">
                <label>选择库:</label>
                <library-selector @library-changed="handleLibraryChange" />
              </div>
              <!-- 库快速选择区 -->
              <div class="library-quick-select" v-if="recentLibraries.length">
                <div class="recent-chips">
                  <button 
                    v-for="library in recentLibraries" 
                    :key="library" 
                    @click="selectLibrary(library)"
                    class="library-chip"
                    :class="{ 'active': selectedLibrary === library }"
                  >
                    {{ library }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 最小Tag数量 -->
          <div class="section">
            <h3>最小Tag数量</h3>
            <div class="number-control">
              <button 
                class="control-btn" 
                @click="decreaseMinCount" 
                :disabled="minCount <= 1"
              >-</button>
              <span class="number">{{ minCount }}</span>
              <button 
                class="control-btn" 
                @click="increaseMinCount" 
                :disabled="minCount >= maxCount || minCount >= 99"
              >+</button>
            </div>
          </div>

          <!-- 最大Tag数量 -->
          <div class="section">
            <h3>最大Tag数量</h3>
            <div class="number-control">
              <button 
                class="control-btn" 
                @click="decreaseMaxCount" 
                :disabled="maxCount <= minCount || maxCount <= 1"
              >-</button>
              <span class="number">{{ maxCount }}</span>
              <button 
                class="control-btn" 
                @click="increaseMaxCount" 
                :disabled="maxCount >= 99"
              >+</button>
            </div>
          </div>

          <!-- 最小权重范围 -->
          <div class="section">
            <h3>最小权重范围（{{ minWeight }}）</h3>
            <div class="slider-container">
              <input 
                type="range" 
                min="0.1" 
                max="1" 
                step="0.1" 
                v-model="minWeight"
                class="slider"
              />
              <span class="slider-value">{{ minWeight }}</span>
            </div>
          </div>

          <!-- 最大权重范围 -->
          <div class="section">
            <h3>最大权重范围（{{ maxWeight }}）</h3>
            <div class="slider-container">
              <input 
                type="range" 
                min="1" 
                max="2" 
                step="0.1" 
                v-model="maxWeight"
                class="slider"
              />
              <span class="slider-value">{{ maxWeight }}</span>
            </div>
          </div>

          <!-- 高级设置 -->
          <div class="section">
            <h3>高级设置</h3>
            <div class="advanced-content">
              <div class="advanced-item">
                <label>排除关键词</label>
                <input 
                  type="text" 
                  v-model="excludeKeywords" 
                  placeholder="输入画师关键词，用逗号分隔"
                  class="form-input"
                />
              </div>
              
              <div class="advanced-item checkbox">
                <input type="checkbox" id="avoidDuplicates" v-model="avoidDuplicates" />
                <label for="avoidDuplicates">避免重复画师</label>
              </div>
              
              <div class="advanced-item checkbox">
                <input type="checkbox" id="fixedWeight" v-model="fixedWeight" />
                <label for="fixedWeight">使用固定权重</label>
              </div>

              <div class="advanced-item" v-if="fixedWeight">
                <label>固定权重值</label>
                <div class="slider-container">
                  <input 
                    type="range" 
                    min="0.1" 
                    max="2" 
                    step="0.1" 
                    v-model="fixedWeightValue" 
                    class="slider" 
                  />
                  <span class="slider-value">{{ fixedWeightValue }}</span>
                </div>
              </div>

              <div class="advanced-item">
                <label>权重添加频率（{{ weightFrequency }}%）</label>
                <div class="slider-container">
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    step="10" 
                    v-model="weightFrequency" 
                    class="slider" 
                  />
                  <span class="slider-value">{{ weightFrequency }}%</span>
                </div>
                <div class="setting-description">设置每个标签添加权重的概率，100%表示全部添加，10%表示每个标签有10%的概率添加权重</div>
              </div>

              <div class="advanced-item checkbox">
                <input type="checkbox" id="useCustomFormat" v-model="useCustomFormat" />
                <label for="useCustomFormat">使用自定义格式</label>
              </div>

              <div class="advanced-item" v-if="useCustomFormat">
                <label>自定义格式</label>
                <select v-model="customFormat" class="form-select">
                  <option value="brackets">(artist:weight)</option>
                  <option value="colon">artist:weight</option>
                  <option value="space">artist weight</option>
                  <option value="only">artist</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 按钮区 -->
          <div class="button-group">
            <button @click="generateArtists" class="primary-button" :disabled="isGenerating">
              <span v-if="isGenerating" class="button-spinner"></span>
              <span v-else class="button-icon">🎲</span>
              {{ isGenerating ? '生成中...' : '生成' }}
            </button>
            <button @click="copyToClipboard" class="secondary-button" :disabled="!result">
              <span class="button-icon">📋</span> 复制
            </button>
            <button @click="showArtistLibrary" class="accent-button" :disabled="isLoadingArtists">
              <span v-if="isLoadingArtists" class="button-spinner"></span>
              <span v-else class="button-icon">🎨</span>
              {{ isLoadingArtists ? '加载中...' : '画师库' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 结果面板 -->
      <div class="result-panel" :class="{ 'mobile': isMobile }">
        <div class="panel-header">
          <h3 class="panel-title">生成结果</h3>
          <div class="panel-actions" v-if="result">
            <button @click="clearResult" class="action-button" title="清空结果">
              <span class="action-icon">🗑️</span>
            </button>
          </div>
        </div>
        <div class="result-content" :class="{ 'empty': !result }">
          <template v-if="result">{{ result }}</template>
          <div v-else class="empty-result">
            <span>点击"生成"按钮生成画师权重组合</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 画师库模态框 -->
    <div class="modal" v-if="showModal" @click.self="closeModal">
      <div class="modal-content" :class="{ 'mobile': isMobile }">
        <div class="modal-header">
          <h2>画师库 - {{ selectedLibrary }}</h2>
          <div class="modal-actions">
            <span class="artist-count" v-if="filteredArtists.length">共 {{ filteredArtists.length }} 个画师</span>
            <button class="close-button" @click="closeModal" title="关闭">×</button>
          </div>
        </div>
        
        <!-- 库选择区域 -->
        <div class="library-bar">
          <div class="library-selector">
            <label>选择库:</label>
            <select v-model="selectedLibrary" class="modal-select" @change="handleLibraryChange">
              <option v-for="library in availableLibraries" :key="library" :value="library">
                {{ library }}
              </option>
            </select>
          </div>
          <!-- 库快速选择区 -->
          <div class="library-quick-select" v-if="recentLibraries.length">
            <div class="recent-chips">
              <button 
                v-for="library in recentLibraries" 
                :key="library" 
                @click="selectLibrary(library)"
                class="library-chip"
                :class="{ 'active': selectedLibrary === library }"
              >
                {{ library }}
              </button>
            </div>
          </div>
        </div>
        
        <div class="search-container">
          <input 
            type="text" 
            class="search-input" 
            placeholder="搜索画师..." 
            v-model="searchQuery"
          >
          <span class="search-icon">🔍</span>
        </div>
        <div class="modal-body" ref="artistListContainer">
          <template v-if="filteredArtists.length">
            <span 
              v-for="(artist, index) in filteredArtists" 
              :key="index" 
              class="artist-item"
              @click="addArtistToResult(artist)"
            >
              {{ artist }}
            </span>
          </template>
          <div v-else-if="isLoadingArtists || isLoadingLibrary" class="empty-artists">
            <div class="loading-spinner"></div>
            <span>加载中...</span>
          </div>
          <div v-else class="empty-artists">
            <span v-if="searchQuery">未找到匹配"{{ searchQuery }}"的画师</span>
            <span v-else>画师库为空或正在加载中...</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onBeforeUnmount, nextTick, inject } from 'vue';
import LibrarySelector from '../../common/LibrarySelector.vue';

export default defineComponent({
  name: 'WeightAdder',
  components: {
    LibrarySelector
  },
  setup() {
    const tagLibrary = inject('tagLibrary');
    const emitter = inject('emitter');
    
    // 状态变量
    const minCount = ref(1);
    const maxCount = ref(3);
    const minWeight = ref(0.5);
    const maxWeight = ref(1.5);
    const result = ref('');
    const showModal = ref(false);
    const searchQuery = ref('');
    const artists = ref([]);
    const isGenerating = ref(false);
    const isLoadingArtists = ref(true);
    const excludeKeywords = ref('');
    const avoidDuplicates = ref(false);
    const fixedWeight = ref(false);
    const fixedWeightValue = ref(1.0);
    const useCustomFormat = ref(false);
    const customFormat = ref('brackets');
    const artistListContainer = ref(null);
    const isMobile = ref(window.innerWidth <= 768);
    const tagInput = ref('');
    const selectedLibrary = ref('');
    const isLoadingLibrary = ref(false);
    const weightFrequency = ref(50);
    
    // 可用的库列表
    const availableLibraries = ref([
      '默认库', 
      'Stable Diffusion画师', 
      'Midjourney风格',
      'NovelAI标签',
      '常用特效标签'
    ]);
    
    // 最近使用的库列表
    const recentLibraries = computed(() => {
      const recent = localStorage.getItem('recent_libraries');
      try {
        if (recent) {
          // 过滤掉当前选中的库，只显示最近的3个
          return JSON.parse(recent)
            .filter(lib => lib !== selectedLibrary.value)
            .slice(0, 3);
        }
      } catch (error) {
        console.error('解析最近使用的库时出错:', error);
      }
      return [];
    });

    // 过滤后的艺术家列表
    const filteredArtists = computed(() => {
      if (!searchQuery.value) return artists.value;
      const query = searchQuery.value.toLowerCase();
      return artists.value.filter(artist => 
        artist.toLowerCase().includes(query)
      );
    });

    // 加载画师数据
    const loadArtists = async (libraryName) => {
      try {
        isLoadingArtists.value = true;
        
        // 如果提供了库名，则加载指定库的画师
        if (libraryName && tagLibrary) {
          console.log(`从标签库加载: ${libraryName}`);
          // 使用注入的标签库服务加载数据
          const tags = await tagLibrary.getAllTags(libraryName);
          console.log('加载到的标签:', tags); // 添加调试日志
          
          // 处理标签数据，确保统一格式
          artists.value = tags.map(tag => {
            // 如果是字符串，直接返回
            if (typeof tag === 'string') {
              return tag;
            }
            // 如果是对象，提取content字段
            if (typeof tag === 'object' && tag !== null) {
              return tag.content || '';
            }
            return '';
          }).filter(tag => tag); // 过滤掉空字符串
          
          console.log('处理后的画师列表:', artists.value); // 添加调试日志
        } else {
          // 回退到本地JSON加载
          console.log('从本地JSON加载画师库');
          const artistsData = await fetch('/public/artists.json')
            .then(response => {
              if (!response.ok) throw new Error('无法加载画师库');
              return response.json();
            });
          
          if (artistsData && artistsData.画师画风) {
            artists.value = artistsData.画师画风.map(item => item.content);
            console.log('从本地JSON加载的画师列表:', artists.value); // 添加调试日志
          } else {
            console.error('画师数据格式不正确');
            throw new Error('画师数据格式不正确');
          }
        }
      } catch (error) {
        console.error('加载画师数据失败:', error);
        artists.value = []; // 如果加载失败，使用空数组
        emitter.emit('notification', {
          type: 'error',
          message: `加载画师数据失败: ${error.message}`
        });
      } finally {
        isLoadingArtists.value = false;
      }
    };

    // 最小数量加减控制
    const decreaseMinCount = () => {
      if (minCount.value > 1) {
        minCount.value--;
      }
    };

    const increaseMinCount = () => {
      if (minCount.value < maxCount.value && minCount.value < 99) {
        minCount.value++;
      }
    };

    // 最大数量加减控制
    const decreaseMaxCount = () => {
      if (maxCount.value > minCount.value && maxCount.value > 1) {
        maxCount.value--;
      }
    };

    const increaseMaxCount = () => {
      if (maxCount.value < 99) {
        maxCount.value++;
      }
    };

    // 生成画师字符串
    const generateArtists = async () => {
      if (artists.value.length === 0) {
        alert('画师库尚未加载完成，请稍后再试。');
        return;
      }

      try {
        isGenerating.value = true;
        
        // 模拟一些处理时间，增强用户体验
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const count = Math.floor(Math.random() * (maxCount.value - minCount.value + 1)) + Number(minCount.value);
        const selectedArtists = [];
        
        // 处理排除关键词
        let excludeList = [];
        if (excludeKeywords.value.trim()) {
          excludeList = excludeKeywords.value.split(',').map(kw => kw.trim().toLowerCase());
        }
        
        // 过滤后的画师列表（排除包含关键词的画师）
        const filteredArtistPool = excludeList.length > 0
          ? artists.value.filter(artist => 
              !excludeList.some(keyword => artist.toLowerCase().includes(keyword))
            )
          : artists.value;
        
        if (filteredArtistPool.length === 0) {
          throw new Error('排除关键词后没有可用的画师，请调整排除条件');
        }
        
        // 避免重复
        const usedIndices = new Set();
        const maxAttempts = 20; // 最大尝试次数，防止无限循环
        
        for (let i = 0; i < count; i++) {
          let artist;
          let randomIndex;
          let attempts = 0;
          
          // 尝试获取不重复的画师
          do {
            randomIndex = Math.floor(Math.random() * filteredArtistPool.length);
            artist = filteredArtistPool[randomIndex];
            attempts++;
            
            // 如果尝试次数太多，就不再坚持避免重复
            if (attempts >= maxAttempts) {
              console.warn('尝试获取不重复画师失败，可能是画师库太小或排除条件太严格');
              break;
            }
          } while (avoidDuplicates.value && usedIndices.has(randomIndex) && attempts < maxAttempts);
          
          usedIndices.add(randomIndex);
          
          // 根据权重频率决定是否添加权重
          const shouldAddWeight = Math.random() * 100 <= weightFrequency.value;
          
          if (!shouldAddWeight) {
            selectedArtists.push(artist);
            continue;
          }
          
          // 根据设置决定权重
          let weight;
          if (fixedWeight.value) {
            weight = fixedWeightValue.value.toFixed(1);
          } else {
            weight = (Math.random() * (maxWeight.value - minWeight.value) + Number(minWeight.value)).toFixed(1);
          }
          
          // 根据自定义格式设置
          let formattedArtist;
          if (useCustomFormat.value) {
            switch (customFormat.value) {
              case 'colon':
                formattedArtist = `${artist}:${weight}`;
                break;
              case 'space':
                formattedArtist = `${artist} ${weight}`;
                break;
              case 'only':
                formattedArtist = artist;
                break;
              case 'brackets':
              default:
                formattedArtist = `(${artist}:${weight})`;
                break;
            }
          } else {
            formattedArtist = `(${artist}:${weight})`;
          }
          
          selectedArtists.push(formattedArtist);
        }

        result.value = selectedArtists.join(', ');
        console.log('生成结果:', result.value); // 添加调试日志
        
        // 在生成结果后自动滚动到结果区域
        nextTick(() => {
          const resultPanel = document.querySelector('.result-panel');
          if (resultPanel) {
            resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
      } catch (error) {
        console.error('生成画师权重时出错:', error);
        alert('生成失败: ' + (error.message || '未知错误'));
      } finally {
        isGenerating.value = false;
      }
    };

    // 复制结果到剪贴板
    const copyToClipboard = () => {
      if (!result.value) {
        alert('没有生成任何内容可供复制');
        return;
      }

      navigator.clipboard.writeText(result.value)
        .then(() => alert('结果已复制到剪贴板'))
        .catch(err => {
          console.error('复制失败:', err);
          alert('复制失败，请手动复制。');
        });
    };

    // 清空结果
    const clearResult = () => {
      result.value = '';
    };

    // 显示画师库
    const showArtistLibrary = () => {
      if (artists.value.length === 0 && !isLoadingArtists.value) {
        alert('画师列表为空，请重新加载页面尝试。');
        return;
      }
      showModal.value = true;
    };

    // 关闭画师库
    const closeModal = () => {
      showModal.value = false;
      searchQuery.value = '';
    };

    // 添加画师到结果
    const addArtistToResult = (artist) => {
      // 根据设置决定权重
      let weight;
      if (fixedWeight.value) {
        weight = fixedWeightValue.value.toFixed(1);
      } else {
        weight = (Math.random() * (maxWeight.value - minWeight.value) + Number(minWeight.value)).toFixed(1);
      }
      
      // 根据自定义格式设置
      let formattedArtist;
      if (useCustomFormat.value) {
        switch (customFormat.value) {
          case 'colon':
            formattedArtist = `${artist}:${weight}`;
            break;
          case 'space':
            formattedArtist = `${artist} ${weight}`;
            break;
          case 'only':
            formattedArtist = artist;
            break;
          case 'brackets':
          default:
            formattedArtist = `(${artist}:${weight})`;
            break;
        }
      } else {
        formattedArtist = `(${artist}:${weight})`;
      }
      
      if (result.value) {
        result.value += ', ' + formattedArtist;
      } else {
        result.value = formattedArtist;
      }
      
      // 关闭模态框并滚动到结果区域
      closeModal();
      nextTick(() => {
        const resultPanel = document.querySelector('.result-panel');
        if (resultPanel) {
          resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    };

    // 监听窗口大小变化
    const handleResize = () => {
      isMobile.value = window.innerWidth <= 768;
    };
    
    // 组件挂载时初始化
    onMounted(() => {
      // 获取当前库
      if (tagLibrary && tagLibrary.getCurrentLibraryName) {
        const currentLib = tagLibrary.getCurrentLibraryName();
        selectedLibrary.value = currentLib;
        loadArtists(currentLib);
      } else {
        // 如果没有标签库服务，则加载默认数据
        loadArtists();
      }
      
      window.addEventListener('resize', handleResize);
      
      // 监听库变更事件
      emitter.on('library-changed', handleLibraryChange);
    });
    
    // 组件卸载前移除事件监听
    onBeforeUnmount(() => {
      window.removeEventListener('resize', handleResize);
      emitter.off('library-changed', handleLibraryChange);
    });

    // 处理Tag输入分割
    const processTagInput = () => {
      if (!tagInput.value.trim()) {
        alert('请先输入需要处理的Tag');
        return;
      }
      
      isGenerating.value = true;
      
      try {
        // 分割输入的标签文本
        const tags = splitTagInput(tagInput.value);
        
        if (tags.length === 0) {
          alert('未能识别到有效的Tag');
          isGenerating.value = false;
          return;
        }
        
        // 处理每个Tag，根据频率决定是否添加权重
        const tagsWithWeights = tags.map(tag => {
          // 根据权重频率决定是否添加权重
          const shouldAddWeight = Math.random() * 100 <= weightFrequency.value;
          
          if (!shouldAddWeight) {
            return tag;
          }
          
          // 生成随机权重
          let weight;
          if (fixedWeight.value) {
            weight = fixedWeightValue.value.toFixed(1);
          } else {
            weight = (Math.random() * (maxWeight.value - minWeight.value) + Number(minWeight.value)).toFixed(1);
          }
          
          // 根据自定义格式设置
          let formattedTag;
          if (useCustomFormat.value) {
            switch (customFormat.value) {
              case 'colon':
                formattedTag = `${tag}:${weight}`;
                break;
              case 'space':
                formattedTag = `${tag} ${weight}`;
                break;
              case 'only':
                formattedTag = tag;
                break;
              case 'brackets':
              default:
                formattedTag = `(${tag}:${weight})`;
                break;
            }
          } else {
            formattedTag = `(${tag}:${weight})`;
          }
          
          return formattedTag;
        });
        
        // 拼接结果
        const resultText = tagsWithWeights.join(', ');
        
        // 如果当前已有结果，则添加到结果末尾
        if (result.value) {
          result.value += ', ' + resultText;
        } else {
          result.value = resultText;
        }
        
        // 自动滚动到结果区域
        nextTick(() => {
          const resultPanel = document.querySelector('.result-panel');
          if (resultPanel) {
            resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
      } catch (error) {
        console.error('处理Tag输入失败:', error);
        alert('处理失败: ' + error.message);
      } finally {
        isGenerating.value = false;
      }
    };
    
    // 分割Tag输入
    const splitTagInput = (input) => {
      if (!input.trim()) return [];
      
      // 分割并清理输入
      let tags = [];
      
      // 检测中英文混合情况
      const hasChinese = /[\u4e00-\u9fa5]/.test(input);
      const hasEnglish = /[a-zA-Z]/.test(input);
      
      if (hasChinese && hasEnglish) {
        // 处理混合中英文的情况
        // 1. 先按照逗号分割
        const commaSplit = input.split(/[,，]/);
        
        // 2. 处理每个部分，将英文和中文分开
        commaSplit.forEach(part => {
          if (!part.trim()) return;
          
          // 英文部分通常使用空格分隔
          const engMatches = part.match(/[a-zA-Z][a-zA-Z\s\-_]*/g);
          if (engMatches) {
            engMatches.forEach(eng => {
              if (eng.trim()) tags.push(eng.trim());
            });
          }
          
          // 中文部分通常连续出现
          const cnMatches = part.match(/[\u4e00-\u9fa5]+/g);
          if (cnMatches) {
            cnMatches.forEach(cn => {
              if (cn.trim()) tags.push(cn.trim());
            });
          }
        });
      } else if (hasChinese) {
        // 只有中文的情况，按照中文逗号或空格分割
        tags = input.split(/[,，\s]/);
      } else {
        // 只有英文的情况，按照英文逗号或空格分割
        tags = input.split(/[,\s]/);
      }
      
      // 过滤空字符串并去重
      return [...new Set(tags.filter(tag => tag.trim()))];
    };

    // 清空Tag输入
    const clearTagInput = () => {
      tagInput.value = '';
    };

    // 处理库变更
    const handleLibraryChange = (libraryName) => {
      if (!libraryName || libraryName === selectedLibrary.value) return;
      
      selectedLibrary.value = libraryName;
      isLoadingLibrary.value = true;
      
      // 加载新库的数据
      loadArtists(libraryName).then(() => {
        isLoadingLibrary.value = false;
        
        emitter.emit('notification', {
          type: 'success',
          message: `已切换到 ${libraryName} 库`
        });
      });
    };

    // 快速选择库
    const selectLibrary = (library) => {
      if (library && library !== selectedLibrary.value) {
        handleLibraryChange(library);
      }
    };

    return {
      minCount,
      maxCount,
      minWeight,
      maxWeight,
      result,
      showModal,
      searchQuery,
      artists,
      filteredArtists,
      isGenerating,
      isLoadingArtists,
      generateArtists,
      copyToClipboard,
      clearResult,
      showArtistLibrary,
      closeModal,
      addArtistToResult,
      decreaseMinCount,
      increaseMinCount,
      decreaseMaxCount,
      increaseMaxCount,
      excludeKeywords,
      avoidDuplicates,
      fixedWeight,
      fixedWeightValue,
      useCustomFormat,
      customFormat,
      artistListContainer,
      isMobile,
      tagInput,
      processTagInput,
      clearTagInput,
      selectedLibrary,
      recentLibraries,
      isLoadingLibrary,
      handleLibraryChange,
      selectLibrary,
      splitTagInput,
      availableLibraries,
      weightFrequency
    };
  }
});
</script>

<style scoped>
.weight-adder {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.weight-adder-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  gap: 20px;
  overflow-y: auto;
}

.control-panel {
  background-color: var(--panel-bg-color, #fff);
  border-radius: var(--border-radius-medium, 8px);
  box-shadow: var(--shadow-small, 0 2px 8px rgba(0, 0, 0, 0.1));
  overflow: hidden;
  max-height: calc(100vh - 400px);
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-color, #eee);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-color, #333);
  position: relative;
  padding-left: 0.5rem;
}

.panel-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 1.2em;
  background-color: var(--accent-color, #42b883);
  border-radius: 2px;
}

.panel-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.action-button:hover {
  background-color: var(--hover-color, #f0f0f0);
}

.form-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.section {
  margin-bottom: 20px;
}

.section h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 10px;
  color: var(--text-color, #333);
}

.number-control {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  overflow: hidden;
  width: fit-content;
}

.control-btn {
  background-color: var(--bg-color-light, #f5f5f5);
  border: none;
  width: 36px;
  height: 36px;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.control-btn:disabled {
  color: var(--text-color-light, #ccc);
  cursor: not-allowed;
}

.control-btn:not(:disabled):hover {
  background-color: var(--hover-color, #e6f7ff);
}

.number {
  width: 50px;
  text-align: center;
  font-size: 1rem;
  font-weight: 600;
  background-color: var(--bg-color, #fff);
  padding: 6px 0;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.slider {
  flex: 1;
  height: 6px;
  appearance: none;
  background-color: var(--border-color, #ddd);
  border-radius: 3px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: var(--primary-color, #1677ff);
  cursor: pointer;
}

.slider-value {
  min-width: 40px;
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-color, #333);
  font-weight: 600;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 30px;
}

.primary-button,
.secondary-button,
.accent-button {
  flex: 1;
  height: 44px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-button {
  background-color: var(--primary-color, #1677ff);
  color: white;
}

.primary-button:hover:not(:disabled) {
  background-color: var(--primary-hover-color, #4096ff);
  transform: translateY(-2px);
}

.secondary-button {
  background-color: var(--bg-color-light, #f0f0f0);
  color: var(--text-color, #333);
  border: 1px solid var(--border-color, #ddd);
}

.secondary-button:hover:not(:disabled) {
  background-color: var(--hover-color, #e6f7ff);
  transform: translateY(-2px);
}

.accent-button {
  background-color: var(--accent-color, #42b883);
  color: white;
}

.accent-button:hover:not(:disabled) {
  background-color: var(--accent-hover-color, #36a070);
  transform: translateY(-2px);
}

.primary-button:disabled,
.secondary-button:disabled,
.accent-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.button-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-radius: 50%;
  border-right-color: transparent;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.button-icon {
  font-size: 1.2rem;
}

.result-panel {
  background-color: var(--panel-bg-color, #fff);
  border-radius: var(--border-radius-medium, 8px);
  box-shadow: var(--shadow-small, 0 2px 8px rgba(0, 0, 0, 0.1));
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 150px;
}

.result-content {
  flex: 1;
  padding: 20px;
  font-size: 1rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-y: auto;
  background-color: var(--bg-color-light, #f9f9f9);
}

.empty-result {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-color-light, #999);
  font-style: italic;
}

/* 模态框样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fade-in 0.2s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: var(--bg-color, #fff);
  border-radius: 12px;
  width: 80%;
  max-width: 900px;
  max-height: 80vh;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  animation: slide-up 0.3s ease-out;
}

@keyframes slide-up {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color, #eee);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.4rem;
  color: var(--text-color, #333);
}

.modal-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.artist-count {
  font-size: 0.9rem;
  color: var(--text-color-light, #666);
}

.close-button {
  background: none;
  border: none;
  font-size: 1.6rem;
  line-height: 1;
  cursor: pointer;
  color: var(--text-color-light, #666);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: var(--hover-color, #f0f0f0);
  color: var(--text-color, #333);
}

.search-container {
  padding: 15px 20px;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 12px 15px 12px 40px;
  font-size: 1rem;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 8px;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  border-color: var(--primary-color, #1677ff);
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  outline: none;
}

.search-icon {
  position: absolute;
  left: 35px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-color-light, #999);
  font-size: 1.1rem;
}

.modal-body {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  overflow-y: auto;
  padding: 15px 20px;
  max-height: 60vh;
}

.artist-item {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color-light, #f5f5f5);
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  font-size: 0.95rem;
  word-break: break-word;
  height: auto;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
  cursor: pointer;
  border: 1px solid transparent;
}

.artist-item:hover {
  background-color: var(--hover-color, #e6f7ff);
  transform: translateY(-2px);
  border-color: var(--primary-color, #1677ff);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

.empty-artists {
  grid-column: 1 / -1;
  padding: 40px 0;
  text-align: center;
  color: var(--text-color-light, #999);
  font-style: italic;
}

/* 深色模式 */
:global(.dark-mode) .control-panel,
:global(.dark-mode) .result-panel {
  background-color: var(--panel-bg-color-dark, #1f1f1f);
  box-shadow: var(--shadow-medium-dark, 0 4px 12px rgba(0, 0, 0, 0.2));
}

:global(.dark-mode) .panel-header {
  border-bottom-color: var(--border-color-dark, #333);
}

:global(.dark-mode) .result-content {
  background-color: var(--bg-color-dark, #141414);
}

:global(.dark-mode) .secondary-button {
  background-color: var(--bg-color-dark-mode, #2a2a2a);
  border-color: var(--border-color-dark, #444);
}

:global(.dark-mode) .number-control {
  border-color: var(--border-color-dark, #444);
}

:global(.dark-mode) .control-btn {
  background-color: var(--bg-color-dark-mode, #2a2a2a);
}

:global(.dark-mode) .number {
  background-color: var(--bg-color-dark, #141414);
}

:global(.dark-mode) .slider {
  background-color: var(--border-color-dark, #444);
}

:global(.dark-mode) .modal-content {
  background-color: var(--bg-color-dark, #141414);
}

:global(.dark-mode) .modal-header {
  border-bottom-color: var(--border-color-dark, #333);
}

:global(.dark-mode) .search-input {
  background-color: var(--bg-color-dark-mode, #2a2a2a);
  color: var(--text-color-dark, #e0e0e0);
  border-color: var(--border-color-dark, #444);
}

:global(.dark-mode) .artist-item {
  background-color: var(--bg-color-dark-mode, #2a2a2a);
}

:global(.dark-mode) .artist-item:hover {
  background-color: var(--hover-color-dark, #165996);
}

/* 移动响应式适配 */
@media (max-width: 768px) {
  .button-group {
    flex-direction: column;
  }
  
  .modal-content {
    width: 90%;
    max-width: none;
    max-height: 85vh;
  }
  
  .modal-body {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
  
  /* 移动设备上的高度调整 */
  .control-panel {
    max-height: unset;
  }
  
  .advanced-content {
    max-height: 300px;
  }
  
  /* 移动设备特定样式 */
  .control-panel.mobile .section {
    margin-bottom: 15px;
  }
  
  .control-panel.mobile .panel-header,
  .advanced-settings-wrapper.mobile .advanced-header,
  .result-panel.mobile .panel-header {
    padding: 10px;
  }
  
  .control-panel.mobile .form-content {
    padding: 15px;
  }
  
  .advanced-settings-wrapper.mobile .advanced-content {
    padding: 10px;
  }
  
  .advanced-settings-wrapper.mobile .advanced-item {
    margin-bottom: 8px;
  }
  
  .result-panel.mobile .result-content {
    padding: 15px;
  }
  
  /* 缩小模态框上的元素 */
  .modal-content.mobile .modal-header {
    padding: 12px 15px;
  }
  
  .modal-content.mobile .search-container {
    padding: 10px 15px;
  }
  
  .modal-content.mobile .modal-body {
    padding: 10px 15px;
    max-height: 50vh;
  }
  
  .modal-content.mobile .artist-item {
    padding: 10px;
    font-size: 0.9rem;
  }
}

/* 更多响应式高度调整 */
@media (min-height: 800px) {
  .control-panel {
    max-height: calc(100vh - 350px);
  }
  
  .advanced-content {
    max-height: 450px;
  }
}

@media (max-height: 700px) {
  .control-panel {
    max-height: calc(100vh - 450px);
  }
  
  .section {
    margin-bottom: 15px;
  }
  
  .button-group {
    margin-top: 15px;
  }
  
  .advanced-content {
    max-height: 250px;
  }
}

/* 滚动条样式 */
.advanced-content::-webkit-scrollbar,
.form-content::-webkit-scrollbar,
.weight-adder-content::-webkit-scrollbar {
  width: 6px;
}

.advanced-content::-webkit-scrollbar-thumb,
.form-content::-webkit-scrollbar-thumb,
.weight-adder-content::-webkit-scrollbar-thumb {
  background-color: var(--border-color, rgba(0, 0, 0, 0.2));
  border-radius: 10px;
}

.advanced-content::-webkit-scrollbar-track,
.form-content::-webkit-scrollbar-track,
.weight-adder-content::-webkit-scrollbar-track {
  background-color: transparent;
}

:global(.dark-mode) .advanced-content::-webkit-scrollbar-thumb,
:global(.dark-mode) .form-content::-webkit-scrollbar-thumb,
:global(.dark-mode) .weight-adder-content::-webkit-scrollbar-thumb {
  background-color: var(--border-color-dark, rgba(255, 255, 255, 0.2));
}

/* 高级设置相关样式 */
.advanced-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.advanced-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.advanced-item label {
  font-size: 0.95rem;
  color: var(--text-color, #333);
  font-weight: 500;
}

.advanced-item.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.advanced-item.checkbox label {
  font-weight: normal;
  cursor: pointer;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  font-size: 0.95rem;
  color: var(--text-color, #333);
  background-color: var(--input-bg-color, #fff);
  transition: all 0.3s;
}

.form-input:focus {
  border-color: var(--primary-color, #1677ff);
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
  outline: none;
}

.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  font-size: 0.95rem;
  color: var(--text-color, #333);
  background-color: var(--input-bg-color, #fff);
  cursor: pointer;
  transition: all 0.3s;
}

.form-select:focus {
  border-color: var(--primary-color, #1677ff);
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
  outline: none;
}

.setting-description {
  font-size: 0.9rem;
  color: var(--text-color-light, #666);
}

/* 深色模式适配 */
:global(.dark-mode) .form-input,
:global(.dark-mode) .form-select {
  background-color: var(--input-bg-color-dark, #141414);
  border-color: var(--border-color-dark, #444);
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .setting-description {
  color: var(--text-color-light-dark, #999);
}

/* Tag输入样式 */
.tag-input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 8px;
  font-size: 1rem;
  line-height: 1.5;
  resize: vertical;
  min-height: 100px;
  background-color: var(--bg-color-light, #f9f9f9);
  color: var(--text-color, #333);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.tag-input:focus {
  outline: none;
  border-color: var(--primary-color, #2196F3);
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.tag-input-actions {
  display: flex;
  margin-top: 10px;
  gap: 10px;
  justify-content: flex-start;
}

.small-button {
  padding: 8px 16px;
  border-radius: var(--border-radius-small, 4px);
  border: 1px solid var(--border-color, #ddd);
  background-color: var(--bg-color-light, #f5f5f5);
  color: var(--text-color, #333);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.small-button:hover {
  background-color: var(--hover-color, #e6e6e6);
}

/* 库选择样式 */
.library-selection {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.recent-libraries {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.recent-label {
  font-size: 0.85rem;
  color: var(--text-color-light, #777);
}

.recent-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.library-chip {
  background-color: var(--bg-color-light, #f5f5f5);
  border: 1px solid var(--border-color, #ddd);
  border-radius: 16px;
  padding: 4px 12px;
  font-size: 0.85rem;
  color: var(--text-color, #333);
  cursor: pointer;
  transition: all 0.2s;
}

.library-chip:hover {
  background-color: var(--hover-color, #e6f7ff);
  border-color: var(--primary-color, #2196F3);
}

.library-chip.active {
  background-color: var(--primary-color, #2196F3);
  color: white;
  border-color: var(--primary-color, #2196F3);
}

/* 深色模式适配 */
:global(.dark-mode) .tag-input {
  background-color: var(--bg-color-light-dark, #333);
  border-color: var(--border-color-dark, #444);
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .small-button {
  background-color: var(--bg-color-light-dark, #333);
  border-color: var(--border-color-dark, #444);
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .small-button:hover {
  background-color: var(--bg-color-dark, #444);
}

:global(.dark-mode) .library-chip {
  background-color: var(--bg-color-light-dark, #333);
  border-color: var(--border-color-dark, #444);
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .library-chip:hover {
  background-color: rgba(33, 150, 243, 0.2);
  border-color: var(--primary-color, #2196F3);
}

/* 模态框内库选择样式 */
.library-bar {
  display: flex;
  padding: 10px 20px;
  background-color: var(--bg-color-light, #f5f5f5);
  border-bottom: 1px solid var(--border-color, #eee);
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.library-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.library-selector label {
  font-size: 0.9rem;
  color: var(--text-color, #333);
  white-space: nowrap;
}

.modal-select {
  padding: 6px 10px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  background-color: var(--bg-color, #fff);
  font-size: 0.9rem;
  min-width: 150px;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 12px;
}

.library-quick-select {
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: flex-end;
}

.loading-spinner {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-color, #2196F3);
  animation: spin 1s linear infinite;
  margin-right: 10px;
}

/* 深色模式适配 */
:global(.dark-mode) .library-bar {
  background-color: var(--bg-color-dark, #2a2a2a);
  border-color: var(--border-color-dark, #444);
}

:global(.dark-mode) .library-selector label {
  color: var(--text-color-dark, #e0e0e0);
}

:global(.dark-mode) .modal-select {
  background-color: var(--bg-color-light-dark, #333);
  border-color: var(--border-color-dark, #444);
  color: var(--text-color-dark, #e0e0e0);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23e0e0e0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
}

:global(.dark-mode) .loading-spinner {
  border-color: rgba(255, 255, 255, 0.1);
  border-top-color: var(--primary-color, #2196F3);
}
</style>