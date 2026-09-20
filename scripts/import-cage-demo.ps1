param([string]$Source = 'C:/Users/linkw/Documents/rooms/assets/short linkwave/Battle rap, maquette')
$ErrorActionPreference = 'Stop'
$target = Join-Path $PSScriptRoot '../app/src/main/assets/cage-demo'
New-Item -ItemType Directory -Force -Path $target | Out-Null
$clips = [ordered]@{
    'akamalaime' = 'AKAMALAIME #live'; 'naylil' = 'NAYLIL #live'; 'iso' = 'ISO';
    'chil-p' = 'CHIL P'; 'snooper' = ' SNOOPER'; 'rnueve' = 'RNUEVE #2';
    'fenvo-2' = 'FENVO #2'; 'la-2' = 'LA 2'; 'dwrt' = 'DWRT';
    'r-keto' = 'R KETO'; 'fenvo' = 'FENVO'; 'chaka' = 'CHAKA'; 'heptys' = 'HEPTYS'
}
$provenance = @()
foreach ($slug in $clips.Keys) {
    $file = Join-Path $Source ('CHALLENGE QUECHUA 2 ： ' + $clips[$slug] + '.mp4')
    if (!(Test-Path -LiteralPath $file)) { throw "Source manquante : $file" }
    $output = Join-Path $target "$slug.mp4"
    & ffmpeg -hide_banner -loglevel error -y -i $file -map 0:v:0 -map '0:a:0?' -vf 'scale=-2:720,fps=24' -c:v libx264 -preset veryfast -crf 26 -maxrate 1200k -bufsize 2400k -threads 2 -pix_fmt yuv420p -c:a aac -b:a 80k -movflags +faststart -map_metadata -1 $output
    if ($LASTEXITCODE -ne 0) { throw "Conversion impossible : $file" }
    $provenance += [ordered]@{ asset = "$slug.mp4"; source = $file; sourceSha256 = (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash }
    Write-Output "$slug importé"
}
$provenance | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $target 'sources.json') -Encoding utf8
