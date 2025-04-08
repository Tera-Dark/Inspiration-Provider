@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

title 灵感提供机 - 修复版部署

echo 灵感提供机 - 修复版部署到GitHub Pages
echo ===================================
echo.

cd /d "%~dp0"

echo 正在检查环境...

REM 检查git是否安装
git --version > nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未检测到Git，请先安装Git。
    goto :END
)
echo √ Git已安装

REM 检查node是否安装
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未检测到Node.js，请先安装Node.js。
    goto :END
)
echo √ Node.js已安装

REM 检查当前目录是否为git仓库
if not exist ".git\" (
    echo 错误: 当前目录不是Git仓库根目录。
    goto :END
)
echo √ 当前目录是Git仓库

REM 检查是否有未提交的更改
git diff --quiet --exit-code
if %errorlevel% neq 0 (
    echo 检测到未保存的更改。
    
    set /p SAVE_CHANGES="是否保存当前更改？(Y/N): "
    if /i "!SAVE_CHANGES!"=="Y" (
        REM 获取当前日期和时间作为提交信息
        for /f "usebackq tokens=*" %%a in (`powershell -Command "Get-Date -Format 'yyyy-MM-dd HH:mm:ss'"`) do set "timestamp=%%a"
        
        echo 正在保存当前更改...
        git add .
        git commit -m "自动保存 !timestamp!" --no-verify
        
        if !errorlevel! neq 0 (
            echo 错误: 提交更改失败。
            goto :END
        )
    ) else (
        echo 操作已取消。请先提交或暂存您的更改。
        goto :END
    )
)
echo √ 工作区状态检查完成

REM 检查node_modules目录是否存在
if not exist "node_modules\" (
    echo 未检测到node_modules目录，正在安装依赖...
    call npm install
    
    if %errorlevel% neq 0 (
        echo 错误: 依赖安装失败，请检查网络连接或手动执行npm install命令。
        goto :END
    )
    
    echo 依赖安装完成！
) else (
    echo 依赖已存在，继续执行...
)
echo √ 依赖检查完成

REM 获取当前分支
for /f "tokens=* USEBACKQ" %%g in (`git branch --show-current`) do (set "current_branch=%%g")
echo 当前分支: %current_branch%

REM 检查是否已有gh-pages分支，如果没有则创建
git show-ref --verify --quiet refs/heads/gh-pages
if %errorlevel% neq 0 (
    echo 未检测到gh-pages分支，将创建新分支...
    git checkout --orphan gh-pages
    if %errorlevel% neq 0 (
        echo 错误: 创建gh-pages分支失败。
        goto :END
    )
    
    git reset --hard
    git commit --allow-empty -m "初始化gh-pages分支"
    git checkout %current_branch%
    if %errorlevel% neq 0 (
        echo 错误: 切回原分支失败。
        goto :END
    )
    
    echo gh-pages分支创建完成
) else (
    echo gh-pages分支已存在
)
echo √ 分支检查完成

REM 构建项目
echo 正在构建项目...
call npm run build

if %errorlevel% neq 0 (
    echo 错误: 构建失败，请检查错误信息。
    goto :END
)
echo √ 项目构建完成！

REM 确保dist目录确实存在
timeout /t 2 > nul
if not exist "dist\" (
    echo 错误: 构建完成后dist目录仍不存在，请检查构建配置。
    goto :END
)
echo √ dist目录检查通过

REM 检查public目录中的JSON文件
echo 正在查找JSON文件...
set "found_json=false"
for %%F in (public\*.json) do (
    set "found_json=true"
    echo 找到: %%F
)

if "%found_json%"=="false" (
    echo 警告: 在public目录下未找到任何JSON文件。
)

REM 使用两种方式复制JSON文件
echo 正在复制JSON文件...

REM 方法1: 使用Node.js脚本
echo 方法1: 使用专用JSON复制脚本...
call node copy-json-deploy.js
set node_success=%errorlevel%

REM 方法2: 使用批处理命令直接复制
echo 方法2: 使用批处理命令复制...
if not exist "dist\public\" mkdir "dist\public\"
if not exist "dist\assets\" mkdir "dist\assets\"

set "batch_success=true"
for %%F in (public\*.json) do (
    copy "%%F" "dist\" > nul 2>&1
    if !errorlevel! neq 0 set "batch_success=false"
    
    copy "%%F" "dist\public\" > nul 2>&1
    if !errorlevel! neq 0 set "batch_success=false"
    
    copy "%%F" "dist\assets\" > nul 2>&1
    if !errorlevel! neq 0 set "batch_success=false"
    
    echo 已复制: %%~nxF
)

REM 检查两种复制方法的结果
if "%node_success%"=="0" (
    echo √ Node.js脚本复制成功
) else (
    echo ✗ Node.js脚本复制失败
)

if "%batch_success%"=="true" (
    echo √ 批处理命令复制成功
) else (
    echo ✗ 批处理命令复制失败
)

REM 至少有一种方法成功即可继续
if not "%node_success%"=="0" (
    if not "%batch_success%"=="true" (
        echo 错误: 两种复制方法均失败，无法继续部署。
        goto :END
    )
)

echo √ JSON文件复制完成

REM 获取远程仓库URL
for /f "tokens=* USEBACKQ" %%g in (`git remote get-url origin 2^>nul`) do (set "remote_url=%%g")
if "%remote_url%"=="" (
    echo 警告: 无法获取远程仓库URL，将使用默认URL。
) else (
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
)

REM 部署到GitHub Pages
echo 正在部署到GitHub Pages...
call npm run deploy

if %errorlevel% neq 0 (
    echo 错误: 部署失败，请检查错误信息。
    goto :END
)

REM 返回原分支
git checkout %current_branch%
if %errorlevel% neq 0 (
    echo 警告: 返回原分支失败，但部署已完成。
)

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

goto :END

:END
echo.
echo 按任意键退出...
pause > nul

REM 配置Git用户名和邮箱
git config --global user.name "Tera-Dark"
git config --global user.email "wjx19825323597@gmail.com" 