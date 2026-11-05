#!/bin/bash
# 摸鱼日历海报一键生成：./run.sh [YYYY-MM-DD]（不传日期则用今天，北京时间）
set -e
cd "$(dirname "$0")"
node data.js "$1"
./.venv/bin/python render.py
