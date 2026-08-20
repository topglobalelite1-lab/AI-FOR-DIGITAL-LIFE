Add-Type -AssemblyName System.IO
$src = 'c:\Users\WINDOWS 10\Documents\YCWC\content.css'
$tmp = 'c:\Users\WINDOWS 10\Documents\YCWC\content_tmp.css'

# Create the temp file first
New-Item -Path $tmp -ItemType File -Force | Out-Null

$lines = [System.IO.File]::ReadAllLines($src)
$cutLine = 1897
$kept = $lines[0..($cutLine - 1)]
[System.IO.File]::WriteAllLines($tmp, $kept)
Write-Host "Written $($kept.Count) lines to temp file: $tmp"
