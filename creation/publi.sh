#!/bin/bash

# A script for pushing code changes AND new questions to web server
# Takes a relative pathname ../

# removing...
echo "removing"

# replacing...
# scp -r ../* $MEME9/TrekTrivia

# maybe just normal scp will work... but need overwrite.
# try RSYNC

rsync -av --delete ../ $MEME9/TrekTrivia
# I'm unsure about the slashes after the directory names, as well as the need for -a, -v, and whether meme9 has rsync installed.
