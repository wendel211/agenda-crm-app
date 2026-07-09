import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Wrapper de tela: fundo, safe area e scroll opcional. */
export function Screen({ children, scroll = true, padded = true, style }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const padding = padded ? styles.padded : null;

  if (!scroll) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }, padding, style]}>{children}</View>
    );
  }

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top }]}
      contentContainerStyle={[padding, { paddingBottom: insets.bottom + 96 }, style]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  padded: { paddingHorizontal: spacing.xl },
});
