import { Platform } from 'react-native';
import Constants from 'expo-constants';

import { parseISODate } from './format';
import { timeToMinutes } from './time';
import { supabase } from './supabase';

const REMINDER_MINUTES_BEFORE = 60;
const CHANNEL_ID = 'reminders';

let handlerConfigured = false;

/**
 * Carrega expo-notifications sob demanda: no Expo Go (SDK 53+) o import
 * do módulo lança erro, então só importamos na hora de usar, protegido.
 */
async function loadNotifications() {
  const Notifications = await import('expo-notifications');
  if (!handlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    handlerConfigured = true;
  }
  return Notifications;
}

/** Registra o aparelho para resumos remotos; falhas não bloqueiam o login. */
export async function registerDevicePushToken(
  businessId: string,
  userId: string,
): Promise<void> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return;
  }
  const projectId =
    Constants.easConfig?.projectId ??
    (Constants.expoConfig?.extra?.eas?.projectId as string | undefined);
  if (!projectId) {
    return;
  }

  const Notifications = await loadNotifications();
  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted
    ? current
    : await Notifications.requestPermissionsAsync();
  if (!permission.granted) {
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const { error } = await supabase.from('push_tokens').upsert(
    {
      business_id: businessId,
      user_id: userId,
      token,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'token' },
  );
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Agenda um lembrete local 1h antes do atendimento no aparelho da profissional.
 * Falha em silêncio: lembrete é conveniência, nunca pode travar o agendamento.
 * No Expo Go não faz nada — requer development build.
 */
export async function scheduleAppointmentReminder(input: {
  clientName: string;
  date: string;
  startTime: string;
}): Promise<void> {
  try {
    const Notifications = await loadNotifications();

    const current = await Notifications.getPermissionsAsync();
    if (!current.granted) {
      const requested = await Notifications.requestPermissionsAsync();
      if (!requested.granted) {
        return;
      }
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Lembretes de atendimento',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const when = parseISODate(input.date);
    const minutes = timeToMinutes(input.startTime) - REMINDER_MINUTES_BEFORE;
    when.setMinutes(minutes);
    if (when <= new Date()) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Atendimento em 1 hora',
        body: `${input.clientName} às ${input.startTime}. Prepare tudo com calma!`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: when,
        channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
      },
    });
  } catch {
    // Expo Go, sem permissão ou plataforma sem suporte — segue sem lembrete.
  }
}
