import { useMemo } from 'react';
import { useWindowDimensions, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing } from '@/theme';

/** Phone widths that commonly crush flex text rows. */
const COMPACT_WIDTH = 360;
/** Short phones / landscape-ish heights where camera chrome must shrink. */
const SHORT_HEIGHT = 700;
/** Large phones / small tablets — start capping reading width. */
const WIDE_WIDTH = 428;

export const CONTENT_MAX_WIDTH = 560;

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const isCompact = width < COMPACT_WIDTH;
    const isShort = height < SHORT_HEIGHT;
    const isWide = width >= WIDE_WIDTH;
    const horizontalGutter = isCompact ? spacing.md : spacing.lg;
    const scrollBottomPad = insets.bottom + spacing.xl;

    const contentFrameStyle: ViewStyle = {
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH,
      alignSelf: 'center',
    };

    return {
      width,
      height,
      insets,
      isCompact,
      isShort,
      isWide,
      horizontalGutter,
      scrollBottomPad,
      contentMaxWidth: CONTENT_MAX_WIDTH,
      contentFrameStyle,
    };
  }, [height, insets, width]);
}
