
param([string]$JobsFile, [int]$Rate)
Add-Type -AssemblyName System.Speech
$jobs = Get-Content -Raw -Encoding UTF8 $JobsFile | ConvertFrom-Json
foreach ($j in $jobs) {
  $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
  if ($j.voice) { try { $s.SelectVoice($j.voice) } catch { } }
  $s.Rate = $Rate
  $s.SetOutputToWaveFile($j.file)
  $s.Speak($j.text)
  $s.Dispose()
}
