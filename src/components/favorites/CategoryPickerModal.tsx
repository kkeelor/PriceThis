import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';

import { AppText, Button } from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import type { FavoriteCategory } from '@/types/favorites';
import { radii, spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

type CategoryPickerModalProps = {
  visible: boolean;
  categories: FavoriteCategory[];
  selectedCategoryId?: string;
  title?: string;
  onSelect: (categoryId: string) => void;
  onClose: () => void;
};

export function CategoryPickerModal({
  visible,
  categories,
  selectedCategoryId,
  title = 'Choose category',
  onSelect,
  onClose,
}: CategoryPickerModalProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <AppText style={styles.title}>{title}</AppText>
          <View style={styles.list}>
            {categories.map(category => {
              const selected = category.id === selectedCategoryId;
              return (
                <Pressable
                  key={category.id}
                  accessibilityRole="button"
                  onPress={() => onSelect(category.id)}
                  style={[styles.row, selected && styles.rowSelected]}>
                  <AppText style={styles.rowLabel}>{category.name}</AppText>
                  {selected ? <Check color={colors.accent} size={18} strokeWidth={2.5} /> : null}
                </Pressable>
              );
            })}
          </View>
          <Button label="Cancel" variant="secondary" fullWidth onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
      padding: spacing.lg,
    },
    sheet: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: radii.lg,
      padding: spacing.lg,
      gap: spacing.md,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
    },
    title: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    list: {
      gap: spacing.xs,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radii.md,
      backgroundColor: colors.surface,
    },
    rowSelected: {
      borderWidth: 1,
      borderColor: colors.accent,
    },
    rowLabel: {
      ...typography.body,
      color: colors.textPrimary,
    },
  });
}
