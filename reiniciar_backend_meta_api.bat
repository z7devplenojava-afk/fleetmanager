@echo off
echo ========================================
echo  REINICIANDO BACKEND COM META CLOUD API
echo ========================================
echo.

cd /d C:\dev\fluxbus\backend

echo [PASSO 1] Limpando compilacao anterior...
call mvnw clean

echo.
echo [PASSO 2] Recompilando com novas configuracoes...
call mvnw compile

echo.
echo [PASSO 3] Iniciando backend...
echo.
echo ========================================
echo  BACKEND INICIANDO...
echo ========================================
echo.
echo Verifique os logs abaixo para confirmar:
echo - Meta WhatsApp Cloud API configurada
echo - Phone Number ID carregado
echo - Access Token carregado
echo.

call mvnw spring-boot:run

