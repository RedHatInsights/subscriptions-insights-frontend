pipeline {
    agent { label 'insights' }
    options {
        timestamps()
    }

    stages {
        stage('Ephemeral testing stage') {
            steps {
                sh "echo 'ephemeral testing stage'"
            }
        }

        stage('Build stage') {
            steps {
                sh "echo 'build stage'"
            }
        }

        stage('Deploy stage') {
            steps {
                sh "echo 'deploy stage'"
            }
        }
    }
}
