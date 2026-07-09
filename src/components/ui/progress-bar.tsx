import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme';

interface ProgressBarProps {
  /** Progresso entre 0 e 1. */
  value: number;
  color?: string;
  height?: number;
}

export function ProgressBar({ value, color = colors.primary, height = 8 }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 1);

  return (
    <View style={[styles.track, { height }]}>
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
});
