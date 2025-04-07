# 🎲 灵感提供机 - 创意标签抽签工具

> 突破创作瓶颈，为你的灵感之源添一把火！

## 项目简介
Inspiration-Provider是一个创意灵感生成工具，通过丰富的标签库为创作者提供多元化的创意启发。本项目旨在帮助设计师、艺术家、作家等创意工作者克服创作瓶颈，激发新的灵感和创意思路。

## 主要功能
- **丰富标签库**：包含艺术、科技、自然、情感、思维模式、生活美学等多个分类的创意标签
- **随机生成**：根据用户选择的主题范围，随机组合生成创意灵感
- **标签管理**：提供直观的界面来查看、编辑和管理标签库
- **历史记录**：保存生成的灵感历史，方便回顾和再利用
- **自定义设置**：允许用户根据自己的需求自定义生成参数和界面偏好

## 技术栈
- 前端框架：Vue.js
- UI组件：Element Plus
- 状态管理：Vuex
- 本地存储：LocalStorage

## 使用方法
1. 选择感兴趣的标签类别
2. 设置生成参数（如随机度、组合方式等）
3. 点击生成按钮获取灵感组合
4. 保存或导出喜欢的创意灵感

## 项目展望
未来计划添加更多创意生成算法、用户自定义标签库、多语言支持等功能，让创意激发过程更加个性化和多样化。

## 🚀 这款工具能帮你做什么？

- 📝 **文案创作** - 需要写小说但不知从何下笔？抽几个标签，看看能否碰撞出火花
- 🎨 **设计灵感** - 陷入设计瓶颈？随机组合几个元素，打破常规思维
- 🎮 **游戏开发** - 为你的游戏寻找新鲜的角色特质或剧情元素
- 🎯 **头脑风暴** - 团队创意会议前，先抽几组标签热身
- 🎭 **角色塑造** - 为你的故事角色注入随机特质，创造更丰富的人物

## ✨ 特色功能

- 🧩 **分类标签系统** - 人物特质、创作主题、情节元素等多种分类，随心组合
- 💾 **本地数据存储** - 所有设置和历史记录都保存在本地，无需担心数据丢失
- 📚 **自定义标签库** - 不满足于默认标签？创建你专属的标签集合！
- ⚖️ **权重添加器** - 为标签添加权重值，支持多种格式和批量处理
- 🔄 **历史记录** - 喜欢之前抽到的灵感？随时回顾，重新激发创意
- 🌗 **深色模式** - 保护你熬夜创作的双眼
- 📱 **全面移动适配** - 无论是手机还是平板，都能获得完美的体验
- 🔋 **高性能优化** - 快速响应，数据处理高效稳定
- 🛡️ **强化错误处理** - 稳定可靠，不易崩溃，即使数据异常也能正常工作

## 新功能：权重添加器

最新版本添加了强大的权重添加器功能，帮助你更灵活地管理标签权重：

1. **多种权重格式**
   - (标签:权重) 格式
   - 标签:权重 格式
   - 标签 权重 格式
   - 仅标签格式

2. **灵活的权重设置**
   - 支持固定权重值
   - 支持随机权重范围
   - 可设置最小/最大权重范围

3. **批量处理功能**
   - 支持批量输入标签
   - 智能分割中英文混合内容
   - 自动添加随机权重

4. **高级筛选**
   - 排除特定关键词
   - 避免重复选择
   - 支持从标签库快速选择

5. **便捷操作**
   - 快速复制结果
   - 支持实时预览
   - 可随时清空重新生成

## 新功能：标签格式转换工具

标签库现在支持从各种文本格式导入标签数据，通过以下步骤使用：

1. 进入标签库管理界面，选择"导入"选项卡
2. 点击"文本转换导入"标签页
3. 粘贴您的文本内容到文本框中
4. 选择适合的文本格式或使用"自动检测"
5. 点击"转换为JSON"按钮
6. 确认转换结果后点击"导入转换后的JSON"按钮

