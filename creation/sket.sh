#!/bin/zsh

# this is not dynamic whatsoever

ssh admin@summitdesktops.com 'cd /var/www/meme9.com/TrekTrivia ; rm -rf *'
echo "deleted files on server"

scp -r ../* admin@summitdesktops.com:/var/www/meme9.com/TrekTrivia
echo "copied new files to server"
