import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button } from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import { radii, spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.card}>
          {destructive ? (
            <View style={styles.iconWrap}>
              <AppText style={styles.icon}>🗑</AppText>
            </View>
          ) : null}

          <AppText style={styles.title}>{title}</AppText>
          <AppText style={styles.message}>{message}</AppText>

          <View style={styles.actions}>
            <Button label={cancelLabel} variant="secondary" fullWidth onPress={onCancel} />
            {destructive ? (
              <Pressable
                accessibilityRole="button"
                onPress={onConfirm}
                style={({ pressed }) => [
                  styles.destructiveButton,
                  pressed && styles.destructiveButtonPressed,
                ]}>
                <AppText style={styles.destructiveLabel}>{confirmLabel}</AppText>
              </Pressable>
            ) : (
              <Button label={confirmLabel} fullWidth onPress={onConfirm} />
            )}
          </View>
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
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    card: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: colors.surfaceElevated,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.md,
      ...(isDark
        ? {}
        : {
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 24,
            elevation: 8,
          }),
    },
    iconWrap: {
      alignSelf: 'center',
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.dangerSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: {
      fontSize: 22,
      lineHeight: 26,
    },
    title: {
      ...typography.title,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    message: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    actions: {
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    destructiveButton: {
      minHeight: 52,
      borderRadius: radii.md,
      backgroundColor: colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    destructiveButtonPressed: {
      opacity: 0.88,
    },
    destructiveLabel: {
      ...typography.bodyStrong,
      color: '#FFFFFF',
      textAlign: 'center',
    },
  });
}
