param(
  [ValidateSet('01','01b','01c','02','03','04','05')][string]$Case = '01',
  [string]$Device = '192.168.1.169:36909'
)
$ErrorActionPreference = 'Stop'
$edge = $PSScriptRoot
$repo = (Resolve-Path (Join-Path $edge '..\..\..')).Path
$adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
$maestro = Join-Path $env:USERPROFILE '.maestro\bin\maestro.bat'
$env:JAVA_HOME = 'C:\Program Files\Android\openjdk\jdk-21.0.8'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
$env:ADB_SERVER_PORT = '5038'
$flows = @{
  '01' = 'fast\01-live-mode-boundary.yaml'
  '01b' = 'fast\01b-demo-mode-boundary.yaml'
  '01c' = 'fast\01c-demo-exit.yaml'
  '02' = 'medium\02-webview-native-handoff.yaml'
  '03' = 'medium\03-double-create-idempotence.yaml'
  '04' = 'deep\04-live-wizard-resume.yaml'
  '05' = 'deep\05-feature-stack-accumulation.yaml'
}
$qaTitle = 'QA_EDGE_' + (Get-Date -Format 'yyyyMMdd_HHmmss') + '_' + $Case
$artifact = Join-Path $edge ('artifacts\' + (Get-Date -Format 'yyyyMMdd_HHmmss') + '_' + $Case)
New-Item -ItemType Directory -Path $artifact -Force | Out-Null
function Get-CdpSnapshot {
  $appPid = (& $adb -s $Device shell pidof com.meewav.android.debug).Trim()
  if (-not $appPid) { return $null }
  & $adb -s $Device forward tcp:9223 "localabstract:webview_devtools_remote_$appPid" | Out-Null
  try {
    $raw = (& node (Join-Path $edge 'cdp-state.mjs') 9223) -join "`n"
    if ($LASTEXITCODE -ne 0) { return $null }
    return ($raw | ConvertFrom-Json)
  } finally { & $adb -s $Device forward --remove tcp:9223 | Out-Null }
}
function Capture-Evidence {
  & $adb -s $Device shell screencap -p /sdcard/edge_qa_screen.png | Out-Null
  & $adb -s $Device pull /sdcard/edge_qa_screen.png (Join-Path $artifact 'screen.png') | Out-Null
  & $adb -s $Device shell uiautomator dump /sdcard/edge_qa_ui.xml | Out-Null
  & $adb -s $Device shell ls /sdcard/edge_qa_ui.xml 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) {
    & $adb -s $Device shell cat /sdcard/edge_qa_ui.xml | Set-Content -LiteralPath (Join-Path $artifact 'ui.xml') -Encoding utf8
  } else {
    # Maestro owns Samsung's accessibility automation service during a test.
    # uiautomator can be refused even though Maestro's own hierarchy still works.
    & $maestro --device $Device hierarchy | Set-Content -LiteralPath (Join-Path $artifact 'maestro-hierarchy.json') -Encoding utf8
  }
  & $adb -s $Device shell dumpsys activity activities | Set-Content -LiteralPath (Join-Path $artifact 'activity.txt') -Encoding utf8
  & $adb -s $Device shell dumpsys media.camera | Set-Content -LiteralPath (Join-Path $artifact 'camera.txt') -Encoding utf8
  & $adb -s $Device logcat -d -t 3500 -v time |
    Where-Object { $_ -match 'WaveRTC|AndroidRuntime|ActivityTaskManager|Meewav' -or $_ -match '\b[EW]/.*(chromium|WebView)' } |
    Select-Object -Last 500 |
    ForEach-Object { $_ -replace 'Bearer\s+[^\s]+', 'Bearer [REDACTED]' } |
    Set-Content -LiteralPath (Join-Path $artifact 'logcat.txt') -Encoding utf8
  try { Get-CdpSnapshot | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $artifact 'cdp-state.json') -Encoding utf8 }
  catch { $_.Exception.Message | Set-Content -LiteralPath (Join-Path $artifact 'cdp-error.txt') }
  & $adb -s $Device shell rm -f /sdcard/edge_qa_screen.png /sdcard/edge_qa_ui.xml | Out-Null
}
if ((& $adb -s $Device get-state 2>$null) -ne 'device') { throw "S22 unavailable: $Device" }
$model = (& $adb -s $Device shell getprop ro.product.model).Trim()
if ($model -ne 'SM-S908B') { throw "Unexpected device: $model" }
$stack = (& $adb -s $Device shell dumpsys activity activities) -join "`n"
if ($Case -notin @('01b','01c','04') -and $stack -notmatch '(?s)(?:topResumedActivity=|ResumedActivity:)\s*ActivityRecord\{.{0,180}RoomsActivity') {
  Write-Host 'BLOCKED: open LIVE Rooms with an authenticated QA account before the flow.'
  Write-Host 'No test action or backend write was performed.'
  exit 2
}
if ($Case -notin @('01b','01c','04')) {
  $beforeCdp = Get-CdpSnapshot
  if ($null -eq $beforeCdp -or $beforeCdp.roomsWebViews -eq 0 -or
      @($beforeCdp.pages | Where-Object { -not $_.visibleFixture -or $_.roomsBackendRequests -gt 0 }).Count -eq 0) {
    Write-Host 'BLOCKED: current Rooms WebView is DEMO or LIVE could not be proven.'
    Write-Host 'Sign in to Application réelle and reopen Rooms; no test action was performed.'
    exit 2
  }
}
$beforeRoomsActivities = if ($Case -eq '05') { ([regex]::Matches($stack, '(?s)\* Hist\s+#\d+: ActivityRecord\{[^}]{0,220}RoomsActivity')).Count } else { 0 }
$beforeRoomsWebViews = if ($Case -eq '05') { $beforeCdp.roomsWebViews } else { 0 }
$flow = Join-Path $edge $flows[$Case]
Write-Host "EDGE $Case on $Device — $qaTitle"
& $maestro --device $Device test --no-ansi --no-reinstall-driver --debug-output (Join-Path $artifact 'maestro') -e "QA_ROOM_TITLE=$qaTitle" $flow
$maestroCode = $LASTEXITCODE
if ($maestroCode -eq 0 -and $Case -in @('01','01b','04')) {
  $afterCdp = Get-CdpSnapshot
  $afterCdp | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $artifact 'cdp-state.json') -Encoding utf8
  $livePages = @($afterCdp.pages | Where-Object { -not $_.visibleFixture -and $_.roomsBackendRequests -gt 0 })
  $demoPages = @($afterCdp.pages | Where-Object { $_.visibleFixture -and $_.roomsBackendRequests -eq 0 })
  if (($Case -in @('01','04') -and $livePages.Count -eq 0) -or ($Case -eq '01b' -and $demoPages.Count -eq 0)) {
    $maestroCode = 1
  }
}
if ($maestroCode -eq 0 -and $Case -eq '05') {
  $afterCdp = Get-CdpSnapshot
  $after = (& $adb -s $Device shell dumpsys activity activities) -join "`n"
  $afterRoomsActivities = ([regex]::Matches($after, '(?s)\* Hist\s+#\d+: ActivityRecord\{[^}]{0,220}RoomsActivity')).Count
  $afterRoomsWebViews = if ($null -eq $afterCdp) { -1 } else { $afterCdp.roomsWebViews }
  "beforeRoomsActivities=$beforeRoomsActivities`nafterRoomsActivities=$afterRoomsActivities`nbeforeRoomsWebViews=$beforeRoomsWebViews`nafterRoomsWebViews=$afterRoomsWebViews" |
    Set-Content -LiteralPath (Join-Path $artifact 'stack-counts.txt')
  if ($afterRoomsActivities -gt $beforeRoomsActivities -or $afterRoomsWebViews -gt $beforeRoomsWebViews -or $afterRoomsWebViews -lt 0) { $maestroCode = 1 }
}
if ($maestroCode -eq 0 -and $Case -notin @('01','01b','01c','04')) {
  & node (Join-Path $edge 'backend-check.mjs') $qaTitle 1 | Tee-Object -FilePath (Join-Path $artifact 'backend.json')
  $backendCode = $LASTEXITCODE
  $after = (& $adb -s $Device shell dumpsys activity activities) -join "`n"
  $topOk = $after -match '(?s)(?:topResumedActivity=|ResumedActivity:)\s*ActivityRecord\{.{0,180}WaveMixerActivity'
  $mixerCount = ([regex]::Matches($after, '(?ms)^\s*\* Hist\s+#\d+: ActivityRecord\{[^}]{0,180}WaveMixerActivity')).Count
  "topMixer=$topOk`nmixerActivities=$mixerCount" | Set-Content -LiteralPath (Join-Path $artifact 'native-check.txt')
  if ($backendCode -ne 0 -or -not $topOk -or $mixerCount -ne 1) { $maestroCode = 1 }
}
if ($maestroCode -ne 0) {
  Capture-Evidence
  Write-Host "FAIL: first anomaly; evidence: $artifact"
  exit 1
}
Write-Host "PASS: $Case; evidence summary: $artifact"
