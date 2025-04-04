# GitHub Pages 部署说明

当前已完成以下步骤：

1. 创建了 `gh-pages` 分支
2. 配置了 `vite.config.js` 和 `vue.config.js` 文件以支持GitHub Pages
3. 添加了 `gh-pages` 依赖和部署脚本
4. 修改了 `TagLoader.js` 以支持GitHub Pages上的路径加载
5. 已构建项目并将法典数据复制到 `dist` 目录

## 网络连接恢复后，请执行以下步骤完成部署：

### 方法一：使用npm脚本部署

```bash
# 确保当前在gh-pages分支
git checkout gh-pages

# 安装依赖（如果需要）
npm install

# 运行部署脚本
npm run deploy
```

### 方法二：手动推送gh-pages分支

```bash
# 确保当前在gh-pages分支
git checkout gh-pages

# 推送gh-pages分支到GitHub
git push origin gh-pages
```

### 方法三：使用subtree推送dist目录

```bash
# 切换回master分支
git checkout master

# 使用subtree将dist目录推送到gh-pages分支
git subtree push --prefix dist origin gh-pages
```

## 部署完成后

部署完成后，你可以在以下地址访问你的应用：

https://tera-dark.github.io/Inspiration-Provider/

## 注意事项

1. 如果更新了代码，需要重新构建并部署
2. 确保法典数据正确复制到dist目录
3. 如果遇到路径问题，检查 TagLoader.js 中的路径配置
4. 各环境路径的配置已在 vite.config.js 和 vue.config.js 中设置 