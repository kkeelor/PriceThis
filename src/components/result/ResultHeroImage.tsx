import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button } from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import { spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

type ResultHeroImageProps = {
  imageUri?: string;
  objectName: string;
};

export function ResultHeroImage({ imageUri, objectName }: ResultHeroImageProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, width);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(imageUri));

  if (!imageUri) {
    return (
      <View style={styles.placeholder}>
        <AppText style={styles.placeholderText}>✨</AppText>
      </View>
    );
  }

  return (
    <>
      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel={`View photo of ${objectName}`}
        onPress={() => setViewerOpen(true)}
        style={styles.pressable}>
        <Image
          source={{ uri: imageUri }}
          style={styles.hero}
          resizeMode="cover"
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
        />
        {isLoading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : null}
        <View style={styles.tapHint}>
          <AppText style={styles.tapHintText}>Tap to view</AppText>
        </View>
      </Pressable>

      <Modal
        visible={viewerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerOpen(false)}>
        <View style={[styles.viewerBackdrop, { paddingBottom: insets.bottom }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setViewerOpen(false)} />
          <View style={[styles.viewerHeader, { top: insets.top + spacing.sm }]}>
            <Button label="Close" variant="ghost" onPress={() => setViewerOpen(false)} />
          </View>
          <Image
            source={{ uri: imageUri }}
            style={styles.viewerImage}
            resizeMode="contain"
            accessibilityLabel={objectName}
          />
        </View>
      </Modal>
    </>
  );
}

function createStyles(colors: ThemeColors, width: number) {
  const heightCap = width >= 600 ? 420 : width >= 428 ? 360 : 320;
  const heroHeight = Math.round(Math.min(width * 0.72, heightCap));

  return StyleSheet.create({
    pressable: {
      width: '100%',
      height: heroHeight,
      backgroundColor: colors.surface,
    },
    hero: {
      width: '100%',
      height: '100%',
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    tapHint: {
      position: 'absolute',
      right: spacing.md,
      bottom: spacing.md,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 999,
    },
    tapHintText: {
      ...typography.caption,
      color: '#F4F6FB',
    },
    placeholder: {
      width: '100%',
      height: heroHeight,
      backgroundColor: colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderText: {
      fontSize: 40,
    },
    viewerBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      justifyContent: 'center',
    },
    viewerHeader: {
      position: 'absolute',
      right: spacing.md,
      zIndex: 2,
    },
    viewerImage: {
      width: '100%',
      height: '100%',
    },
  });
}
