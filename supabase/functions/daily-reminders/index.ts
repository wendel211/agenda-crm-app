// Edge Function: resumo diário da agenda via push (Expo Push API).
//
// Pré-requisitos para ativar:
//   1. Tabela push_tokens (business_id, token) preenchida pelo app com o Expo push token
//   2. supabase functions deploy daily-reminders
//   3. Agendar via cron no painel (Integrations → Cron):
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
    .select('business_id, start_time')
    .eq('date', today)
    .in('status', ['agendado', 'confirmado']);
  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const byBusiness = new Map<string, number>();
  for (const appointment of appointments ?? []) {
    byBusiness.set(appointment.business_id, (byBusiness.get(appointment.business_id) ?? 0) + 1);
  }

  const { data: tokens } = await supabase.from('push_tokens').select('business_id, token');

  const messages = (tokens ?? [])
    .filter((row) => byBusiness.has(row.business_id))
    .map((row) => ({
      to: row.token,
      title: 'Sua agenda de hoje',
      body: `Você tem ${byBusiness.get(row.business_id)} atendimento(s) hoje. Bom trabalho!`,
    }));

  if (messages.length > 0) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
  }

  return new Response(JSON.stringify({ sent: messages.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
