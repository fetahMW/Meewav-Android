param(
  [Parameter(Mandatory)][ValidateSet('hierarchy', 'test')][string]$Operation,
  [string]$Flow,
  [string]$OutputDirectory
)

# Luna B has no parameter that can select another device.
$argsForRun = @{ Actor = 'B'; Operation = $Operation }
if ($Flow) { $argsForRun.Flow = $Flow }
if ($OutputDirectory) { $argsForRun.OutputDirectory = $OutputDirectory }
& (Join-Path $PSScriptRoot '..\integration-run1\invoke-maestro.ps1') @argsForRun
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
