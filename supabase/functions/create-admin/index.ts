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
      throw new Error('Acesso negado: apenas administradores podem criar outros admins');
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      throw new Error('Email e senha são obrigatórios');
    }

    if (password.length < 8) {
      throw new Error('A senha deve ter no mínimo 8 caracteres');
    }

    console.log('Criando novo usuário admin:', email);

    // Criar o usuário admin
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nome: 'Administrador'
      }
    });

    if (authError) {
      console.error('Erro ao criar usuário:', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Usuário não foi criado');
    }

    console.log('Usuário criado com ID:', authData.user.id);

    // Atualizar a role para admin (o trigger já cria como 'cliente')
    const { error: roleError } = await supabase
      .from('user_roles')
      .update({ role: 'admin' })
      .eq('user_id', authData.user.id);

    if (roleError) {
      console.error('Erro ao atualizar role:', roleError);
      throw roleError;
    }

    console.log('Admin criado com sucesso!');

    // Log de auditoria
    console.log(`[SECURITY_AUDIT] Admin criado: email=${email}, criado_por=${user.email}, user_id=${authData.user.id}`);

    return new Response(
      JSON.stringify({ 
        message: 'Admin criado com sucesso!',
        email: email,
        userId: authData.user.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Erro na função create-admin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
