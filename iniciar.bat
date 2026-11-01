@echo off
title Calculadora Salarial - Expo
cd /d "%~dp0"
echo ========================================================
echo   Iniciando Calculadora Salarial en Expo
echo   Abre la app 'Expo Go' en tu celular y escanea el QR
echo ========================================================
call npx.cmd expo start
pause
