$content = Get-Content build.gradle
$content = $content -replace "url 'https://www.jitpack.io'", "url = 'https://www.jitpack.io'"
$content | Set-Content build.gradle
Write-Host "Fixed root build.gradle"
