@echo off
cd /d "%~dp0.."
set "COREPACK_HOME=%CD%\.corepack"
set "CI=true"
corepack pnpm dev -H 127.0.0.1 >> "%CD%\dev-server.out.log" 2>> "%CD%\dev-server.err.log"
