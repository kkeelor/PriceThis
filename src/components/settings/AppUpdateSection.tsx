import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { getInstalledVersionName } from '@/services/app/appVersion';
import { radii, spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

type AppUpdateSectionProps = {
  active: boolean;
};

export function AppUpdateSection({ active }: AppUpdateSectionProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const {
    check,
    status,
    progress,
    updateAvailable,
    supported,
    errorMessage,
    errorDetails,
    statusDetail,
    refreshCheck,
    downloadUpdate,
  } = useAppUpdate();

  const versionName = check?.currentVersionName ?? getInstalledVersionName();

  useEffect(() => {
    if (active) {
      void refreshCheck();
    }
  }, [active, refreshCheck]);

  if (!supported) {
    return null;
  }

  const isChecking = status === 'checking';
  const isDownloading = status === 'downloading';
  const isVerifying = status === 'verifying';
  const isInstalling = status === 'installing';
  const isBusy = isChecking || isDownloading || isVerifying || isInstalling;

  const handlePress = () => {
    if (updateAvailable && !isBusy) {
      void downloadUpdate();
      return;
    }
    if (!isBusy) {
      void refreshCheck();
    }
  };

  const buttonLabel = isChecking
    ? 'Checking…'
    : isDownloading
      ? statusDetail && progress === 0
        ? statusDetail
        : `Downloading… ${Math.round(progress * 100)}%`
      : isVerifying
        ? statusDetail ?? 'Verifying download…'
        : isInstalling
          ? statusDetail ?? 'Opening installer…'
          : updateAvailable
            ? 'Update available'
            : 'Check for updates';

  return (
    <View style={styles.section}>
      <AppText style={styles.sectionLabel}>App update</AppText>
      <View style={styles.card}>
        <AppText style={styles.version}>Version {versionName}</AppText>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            updateAvailable ? 'Update available, tap to download' : 'Check for updates'
          }
          disabled={isBusy}
          onPress={handlePress}
          style={({ pressed }) => [
            styles.checkButton,
            pressed && !isBusy && styles.checkButtonPressed,
            isBusy && styles.checkButtonDisabled,
          ]}>
          <AppText style={styles.checkLabel} numberOfLines={1}>
            {buttonLabel}
          </AppText>
          {updateAvailable && !isBusy ? (
            <View style={styles.badge}>
              <AppText style={styles.badgeText}>1</AppText>
            </View>
          ) : null}
        </Pressable>

        {isDownloading || isVerifying ? (
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${isVerifying ? 100 : Math.round(progress * 100)}%` },
              ]}
            />
          </View>
        ) : null}

        {statusDetail && isBusy ? (
          <AppText style={styles.debugText} selectable>
            {statusDetail}
          </AppText>
        ) : null}

        {errorMessage ? (
          <AppText style={styles.errorText} selectable>
            {errorMessage}
          </AppText>
        ) : null}

        {errorDetails ? (
          <AppText style={styles.debugText} selectable>
            {errorDetails}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    section: {
      gap: spacing.sm,
    },
    sectionLabel: {
      ...typography.label,
      color: colors.textMuted,
    },
    card: {
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: isDark ? 1 : StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: radii.md,
      padding: spacing.md,
      ...(isDark
        ? {}
        : {
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }),
    },
    version: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    checkButton: {
      minHeight: 48,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    checkButtonPressed: {
      opacity: 0.88,
    },
    checkButtonDisabled: {
      opacity: 0.6,
    },
    checkLabel: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    badge: {
      position: 'absolute',
      top: -6,
      right: -6,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 4,
      backgroundColor: colors.danger,
      borderWidth: 1.5,
      borderColor: colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      ...typography.caption,
      color: '#FFFFFF',
      fontSize: 11,
      lineHeight: 13,
      fontWeight: '700',
    },
    progressTrack: {
      height: 3,
      borderRadius: 999,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    progressFill: {
      height: 3,
      borderRadius: 999,
      backgroundColor: colors.accent,
    },
    errorText: {
      ...typography.caption,
      color: colors.danger,
    },
    debugText: {
      ...typography.caption,
      color: colors.textMuted,
      fontFamily: 'monospace',
    },
  });
}
