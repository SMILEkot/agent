@echo off
echo ========================================
echo    AI Agent - Сборка для продакшена
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

:: Собираем проект
echo 🔨 Собираем проект...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Ошибка при сборке!
    pause
    exit /b 1
)

echo.
echo ✅ Проект успешно собран!
echo 📁 Файлы находятся в папке 'dist'
echo.
echo Для запуска собранной версии используйте: serve.bat
echo.

pause
