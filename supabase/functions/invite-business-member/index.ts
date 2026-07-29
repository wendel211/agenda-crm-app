import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type InviteRole = 'admin' | 'receptionist' | 'professional';

interface InvitePayload {
  businessId?: string;
  email?: string;
  displayName?: string;
  role?: InviteRole;
}

async function findUserByEmail(
  admin: SupabaseClient<any, any, any, any, any>,
  email: string,
): Promise<{ id: string; email?: string } | undefined> {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === email);
    if (found) return found;
    if (data.users.length < 100) return undefined;
  }
  return undefined;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization) throw new Error('Sessão ausente.');

    const url = Deno.env.get('SUPABASE_URL')!;
    const callerClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false },
    });

    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser();
    if (callerError || !caller) throw new Error('Sessão inválida.');

    const payload = (await request.json()) as InvitePayload;
    const businessId = payload.businessId?.trim();
    const email = payload.email?.trim().toLowerCase();
    const displayName = payload.displayName?.trim();
    const role = payload.role;

    if (!businessId || !email || !displayName || !role) {
      throw new Error('Nome, e-mail, função e negócio são obrigatórios.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Informe um e-mail válido.');
    }
    if (!['admin', 'receptionist', 'professional'].includes(role)) {
      throw new Error('Função inválida.');
    }

    const { data: callerMembership } = await admin
      .from('business_members')
      .select('id')
      .eq('business_id', businessId)
      .eq('user_id', caller.id)
      .eq('status', 'active')
      .in('role', ['owner', 'admin'])
      .maybeSingle();
    if (!callerMembership) throw new Error('Você não tem permissão para convidar membros.');

    let invitedUser = await findUserByEmail(admin, email);
    let emailSent = false;
    if (!invitedUser) {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: displayName },
        redirectTo: Deno.env.get('APP_INVITE_REDIRECT_URL') ?? 'agendacrm://',
      });
      if (error || !data.user) throw error ?? new Error('Não foi possível criar o convite.');
      invitedUser = data.user;
      emailSent = true;
    }

    const { data: invitationId, error: invitationError } = await admin.rpc(
      'admin_create_business_invitation',
      {
        p_business_id: businessId,
        p_email: email,
        p_display_name: displayName,
        p_role: role,
        p_auth_user_id: invitedUser.id,
        p_invited_by: caller.id,
      },
    );
    if (invitationError) throw invitationError;

    return new Response(JSON.stringify({ invitationId, emailSent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Não foi possível enviar o convite.';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
