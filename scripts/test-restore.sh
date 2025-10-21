#!/bin/bash
# Script para TESTAR restauração sem afetar o banco de produção
# Execute mensalmente para garantir que os backups funcionam

# Configurações
BACKUP_DIR="/home/backups/supabase"
TEST_DB="supabase_test_restore"
DB_USER="postgres"
DB_HOST="localhost"

echo "🧪 Iniciando teste de restauração..."
echo "Data: $(date)"

# Pegar o backup mais recente
LATEST_BACKUP=$(ls -t $BACKUP_DIR/supabase_db_*.backup.gz | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ Nenhum backup encontrado em $BACKUP_DIR"
    exit 1
fi

echo "📦 Backup a ser testado: $LATEST_BACKUP"

# Descompactar
echo "📂 Descompactando backup..."
UNCOMPRESSED="${LATEST_BACKUP%.gz}"
gunzip -k "$LATEST_BACKUP"

# Criar banco de teste
echo "🗄️  Criando banco de dados de teste..."
dropdb -U $DB_USER -h $DB_HOST $TEST_DB --if-exists 2>/dev/null
createdb -U $DB_USER -h $DB_HOST $TEST_DB

# Restaurar no banco de teste
echo "🔄 Restaurando backup no banco de teste..."
pg_restore -U $DB_USER -h $DB_HOST -d $TEST_DB -v "$UNCOMPRESSED" 2>&1 | tee /tmp/restore_test.log

# Verificar se a restauração funcionou
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ TESTE DE RESTAURAÇÃO: PASSOU!"
    echo ""
    
    # Verificar algumas tabelas
    echo "📊 Verificando integridade dos dados..."
    psql -U $DB_USER -h $DB_HOST -d $TEST_DB -c "
        SELECT 
            'profiles' as tabela, 
            COUNT(*) as registros 
        FROM profiles
        UNION ALL
        SELECT 'solicitacoes', COUNT(*) FROM solicitacoes
        UNION ALL
        SELECT 'planos_adquiridos', COUNT(*) FROM planos_adquiridos
        UNION ALL
        SELECT 'user_roles', COUNT(*) FROM user_roles;
    "
    
    echo ""
    echo "✅ Backup está VÁLIDO e pode ser usado para restauração!"
    echo "$(date +%Y-%m-%d\ %H:%M:%S) - Teste de restauração: SUCESSO" >> $BACKUP_DIR/backup.log
else
    echo ""
    echo "❌ TESTE DE RESTAURAÇÃO: FALHOU!"
    echo "⚠️  Os backups podem estar corrompidos ou incompletos!"
    echo "📝 Verifique os logs em: /tmp/restore_test.log"
    echo "$(date +%Y-%m-%d\ %H:%M:%S) - Teste de restauração: FALHOU" >> $BACKUP_DIR/backup.log
fi

# Limpar
echo ""
echo "🧹 Limpando arquivos temporários..."
rm "$UNCOMPRESSED"
dropdb -U $DB_USER -h $DB_HOST $TEST_DB --if-exists

echo "🧪 Teste concluído!"
