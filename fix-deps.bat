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
if exist "yarn.lock" (
    echo Удаляем yarn.lock...
    del yarn.lock
)

echo.
echo 🔄 Очищаем кэш npm...
call npm cache clean --force

echo.
echo 📦 Переустанавливаем зависимости...
echo (Исправляем проблему с Rollup)

REM Устанавливаем с правильными флагами для Rollup
call npm install --no-optional --legacy-peer-deps --force

if %errorlevel% neq 0 (
    echo.
    echo ❌ Ошибка с npm! Пробуем yarn...
    
    REM Устанавливаем yarn если его нет
    call npm install -g yarn
    
    REM Устанавливаем через yarn (лучше работает с optional dependencies)
    call yarn install --ignore-optional
    
    if %errorlevel% neq 0 (
        echo.
        echo ❌ И yarn не помог! Пробуем принудительную установку...
        
        REM Последняя попытка - устанавливаем Rollup отдельно
        call npm install @rollup/rollup-win32-x64-msvc --save-dev --force
        call npm install --legacy-peer-deps --force
        
        if %errorlevel% neq 0 (
            echo.
            echo ❌ Критическая ошибка установки!
            echo.
            echo 💡 Попробуйте:
            echo 1. Запустить как администратор
            echo 2. Обновить Node.js до последней версии
            echo 3. Перезагрузить компьютер и попробовать снова
            pause
            exit /b 1
        )
    )
)

echo.
echo ✅ Зависимости установлены!
echo.
echo 🔍 Проверяем критические пакеты...

if not exist "node_modules\rollup" (
    echo ❌ Rollup не установлен!
    call npm install rollup --save-dev --force
)

if not exist "node_modules\vite" (
    echo ❌ Vite не установлен!
    call npm install vite --save-dev --force
)

echo ✅ Проверка завершена!
echo.
echo 💡 Теперь запустите start.bat
pause

