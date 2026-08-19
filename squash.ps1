# Squash all commits into one clean commit and force push
# Run this from the portfolio folder: powershell -ExecutionPolicy Bypass -File squash.ps1

$ErrorActionPreference = "Stop"

Write-Host "Squashing all commits into one clean commit..."

# get the root commit (first one)
$root = git rev-list --max-parents=0 HEAD 2>$null
if (-not $root) { Write-Host "No commits found"; exit 1 }

# soft reset to root so all changes are staged
git reset --soft $root

# amend into one clean commit
git commit --amend -m "Initial portfolio for Skulls321" -m "Dark blue on black developer portfolio with interactive hero, model catalog, showcase video, plugins section, and music player."

# force push
Write-Host "Force pushing to remote..."
git push --force origin main

Write-Host "Done. All history squashed into one clean commit."
git log --oneline
