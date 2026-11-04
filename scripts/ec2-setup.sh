#!/usr/bin/env bash
# One-command setup script for Ubuntu 22.04 / 24.04 AWS EC2 instance.
# Installs Docker, Docker Compose v2, Java 21, and Jenkins LTS (on Port 8080),
# and starts the CloudTasks Pro stack on Port 8081, 3000, and 4000.
# Usage: chmod +x scripts/ec2-setup.sh && sudo ./scripts/ec2-setup.sh
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

echo "=== [1/4] Updating Ubuntu packages and installing dependencies ==="
apt-get update -y
apt-get install -y ca-certificates curl gnupg fontconfig openjdk-21-jre-headless git

echo "=== [2/4] Installing Docker Engine & Docker Compose ==="
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker
usermod -aG docker ubuntu || true

echo "=== [3/4] Installing Jenkins LTS (Port 8080) ==="
if ! systemctl list-unit-files | grep -q '^jenkins.service'; then
  install -d -m 0755 /etc/apt/keyrings
  curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key -o /etc/apt/keyrings/jenkins-keyring.asc
  echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" \
    > /etc/apt/sources.list.d/jenkins.list
  apt-get update -y
  apt-get install -y jenkins
fi

usermod -aG docker jenkins
systemctl enable --now jenkins
systemctl restart jenkins

echo "=== [4/4] Building & Starting CloudTasks Pro on Port 8081, 3000, 4000 ==="
docker compose up -d --build

EC2_IP=$(curl -s --max-time 5 http://checkip.amazonaws.com || hostname -I | awk '{print $1}')
echo ""
echo "=================================================================="
echo "✅ EC2 SERVER & APP STACK READY!"
echo "------------------------------------------------------------------"
echo "🌐 Main Web App (Nginx Port 8081):  http://${EC2_IP}:8081"
echo "🖥️ Web UI Direct (Port 3000):       http://${EC2_IP}:3000"
echo "⚙️ REST API Health (Port 4000):     http://${EC2_IP}:4000/api/health"
echo "🔧 Jenkins CI/CD (Port 8080):       http://${EC2_IP}:8080"
echo "------------------------------------------------------------------"
echo "Jenkins Initial Admin Password:"
cat /var/lib/jenkins/secrets/initialAdminPassword || true
echo "------------------------------------------------------------------"
echo "Make sure your AWS EC2 Security Group allows Inbound TCP ports:"
echo "   22 (SSH), 8081 (Main App), 3000 (Web UI), 4000 (REST API), 8080 (Jenkins)"
echo "=================================================================="
