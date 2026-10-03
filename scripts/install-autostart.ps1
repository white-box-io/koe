$projectDir = Split-Path -Parent $PSScriptRoot
$appExe = Join-Path $projectDir 'app\src-tauri\target\release\koe.exe'
$startupDir = [Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startupDir 'Koe.lnk'

if (-not (Test-Path $appExe)) {
    Write-Output "Build the app first: cd app; npx tauri build --no-bundle"
    exit 1
}

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $appExe
$shortcut.Arguments = ''
$shortcut.WorkingDirectory = $projectDir
$shortcut.Description = 'Koe voice companion for Claude Code'
$shortcut.Save()

Write-Output "Autostart now launches: $appExe"
