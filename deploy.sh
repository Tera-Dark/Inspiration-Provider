#!/bin/sh

# 一键部署GitHub Pages脚本
# 使用方法：运行 ./deploy.sh

# 确保脚本在发生错误时停止执行
set -e

# 构建项目
echo "开始构建项目..."
npm run build

# 切换到gh-pages分支
echo "切换到gh-pages分支..."
git checkout gh-pages

# 清除旧文件（保留.git目录）
echo "清理旧文件..."
find . -maxdepth 1 ! -path "./.git" ! -path "." ! -path "./dist" ! -path "./deploy.sh" -exec rm -rf {} \;

# 复制dist目录内容到根目录
echo "复制dist目录内容到根目录..."
cp -r dist/* .

# 添加所有文件到git
echo "添加更改到git..."
git add -A

# 提交更改
echo "提交更改..."
git commit -m "更新GitHub Pages内容 $(date)"

# 推送到远程仓库
echo "推送到GitHub..."
git push -f origin gh-pages

echo "部署完成！"

# 切回主分支
git checkout master

echo "脚本执行完毕。" 