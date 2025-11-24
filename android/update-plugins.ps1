$content = Get-Content settings.gradle
$newContent = @()
foreach ($line in $content) {
    $newContent += $line
    if ($line -match '^plugins \{') {
        $newContent += '  id("org.gradle.toolchains.foojay-resolver-convention") version "0.8.0"'
    }
}
$newContent | Set-Content settings.gradle
Write-Host "Added foojay-resolver plugin"
