$ErrorActionPreference = "Stop"
$workspace = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $workspace
$env:COREPACK_HOME = Join-Path $workspace ".corepack"
$env:CI = "true"
corepack pnpm dev -H 127.0.0.1 *> (Join-Path $workspace "dev-server.out.log")
