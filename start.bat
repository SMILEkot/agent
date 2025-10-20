@echo off
echo ========================================
echo    AI Agent - Запуск приложения
echo ========================================
echo.

:: Проверяем наличие Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js не найден!
    echo Пожалуйста, установите Node.js с https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js найден
echo.

:: Проверяем наличие package.json
if not exist "package.json" (
    echo ❌ Файл package.json не найден!
    echo Убедитесь, что вы запускаете скрипт из корневой папки проекта
    echo.
    pause
    exit /b 1
)

:: Устанавливаем зависимости если нужно
if not exist "node_modules" (
    echo 📦 Устанавливаем зависимости...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Ошибка при установке зависимостей!
        pause
        exit /b 1
    )
    echo ✅ Зависимости установлены
    echo.
)

:: Запускаем приложение
echo 🚀 Запускаем AI Agent Desktop...
echo.
echo 🖥️  Приложение откроется в отдельном окне
echo 💡 Для остановки закройте окно приложения или нажмите Ctrl+C
echo.

call npm run dev

pause
