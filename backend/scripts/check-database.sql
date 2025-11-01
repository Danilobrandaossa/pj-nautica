-- =====================================================
-- Script de Verificação Completa do Banco de Dados
-- Infinity Náutica - Sistema de Agendamento
-- =====================================================

\echo '================================================='
\echo 'Verificação de Integridade do Banco de Dados'
\echo '================================================='
\echo ''

-- =====================================================
-- 1. VERIFICAR TABELAS EXISTENTES
-- =====================================================
\echo '1. Verificando tabelas existentes...'
\echo ''

SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as colunas
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

\echo ''
\echo '================================================='
\echo ''

-- =====================================================
-- 2. VERIFICAR USUÁRIOS
-- =====================================================
\echo '2. Verificando usuários...'
\echo ''

SELECT 
    'Total de usuários (ativos):' as descricao,
    COUNT(*) FILTER (WHERE "deletedAt" IS NULL) as valor
FROM users
UNION ALL
SELECT 
    'Usuários deletados (soft delete):' as descricao,
    COUNT(*) FILTER (WHERE "deletedAt" IS NOT NULL) as valor
FROM users
UNION ALL
SELECT 
    'Administradores ativos:' as descricao,
    COUNT(*) FILTER (WHERE role = 'ADMIN' AND "deletedAt" IS NULL) as valor
FROM users
UNION ALL
SELECT 
    'Usuários comuns ativos:' as descricao,
    COUNT(*) FILTER (WHERE role = 'USER' AND "deletedAt" IS NULL) as valor
FROM users;

\echo ''
\echo '-----------------------------------'
\echo 'Administradores do sistema:'
\echo '-----------------------------------'
SELECT id, email, name, role, "isActive", status, "lastLoginAt"
FROM users
WHERE role = 'ADMIN' AND "deletedAt" IS NULL
ORDER BY "createdAt" DESC;

\echo ''
\echo '================================================='
\echo ''

-- =====================================================
-- 3. VERIFICAR EMBARCAÇÕES
-- =====================================================
\echo '3. Verificando embarcações...'
\echo ''

SELECT 
    'Total de embarcações:' as descricao,
    COUNT(*) as valor
FROM vessels
UNION ALL
SELECT 
    'Embarcações ativas:' as descricao,
    COUNT(*) FILTER (WHERE "deletedAt" IS NULL AND "isActive" = true) as valor
FROM vessels
UNION ALL
SELECT 
    'Embarcações deletadas:' as descricao,
    COUNT(*) FILTER (WHERE "deletedAt" IS NOT NULL) as valor
FROM vessels;

\echo ''
\echo '-----------------------------------'
\echo 'Lista de embarcações:'
\echo '-----------------------------------'
SELECT id, name, "isActive", "deletedAt", "calendarDaysAhead"
FROM vessels
ORDER BY "createdAt" DESC;

\echo ''
\echo '================================================='
\echo ''

-- =====================================================
-- 4. VERIFICAR RESERVAS (BOOKINGS)
-- =====================================================
\echo '4. Verificando reservas...'
\echo ''

SELECT 
    status as status_reserva,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE "deletedAt" IS NULL) as ativas,
    COUNT(*) FILTER (WHERE "deletedAt" IS NOT NULL) as deletadas
FROM bookings
GROUP BY status
ORDER BY status;

\echo ''
\echo '-----------------------------------'
\echo 'Reservas recentes (últimas 10):'
\echo '-----------------------------------'
SELECT 
    b.id,
    TO_CHAR(b."bookingDate", 'DD/MM/YYYY') as data_reserva,
    b.status,
    u.email as usuario,
    v.name as embarcacao,
    TO_CHAR(b."createdAt", 'DD/MM/YYYY HH24:MI') as criado_em
FROM bookings b
JOIN users u ON b."userId" = u.id
JOIN vessels v ON b."vesselId" = v.id
WHERE b."deletedAt" IS NULL
ORDER BY b."bookingDate" DESC
LIMIT 10;

\echo ''
\echo '-----------------------------------'
\echo 'Reservas por embarcação (ativas):'
\echo '-----------------------------------'
SELECT 
    v.name as embarcacao,
    COUNT(b.id) as total_reservas,
    COUNT(b.id) FILTER (WHERE b.status = 'APPROVED') as aprovadas,
    COUNT(b.id) FILTER (WHERE b.status = 'PENDING') as pendentes
FROM vessels v
LEFT JOIN bookings b ON v.id = b."vesselId" AND b."deletedAt" IS NULL
WHERE v."deletedAt" IS NULL
GROUP BY v.id, v.name
ORDER BY total_reservas DESC;

\echo ''
\echo '================================================='
\echo ''

-- =====================================================
-- 5. VERIFICAR RELAÇÃO USUÁRIO-EMBARCAÇÃO
-- =====================================================
\echo '5. Verificando relação usuário-embarcação...'
\echo ''

SELECT 
    'Total de relações:' as descricao,
    COUNT(*) as valor
FROM user_vessels
UNION ALL
SELECT 
    'Relações ativas:' as descricao,
    COUNT(*) FILTER (WHERE status = 'ACTIVE') as valor
FROM user_vessels
UNION ALL
SELECT 
    'Relações suspensas:' as descricao,
    COUNT(*) FILTER (WHERE status = 'SUSPENDED') as valor
FROM user_vessels;

\echo ''
\echo '-----------------------------------'
\echo 'Embarcações por usuário:'
\echo '-----------------------------------'
SELECT 
    u.email as usuario,
    COUNT(uv.id) as total_embarcacoes,
    STRING_AGG(v.name, ', ') as embarcacoes
