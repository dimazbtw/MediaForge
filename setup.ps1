# MediaForge — instalação (Windows)
#
#   Clica com o botão direito neste ficheiro > "Executar com o PowerShell"
#   ou corre no terminal:   .\setup.ps1
#
# Aceita os mesmos sinalizadores do script Node, ex.:  .\setup.ps1 --with-ffmpeg

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host ''
    Write-Host '  Node.js nao encontrado.' -ForegroundColor Red
    Write-Host '  Instala a versao LTS em https://nodejs.org e volta a correr este script.'
    Write-Host ''
    Read-Host '  Prime Enter para fechar'
    exit 1
}

node scripts/setup.mjs @args
$code = $LASTEXITCODE

# Sem isto a janela fecha-se de imediato quando o script e aberto com duplo clique.
if ($Host.Name -eq 'ConsoleHost' -and -not $env:CI) {
    Write-Host ''
    Read-Host '  Prime Enter para fechar'
}

exit $code
