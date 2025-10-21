import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verificar se o usuário que está fazendo a requisição é admin
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Não autenticado');
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role !== 'admin') {
      throw new Error('Acesso negado: apenas administradores podem ver logs');
    }

    // Buscar logs de diferentes tabelas
    const [solicitacoesLogs, planosLogs, rolesLogs] = await Promise.all([
      supabase
        .from('solicitacoes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50),
      
      supabase
        .from('planos_adquiridos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50),
      
      supabase
        .from('user_roles')
        .select('*, profiles(nome, email)')
        .order('created_at', { ascending: false })
        .limit(50)
    ]);

    const logs = {
      solicitacoes: solicitacoesLogs.data || [],
      planos: planosLogs.data || [],
      roles: rolesLogs.data || [],
      timestamp: new Date().toISOString()
    };

    console.log(`[SECURITY_AUDIT] Logs acessados por: ${user.email}`);

    return new Response(
      JSON.stringify({ 
        logs,
        message: 'Logs recuperados com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Erro na função get-system-logs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
