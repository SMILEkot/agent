@echo off
echo ========================================
echo     AI Agent - Первоначальная настройка
echo ========================================
echo.

:: Проверяем наличие Node.js
echo 🔍 Проверяем наличие Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js не найден!
    echo.
    echo Пожалуйста, установите Node.js:
    echo 1. Перейдите на https://nodejs.org/
    echo 2. Скачайте LTS версию
    echo 3. Установите и перезапустите этот скрипт
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js найден
node --version
echo.

:: Проверяем наличие npm
echo 🔍 Проверяем наличие npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm не найден!
    echo npm должен устанавливаться вместе с Node.js
    echo.
    pause
    exit /b 1
)

echo ✅ npm найден
npm --version
echo.

:: Устанавливаем зависимости
echo 📦 Устанавливаем зависимости проекта...
echo Это может занять несколько минут...
echo.

call npm install
if %errorlevel% neq 0 (
    echo ❌ Ошибка при установке зависимостей!
    echo.
    echo Попробуйте:
    echo 1. Проверить подключение к интернету
    echo 2. Запустить скрипт от имени администратора
    echo 3. Очистить кэш npm: npm cache clean --force
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Зависимости успешно установлены!
echo.

:: Проверяем сборку
echo 🔨 Проверяем сборку проекта...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Ошибка при сборке проекта!
    pause
    exit /b 1
)

echo.
echo ========================================
echo        🎉 Настройка завершена!
echo ========================================
echo.
echo Доступные команды:
echo.
echo 📝 start.bat    - Запуск в режиме разработки
echo 🔨 build.bat    - Сборка для продакшена  
echo 🚀 serve.bat    - Запуск собранной версии
echo.
echo Для начала работы запустите start.bat
echo.

pause
