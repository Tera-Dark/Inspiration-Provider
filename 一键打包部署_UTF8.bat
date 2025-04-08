@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo 灵感提供机 - 自动打包部署到GitHub Pages
echo ===================================
echo.

cd /d "%~dp0"

REM 检查git是否安装
git --version > nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未检测到Git，请先安装Git。
    pause
    exit /b 1
)

REM 检查node是否安装
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未检测到Node.js，请先安装Node.js。
    pause
    exit /b 1
)

REM 检查当前目录是否为git仓库
if not exist ".git\" (
    echo 错误: 当前目录不是Git仓库根目录。
    pause
    exit /b 1
)

REM 检查是否有未提交的更改
git diff --quiet --exit-code
if %errorlevel% neq 0 (
    echo 检测到未保存的更改。
    
    set /p SAVE_CHANGES="是否保存当前更改？(Y/N): "
    if /i "!SAVE_CHANGES!"=="Y" (
        REM 获取当前日期和时间作为提交信息
        for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
        set "YYYY=!dt:~0,4!"
        set "MM=!dt:~4,2!"
        set "DD=!dt:~6,2!"
        set "HH=!dt:~8,2!"
        set "Min=!dt:~10,2!"
        set "Sec=!dt:~12,2!"
        
        set "timestamp=!YYYY!-!MM!-!DD! !HH!:!Min!:!Sec!"
        
        echo 正在保存当前更改...
        git add .
        git commit -m "自动保存 !timestamp!" --no-verify
        
        if !errorlevel! neq 0 (
            echo 错误: 提交更改失败。
            pause
            exit /b 1
        )
    ) else (
        echo 操作已取消。请先提交或暂存您的更改。
        pause
        exit /b 1
    )
)

REM 检查node_modules目录是否存在
if not exist "node_modules\" (
    echo 未检测到node_modules目录，正在安装依赖...
    npm install
    
    if %errorlevel% neq 0 (
        echo 错误: 依赖安装失败，请检查网络连接或手动执行npm install命令。
        pause
        exit /b 1
    )
    
    echo 依赖安装完成！
) else (
    echo 依赖已存在，继续执行...
)

REM 获取当前分支
for /f "tokens=* USEBACKQ" %%g in (`git branch --show-current`) do (set "current_branch=%%g")
echo 当前分支: %current_branch%

REM 检查是否已有gh-pages分支，如果没有则创建
git show-ref --verify --quiet refs/heads/gh-pages
if %errorlevel% neq 0 (
    echo 未检测到gh-pages分支，将创建新分支...
    git checkout --orphan gh-pages
    git reset --hard
    git commit --allow-empty -m "初始化gh-pages分支"
    git checkout %current_branch%
    echo gh-pages分支创建完成
) else (
    echo gh-pages分支已存在
)

REM 构建项目
echo 正在构建项目...
npm run build

if %errorlevel% neq 0 (
    echo 错误: 构建失败，请检查错误信息。
    pause
    exit /b 1
)
echo 项目构建完成！

REM 获取远程仓库URL
for /f "tokens=* USEBACKQ" %%g in (`git remote get-url origin`) do (set "remote_url=%%g")
echo 远程仓库: %remote_url%

REM 提取用户名
for /f "tokens=* USEBACKQ delims=/" %%g in ('%remote_url%') do (
    set "repo_part=%%g"
)
set "repo_part=%repo_part:*github.com[:/]=%"
for /f "tokens=1,2 delims=/" %%a in ("%repo_part%") do (
    set "username=%%a"
    set "repo=%%b"
)
set "repo=%repo:.git=%"

REM 部署到GitHub Pages
echo 正在部署到GitHub Pages...
npm run deploy

if %errorlevel% neq 0 (
    echo 错误: 部署失败，请检查错误信息。
    pause
    exit /b 1
)

REM 返回原分支
git checkout %current_branch%

echo.
echo ===================================
echo 部署成功完成！
echo 已部署到GitHub Pages，页面将在几分钟内更新。
if not "%username%"=="" (
    echo 访问地址: https://%username%.github.io/Inspiration-Provider/
) else (
    echo 访问地址: https://[你的用户名].github.io/Inspiration-Provider/
)
echo ===================================
echo.

pause 