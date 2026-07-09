import type { BadgeTone } from '@/components/ui';
import type { AppointmentStatus } from '@/types';

export const statusMeta: Record<AppointmentStatus, { label: string; tone: BadgeTone }> = {
  agendado: { label: 'Agendado', tone: 'info' },
  confirmado: { label: 'Confirmado', tone: 'primary' },
  concluido: { label: 'Concluído', tone: 'success' },
  cancelado: { label: 'Cancelado', tone: 'neutral' },
  faltou: { label: 'Faltou', tone: 'danger' },
};
