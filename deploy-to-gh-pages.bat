@echo off
echo ===== 灵感提供机 GitHub Pages 部署脚本 =====
echo.

REM 构建项目
echo 正在构建项目...
call npm run build
if %ERRORLEVEL% neq 0 (
  echo 构建失败！
  exit /b %ERRORLEVEL%
)

REM 复制法典数据
echo 复制法典数据...
copy .\public\所长常规法典.json .\dist\

REM 检查是否有gh-pages分支
git branch | findstr "gh-pages" >nul
if %ERRORLEVEL% neq 0 (
  echo 创建gh-pages分支...
  git checkout -b gh-pages
) else (
  echo 切换到gh-pages分支...
  git checkout gh-pages
)

REM 尝试部署
echo 尝试使用npm脚本部署...
call npm run deploy
if %ERRORLEVEL% neq 0 (
  echo npm部署失败，尝试手动推送...
  git add .
  git commit -m "更新GitHub Pages部署"
  git push origin gh-pages
  if %ERRORLEVEL% neq 0 (
    echo 推送失败！请稍后手动推送。
    exit /b %ERRORLEVEL%
  )
)

echo.
echo 部署完成！网站将在几分钟内更新。
echo 访问地址: https://tera-dark.github.io/Inspiration-Provider/
echo.

REM 切回master分支
git checkout master

echo 请按任意键退出...
pause >nul 