import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { History } from 'lucide-react-native';

import { RecentScanRow } from '@/components/home/RecentScanRow';
import { AppText, Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { GlassCard } from '@/components/ui/GlassCard';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/context/ThemeContext';
import { useRecentScans } from '@/hooks/useRecentScans';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import type { HistoryScreenProps } from '@/navigation/types';
import { radii, spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

export function HistoryScreen({ navigation }: HistoryScreenProps) {
  const { colors } = useTheme();
  const { contentFrameStyle } = useResponsiveLayout();
  const styles = createStyles(colors);
  const { scans, refresh, deleteScan, clearAll } = useRecentScans();
  const [refreshing, setRefreshing] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refresh();
    requestAnimationFrame(() => {
      setRefreshing(false);
    });
  }, [refresh]);

  const handleConfirmClearAll = useCallback(() => {
    clearAll();
    setClearConfirmOpen(false);
  }, [clearAll]);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[styles.scroll, contentFrameStyle]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.surface}
          />
        }>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <AppText style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
              Recent scans
            </AppText>
            {scans.length > 0 ? (
              <Pressable
                accessibilityLabel="Delete all recent scans"
                accessibilityRole="button"
                onPress={() => setClearConfirmOpen(true)}
                hitSlop={8}
                style={styles.clearAllButton}>
                <AppText style={styles.trashHeaderIcon}>🗑</AppText>
              </Pressable>
            ) : null}
          </View>
          <AppText style={styles.subtitle}>
            {scans.length === 0
              ? 'Your past scans will show up here.'
              : `${scans.length} saved ${scans.length === 1 ? 'scan' : 'scans'}`}
          </AppText>
        </View>

        {scans.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <History color={colors.accent} size={32} strokeWidth={1.75} />
            <AppText style={styles.emptyTitle}>No scans yet</AppText>
            <AppText style={styles.emptyBody}>
              Scan something from Home or try a search to start building your history.
            </AppText>
            <Button
              label="Go to Home"
              variant="secondary"
              fullWidth
              onPress={() => navigation.navigate('Home')}
            />
          </GlassCard>
        ) : (
          <View style={styles.list}>
            {scans.map(item => (
              <RecentScanRow
                key={item.id}
                scan={item}
                onPress={() => navigation.navigate('Result', { result: item })}
                onDelete={() => deleteScan(item.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <ConfirmDialog
        visible={clearConfirmOpen}
        title="Delete all scans?"
        message={
          scans.length === 1
            ? 'This removes 1 saved scan from your history. This cannot be undone.'
            : `This removes ${scans.length} saved scans from your history. This cannot be undone.`
        }
        confirmLabel="Delete all"
        cancelLabel="Keep scans"
        destructive
        onCancel={() => setClearConfirmOpen(false)}
        onConfirm={handleConfirmClearAll}
      />
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    scroll: {
      paddingBottom: spacing.xxl,
      gap: spacing.lg,
      width: '100%',
    },
    header: {
      marginTop: spacing.md,
      gap: spacing.xs,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    title: {
      ...typography.title,
      color: colors.textPrimary,
      flex: 1,
      minWidth: 0,
    },
    clearAllButton: {
      width: 36,
      height: 36,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.dangerSoft,
      flexShrink: 0,
    },
    trashHeaderIcon: {
      fontSize: 18,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
    },
    emptyCard: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xl,
      alignSelf: 'center',
      width: '100%',
      maxWidth: 420,
    },
    emptyTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    emptyBody: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    list: {
      gap: spacing.sm,
    },
  });
}
