import { EmptyState, Screen, ScreenHeader } from '@/components/ui';

export default function NotificationsScreen() {
  return (
    <Screen>
      <ScreenHeader title="Notificações" />
      <EmptyState
        icon="notifications-outline"
        title="Nada por aqui"
        message="Lembretes de agendamento e alertas de clientes sumidas vão aparecer nesta tela em breve."
      />
    </Screen>
  );
}