支持的文本格式：

1. **分类名换行标签格式**：
   ```
   人物特质
   勇敢
   聪明
   善良
   
   故事背景
   中世纪
   现代都市
   ```

2. **标签 #分类格式**：
   ```
   勇敢 #人物特质
   聪明 #人物特质
   中世纪 #故事背景
   ```

3. **标签1,标签2 分类格式**：
   ```
   勇敢,聪明,善良 人物特质
   中世纪,现代都市 故事背景
   ```

4. **法典标签格式**：
   ```
   ●OC杂项
   
   玛德琳
   1girl,down jacket,blue jacket,long hair,full body,ahoge
   
   ●单机角色
   
   末影人娘
   enderman (minecraft),naked bodystocking
   ```
   此格式适合处理角色标签集合，将自动提取角色名称作为子标签。

这个功能特别适合从现有文本资料中快速导入大量标签数据。

## 🛠️ 开发者指南

### 环境准备

```bash
# 安装所有依赖
npm install

# 启动开发服务器
npm run dev
```

Windows用户也可以直接双击`启动开发服务器.bat`文件，一键启动！

### 打包项目

```bash
npm run build
```

构建后的文件将整齐地放在`dist`目录，随时可部署！

## 📂 目录结构一览

```
┌── src/                # 源码的秘密基地
│   ├── assets/         # 样式和图片资源
│   ├── components/     # 精心打造的UI组件
│   ├── models/         # 数据模型和逻辑
│   │   ├── TagLibrary.js  # 标签库管理核心
│   │   └── TagDrawer.js   # 标签抽取引擎
│   ├── utils/          # 实用工具函数
│   ├── composables/    # 组合式API
│   ├── views/          # 页面视图
│   ├── App.vue         # 应用主组件
│   └── main.js         # 入口文件
├── public/             # 静态资源
│   └── example_tags.json # 示例标签数据
├── index.html          # HTML模板
├── vite.config.js      # Vite配置
└── package.json        # 项目配置和依赖
```

## 🎮 使用指南

1. 🔢 在"抽取标签"面板设置你想要的标签数量
2. 📑 选择特定分类，或勇敢地选择"全部分类"来获取最大惊喜
3. 🚫 有不想看到的关键词？在排除标签中输入它们
4. 🎯 点击"抽签"按钮，见证灵感火花的诞生！
5. 📝 喜欢这次结果？保存下来，或直接开始创作吧！

## 🔧 自定义你的标签库

想要添加更多符合你创作领域的标签？没问题！

1. 在"标签库管理"选项卡中探索所有功能
2. 导入自定义JSON格式的标签库（格式参考`example_tags.json`）
3. 使用内置的高级编辑器直接添加、编辑标签和分类
4. 利用清理功能移除重复标签或空分类，保持库的整洁

## 💻 性能与兼容性

- ⚡ **高效加载** - 优化的数据加载与解析，更快的响应速度
- 📊 **智能缓存** - 减少不必要的重复计算，提升用户体验 
- 📱 **全设备支持** - 桌面PC、笔记本、平板、手机全面适配
- 🔒 **数据安全** - 所有数据存储在本地，不会上传到服务器
- 🛡️ **防崩溃机制** - 增强的错误处理确保应用稳定运行

## 🤝 一起让它变得更好

发现bug？有新功能建议？欢迎参与这个开源项目！

- 提交Issue分享你的想法
- 贡献代码让灵感提供机变得更强大
- 分享给其他创作者，一起打破创意瓶颈

## 📜 许可证

本项目采用MIT许可证开源，随心所欲地使用吧！

---

> 💡 **创作小贴士**：当你感到灵感枯竭时，不妨随机抽取5个标签，强制自己将它们组合到一起。有时候最不可思议的组合，反而能激发最绝妙的创意！

---
