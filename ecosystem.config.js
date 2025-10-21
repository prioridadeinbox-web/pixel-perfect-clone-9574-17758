module.exports = {
  apps: [{
    name: 'trader-app',
    script: 'npm',
    args: 'run dev',
    cwd: '/caminho/para/seu/projeto', // Ajuste o caminho
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    }
  }]
}

