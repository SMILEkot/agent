@echo off
chcp 65001 >nul
echo ========================================
echo    AI Agent Desktop - Запуск
echo ========================================
echo.

echo ✅ Node.js найден

echo.
echo 🔍 Проверяем зависимости...
if not exist "node_modules" (
    echo ❌ Зависимости не установлены!
    echo 💡 Запустите setup.bat для установки
    pause
    exit /b 1
)

echo ✅ Зависимости найдены

echo.
echo 🚀 Запускаем AI Agent Desktop...
echo.
echo 🖥️ Приложение откроется в отдельном окне
echo 💡 Для остановки нажмите Ctrl+C
echo.

npm run electron:dev

echo.
echo 💡 Для перезапуска используйте start.bat
echo.
pause

