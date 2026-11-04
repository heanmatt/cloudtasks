# CloudTasks Pro (v2.1) — AWS EC2 (:8081) & Jenkins CI/CD (:8080)

**GROUP-03 · Cloud Computing & DevOps Project**

CloudTasks Pro is a multi-container web application deployed automatically on an **AWS EC2 Ubuntu Host** using **GitHub**, **Jenkins CI/CD (Port `:8080`)**, and **Docker Compose (Port `:8081`, `:3000`, `:4000`)**.
- **No Port 8080 Conflict:** Jenkins uses `:8080`, while the Nginx Reverse Proxy Main App runs on **`:8081`**.
- **Excluded per Instructor Guidelines:** Terraform and Docker Swarm have been removed for a fast, single-host EC2 workflow.

---

## Live Ports on AWS EC2 (Send These Links to Your Teacher)

| Service | Container Name | EC2 Port | Live URL Format to Send to Teacher |
|---|---|---|---|
| **Main Web App (Nginx Proxy)** | `cloudtasks-nginx` | **8081** | `http://<52.74.218.180>:8081` |
| **Web Frontend UI (Direct)** | `cloudtasks-web` | **3000** | `http://<52.74.218.180>:3000` |
| **REST API Health & JSON** | `cloudtasks-api` | **4000** | `http://<52.74.218.180>:4000/api/health` |
| **REST API All Tasks JSON** | `cloudtasks-api` | **4000** | `http://<52.74.218.180>:4000/api/tasks` |
| **Jenkins CI/CD Dashboard** | Host Service | **8080** | `http://<52.74.218.180>:8080` |
| **Redis Persistent Store** | `cloudtasks-redis` | Internal `6379` | Accessed internally by `api` |

---

## 6-Tab Enterprise Web Application (`http://<EC2_PUBLIC_IP>:8081`)

1. **📊 1. Dashboard Overview:** Real-time KPI summary cards (Total Tasks, In Progress, Completed Rate, High Priority), Quick Add Task form, and Live EC2 Port Gateway status strip.
2. **✅ 2. Task Manager:** Full CRUD task management with Categories (`DevOps`, `Cloud EC2`, `Backend API`, `Frontend UI`, `Documentation`), Priorities (`High`, `Medium`, `Low`), Workflow Stages (`To Do`, `In Progress`, `Completed`), Assignees, and instant search/filtering.
3. **📋 3. Kanban Board:** Interactive 3-column board (`To Do`, `In Progress`, `Completed`) with one-click stage transitions.
4. **📈 4. Analytics & Reports:** Visual completion progress bars by category, priority breakdown, team workload allocation, and JSON report export.
5. **🌐 5. EC2 Ports & Teacher Links:** Automatic detection of your EC2 Public IP with clickable URLs for every exposed port (`:8081`, `:3000`, `:4000`, `:8080`), one-click "Copy Links for Teacher", and a 12-request live container health probe.
6. **📖 6. Setup Guide (Port 8081):** Built-in copy-paste terminal commands for GitHub Push, AWS Security Group ports, EC2 installation, and Jenkins pipeline setup.

---

## Quick Start (Local or Direct on EC2)

```bash
docker compose up -d --build
```

Then open:
- Main Application (Nginx Port 8081): `http://localhost:8081` (or `http://<EC2_PUBLIC_IP>:8081`)
- Web UI Direct (Port 3000): `http://localhost:3000`
- REST API Health (Port 4000): `http://localhost:4000/api/health`

See **[SETUP-GUIDE.md](SETUP-GUIDE.md)** and **`docs/CloudTasks_Project_Report_v2.docx`** inside this folder for the complete step-by-step instructions and formal report.
