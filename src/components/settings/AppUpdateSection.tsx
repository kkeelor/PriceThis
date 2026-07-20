import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

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
    refreshCheck,
    downloadUpdate,
  } = useAppUpdate();

  const versionName = check?.currentVersionName ?? getInstalledVersionName();

  const isChecking = status === 'checking';
  const isDownloading = status === 'downloading';
  const isVerifying = status === 'verifying';
  const isInstalling = status === 'installing';
  const isBusy = isChecking || isDownloading || isVerifying || isInstalling;

  const barWidth = useSharedValue(0);

  useEffect(() => {
    if (active) {
      refreshCheck();
    }
  }, [active, refreshCheck]);

  useEffect(() => {
    const target = isVerifying ? 100 : Math.round(progress * 100);
    barWidth.value = withTiming(target, { duration: 300 });
  }, [barWidth, isVerifying, progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
  }));

  if (!supported) {
    return null;
  }

  const handlePress = () => {
    if (updateAvailable && !isBusy) {
      downloadUpdate();
      return;
    }
    if (!isBusy) {
      refreshCheck();
    }
  };

  const buttonLabel = isChecking
    ? 'Checking…'
    : isDownloading
      ? `Downloading… ${Math.round(progress * 100)}%`
      : isVerifying
        ? 'Verifying download…'
        : isInstalling
          ? 'Opening installer…'
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
          <AppText style={styles.checkLabel} numberOfLines={2}>
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
            <Animated.View style={[styles.progressFill, barStyle]} />
          </View>
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
      minHeight: 52,
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
      color: colors.textOnAccent,
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
