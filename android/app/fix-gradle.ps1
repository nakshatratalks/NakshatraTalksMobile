$content = Get-Content build.gradle
$content = $content -replace 'ndkVersion rootProject', 'ndkVersion = rootProject'
$content = $content -replace 'buildToolsVersion rootProject', 'buildToolsVersion = rootProject'
$content = $content -replace 'compileSdk rootProject', 'compileSdk = rootProject'
$content = $content -replace "namespace 'com.ramachandraaps", "namespace = 'com.ramachandraaps"
$content = $content -replace "applicationId 'com.ramachandraaps", "applicationId = 'com.ramachandraaps"
$content = $content -replace 'signingConfig signingConfigs', 'signingConfig = signingConfigs'
$content = $content -replace 'shrinkResources enableShrinkResources', 'shrinkResources = enableShrinkResources'
$content = $content -replace 'crunchPngs enablePngCrunchInRelease', 'crunchPngs = enablePngCrunchInRelease'
$content = $content -replace 'checkReleaseBuilds false', 'checkReleaseBuilds = false'
$content = $content -replace 'abortOnError false', 'abortOnError = false'
$content = $content -replace 'useLegacyPackaging enableLegacyPackaging', 'useLegacyPackaging = enableLegacyPackaging'
$content = $content -replace "ignoreAssetsPattern '!", "ignoreAssetsPattern = '!"
$content | Set-Content build.gradle
Write-Host "Fixed app/build.gradle"
