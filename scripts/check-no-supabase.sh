#!/bin/bash
# Grep gate: prevent Supabase reintroduction in kaboo-fe
# Exit with error if any Supabase references are found in source files

PATTERN="supabase"
DIRS=("src" "public")
EXCLUDES=("node_modules" ".next" "dist" "build")

echo "Checking for Supabase references in kaboo-fe..."

FOUND=0
for dir in "${DIRS[@]}"; do
  if [ -d "$dir" ]; then
    for exclude in "${EXCLUDES[@]}"; do
      EXCLUDE_ARGS+=("--exclude-dir=$exclude")
    done
    if grep -ri "$PATTERN" "$dir" "${EXCLUDE_ARGS[@]}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" --include="*.md" 2>/dev/null; then
      echo "ERROR: Found Supabase references in $dir"
      FOUND=1
    fi
  fi
done

if [ $FOUND -eq 1 ]; then
  echo "FAILED: Supabase references detected. Please remove them."
  exit 1
else
  echo "OK: No Supabase references found."
  exit 0
fi
