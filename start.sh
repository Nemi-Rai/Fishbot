#!/bin/bash

# Start your Node.js program using PM2
# Replace 'your_script.js' with the path to your Node.js program
pm2 start index.js --name fishbot

# Automatically restart the app if it crashes
pm2 restart fishbot --watch
