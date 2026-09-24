param(
  [string]$DeviceA = 'emulator-5570',
  [string]$DeviceB = 'emulator-5572',
  [switch]$SkipLogin,
  [switch]$SkipInstall
)

$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
$emulator = Join-Path $env:LOCALAPPDATA 'Android\Sdk\emulator\emulator.exe'
$apk = Join-Path $repo 'app\build\outputs\apk\debug\app-debug.apk'
$results = Join-Path $repo 'app\build\messaging-dual-agent'

if ($DeviceA -notmatch '^emulator-(\d+)$' -or $DeviceB -notmatch '^emulator-(\d+)$' -or $DeviceA -eq $DeviceB) {
  throw 'Choose two distinct Android emulator serials (for example emulator-5570 and emulator-5572).'
}
$portA = [int]($DeviceA -replace '^emulator-', '')
$portB = [int]($DeviceB -replace '^emulator-', '')
if ($portA % 2 -ne 0 -or $portB % 2 -ne 0) { throw 'Android emulator console ports must be even.' }
if (-not (Test-Path -LiteralPath $adb)) { throw 'Android SDK adb not found.' }
if (-not (Test-Path -LiteralPath $apk)) { throw 'Debug APK missing; build :app:assembleDebug first.' }

function Wait-Device([string]$serial) {
  $deadline = (Get-Date).AddMinutes(4)
  while ((Get-Date) -lt $deadline) {
    $state = (& $adb -s $serial get-state 2>$null) -join ''
    if ($state -eq 'device') {
      $booted = (& $adb -s $serial shell getprop sys.boot_completed 2>$null) -join ''
      if ($booted.Trim() -eq '1') { return }
    }
    Start-Sleep -Seconds 3
  }
  throw "$serial did not boot within four minutes."
}

function Start-EmulatorIfNeeded([string]$serial, [string]$avd) {
  $state = (& $adb -s $serial get-state 2>$null) -join ''
  if ($state -ne 'device') {
    if (-not (Test-Path -LiteralPath $emulator)) { throw 'Android emulator executable not found.' }
    $port = [int]($serial -replace '^emulator-', '')
    Start-Process -FilePath $emulator -ArgumentList @('-avd', $avd, '-port', $port, '-no-window', '-no-audio', '-gpu', 'swiftshader_indirect', '-memory', '4096') -WindowStyle Hidden | Out-Null
  }
  Wait-Device $serial
}

Push-Location $repo
try {
  New-Item -ItemType Directory -Path $results -Force | Out-Null
  Start-EmulatorIfNeeded $DeviceA 'Medium_Phone_API_36.1'
  Start-EmulatorIfNeeded $DeviceB 'Meewav_Galaxy_S22_Ultra'
  foreach ($serial in @($DeviceA, $DeviceB)) {
    & $adb -s $serial shell wm size 1080x2400 | Out-Null
    & $adb -s $serial shell wm density 420 | Out-Null
  }

  & node (Join-Path $PSScriptRoot 'provision.mjs')
  if ($LASTEXITCODE -ne 0) { throw 'QA account provisioning failed.' }

  if (-not $SkipInstall) {
    foreach ($serial in @($DeviceA, $DeviceB)) {
      & $adb -s $serial install -r $apk | Out-Null
      if ($LASTEXITCODE -ne 0) { throw "APK install failed on $serial." }
    }
  }

  if (-not $SkipLogin) {
    & (Join-Path $PSScriptRoot 'login.ps1') -Device $DeviceA -AccountIndex 0
    if (-not $?) { throw "LIVE login failed on $DeviceA." }
    & (Join-Path $PSScriptRoot 'login.ps1') -Device $DeviceB -AccountIndex 1
    if (-not $?) { throw "LIVE login failed on $DeviceB." }
  }

  & node (Join-Path $PSScriptRoot 'conversation.mjs') --device-a $DeviceA --device-b $DeviceB
  if ($LASTEXITCODE -ne 0) { throw 'Two-device UI conversation failed; inspect the latest conversation report.' }
  $latest = Get-ChildItem -LiteralPath $results -Directory -Filter 'conversation-*' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $latest) { throw 'Conversation report not found.' }
  $report = Get-Content (Join-Path $latest.FullName 'report.json') -Raw | ConvertFrom-Json
  $aText = @($report.results | Where-Object step -eq 'a_to_b_visual_delivery')[0].marker
  $bText = @($report.results | Where-Object step -eq 'b_to_a_visual_delivery')[0].marker
  $audioName = @($report.results | Where-Object step -eq 'audio_a_to_b_visual_delivery')[0].audioName
  if (-not $aText -or -not $bText -or -not $audioName) { throw 'Conversation report is missing one or more message markers.' }

  & node (Join-Path $PSScriptRoot 'verify.mjs') --dm-a $aText --dm-b $bText --audio-name $audioName --audio-from a
  if ($LASTEXITCODE -ne 0) { throw 'Server-side verification failed or is pending; inspect verification.json.' }
  Write-Output "PASS: two LIVE accounts exchanged two DMs and an audio file. Reports: $latest"
} finally {
  Pop-Location
}
