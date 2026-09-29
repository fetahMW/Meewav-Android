param([Parameter(Mandatory=$true)][string]$Serial,
      [Parameter(Mandatory=$true)][string]$Flow,
      [Parameter(Mandatory=$true)][string]$OutputDirectory)
$ErrorActionPreference = 'Stop'
$maestroExe = Join-Path $env:USERPROFILE '.maestro\bin\maestro.bat'
if (-not (Test-Path -LiteralPath $maestroExe)) { throw 'Maestro absent.' }
if (-not $env:JAVA_HOME) { $env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr' }
$env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:PATH = (Join-Path $env:ANDROID_HOME 'platform-tools') + ';' + $env:PATH
# Credentials are inherited in environment variables, never passed on the CLI.
& $maestroExe --device $Serial test --debug-output $OutputDirectory $Flow
exit $LASTEXITCODE
