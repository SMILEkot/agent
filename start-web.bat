@echo off
echo ========================================
echo    AI Agent - Запуск веб-версии
echo ========================================
echo.

echo ✅ Node.js найден

echo.
echo 🔍 Проверяем зависимости...
if not exist "node_modules" (
    echo ❌ Зависимости не установлены!
    echo 💡 Запустите setup-web.bat для установки
    pause
    exit /b 1
)

echo ✅ Зависимости найдены

echo.
echo 🚀 Запускаем AI Agent Desktop (веб-версия)...
echo.
echo 🌐 Приложение откроется в браузере на http://localhost:5173
echo 💡 Для остановки нажмите Ctrl+C
echo.

npm run dev

echo.
echo 💡 Для перезапуска используйте start-web.bat
echo.
pause

