#!/bin/bash
# Script de Backup do PostgreSQL para Supabase Auto-hospedado
# Execute via cron job diário

# Configurações
BACKUP_DIR="/home/backups/supabase"
DB_NAME="postgres"
DB_USER="postgres"
DB_HOST="localhost"
RETENTION_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)

# Criar diretório se não existir
mkdir -p $BACKUP_DIR

# Nome do arquivo de backup
BACKUP_FILE="$BACKUP_DIR/supabase_db_$DATE.backup"

echo "📦 Iniciando backup do banco de dados..."
echo "Data: $(date)"

# Fazer dump do banco de dados
pg_dump -U $DB_USER -h $DB_HOST -F c -b -v -f "$BACKUP_FILE" $DB_NAME

# Verificar se o backup foi criado
if [ -f "$BACKUP_FILE" ]; then
    # Comprimir para economizar espaço
    gzip "$BACKUP_FILE"
    echo "✅ Backup criado com sucesso: ${BACKUP_FILE}.gz"
    echo "📊 Tamanho: $(du -h ${BACKUP_FILE}.gz | cut -f1)"
    
    # Registrar no log
    echo "$(date +%Y-%m-%d\ %H:%M:%S) - Backup realizado com sucesso" >> $BACKUP_DIR/backup.log
else
    echo "❌ ERRO: Falha ao criar backup!"
    echo "$(date +%Y-%m-%d\ %H:%M:%S) - ERRO: Backup falhou" >> $BACKUP_DIR/backup.log
    exit 1
fi

# Limpar backups antigos (manter apenas últimos X dias)
echo "🧹 Limpando backups com mais de $RETENTION_DAYS dias..."
find $BACKUP_DIR -name "supabase_db_*.backup.gz" -mtime +$RETENTION_DAYS -delete

# Listar backups disponíveis
echo "📋 Backups disponíveis:"
ls -lh $BACKUP_DIR/supabase_db_*.backup.gz 2>/dev/null || echo "Nenhum backup encontrado"

echo "✅ Processo de backup concluído!"
