# Grep gate: prevent Supabase reintroduction in kaboo-fe (PowerShell)
# Exit with error if any Supabase references are found in source files

$ErrorActionPreference = "Stop"
$PATTERN = "supabase"
$DIRS = @("src", "public")
$EXCLUDES = @("node_modules", ".next", "dist", "build")

Write-Host "Checking for Supabase references in kaboo-fe..."

$found = $false
foreach ($dir in $DIRS) {
  if (Test-Path $dir) {
    $files = Get-ChildItem -Path $dir -Recurse -Include "*.ts","*.tsx","*.js","*.json","*.md" -Exclude $EXCLUDES
    foreach ($file in $files) {
      $content = Get-Content $file.FullName -Raw
      if ($content -match $PATTERN) {
        Write-Host "ERROR: Found Supabase reference in $($file.FullName)"
        $found = $true
      }
    }
  }
}

if ($found) {
  Write-Host "FAILED: Supabase references detected. Please remove them."
  exit 1
} else {
  Write-Host "OK: No Supabase references found."
  exit 0
}
