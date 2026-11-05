@echo off
cd /d "%~dp0"
node data.js %1
python render.py
