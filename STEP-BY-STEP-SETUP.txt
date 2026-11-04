# CloudTasks Pro (v2.1) — Step-by-Step Setup Guide (Port 8081 App & Port 8080 Jenkins)

Why Port `8081`?
Because **Jenkins CI/CD runs on Port `8080`**, the CloudTasks Nginx Reverse Proxy is mapped to **Port `8081`** (`8081:80` in `docker-compose.yml`). This completely eliminates the `port 8080 is already allocated` conflict!

---

## Step 1: Push Project to GitHub

Open a terminal inside this `cloudtasks` folder and push the code to your GitHub repository:

```bash
git init -b main
git add .
git commit -m "feat: CloudTasks Pro v2.1 on port 8081 with Jenkins CI/CD"
git remote add origin https://github.com/heanmatt/cloudtasks.git
git push -u origin main --force
```

---

## Step 2: Configure AWS EC2 Security Group (Open Port 8081, 3000, 4000, 8080)

1. In **AWS Console → EC2 → Instances**, select your Ubuntu EC2 instance (or launch a new Ubuntu 22.04 / 24.04 LTS `t3.small` / `t2.medium` instance).
2. Click the **Security** tab → click your **Security Group** → **Edit inbound rules**.
3. Ensure these **5 Inbound TCP Rules** are added with Source `0.0.0.0/0` (Anywhere-IPv4):
   - **Port `22`** (SSH)
   - **Port `8081`** (Custom TCP — **Main Web App via Nginx Reverse Proxy**)
   - **Port `3000`** (Custom TCP — **Web Frontend Container Direct**)
   - **Port `4000`** (Custom TCP — **Node.js REST API Direct**)
   - **Port `8080`** (Custom TCP — **Jenkins CI/CD Server**)
4. Click **Save rules**.

---

## Step 3: Update or Install on Your AWS EC2 Instance

SSH into your EC2 server:

```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

### Option A: If Jenkins & Docker are ALREADY installed on your EC2
Stop any old containers, pull the new code, and start the stack on Port `8081`:

```bash
# If you already cloned the repo earlier:
cd ~/cloudtasks || git clone https://github.com/heanmatt/cloudtasks.git ~/cloudtasks
cd ~/cloudtasks
git pull origin main

# Make sure jenkins user has Docker permission:
sudo usermod -aG docker jenkins || true
sudo usermod -aG docker ubuntu || true

# Start the containers on Port 8081, 3000, 4000:
sudo docker compose down --remove-orphans
sudo docker compose up -d --build
sudo docker compose ps
```

### Option B: Fresh EC2 Instance (1-Command Full Installer)
If this is a brand-new Ubuntu EC2 server, run `ec2-setup.sh` to install Docker, Jenkins (`:8080`), and start the app (`:8081`):

```bash
git clone https://github.com/heanmatt/cloudtasks.git
cd cloudtasks
chmod +x scripts/ec2-setup.sh scripts/verify.sh
sudo ./scripts/ec2-setup.sh
```

---

## Step 4: Configure & Run Jenkins Pipeline (`http://<EC2_PUBLIC_IP>:8080`)

1. Open `http://<EC2_PUBLIC_IP>:8080` in your browser.
2. Click **New Item** (or open your existing pipeline job and click **Configure**):
   - **Item Name:** `cloudtasks-deploy`
   - **Type:** **Pipeline** → click **OK**.
3. Under **Build Triggers**:
   - Check **GitHub hook trigger for GITScm polling** and/or **Poll SCM** with schedule `H/2 * * * *`.
4. Under **Pipeline**:
   - **Definition:** `Pipeline script from SCM`
   - **SCM:** `Git`
   - **Repository URL:** `https://github.com/heanmatt/cloudtasks.git`
   - **Branch Specifier:** `*/main`
   - **Script Path:** `Jenkinsfile`
5. Click **Save**, then click **Build Now**!

---

## Step 5: Copy & Send These Live Links to Your Teacher

Once the build finishes (or right after `docker compose up -d --build`), open **`http://<EC2_PUBLIC_IP>:8081`** in your browser. You can also click **Tab 5 (🌐 EC2 Ports & Teacher Links)** → **📋 Copy Links for Teacher**:

- **1. Main Web App (Nginx Port 8081):** `http://<EC2_PUBLIC_IP>:8081`
- **2. Direct Web Frontend UI (Port 3000):** `http://<EC2_PUBLIC_IP>:3000`
- **3. Direct REST API Health (Port 4000):** `http://<EC2_PUBLIC_IP>:4000/api/health`
- **4. Direct REST API Tasks JSON (Port 4000):** `http://<EC2_PUBLIC_IP>:4000/api/tasks`
- **5. Direct REST API Stats JSON (Port 4000):** `http://<EC2_PUBLIC_IP>:4000/api/stats`
- **6. Jenkins CI/CD Server (Port 8080):** `http://<EC2_PUBLIC_IP>:8080`
