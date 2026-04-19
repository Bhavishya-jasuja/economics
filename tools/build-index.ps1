# Rebuild index.html from partials/*.html
# Usage (from repo root):  powershell -NoProfile -ExecutionPolicy Bypass -File tools/build-index.ps1
# Commit both partials/ and the generated index.html so static hosts work without a build step.
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$parts = @(
    'partials/00-head.html',
    'partials/01-background.html',
    'partials/02-nav.html',
    'partials/03-section-about.html',
    'partials/04-section-results.html',
    'partials/04b-section-marks-submit.html',
    'partials/05-section-courses.html',
    'partials/06-section-memories.html',
    'partials/07-section-testimonials.html',
    'partials/08-section-contact.html',
    'partials/09-footer.html',
    'partials/10-scripts.html'
)

$outPath = Join-Path $repoRoot 'index.html'
$utf8 = New-Object System.Text.UTF8Encoding $false
$sb = New-Object System.Text.StringBuilder
foreach ($rel in $parts) {
    $path = Join-Path $repoRoot $rel
    if (-not (Test-Path $path)) { throw "Missing partial: $rel" }
    $text = [System.IO.File]::ReadAllText($path).TrimEnd("`r", "`n")
    [void]$sb.AppendLine($text)
    [void]$sb.AppendLine()
}
[System.IO.File]::WriteAllText($outPath, $sb.ToString().TrimEnd() + "`r`n", $utf8)
Write-Host "OK: $outPath"
