@echo off
cd /d C:\Users\mappo\source\repos\SawaRh
if exist "apps\web\.next" rmdir /s /q "apps\web\.next"
if exist "apps\web\.next-dev" rmdir /s /q "apps\web\.next-dev"
npx pnpm --filter @sawa-rh/web dev > C:\Users\mappo\source\repos\SawaRh\web-start.log 2>&1