FROM users u
LEFT JOIN user_vessels uv ON u.id = uv."userId"
LEFT JOIN vessels v ON uv."vesselId" = v.id AND v."deletedAt" IS NULL
WHERE u."deletedAt" IS NULL
GROUP BY u.email
ORDER BY total_embarcacoes DESC, u.email;

\echo ''
\echo '================================================='
\echo ''

-- =====================================================
-- 6. VERIFICAR TOKENS DE AUTENTICAÇÃO
-- =====================================================
\echo '6. Verificando tokens de autenticação...'
\echo ''

SELECT 
    'Tokens válidos:' as descricao,
    COUNT(*) FILTER (WHERE "isRevoked" = false AND "expiresAt" > NOW()) as valor
FROM refresh_tokens
UNION ALL
SELECT 
    'Tokens revogados:' as descricao,
    COUNT(*) FILTER (WHERE "isRevoked" = true) as valor
FROM refresh_tokens
UNION ALL
SELECT 
    'Tokens expirados:' as descricao,
    COUNT(*) FILTER (WHERE "expiresAt" <= NOW()) as valor
FROM refresh_tokens;

\echo ''
\echo '================================================='
\echo ''

-- =====================================================
-- 7. VERIFICAR DATAS BLOQUEADAS
-- =====================================================
\echo '7. Verificando datas bloqueadas...'
\echo ''

SELECT 
    v.name as embarcacao,
    COUNT(bd.id) as total_bloqueios,
    COUNT(bd.id) FILTER (WHERE bd."endDate" >= CURRENT_DATE) as bloqueios_ativos
FROM vessels v
LEFT JOIN blocked_dates bd ON v.id = bd."vesselId"
WHERE v."deletedAt" IS NULL
GROUP BY v.id, v.name
ORDER BY total_bloqueios DESC;

\echo ''
\echo '================================================='
\echo ''

-- =====================================================
-- 8. VERIFICAR BLOQUEIOS SEMANAIS
-- =====================================================
\echo '8. Verificando bloqueios semanais...'
\echo ''

SELECT 
    CASE day_of_week
        WHEN 0 THEN 'Domingo'
        WHEN 1 THEN 'Segunda-feira'
        WHEN 2 THEN 'Terça-feira'
        WHEN 3 THEN 'Quarta-feira'
        WHEN 4 THEN 'Quinta-feira'
        WHEN 5 THEN 'Sexta-feira'
        WHEN 6 THEN 'Sábado'
    END as dia_semana,
    reason as motivo,
    is_active,
    TO_CHAR("createdAt", 'DD/MM/YYYY') as criado_em
FROM weekly_blocks
ORDER BY day_of_week, "createdAt";

\echo ''
\echo '================================================='
\echo ''

-- =====================================================
-- 9. VERIFICAR NOTIFICAÇÕES
-- =====================================================
\echo '9. Verificando notificações...'
\echo ''

SELECT 
    'Notificações globais:' as descricao,
    COUNT(*) FILTER (WHERE "isGlobal" = true AND "isActive" = true) as valor
FROM notifications
UNION ALL
SELECT 
    'Notificações ativas:' as descricao,
    COUNT(*) FILTER (WHERE "isActive" = true) as valor
FROM notifications
UNION ALL
SELECT 
    'Total de notificações:' as descricao,
    COUNT(*) as valor
FROM notifications;

\echo ''
\echo '================================================='
\echo ''

-- =====================================================
-- 10. VERIFICAR LOGS DE AUDITORIA
-- =====================================================
\echo '10. Verificando logs de auditoria (últimos 7 dias)...'
\echo ''

SELECT action as acao, COUNT(*) as total
FROM audit_logs
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY action
ORDER BY total DESC;

\echo ''
\echo '================================================='
\echo ''

-- =====================================================
-- 11. VERIFICAR ÍNDICES
-- =====================================================
\echo '11. Verificando índices principais...'
\echo ''

SELECT 
    tablename as tabela,
    indexname as indice
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname NOT LIKE '%_pkey'
    AND indexname NOT LIKE '%_unique'
ORDER BY tablename, indexname;

\echo ''
\echo '================================================='
\echo ''

-- =====================================================
-- 12. VERIFICAR CONSTRAINTS E FOREIGN KEYS
-- =====================================================
\echo '12. Verificando constraints e foreign keys...'
\echo ''

SELECT
    tc.table_name as tabela, 
    kcu.column_name as coluna, 
    ccu.table_name as tabela_referenciada,
    ccu.column_name as coluna_referenciada
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

\echo ''
\echo '================================================='
\echo ''

-- =====================================================
-- 13. RESUMO GERAL
-- =====================================================
\echo '13. RESUMO GERAL'
\echo '================================================='
\echo ''

SELECT 
    'Usuários ativos' as item,
    COUNT(*)::text as valor
FROM users WHERE "deletedAt" IS NULL
UNION ALL
SELECT 'Embarcações ativas', COUNT(*)::text FROM vessels WHERE "deletedAt" IS NULL AND "isActive" = true
UNION ALL
SELECT 'Reservas ativas', COUNT(*)::text FROM bookings WHERE "deletedAt" IS NULL
UNION ALL
SELECT 'Relações usuário-embarcação', COUNT(*)::text FROM user_vessels
UNION ALL
SELECT 'Datas bloqueadas', COUNT(*)::text FROM blocked_dates
UNION ALL
SELECT 'Notificações ativas', COUNT(*)::text FROM notifications WHERE "isActive" = true
UNION ALL
SELECT 'Logs de auditoria (7 dias)', COUNT(*)::text FROM audit_logs WHERE "createdAt" >= NOW() - INTERVAL '7 days';

\echo ''
\echo '================================================='
\echo 'Verificação concluída com sucesso!'
\echo '================================================='

