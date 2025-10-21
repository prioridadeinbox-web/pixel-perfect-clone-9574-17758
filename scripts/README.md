# 📦 Scripts de Backup e Restauração - Supabase Auto-hospedado

## 🎯 Objetivo

Estes scripts garantem que seu Supabase auto-hospedado tenha:
- ✅ Backups automáticos diários
- ✅ Cópias na nuvem (redundância)
- ✅ Testes mensais de restauração
- ✅ Logs de auditoria
- ✅ Limpeza automática de backups antigos

---

## 📋 Scripts Disponíveis

| Script | Descrição | Frequência |
|--------|-----------|------------|
| `backup-database.sh` | Backup do PostgreSQL | Diário |
| `backup-storage.sh` | Backup dos arquivos (storage) | Diário |
| `backup-to-cloud.sh` | Upload para nuvem | Diário |
| `restore-database.sh` | Restaura banco de dados | Sob demanda |
| `test-restore.sh` | Testa se backups funcionam | Mensal |

---

## 🚀 Configuração Inicial

### 1. Preparar o ambiente

```bash
# Criar diretório de backups
sudo mkdir -p /home/backups/supabase
sudo chown $USER:$USER /home/backups/supabase

# Copiar scripts
sudo cp scripts/*.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/*.sh
```

### 2. Ajustar variáveis nos scripts

Edite cada script e ajuste:
- `BACKUP_DIR`: Caminho onde os backups serão salvos
- `DB_USER`: Usuário do PostgreSQL
- `DB_HOST`: Host do banco (geralmente `localhost`)
- `STORAGE_DIR`: Caminho dos arquivos do Supabase

### 3. Configurar autenticação do PostgreSQL

Para que os scripts funcionem sem pedir senha, configure o `.pgpass`:

```bash
echo "localhost:5432:*:postgres:SUA_SENHA_AQUI" > ~/.pgpass
chmod 600 ~/.pgpass
```

---

## ⏰ Configurar Cron Jobs (Automação)

Edite o crontab:
```bash
crontab -e
```

Adicione as seguintes linhas:

```bash
# Backup do banco de dados (todos os dias às 2h da manhã)
0 2 * * * /usr/local/bin/backup-database.sh >> /home/backups/supabase/cron.log 2>&1

# Backup do storage (todos os dias às 3h da manhã)
0 3 * * * /usr/local/bin/backup-storage.sh >> /home/backups/supabase/cron.log 2>&1

# Upload para nuvem (todos os dias às 4h da manhã)
0 4 * * * /usr/local/bin/backup-to-cloud.sh >> /home/backups/supabase/cron.log 2>&1

# Teste de restauração (primeiro dia de cada mês às 5h)
0 5 1 * * /usr/local/bin/test-restore.sh >> /home/backups/supabase/cron.log 2>&1
```

Verificar se os cron jobs estão ativos:
```bash
crontab -l
```

---

## ☁️ Configurar Upload para Nuvem (Rclone)

### 1. Instalar Rclone

```bash
curl https://rclone.org/install.sh | sudo bash
```

### 2. Configurar remote (Google Drive exemplo)

```bash
rclone config

# Siga as instruções:
# n) New remote
# name> gdrive
# Storage> drive (Google Drive)
# Configure OAuth...
```

### 3. Testar conexão

```bash
rclone ls gdrive:
```

### 4. Ajustar script

Edite `backup-to-cloud.sh` e defina:
```bash
REMOTE_NAME="gdrive"  # Nome do seu remote
REMOTE_PATH="Backups/Supabase"  # Caminho na nuvem
```

**Outras opções de remote:**
- Dropbox
- Amazon S3
- Microsoft OneDrive
- Backblaze B2
- SFTP

---

## 🧪 Testar Manualmente

### Backup do banco
```bash
/usr/local/bin/backup-database.sh
```

### Backup do storage
```bash
/usr/local/bin/backup-storage.sh
```

### Upload para nuvem
```bash
/usr/local/bin/backup-to-cloud.sh
```

### Teste de restauração
```bash
/usr/local/bin/test-restore.sh
```

---

## 🔄 Restaurar Banco de Dados

**⚠️ ATENÇÃO:** Isso substitui todos os dados!

```bash
# Listar backups disponíveis
ls -lh /home/backups/supabase/supabase_db_*.backup.gz

# Restaurar um backup específico
sudo /usr/local/bin/restore-database.sh /home/backups/supabase/supabase_db_20250107.backup.gz
```

O script:
1. ✅ Cria um backup de segurança antes
2. ✅ Pede confirmação
3. ✅ Desconecta usuários
4. ✅ Restaura o banco
5. ✅ Loga tudo

---

## 📊 Monitoramento

### Ver logs de backup
```bash
tail -f /home/backups/supabase/backup.log
tail -f /home/backups/supabase/cron.log
```

### Verificar espaço em disco
```bash
df -h /home/backups
du -sh /home/backups/supabase/*
```

### Listar backups
```bash
ls -lh /home/backups/supabase/
```

---

## 🔔 Alertas de Falha (Opcional)

Para receber email quando backup falhar, adicione ao final de cada script:

```bash
# Enviar email em caso de falha
if [ $? -ne 0 ]; then
    echo "Backup falhou em $(date)" | mail -s "ERRO: Backup Supabase" seu@email.com
fi
```

Ou use serviços como:
- **Healthchecks.io** (gratuito)
- **UptimeRobot**
- **Cronitor**

---

## 📝 Checklist de Segurança

- [ ] Backups diários funcionando
- [ ] Upload para nuvem configurado
- [ ] Teste de restauração mensal agendado
- [ ] Logs sendo monitorados
- [ ] Alertas de falha configurados
- [ ] Espaço em disco monitorado
- [ ] Backups antigos sendo removidos (rotação)
- [ ] `.pgpass` com permissões corretas (600)
- [ ] Backup da Hostinger como redundância extra

---

## 🆘 Troubleshooting

### Erro: "pg_dump: command not found"
```bash
# Instalar PostgreSQL client
sudo apt install postgresql-client
```

### Erro: "Permission denied"
```bash
# Dar permissão de execução
chmod +x /usr/local/bin/*.sh
```

### Erro: "FATAL: password authentication failed"
```bash
# Verificar ~/.pgpass
cat ~/.pgpass
chmod 600 ~/.pgpass
```

### Backup muito grande
```bash
# Comprimir mais agressivamente
pg_dump ... | gzip -9 > backup.sql.gz
```

---

## 💡 Boas Práticas

1. ✅ **Teste restauração mensalmente** - Backup que não foi testado não é backup
2. ✅ **Mantenha múltiplas cópias** - Local + Nuvem + Hostinger
3. ✅ **Monitore espaço em disco** - Backups consomem espaço
4. ✅ **Rotação automática** - Não acumule backups infinitamente
5. ✅ **Separe dados e arquivos** - Banco e storage em backups diferentes
6. ✅ **Documente tudo** - Anote senhas, paths, configurações
7. ✅ **Criptografe backups sensíveis** - Use GPG se necessário

---

## 📚 Recursos Adicionais

- [Documentação PostgreSQL Backup](https://www.postgresql.org/docs/current/backup.html)
- [Rclone Docs](https://rclone.org/docs/)
- [Cron Guru](https://crontab.guru/) - Helper para expressões cron

---

**Última atualização:** 2025-10-07  
**Projeto:** Prime Capital - Sistema de Trading
