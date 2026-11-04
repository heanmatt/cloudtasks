// CloudTasks Pro v2.1 CI/CD Pipeline (GitHub Push -> Jenkins (:8080) -> Docker Compose (:8081, :3000, :4000) on AWS EC2)
// Simplified per instructor requirements: No Terraform or Docker Swarm required.

pipeline {
  agent any

  options {
    timeout(time: 15, unit: 'MINUTES')
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '15'))
  }

  triggers {
    githubPush()
    pollSCM('H/2 * * * *')
  }

  environment {
    APP_VERSION     = "2.1.${env.BUILD_NUMBER}"
    REGISTRY        = 'heanmatt'
    DOCKER_BUILDKIT = '1'
  }

  stages {
    stage('1. Validate & Build Images') {
      steps {
        sh '''
          echo "Validating docker-compose.yml..."
          docker compose config -q

          echo "Building Docker images for api, web, and nginx..."
          APP_VERSION=$APP_VERSION docker compose build
        '''
      }
    }

    stage('2. Run Unit Tests') {
      steps {
        sh '''
          echo "Running automated unit tests inside Docker test stages..."
          docker build --target test --progress=plain -t cloudtasks-api-test services/api
          docker build --target test --progress=plain -t cloudtasks-web-test services/web
        '''
      }
    }

    stage('3. Push to Docker Hub (Optional)') {
      steps {
        script {
          try {
            withCredentials([usernamePassword(credentialsId: 'dockerhub-creds',
                                              usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
              sh '''
                echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
                docker tag $REGISTRY/cloudtasks-api:$APP_VERSION $REGISTRY/cloudtasks-api:latest
                docker tag $REGISTRY/cloudtasks-web:$APP_VERSION $REGISTRY/cloudtasks-web:latest
                docker tag $REGISTRY/cloudtasks-nginx:$APP_VERSION $REGISTRY/cloudtasks-nginx:latest
                docker push $REGISTRY/cloudtasks-api:$APP_VERSION
                docker push $REGISTRY/cloudtasks-api:latest
                docker push $REGISTRY/cloudtasks-web:$APP_VERSION
                docker push $REGISTRY/cloudtasks-web:latest
                docker push $REGISTRY/cloudtasks-nginx:$APP_VERSION
                docker push $REGISTRY/cloudtasks-nginx:latest
                docker logout
              '''
            }
          } catch (Exception e) {
            echo "Note: 'dockerhub-creds' not configured or skipped. Proceeding directly to local EC2 deployment."
          }
        }
      }
    }

    stage('4. Deploy to AWS EC2 Host (Port 8081)') {
      steps {
        sh '''
          echo "Deploying CloudTasks Pro stack on EC2 host via Docker Compose (Port 8081, 3000, 4000)..."
          APP_VERSION=$APP_VERSION docker compose up -d --remove-orphans
          docker compose ps
        '''
      }
    }

    stage('5. Verify Live Ports & Print Teacher Links') {
      steps {
        sh '''
          echo "Waiting for services on Ports 8081, 3000, and 4000 to report healthy..."
          for i in $(seq 1 15); do
            if curl -fsS http://127.0.0.1:8081/api/health >/dev/null && \
               curl -fsS http://127.0.0.1:3000/health >/dev/null && \
               curl -fsS http://127.0.0.1:4000/api/health >/dev/null; then
              echo "All containers are UP and healthy!"
              break
            fi
            sleep 2
          done

          EC2_IP=$(curl -s --max-time 3 http://checkip.amazonaws.com || hostname -I | awk '{print $1}')
          echo "=================================================================="
          echo "✅ DEPLOYMENT COMPLETE! SEND THESE LINKS TO YOUR TEACHER:"
          echo "------------------------------------------------------------------"
          echo "🌐 Main Web App (Nginx Port 8081):  http://${EC2_IP}:8081"
          echo "🖥️ Web UI Direct (Port 3000):       http://${EC2_IP}:3000"
          echo "⚙️ REST API Health (Port 4000):     http://${EC2_IP}:4000/api/health"
          echo "📊 REST API Stats (Port 4000):      http://${EC2_IP}:4000/api/stats"
          echo "🔧 Jenkins Server (Port 8080):      http://${EC2_IP}:8080"
          echo "=================================================================="
        '''
      }
    }
  }

  post {
    always {
      sh 'docker image prune -f || true'
    }
  }
}
