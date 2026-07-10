import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { parseISODate } from './format';
import { timeToMinutes } from './time';

const REMINDER_MINUTES_BEFORE = 60;
const CHANNEL_ID = 'reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Agenda um lembrete local 1h antes do atendimento no aparelho da profissional.
 * Falha em silêncio: lembrete é conveniência, nunca pode travar o agendamento.
 */
export async function scheduleAppointmentReminder(input: {
  clientName: string;
  date: string;
  startTime: string;
}): Promise<void> {
  try {
    if (!(await ensurePermission())) {
      return;
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
    // Sem permissão ou ambiente sem suporte (ex.: web) — segue sem lembrete.
  }
}
