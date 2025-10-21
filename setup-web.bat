@echo off
echo ========================================
echo    AI Agent - Веб-версия (БЕЗ node-pty)
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
echo 📦 Копируем веб-совместимый package.json...
if exist "package-web.json" (
    copy package-web.json package.json
    echo ✅ package.json обновлен для веб-версии
) else (
    echo ❌ package-web.json не найден!
    pause
    exit /b 1
)

echo.
echo 🔄 Очищаем кэш npm...
call npm cache clean --force

echo.
echo 📦 Устанавливаем веб-совместимые зависимости...
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
        echo 1. Установить Visual Studio Build Tools
        echo 2. Или использовать только веб-версию без Electron
        pause
        exit /b 1
    )
)

echo.
echo ✅ Веб-версия успешно настроена!
echo.
echo 🚀 Доступные команды:
echo   npm run dev        - Запуск веб-версии
echo   npm run build      - Сборка для продакшена
echo   npm run preview    - Предпросмотр сборки
echo.
echo 💡 Веб-версия работает БЕЗ node-pty и Visual Studio Build Tools!
echo.

pause

