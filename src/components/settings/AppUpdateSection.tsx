import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { spacing } from '@/theme';
import type { ThemeColors } from '@/theme/types';

type AppUpdateSectionProps = {
  active: boolean;
};

export function AppUpdateSection({ active }: AppUpdateSectionProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { status, progress, updateAvailable, refreshCheck, downloadUpdate } = useAppUpdate();

  useEffect(() => {
    if (active) {
      void refreshCheck();
    }
  }, [active, refreshCheck]);

  const isBusy = status === 'downloading' || status === 'installing';
  const visible = updateAvailable || isBusy;

  if (!visible) {
    return null;
  }

  const label =
    status === 'downloading'
      ? `Updating… ${Math.round(progress * 100)}%`
      : status === 'installing'
        ? 'Opening installer…'
        : 'Update';

  return (
    <View style={styles.section}>
      <Button label={label} fullWidth disabled={isBusy} onPress={() => void downloadUpdate()} />
      {status === 'downloading' ? (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      ) : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    section: {
      gap: spacing.sm,
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
  });
}
