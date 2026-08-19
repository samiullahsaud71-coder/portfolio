@echo off
cd /d "G:\website\portfolio"

echo Wiping old git history...
rmdir /s /q .git

echo Initializing fresh repo...
git init
git branch -M main
git remote add origin https://github.com/samiullahsaud71-coder/portfolio.git

git add -A
git commit -m "Initial portfolio for Skulls321"

echo Pushing to GitHub...
git push -u --force origin main

echo Done.
pause
