param(
  [Parameter(Mandatory)][ValidatePattern('^emulator-\d+$')][string]$Device,
  [Parameter(Mandatory)][ValidateRange(0,1)][int]$AccountIndex
)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
$accounts = Get-Content (Join-Path $root 'app\build\messaging-dual-agent\accounts.json') -Raw | ConvertFrom-Json
$account = $accounts[$AccountIndex]
if (-not $account -or [string]::IsNullOrWhiteSpace($account.email) -or [string]::IsNullOrWhiteSpace($account.password)) {
  throw "QA account $AccountIndex is missing or incomplete."
}
if ((& $adb -s $Device get-state 2>$null) -ne 'device') { throw "$Device unavailable" }

function Get-Ui {
  for ($attempt = 0; $attempt -lt 3; $attempt++) {
    $ErrorActionPreference = 'Continue'
    & $adb -s $Device shell uiautomator dump /sdcard/qa_messaging_ui.xml 2>$null | Out-Null
    $dumpExit = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    if ($dumpExit -eq 0) {
      $raw = (& $adb -s $Device shell cat /sdcard/qa_messaging_ui.xml 2>$null) -join ''
      if ($raw -match '^<\?xml') { return [xml]$raw }
    }
    Start-Sleep -Seconds 2
  }
  throw "UI hierarchy unavailable on $Device"
}
function Tap-Bounds([string]$bounds) {
  if ($bounds -notmatch '^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$') { throw "Invalid bounds" }
  $x = [int](([int]$Matches[1] + [int]$Matches[3]) / 2)
  $y = [int](([int]$Matches[2] + [int]$Matches[4]) / 2)
  & $adb -s $Device shell input tap $x $y | Out-Null
}
function Wait-Text([string]$label, [int]$seconds = 60) {
  for ($n = 0; $n -lt $seconds; $n += 3) {
    try { $ui = Get-Ui }
    catch { Start-Sleep -Seconds 3; continue }
    $node = $ui.SelectNodes('//node[@text]') | Where-Object { $_.text -eq $label } | Select-Object -First 1
    if ($node) { return $node }
    Start-Sleep -Seconds 3
  }
  throw "Timed out waiting for '$label' on $Device"
}

# A clean launch is essential: the debug launcher otherwise offers DEMO.
& $adb -s $Device shell pm clear com.meewav.android.debug | Out-Null
& $adb -s $Device shell am start -n 'com.meewav.android.debug/com.meewav.android.app.MainActivity' --ez 'com.meewav.android.LIVE_AUTH' true | Out-Null
$login = Wait-Text 'Se connecter' 120
$ui = Get-Ui
$choice = $ui.SelectNodes('//node[@text]') | Where-Object { $_.text -eq 'Application réelle' } | Select-Object -First 1
if ($choice) { Tap-Bounds $choice.bounds; $login = Wait-Text 'Se connecter' 30 }
$ui = Get-Ui
$fields = @($ui.SelectNodes('//node[@class="android.widget.EditText"]'))
if ($fields.Count -lt 2) { throw "LIVE login fields missing on $Device" }
Tap-Bounds $fields[0].bounds
& $adb -s $Device shell input keycombination 113 29 | Out-Null
& $adb -s $Device shell input keyevent 67 | Out-Null
& $adb -s $Device shell input text ([string]$account.email) | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Email entry failed on $Device" }
& $adb -s $Device shell input keyevent 4 | Out-Null
$ui = Get-Ui
$fields = @($ui.SelectNodes('//node[@class="android.widget.EditText"]'))
if ($fields.Count -lt 2) { throw "Password field missing on $Device" }
if ($fields[0].text -ne $account.email) { throw "Email entry mismatch on $Device" }
Tap-Bounds $fields[1].bounds
& $adb -s $Device shell input keycombination 113 29 | Out-Null
& $adb -s $Device shell input keyevent 67 | Out-Null
& $adb -s $Device shell input text ([string]$account.password) | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Password entry failed on $Device" }
$ui = Get-Ui
$fields = @($ui.SelectNodes('//node[@class="android.widget.EditText"]'))
if ($fields.Count -lt 2 -or $fields[0].text -ne $account.email) { throw "Login fields shifted unexpectedly on $Device" }
$login = Wait-Text 'Se connecter' 15
Tap-Bounds $login.bounds
Start-Sleep -Seconds 12
$opened = $false
for ($n = 0; $n -lt 36; $n++) {
  $activity = (& $adb -s $Device shell dumpsys activity activities) -join ''
  if ($activity -match 'topResumedActivity=.*MessagingActivity') { $opened = $true; break }
  if ($n % 4 -eq 0) {
    try {
      $ui = Get-Ui
      $ack = $ui.SelectNodes('//node[@text="Got it"]') | Select-Object -First 1
      if ($ack) { Tap-Bounds $ack.bounds }
      $open = $ui.SelectNodes('//node[@text="Ouvrir la messagerie"]') | Select-Object -First 1
      if ($open) { Tap-Bounds $open.bounds }
    } catch { }
  }
  # The globe is a WebView canvas and may not expose accessibility nodes.
  # Its envelope is at this location on the two dedicated 1080x2400 AVDs.
  & $adb -s $Device shell input tap 94 243 | Out-Null
  Start-Sleep -Seconds 5
}
if (-not $opened) { throw "Messaging Activity did not open after LIVE sign-in on $Device" }
Write-Output "Messaging Activity opened: $Device, account $AccountIndex ($($account.username)); LIVE mode will be confirmed by the WebView test."
