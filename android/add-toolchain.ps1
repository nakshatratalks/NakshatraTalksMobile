$content = Get-Content settings.gradle -Raw

# Add toolchainManagement block after pluginManagement
$toolchainBlock = @"
`n
pluginManagement {
  repositories {
    google()
    mavenCentral()
    gradlePluginPortal()
  }
"@

# Find where to insert - after the first pluginManagement opening brace
$newContent = $content -replace '(pluginManagement \{)', "$toolchainBlock"

# Add toolchain management block before plugins
$toolchainMgmt = @"

toolchainManagement {
  jvm {
    javaRepositories {
      repository('foojay') {
        resolverClass = org.gradle.toolchains.foojay.FoojayToolchainResolver
      }
    }
  }
}
"@

$finalContent = $newContent -replace '(plugins \{)', "$toolchainMgmt`n`$1"
$finalContent | Set-Content settings.gradle
Write-Host "Added toolchain configuration"
