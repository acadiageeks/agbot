#!/bin/bash

cd /home/tom/code/agbot
pm2 stop agbot
git pull
npm ci
pm2 start agbot