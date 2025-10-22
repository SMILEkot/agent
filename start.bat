@echo off
chcp 65001 >nul
echo ========================================
echo    🤖 AI Agent Desktop - Web Version
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
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Ошибка установки зависимостей!
        pause
        exit /b 1
    )
    echo ✅ Зависимости установлены!
) else (
    echo ✅ Зависимости найдены
)

echo.
echo 🔨 Компилируем React приложение...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Ошибка компиляции!
    echo 💡 Попробуем запустить в режиме разработки...
    echo.
    echo 🚀 Запускаем в dev режиме...
    echo 🌐 Откройте http://localhost:5173 в браузере
    echo.
    start http://localhost:5173
    call npm run dev
    pause
    exit /b 0
)

echo ✅ Компиляция завершена!
echo.
echo 🚀 Запускаем AI Agent Web Server...
echo.
echo 🌐 Веб-интерфейс будет доступен по адресу:
echo    http://localhost:3000
echo.
echo 💡 Для остановки нажмите Ctrl+C
echo.

start http://localhost:3000
node server-enhanced.cjs

if %errorlevel% neq 0 (
    echo.
    echo ❌ Ошибка запуска сервера!
    echo 💡 Проверьте, что порт 3000 свободен
    pause
    exit /b 1
)

echo.
echo 💡 Для перезапуска используйте start.bat
pause
