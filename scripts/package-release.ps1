# Builds release/Koe-v<version>-windows-x64.zip: koe.exe, uv.exe and the voice engine source.
# The engine's Python packages are installed by Koe itself on first launch.

param([string]$Version = "0.1.0")

$ErrorActionPreference = "Stop"
$projectDir = Split-Path -Parent $PSScriptRoot
$releaseDir = Join-Path $projectDir "release"
$packageDir = Join-Path $releaseDir "Koe"
$engineDir = Join-Path $packageDir "engine"
$zipPath = Join-Path $releaseDir "Koe-v$Version-windows-x64.zip"
$uvZipUrl = "https://github.com/astral-sh/uv/releases/latest/download/uv-x86_64-pc-windows-msvc.zip"

Write-Output "Building koe.exe"
Push-Location (Join-Path $projectDir "app")
npx tauri build --no-bundle
if ($LASTEXITCODE -ne 0) { throw "tauri build failed" }
Pop-Location

Write-Output "Collecting files"
if (Test-Path $releaseDir) { Remove-Item $releaseDir -Recurse -Force }
New-Item -ItemType Directory -Force $engineDir | Out-Null
Copy-Item (Join-Path $projectDir "app\src-tauri\target\release\koe.exe") $packageDir
Copy-Item (Join-Path $projectDir "pyproject.toml"), (Join-Path $projectDir "uv.lock") $engineDir
Copy-Item (Join-Path $projectDir "src") $engineDir -Recurse
Get-ChildItem $engineDir -Recurse -Directory -Filter "__pycache__" | Remove-Item -Recurse -Force
Copy-Item (Join-Path $projectDir "LICENSE") $packageDir

Write-Output "Downloading uv"
$uvZip = Join-Path $releaseDir "uv.zip"
Invoke-WebRequest $uvZipUrl -OutFile $uvZip
Expand-Archive $uvZip -DestinationPath (Join-Path $releaseDir "uv")
Copy-Item (Join-Path $releaseDir "uv\uv.exe") $packageDir
Remove-Item $uvZip, (Join-Path $releaseDir "uv") -Recurse -Force

$readme = @'
Koe - talk to Claude Code on Windows

1. Keep this whole folder together, anywhere you like (for example C:\Koe).
2. Double-click koe.exe.
3. The first launch installs the voice engine (about 3 GB, once) and the
   speech models (about 800 MB, once). This can take 10-20 minutes.
4. Hold Right Ctrl and talk to Claude Code.

More help: https://github.com/white-box-io/koe
'@
Set-Content -Path (Join-Path $packageDir "README.txt") -Value $readme -Encoding UTF8

Write-Output "Zipping"
Compress-Archive -Path $packageDir -DestinationPath $zipPath
$sizeMb = [math]::Round((Get-Item $zipPath).Length / 1MB, 1)
Write-Output "Done: $zipPath ($sizeMb MB)"
