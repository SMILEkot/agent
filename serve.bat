@echo off
echo ========================================
echo   AI Agent - Запуск продакшен версии
echo ========================================
echo.

:: Проверяем наличие собранной версии
if not exist "dist" (
    echo ❌ Папка 'dist' не найдена!
    echo Сначала соберите проект с помощью build.bat
    echo.
    pause
    exit /b 1
)

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
echo ✅ Собранная версия найдена
echo.

:: Запускаем preview сервер
echo 🚀 Запускаем продакшен версию...
echo.
echo Приложение будет доступно по адресу: http://localhost:4173
echo Для остановки нажмите Ctrl+C
echo.

call npm run preview

pause
