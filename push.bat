@echo off
git add .
git status --short
set /p msg="Commit message: "
git commit -m "%msg%"
git push
echo Done.
pause
