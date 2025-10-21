#!/bin/bash
# Script de Backup do Storage (arquivos) do Supabase
# Execute via cron job diário

# Configurações
BACKUP_DIR="/home/backups/supabase"
STORAGE_DIR="/var/lib/docker/volumes/supabase_storage_data/_data"
RETENTION_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)

# Criar diretório se não existir
mkdir -p $BACKUP_DIR

# Nome do arquivo de backup
BACKUP_FILE="$BACKUP_DIR/supabase_storage_$DATE.tar.gz"

echo "📦 Iniciando backup do storage..."
echo "Data: $(date)"

# Fazer backup dos arquivos
tar -czf "$BACKUP_FILE" -C "$(dirname $STORAGE_DIR)" "$(basename $STORAGE_DIR)"

# Verificar se o backup foi criado
if [ -f "$BACKUP_FILE" ]; then
    echo "✅ Backup de storage criado com sucesso: $BACKUP_FILE"
    echo "📊 Tamanho: $(du -h $BACKUP_FILE | cut -f1)"
    
    # Registrar no log
    echo "$(date +%Y-%m-%d\ %H:%M:%S) - Backup de storage realizado com sucesso" >> $BACKUP_DIR/backup.log
else
    echo "❌ ERRO: Falha ao criar backup de storage!"
    echo "$(date +%Y-%m-%d\ %H:%M:%S) - ERRO: Backup de storage falhou" >> $BACKUP_DIR/backup.log
    exit 1
fi

# Limpar backups antigos
echo "🧹 Limpando backups de storage com mais de $RETENTION_DAYS dias..."
find $BACKUP_DIR -name "supabase_storage_*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Listar backups disponíveis
echo "📋 Backups de storage disponíveis:"
ls -lh $BACKUP_DIR/supabase_storage_*.tar.gz 2>/dev/null || echo "Nenhum backup encontrado"

echo "✅ Processo de backup de storage concluído!"
