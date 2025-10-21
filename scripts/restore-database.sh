#!/bin/bash
# Script de Restauração do Banco de Dados
# ATENÇÃO: Este script restaura o banco de dados. Use com cuidado!

# Verificar se o arquivo de backup foi fornecido
if [ -z "$1" ]; then
    echo "❌ Erro: Forneça o caminho do arquivo de backup"
    echo "Uso: ./restore-database.sh /caminho/para/backup.backup.gz"
    echo ""
    echo "📋 Backups disponíveis:"
    ls -lh /home/backups/supabase/supabase_db_*.backup.gz 2>/dev/null || echo "Nenhum backup encontrado"
    exit 1
fi

BACKUP_FILE="$1"
DB_NAME="postgres"
DB_USER="postgres"
DB_HOST="localhost"
TEMP_DB="postgres_restore_temp"

# Verificar se o arquivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Erro: Arquivo de backup não encontrado: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  ATENÇÃO: Você está prestes a RESTAURAR o banco de dados!"
echo "Arquivo: $BACKUP_FILE"
echo "Isso irá SUBSTITUIR todos os dados atuais do banco."
echo ""
read -p "Deseja continuar? (digite 'sim' para confirmar): " CONFIRMACAO

if [ "$CONFIRMACAO" != "sim" ]; then
    echo "❌ Restauração cancelada."
    exit 0
fi

# Criar backup de segurança antes de restaurar
echo "📦 Criando backup de segurança antes da restauração..."
SAFETY_BACKUP="/home/backups/supabase/pre_restore_$(date +%Y%m%d_%H%M%S).backup"
pg_dump -U $DB_USER -h $DB_HOST -F c -b -v -f "$SAFETY_BACKUP" $DB_NAME
gzip "$SAFETY_BACKUP"
echo "✅ Backup de segurança criado: ${SAFETY_BACKUP}.gz"

# Descompactar se necessário
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "📂 Descompactando backup..."
    UNCOMPRESSED="${BACKUP_FILE%.gz}"
    gunzip -k "$BACKUP_FILE"
    RESTORE_FILE="$UNCOMPRESSED"
else
    RESTORE_FILE="$BACKUP_FILE"
fi

# Restaurar banco de dados
echo "🔄 Iniciando restauração..."
echo "$(date +%Y-%m-%d\ %H:%M:%S) - Iniciando restauração de $BACKUP_FILE" >> /home/backups/supabase/backup.log

# Opção 1: Restaurar em banco limpo (recomendado)
echo "Desconectando usuários do banco..."
psql -U $DB_USER -h $DB_HOST -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"

echo "Dropando banco existente..."
dropdb -U $DB_USER -h $DB_HOST $DB_NAME --if-exists

echo "Criando banco limpo..."
createdb -U $DB_USER -h $DB_HOST $DB_NAME

echo "Restaurando dados..."
pg_restore -U $DB_USER -h $DB_HOST -d $DB_NAME -v "$RESTORE_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Restauração concluída com sucesso!"
    echo "$(date +%Y-%m-%d\ %H:%M:%S) - Restauração concluída com sucesso" >> /home/backups/supabase/backup.log
    
    # Limpar arquivo descompactado se foi criado
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        rm "$RESTORE_FILE"
    fi
else
    echo "❌ ERRO durante a restauração!"
    echo "$(date +%Y-%m-%d\ %H:%M:%S) - ERRO durante restauração" >> /home/backups/supabase/backup.log
    echo "⚠️  Você pode restaurar o backup de segurança: ${SAFETY_BACKUP}.gz"
    exit 1
fi

echo "🎉 Processo de restauração finalizado!"
