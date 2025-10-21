@echo off
chcp 65001 >nul
echo ========================================
echo      AI Agent Desktop (Simple)
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
echo 🚀 Запускаем простую версию...
echo (Без Vite и Rollup - только чистый HTML/JS)
echo.

REM Проверяем есть ли simple-index.html
if not exist "simple-index.html" (
    echo ❌ simple-index.html не найден!
    echo 💡 Убедитесь что вы скачали все файлы
    pause
    exit /b 1
)

echo 🌐 Запускаем веб-сервер на http://localhost:3000
echo 💡 Откройте браузер и перейдите по адресу: http://localhost:3000
echo 💡 Для остановки нажмите Ctrl+C
echo.

REM Пробуем запустить сервер (сначала .cjs, потом .mjs)
if exist "server.cjs" (
    echo 📦 Запускаем через server.cjs...
    node server.cjs
) else if exist "server.mjs" (
    echo 📦 Запускаем через server.mjs...
    node server.mjs
) else (
    echo ❌ Файлы сервера не найдены!
    echo 💡 Попробуйте super-simple-start.bat
    pause
    exit /b 1
)

pause

