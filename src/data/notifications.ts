import { supabase } from '@/lib/supabase';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  kind: 'agendamento' | 'lembrete' | 'financeiro' | 'sistema';
  read: boolean;
  createdAt: string;
}

export async function listNotifications(businessId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, message, kind, read, created_at')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    throw new Error(error.message);
  }
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    message: row.message,
    kind: row.kind,
    read: row.read,
    createdAt: row.created_at,
  }));
}

export async function markAllNotificationsRead(businessId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('business_id', businessId)
    .eq('read', false);
  if (error) {
    throw new Error(error.message);
  }
}
