$projectDir = Split-Path -Parent $PSScriptRoot
$startupDir = [Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startupDir 'Koe.lnk'

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = Join-Path $projectDir '.venv\Scripts\pythonw.exe'
$shortcut.Arguments = '-m koe'
$shortcut.WorkingDirectory = $projectDir
$shortcut.Description = 'Koe voice companion for Claude Code'
$shortcut.Save()

Write-Output "Autostart added: $shortcutPath"
