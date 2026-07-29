// Edge Function: resumo diário da agenda via push (Expo Push API).
//
// Pré-requisitos para ativar:
//   1. supabase functions deploy daily-reminders
//   2. Agendar via cron no painel (Integrations → Cron):
//      select cron.schedule('daily-reminders', '0 11 * * *',  -- 08:00 BRT
//        $$select net.http_post('https://SEU-PROJETO.supabase.co/functions/v1/daily-reminders',
//          headers := '{"Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb)$$);
//
// Enquanto isso, o app já agenda lembretes locais no aparelho ao criar agendamentos.

import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const today = new Date().toISOString().slice(0, 10);
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('business_id, professional_id, start_time')
    .eq('date', today)
    .in('status', ['agendado', 'confirmado']);
  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const byBusiness = new Map<string, number>();
  const byProfessional = new Map<string, number>();
  for (const appointment of appointments ?? []) {
    byBusiness.set(appointment.business_id, (byBusiness.get(appointment.business_id) ?? 0) + 1);
    const professionalKey = `${appointment.business_id}:${appointment.professional_id}`;
    byProfessional.set(professionalKey, (byProfessional.get(professionalKey) ?? 0) + 1);
  }

  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('business_id, user_id, token');
  const { data: members } = await supabase
    .from('business_members')
    .select('business_id, user_id, role, professional_id')
    .eq('status', 'active');
  const membershipByUser = new Map(
    (members ?? []).map((member) => [`${member.business_id}:${member.user_id}`, member]),
  );

  const messages = (tokens ?? [])
    .map((row) => {
      const membership = membershipByUser.get(`${row.business_id}:${row.user_id}`);
      const count =
        membership?.role === 'professional' && membership.professional_id
          ? (byProfessional.get(`${row.business_id}:${membership.professional_id}`) ?? 0)
          : (byBusiness.get(row.business_id) ?? 0);
      return { row, count };
    })
    .filter(({ count }) => count > 0)
    .map(({ row, count }) => ({
      to: row.token,
      title: 'Sua agenda de hoje',
      body: `Você tem ${count} atendimento(s) hoje. Bom trabalho!`,
    }));

  if (messages.length > 0) {
    const pushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
    if (!pushResponse.ok) {
      return new Response(await pushResponse.text(), { status: 502 });
    }
  }

  return new Response(JSON.stringify({ sent: messages.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
