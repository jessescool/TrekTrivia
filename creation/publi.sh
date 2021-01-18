#!/bin/zsh

# A script for pushing code changes AND new questions to web server

# updating startrekdata.csv
# ipy desposit.py

# syncing with server (not clear whether -del would work, too)
# rsync -rv --delete-before ../ $MEME9/TrekTrivia/

	# rsync versions are different...
	# maybe do -del?
	# would -a do something useful?

#---- an archaic version ----

# this is not dynamic whatsoever
# must be run from inside creation
# doesn't create new vault...

ssh admin@summitdesktops.com 'cd /var/www/meme9.com/TrekTrivia ; rm -rf *'
echo "---deleted files on server---"

scp -r /Users/jessecool/Library/Mobile\ Documents/com~apple~CloudDocs/Projects/TrekTrivia/* admin@summitdesktops.com:/var/www/meme9.com/TrekTrivia
echo "---copied new files to server---"
