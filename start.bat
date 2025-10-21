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
if not exist "node_modules" (
    echo 📦 Устанавливаем зависимости...
    echo Это может занять несколько минут...
    
    call npm install --no-optional --legacy-peer-deps
    
    if %errorlevel% neq 0 (
        echo ❌ Ошибка установки!
        echo 💡 Попробуйте запустить как администратор
        pause
        exit /b 1
    )
    
    echo ✅ Зависимости установлены!
) else (
    echo ✅ Зависимости найдены
)

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

