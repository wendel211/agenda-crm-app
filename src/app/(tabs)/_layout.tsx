import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { colors, radius, shadow, spacing } from '@/theme';

const tabs = [
  { name: 'index', label: 'Início', icon: 'home' as const },
  { name: 'agenda', label: 'Agenda', icon: 'calendar' as const },
  { name: 'clients', label: 'Clientes', icon: 'people' as const },
  { name: 'finance', label: 'Financeiro', icon: 'wallet' as const },
];

function TabBar({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index]?.name;

  const renderTab = (tab: (typeof tabs)[number]) => {
    const active = current === tab.name;
    return (
      <Pressable
        key={tab.name}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={tab.label}
        onPress={() => navigation.navigate(tab.name)}
        style={styles.tab}
      >
        <Ionicons
          name={active ? tab.icon : (`${tab.icon}-outline` as const)}
          size={22}
          color={active ? colors.primary : colors.muted}
        />
        <AppText variant="micro" color={active ? colors.primary : colors.muted}>
          {tab.label}
        </AppText>
      </Pressable>
    );
  };

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + spacing.sm }]}>
      {tabs.slice(0, 2).map(renderTab)}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Novo agendamento"
        onPress={() => router.push('/appointments/new')}
        style={({ pressed }) => [styles.plus, pressed ? styles.plusPressed : null]}
      >
        <Ionicons name="add" size={30} color={colors.surface} />
      </Pressable>
      {tabs.slice(2).map(renderTab)}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="agenda" />
      <Tabs.Screen name="clients" />
      <Tabs.Screen name="finance" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.xs,
  },
  plus: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -spacing.xxl,
    ...shadow.raised,
  },
  plusPressed: { transform: [{ scale: 0.95 }] },
});
