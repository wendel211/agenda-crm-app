import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { minutesToTime } from '@/lib/time';
import { colors, radius, spacing } from '@/theme';

const START_MINUTES = 6 * 60;
const END_MINUTES = 22 * 60;
const STEP = 30;

const OPTIONS: string[] = [];
for (let minute = START_MINUTES; minute <= END_MINUTES; minute += STEP) {
  OPTIONS.push(minutesToTime(minute));
}

interface TimePickerModalProps {
  visible: boolean;
  title: string;
  value: string;
  onSelect: (time: string) => void;
  onClose: () => void;
}

export function TimePickerModal({ visible, title, value, onSelect, onClose }: TimePickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <AppText variant="heading" align="center">
            {title}
          </AppText>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              {OPTIONS.map((option) => {
                const selected = option === value;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      onSelect(option);
                      onClose();
                    }}
                    style={[styles.chip, selected ? styles.chipSelected : null]}
                  >
                    <AppText variant="caption" color={selected ? colors.surface : colors.sub}>
                      {option}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xxl,
    gap: spacing.lg,
    maxHeight: '70%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  chip: {
    width: 72,
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
