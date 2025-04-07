# 一键部署GitHub Pages脚本（PowerShell版本）
# 使用方法：在PowerShell中运行 .\deploy.ps1

# 设置错误操作
$ErrorActionPreference = "Stop"

# 构建项目
Write-Host "开始构建项目..." -ForegroundColor Cyan
npm run build

# 切换到gh-pages分支
Write-Host "切换到gh-pages分支..." -ForegroundColor Cyan
git checkout gh-pages

# 保存当前文件列表
Write-Host "清理旧文件..." -ForegroundColor Cyan
$excludeFiles = @(".git", "dist", "deploy.ps1", "deploy.sh")
Get-ChildItem -Path . -Exclude $excludeFiles | Remove-Item -Recurse -Force

# 复制dist目录内容到根目录
Write-Host "复制dist目录内容到根目录..." -ForegroundColor Cyan
Copy-Item -Path "dist\*" -Destination "." -Recurse -Force

# 添加所有文件到git
Write-Host "添加更改到git..." -ForegroundColor Cyan
git add -A

# 提交更改
Write-Host "提交更改..." -ForegroundColor Cyan
git commit -m "更新GitHub Pages内容 $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

# 推送到远程仓库
Write-Host "推送到GitHub..." -ForegroundColor Cyan
git push -f origin gh-pages

Write-Host "部署完成！" -ForegroundColor Green

# 切回主分支
git checkout master

Write-Host "脚本执行完毕。" -ForegroundColor Green 