import type { BadgeTone } from '@/components/ui';
import type { AppointmentStatus } from '@/types';

export const statusMeta: Record<AppointmentStatus, { label: string; tone: BadgeTone }> = {
  agendado: { label: 'Agendado', tone: 'warning' },
  confirmado: { label: 'Confirmado', tone: 'success' },
  concluido: { label: 'Concluído', tone: 'success' },
  cancelado: { label: 'Cancelado', tone: 'danger' },
  faltou: { label: 'Faltou', tone: 'danger' },
};
