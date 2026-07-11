import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTheme } from '@/context/ThemeContext';
import type { CuriosityCard } from '@/types/scan';
import { spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

type CuriosityCardItemProps = {
  card: CuriosityCard;
};

export function CuriosityCardItem({ card }: CuriosityCardItemProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable onPress={() => setExpanded(current => !current)}>
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <AppText style={styles.title}>{card.title}</AppText>
          <AppText style={styles.chevron}>{expanded ? '−' : '+'}</AppText>
        </View>
        <AppText style={styles.preview}>{card.preview}</AppText>
        {expanded ? <AppText style={styles.content}>{card.content}</AppText> : null}
      </GlassCard>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      gap: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    title: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      flex: 1,
    },
    chevron: {
      ...typography.headline,
      color: colors.accent,
    },
    preview: {
      ...typography.body,
      color: colors.textSecondary,
    },
    content: {
      ...typography.body,
      color: colors.textPrimary,
      marginTop: spacing.xs,
    },
  });
}
