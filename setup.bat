@echo off
chcp 65001 >nul
echo ========================================
echo    AI Agent Desktop - Установка
echo ========================================
echo.

echo 🧹 Очищаем старые зависимости...
if exist "node_modules" (
    echo Удаляем node_modules...
    rmdir /s /q node_modules
)

if exist "package-lock.json" (
    echo Удаляем package-lock.json...
    del package-lock.json
)

echo.
echo 🔄 Очищаем кэш npm...
call npm cache clean --force

echo.
echo 📦 Устанавливаем зависимости...
call npm install --no-optional --legacy-peer-deps

if %errorlevel% neq 0 (
    echo.
    echo ❌ Ошибка установки через npm, пробуем yarn...
    echo 📦 Устанавливаем yarn...
    call npm install -g yarn --silent
    
    echo 📦 Устанавливаем зависимости через yarn...
    call yarn install --silent
    
    if %errorlevel% neq 0 (
        echo ❌ Ошибка установки зависимостей!
        echo.
        echo 💡 Попробуйте:
        echo 1. Перезапустить как администратор
        echo 2. Проверить подключение к интернету
        pause
        exit /b 1
    )
)

echo.
echo ✅ Зависимости успешно установлены!
echo 🚀 Теперь можно запускать start.bat
echo.

pause

