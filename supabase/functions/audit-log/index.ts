import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AuditLog {
  user_id: string
  user_email: string
  action: string
  resource_type: string
  resource_id?: string
  old_value?: any
  new_value?: any
  ip_address: string
  user_agent: string
  session_id?: string
  severity: 'info' | 'warning' | 'critical'
  metadata?: Record<string, any>
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('[AUDIT] ❌ Tentativa de log sem autenticação')
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      console.error('[AUDIT] ❌ Token inválido:', authError?.message)
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payload = await req.json() as Omit<AuditLog, 'user_id' | 'user_email' | 'ip_address' | 'user_agent'>

    // Validação de entrada
    if (!payload.action || !payload.resource_type) {
      console.error('[AUDIT] ❌ Dados inválidos:', payload)
      return new Response(
        JSON.stringify({ error: 'Dados inválidos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const auditLog: AuditLog = {
      user_id: user.id,
      user_email: user.email || 'unknown',
      action: payload.action,
      resource_type: payload.resource_type,
      resource_id: payload.resource_id,
      old_value: payload.old_value,
      new_value: payload.new_value,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
      session_id: payload.session_id,
      severity: payload.severity || 'info',
      metadata: payload.metadata
    }

    // Log estruturado por severidade
    const timestamp = new Date().toISOString()
    const logPrefix = `[AUDIT:${auditLog.severity.toUpperCase()}]`
    
    const logMessage = {
      timestamp,
      user: {
        id: auditLog.user_id,
        email: auditLog.user_email,
        ip: auditLog.ip_address
      },
      action: auditLog.action,
      resource: {
        type: auditLog.resource_type,
        id: auditLog.resource_id
      },
      changes: {
        old: auditLog.old_value,
        new: auditLog.new_value
      },
      context: {
        user_agent: auditLog.user_agent,
        session_id: auditLog.session_id,
        metadata: auditLog.metadata
      }
    }

    switch (auditLog.severity) {
      case 'critical':
        console.error(`${logPrefix} 🚨`, JSON.stringify(logMessage, null, 2))
        break
      case 'warning':
        console.warn(`${logPrefix} ⚠️`, JSON.stringify(logMessage, null, 2))
        break
      default:
        console.log(`${logPrefix} ℹ️`, JSON.stringify(logMessage, null, 2))
    }

    // Alertas específicos para ações críticas
    if (auditLog.severity === 'critical') {
      console.error(`
╔════════════════════════════════════════════════════════════╗
║ 🚨 ALERTA DE SEGURANÇA CRÍTICO                             ║
╠════════════════════════════════════════════════════════════╣
║ Usuário: ${auditLog.user_email}                            ║
║ Ação: ${auditLog.action}                                   ║
║ Recurso: ${auditLog.resource_type} (${auditLog.resource_id})║
║ IP: ${auditLog.ip_address}                                 ║
║ Timestamp: ${timestamp}                                    ║
╚════════════════════════════════════════════════════════════╝
      `)
    }

    // Detecção de padrões suspeitos
    const suspiciousPatterns = [
      'SELECT', 'DROP', 'DELETE', 'UPDATE', 'INSERT',
      '<script', 'javascript:', 'onerror=', 'onload=',
      '../', '..\\', '/etc/', 'cmd.exe', 'powershell'
    ]

    const hasSuspiciousPattern = JSON.stringify(payload).match(
      new RegExp(suspiciousPatterns.join('|'), 'i')
    )

    if (hasSuspiciousPattern) {
      console.error(`[AUDIT] 🚨 PADRÃO SUSPEITO DETECTADO:`, {
        user_email: auditLog.user_email,
        pattern: hasSuspiciousPattern[0],
        full_payload: payload
      })
    }

    return new Response(
      JSON.stringify({ success: true, logged_at: timestamp }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[AUDIT] ❌ Erro ao processar log:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
