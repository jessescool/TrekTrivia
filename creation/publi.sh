#!/bin/zsh

# A script for pushing code changes AND new questions to web server
# must be run from inside creation

python3 deposit.py

rsync -av --delete \
  --exclude .git --exclude .gitignore --exclude CLAUDE.md --exclude creation --exclude scratch --exclude .DS_Store \
  ../ admin@summitdesktops.com:/var/www/meme9.com/TrekTrivia/
echo "---synced with server---"
