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

REM Проверяем основные пакеты
if not exist "node_modules\framer-motion" goto install_deps
if not exist "node_modules\openai" goto install_deps
if not exist "node_modules\@heroicons" goto install_deps
if not exist "node_modules\@monaco-editor" goto install_deps
if not exist "node_modules\markdown-to-jsx" goto install_deps

echo ✅ Все зависимости найдены
goto start_app

:install_deps
echo 📦 Устанавливаем зависимости...
echo Это может занять несколько минут...
echo.

REM Очищаем кэш и старые зависимости
echo 🧹 Очищаем кэш...
if exist "node_modules" rmdir /s /q node_modules
if exist "package-lock.json" del package-lock.json
call npm cache clean --force

echo.
echo 📦 Устанавливаем пакеты...
call npm install --no-optional --legacy-peer-deps --verbose

if %errorlevel% neq 0 (
    echo.
    echo ❌ Ошибка установки через npm!
    echo 💡 Пробуем через yarn...
    
    call npm install -g yarn
    call yarn install
    
    if %errorlevel% neq 0 (
        echo ❌ Ошибка установки зависимостей!
        echo.
        echo 💡 Попробуйте:
        echo 1. Запустить как администратор
        echo 2. Проверить подключение к интернету
        echo 3. Удалить папку node_modules и запустить снова
        pause
        exit /b 1
    )
)

echo ✅ Зависимости установлены!

:start_app
echo.
echo 🚀 Запускаем AI Agent Desktop...
echo.
echo 🖥️ Приложение откроется в отдельном окне
echo 💡 Для остановки нажмите Ctrl+C
echo.

npm run electron:dev

echo.
echo 💡 Для перезапуска используйте start.bat
pause

