@echo off
title Plataforma Comunicados - Upgrade MS (Postgres local)
cd /d "%~dp0"

REM --- Conexion a PostgreSQL local ---
set PGHOST=127.0.0.1
set PGPORT=5432
set PGUSER=postgres
set PGPASSWORD=root
set PGDATABASE=upgrade_ms
set PGSSLMODE=disable

echo.
echo ================================================
echo   Plataforma de Comunicados - Upgrade MS
echo   Base de datos: PostgreSQL local (%PGDATABASE%)
echo   Abriendo en: http://localhost:8765
echo   (Deja esta ventana abierta mientras la usas)
echo ================================================
echo.

REM --- Dependencias (rapido si ya estan instaladas) ---
python -m pip install -q -r requirements.txt

start "" "http://localhost:8765"
python app.py 8765
pause
