import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { colors, radius } from '@/theme';
import { AppText } from './app-text';

const PALETTE = [colors.primary, colors.accent, colors.success, colors.info, colors.warning];

interface AvatarProps {
  name: string;
  size?: number;
  /** Foto opcional — quando presente substitui as iniciais. */
  uri?: string;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function colorOf(name: string): string {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) % PALETTE.length;
  }
  return PALETTE[hash];
}

export function Avatar({ name, size = 44, uri }: AvatarProps) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.circle, { width: size, height: size }]}
        contentFit="cover"
        transition={150}
        accessibilityLabel={`Foto de ${name}`}
      />
    );
  }

  const background = colorOf(name);

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, backgroundColor: `${background}22` },
      ]}
    >
      <AppText
        variant="subheading"
        color={background}
        style={{ fontSize: size * 0.36 }}
      >
        {initialsOf(name)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
