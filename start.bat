@echo off
chcp 65001 >nul
echo ========================================
echo         AI Agent Desktop
echo ========================================
echo.

echo 🔍 Проверяем Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js не найден!
    echo 💡 Установите Node.js с https://nodejs.org
    pause
    exit /b 1
)
echo ✅ Node.js найден

echo.
echo 🔍 Проверяем зависимости...

REM Проверяем критические пакеты для сборки
if not exist "node_modules\rollup" goto missing_deps
if not exist "node_modules\vite" goto missing_deps
if not exist "node_modules\framer-motion" goto missing_deps
if not exist "node_modules\openai" goto missing_deps
if not exist "node_modules\@heroicons" goto missing_deps
if not exist "node_modules\@monaco-editor" goto missing_deps
if not exist "node_modules\markdown-to-jsx" goto missing_deps

echo ✅ Все зависимости найдены
goto start_app

:missing_deps
echo 📦 Некоторые зависимости отсутствуют...
echo 💡 Если у вас ошибка с Rollup - это известная проблема npm!
echo.
echo Устанавливаем зависимости...

REM Специальная установка для решения проблемы с Rollup
call npm install --no-optional --legacy-peer-deps --force

if %errorlevel% neq 0 (
    echo.
    echo ❌ Ошибка установки!
    echo.
    echo 🚨 Для ошибки "Cannot find module @rollup/rollup-win32-x64-msvc":
    echo    Запустите: fix-deps.bat
    echo.
    echo 💡 Или попробуйте:
    echo 1. Запустить как администратор
    echo 2. Обновить Node.js
    pause
    exit /b 1
)

echo ✅ Зависимости установлены!

:start_app
echo.
echo 🚀 Запускаем AI Agent Desktop...
echo.
echo 🖥️ Приложение откроется в отдельном окне
echo 💡 Для остановки нажмите Ctrl+C
echo.
echo 🚨 Если увидите ошибку Rollup - нажмите Ctrl+C и запустите fix-deps.bat
echo.

npm run electron:dev

if %errorlevel% neq 0 (
    echo.
    echo ❌ Ошибка запуска!
    echo.
    echo 💡 Если ошибка с Rollup - запустите:
    echo    fix-deps.bat
    echo.
    echo 💡 Затем снова:
    echo    start.bat
)

echo.
echo 💡 Для перезапуска используйте start.bat
pause

