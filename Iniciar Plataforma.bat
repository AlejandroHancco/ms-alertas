@echo off
title Plataforma Comunicados - Upgrade MS
cd /d "%~dp0"

REM Crea la base de datos la primera vez
if not exist "upgrade_ms.db" (
  echo Creando base de datos por primera vez...
  python import_excel.py --reset
)

echo.
echo ================================================
echo   Plataforma de Comunicados - Upgrade MS
echo   Abriendo en: http://localhost:8765
echo   (Deja esta ventana abierta mientras la usas)
echo ================================================
echo.

start "" "http://localhost:8765"
python app.py 8765
pause
