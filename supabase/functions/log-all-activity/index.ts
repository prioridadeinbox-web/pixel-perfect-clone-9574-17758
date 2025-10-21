import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get request data
    const { action, resource, details, userId } = await req.json();

    // Get user info
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('nome, email')
      .eq('id', userId)
      .single();

    // Create log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      user: {
        id: userId,
        name: profile?.nome || 'Unknown',
        email: profile?.email || 'Unknown'
      },
      action,
      resource,
      details,
      ip: req.headers.get('x-forwarded-for') || 'Unknown',
      user_agent: req.headers.get('user-agent') || 'Unknown'
    };

    // Store in a logs table (expires after 2 days)
    const { error: insertError } = await supabaseAdmin
      .from('system_logs')
      .insert({
        log_data: logEntry,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days
      });

    if (insertError) {
      console.error('Error inserting log:', insertError);
    }

    // Also log to console for immediate visibility
    console.log('[SYSTEM_LOG]', JSON.stringify(logEntry, null, 2));

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error logging activity:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});