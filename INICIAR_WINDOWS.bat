@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Instale o Node.js 22 ou superior antes de continuar.
 pause
 exit /b 1
)
call npm run configurar
if errorlevel 1 goto erro
if not exist backend\node_modules (
 call npm --prefix backend ci
 if errorlevel 1 goto erro
)
if not exist frontend\node_modules (
 call npm --prefix frontend ci
 if errorlevel 1 goto erro
)
echo Ligue o MySQL no XAMPP e importe database\techassistpro.sql antes de usar o sistema.
start "TechAssist API" /D "%~dp0backend" cmd /k npm run dev
start "TechAssist Frontend" /D "%~dp0frontend" cmd /k npm run dev
echo Acesse http://localhost:3000 quando o Next.js estiver pronto.
pause
exit /b 0
:erro
echo Nao foi possivel iniciar. Confira as instrucoes no README.md.
pause
exit /b 1
