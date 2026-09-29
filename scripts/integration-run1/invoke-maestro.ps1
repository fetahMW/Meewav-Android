param(
  [Parameter(Mandatory)][ValidateSet('A', 'B')][string]$Actor,
  [Parameter(Mandatory)][ValidateSet('hierarchy', 'test')][string]$Operation,
  [string]$Flow,
  [string]$OutputDirectory
)

$ErrorActionPreference = 'Stop'
$targets = @{
  A = @{ Serial = 'emulator-5570'; AdbdPort = 5571 }
  B = @{ Serial = 'emulator-5572'; AdbdPort = 5573 }
}

if ($targets.A.Serial -eq $targets.B.Serial -or $targets.A.AdbdPort -eq $targets.B.AdbdPort -or
    $targets.A.Serial -ne 'emulator-5570' -or $targets.A.AdbdPort -ne 5571 -or
    $targets.B.Serial -ne 'emulator-5572' -or $targets.B.AdbdPort -ne 5573) {
  throw 'RUN 1 target map is invalid: A and B must use separate QA emulators and adbd ports.'
}
if ($Operation -eq 'test' -and [string]::IsNullOrWhiteSpace($Flow)) {
  throw 'A Maestro flow is required for test.'
}
if ($Operation -eq 'hierarchy' -and -not [string]::IsNullOrWhiteSpace($Flow)) {
  throw 'Flow is only valid for test.'
}

$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$artifactRoot = Join-Path $root 'app\build\integration-run1'
New-Item -ItemType Directory -Path $artifactRoot -Force | Out-Null
$lockPath = Join-Path $artifactRoot ("device-$Actor.lock")
$lock = $null
$previousAndroidSerial = $env:ANDROID_SERIAL
try {
  # FileShare.None prevents a second actor or process from driving this device.
  $lock = [System.IO.File]::Open($lockPath, [System.IO.FileMode]::OpenOrCreate,
    [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
} catch [System.IO.IOException] {
  throw "RUN 1 device $Actor is already reserved by another process."
}

try {
  $target = $targets[$Actor]
  # Maestro's adb discovery can still see other emulators after an AVD restart.
  # Keep discovery scoped to the mapped serial while connecting to its direct adbd port.
  $env:ANDROID_SERIAL = $target.Serial
  $maestro = Join-Path $env:USERPROFILE '.maestro\bin\maestro.bat'
  if (-not (Test-Path -LiteralPath $maestro)) { throw "Maestro is missing: $maestro" }
  Write-Output "RUN 1 actor $Actor => $($target.Serial), adbd port $($target.AdbdPort)"

  if ($Operation -eq 'hierarchy') {
    & $maestro --host 127.0.0.1 --port $target.AdbdPort hierarchy
  } else {
    $resolvedFlow = (Resolve-Path -LiteralPath $Flow).Path
    if ($OutputDirectory) {
      New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
      $resolvedOutput = (Resolve-Path -LiteralPath $OutputDirectory).Path
      & $maestro --host 127.0.0.1 --port $target.AdbdPort test --test-output-dir $resolvedOutput $resolvedFlow
    } else {
      & $maestro --host 127.0.0.1 --port $target.AdbdPort test $resolvedFlow
    }
  }
  if ($LASTEXITCODE -ne 0) {
    throw "Maestro $Operation failed for actor $Actor with exit code $LASTEXITCODE"
  }
} finally {
  $env:ANDROID_SERIAL = $previousAndroidSerial
  if ($lock) { $lock.Dispose() }
}
