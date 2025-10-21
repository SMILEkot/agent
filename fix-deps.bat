@echo off
chcp 65001 >nul
echo ========================================
echo    Исправление зависимостей
echo ========================================
echo.

echo 🧹 Полная очистка...
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
echo 📦 Переустанавливаем все зависимости...
call npm install --no-optional --legacy-peer-deps

if %errorlevel% neq 0 (
    echo ❌ Ошибка! Пробуем yarn...
    call npm install -g yarn
    call yarn install
)

echo.
echo ✅ Готово! Теперь запустите start.bat
pause

