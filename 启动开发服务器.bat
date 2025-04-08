@echo off
setlocal enabledelayedexpansion
title 灵感提供机开发服务器

echo 正在检测环境...
echo.

:: 检查是否已安装 Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 可以从 https://nodejs.org/zh-cn/ 下载并安装
    echo.
    pause
    exit /b 1
)

:: 显示 Node.js 版本
echo [√] Node.js 已安装
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo    版本: !NODE_VERSION!

:: 检查是否已安装 npm
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [错误] 未检测到 npm，请检查 Node.js 安装是否完整
    echo.
    pause
    exit /b 1
)

:: 显示 npm 版本
echo [√] npm 已安装
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo    版本: !NPM_VERSION!
echo.

:: 切换到脚本所在目录
cd /d "%~dp0"

:: 检查 node_modules 是否存在
if not exist "node_modules\" (
    echo [警告] 未检测到依赖包，正在安装依赖...
    npm install
    if !ERRORLEVEL! neq 0 (
        echo [错误] 依赖安装失败，请检查网络连接或手动运行 npm install
        echo.
        pause
        exit /b 1
    )
    echo [√] 依赖安装完成
    echo.
)

echo 正在启动灵感提供机 Vue版本开发服务器...
echo 请稍候，浏览器将自动打开项目页面...
echo 按 Ctrl+C 可以终止服务器运行
echo.

:: 启动开发服务器
npm run dev

pause 