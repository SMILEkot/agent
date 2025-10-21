@echo off
chcp 65001 >nul
echo ========================================
echo      AI Agent Desktop (Super Simple)
echo ========================================
echo.

echo 🔍 Проверяем Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js не найден!
    echo 💡 Установите Node.js с https://nodejs.org
    pause
    exit /b 1
)
echo ✅ Node.js найден

echo.
echo 🚀 Запускаем сервер...
echo 🌐 Откроется на http://localhost:8000
echo 💡 Для остановки нажмите Ctrl+C
echo.

REM Используем встроенный Python сервер (если есть Python)
python -m http.server 8000 >nul 2>&1
if %errorlevel% neq 0 (
    REM Если Python нет, используем Node.js
    echo 📦 Запускаем через Node.js...
    node -e "require('http').createServer((req,res)=>{const fs=require('fs');const path=req.url==='/'?'simple-index.html':req.url.slice(1);try{const content=fs.readFileSync(path);res.writeHead(200,{'Content-Type':path.endsWith('.html')?'text/html':'text/plain'});res.end(content)}catch(e){res.writeHead(404);res.end('404 Not Found')}}).listen(8000,()=>console.log('Server: http://localhost:8000'))"
)

pause

