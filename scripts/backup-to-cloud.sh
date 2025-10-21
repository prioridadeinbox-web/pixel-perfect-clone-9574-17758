#!/bin/bash
# Script para enviar backups para nuvem (Google Drive, Dropbox, S3, etc)
# Requer rclone instalado e configurado
# Instalação: curl https://rclone.org/install.sh | sudo bash

BACKUP_DIR="/home/backups/supabase"
REMOTE_NAME="gdrive"  # Nome do remote configurado no rclone
REMOTE_PATH="Backups/Supabase"
MAX_AGE=7  # Enviar apenas backups dos últimos 7 dias

echo "☁️  Iniciando sincronização com nuvem..."
echo "Data: $(date)"

# Verificar se rclone está instalado
if ! command -v rclone &> /dev/null; then
    echo "❌ Erro: rclone não está instalado"
    echo "Instale com: curl https://rclone.org/install.sh | sudo bash"
    exit 1
fi

# Verificar se o remote está configurado
if ! rclone listremotes | grep -q "^${REMOTE_NAME}:$"; then
    echo "❌ Erro: Remote '$REMOTE_NAME' não configurado"
    echo "Configure com: rclone config"
    exit 1
fi

# Sincronizar backups
echo "📤 Enviando backups para ${REMOTE_NAME}:${REMOTE_PATH}..."

rclone copy $BACKUP_DIR ${REMOTE_NAME}:${REMOTE_PATH} \
    --max-age ${MAX_AGE}d \
    --include "*.backup.gz" \
    --include "*.tar.gz" \
    --include "*.log" \
    --progress \
    --stats 1s

if [ $? -eq 0 ]; then
    echo "✅ Sincronização concluída com sucesso!"
    echo "$(date +%Y-%m-%d\ %H:%M:%S) - Upload para nuvem realizado com sucesso" >> $BACKUP_DIR/backup.log
else
    echo "❌ ERRO durante sincronização com nuvem!"
    echo "$(date +%Y-%m-%d\ %H:%M:%S) - ERRO no upload para nuvem" >> $BACKUP_DIR/backup.log
    exit 1
fi

# Listar arquivos na nuvem
echo "📋 Arquivos na nuvem:"
rclone ls ${REMOTE_NAME}:${REMOTE_PATH}

echo "☁️  Processo de upload concluído!"
