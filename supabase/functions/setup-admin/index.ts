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

    console.log('Verificando se já existe admin...');

    // Verificar se já existe um admin
    const { data: existingAdmin, error: checkError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('role', 'admin')
      .limit(1);

    if (checkError) {
      console.error('Erro ao verificar admin:', checkError);
      throw checkError;
    }

    if (existingAdmin && existingAdmin.length > 0) {
      console.log('Admin já existe no sistema');
      return new Response(
        JSON.stringify({ message: 'Admin já existe no sistema' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log('Criando usuário admin...');

    // Criar o usuário admin
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@sistema.com',
      password: 'Admin@123456',
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

    // O perfil e a role são criados automaticamente pelo trigger handle_new_user
    // Mas vamos garantir que a role seja admin
    const { error: roleError } = await supabase
      .from('user_roles')
      .update({ role: 'admin' })
      .eq('user_id', authData.user.id);

    if (roleError) {
      console.error('Erro ao atualizar role:', roleError);
      throw roleError;
    }

    console.log('Admin configurado com sucesso!');

    return new Response(
      JSON.stringify({ 
        message: 'Admin criado com sucesso!',
        email: 'admin@sistema.com',
        userId: authData.user.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Erro na função setup-admin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
