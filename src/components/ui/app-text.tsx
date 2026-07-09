import { Text, type TextProps, type TextStyle } from 'react-native';

import { colors, typography } from '@/theme';

type Variant = keyof typeof typography;

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  align?: TextStyle['textAlign'];
}

export function AppText({ variant = 'body', color = colors.ink, align, style, ...rest }: AppTextProps) {
  return <Text style={[typography[variant], { color, textAlign: align }, style]} {...rest} />;
}
