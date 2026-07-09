import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '@/theme';
import { AppText } from './app-text';

interface TextFieldProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
}

export function TextField({ label, icon, error, secureTextEntry, ...rest }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));

  return (
    <View style={styles.wrapper}>
      {label ? (
        <AppText variant="caption" color={colors.sub}>
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.field,
          focused ? styles.focused : null,
          error ? styles.errored : null,
        ]}
      >
        {icon ? <Ionicons name={icon} size={20} color={focused ? colors.primary : colors.muted} /> : null}
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.muted}
          secureTextEntry={hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar senha' : 'Ocultar senha'}
            onPress={() => setHidden((value) => !value)}
            hitSlop={8}
          >
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" color={colors.danger}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs + 2 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    height: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  focused: { borderColor: colors.primary },
  errored: { borderColor: colors.danger },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.ink,
    paddingVertical: 0,
  },
});
