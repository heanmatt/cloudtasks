#!/usr/bin/env bash
# Verifies all running containers and ports (8081, 3000, 4000) on the EC2 host.
# Usage: ./scripts/verify.sh [HOST_IP]
set -euo pipefail

HOST="${1:-$(curl -s --max-time 3 http://checkip.amazonaws.com || echo 127.0.0.1)}"

echo "== 1. Nginx Gateway Health (Port 8081) =="
curl -fsS "http://${HOST}:8081/nginx-health"

echo "== 2. Web Frontend Health (Port 3000) =="
curl -fsS "http://${HOST}:3000/health"; echo

echo "== 3. REST API Health (Port 4000) =="
curl -fsS "http://${HOST}:4000/api/health"; echo

echo "== 4. REST API Analytics Stats (Port 4000) =="
curl -fsS "http://${HOST}:4000/api/stats"; echo

echo ""
echo "=================================================================="
echo "LIVE TEACHER LINKS FOR HOST ${HOST}:"
echo "  - Main App (Port 8081):    http://${HOST}:8081"
echo "  - Web Service (Port 3000): http://${HOST}:3000"
echo "  - API Health (Port 4000):  http://${HOST}:4000/api/health"
echo "  - API Tasks (Port 4000):   http://${HOST}:4000/api/tasks"
echo "  - Jenkins (Port 8080):     http://${HOST}:8080"
echo "=================================================================="
