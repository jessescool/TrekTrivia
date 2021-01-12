#!/bin/zsh

# A script for pushing code changes AND new questions to web server

# updating startrekdata.csv
ipy desposit.py

# syncing with server (not clear whether -del would work, too)
rsync -rv --delete-before ../ $MEME9/TrekTrivia/

	# rsync versions are different...
	# maybe do -del?
	# would -a do something useful?
