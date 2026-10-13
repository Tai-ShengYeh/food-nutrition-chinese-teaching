param([Parameter(Mandatory=$true)][string]$Folder)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$cache = Join-Path $Folder '.render-cache'
New-Item -ItemType Directory -Force -Path $cache | Out-Null
$data = Get-Content -LiteralPath (Join-Path $Folder 'storyboard.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice('Microsoft Hanhan Desktop')
$s.Rate = -1
try {
 for ($i=0; $i -lt $data.scenes.Count; $i++) {
  $s.SetOutputToWaveFile((Join-Path $cache ('speech-{0:D3}.wav' -f $i)))
  $s.Speak($data.scenes[$i].speech)
  $s.SetOutputToNull()
 }
} finally { $s.Dispose() }
