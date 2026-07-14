import { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Pencil, Trash2 } from 'lucide-react-native';

import { AppText, Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { GlassCard } from '@/components/ui/GlassCard';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/context/ThemeContext';
import { useFavorites } from '@/hooks/useFavorites';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import type { CategoryManagerScreenProps } from '@/navigation/types';
import { DEFAULT_FAVORITE_CATEGORY_ID } from '@/types/favorites';
import { radii, spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

export function CategoryManagerScreen({ navigation }: CategoryManagerScreenProps) {
  const { colors, isDark } = useTheme();
  const { contentFrameStyle, scrollBottomPad, isCompact } = useResponsiveLayout();
  const styles = createStyles(colors, isDark, isCompact);
  const { categories, addCategory, renameCategory, deleteCategory } = useFavorites();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleAddCategory = useCallback(() => {
    try {
      addCategory(newCategoryName);
      setNewCategoryName('');
    } catch (error) {
      Alert.alert('Could not add category', error instanceof Error ? error.message : 'Try again.');
    }
  }, [addCategory, newCategoryName]);

  const handleSaveRename = useCallback(() => {
    if (!editingId) {
      return;
    }

    try {
      renameCategory(editingId, editingName);
      setEditingId(null);
      setEditingName('');
    } catch (error) {
      Alert.alert('Could not rename', error instanceof Error ? error.message : 'Try again.');
    }
  }, [editingId, editingName, renameCategory]);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTargetId) {
      return;
    }

    try {
      deleteCategory(deleteTargetId);
      setDeleteTargetId(null);
    } catch (error) {
      Alert.alert('Could not delete', error instanceof Error ? error.message : 'Try again.');
    }
  }, [deleteCategory, deleteTargetId]);

  const deleteTarget = categories.find(category => category.id === deleteTargetId);

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            contentFrameStyle,
            { paddingBottom: scrollBottomPad },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Button
              label="Back"
              variant="ghost"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            />
            <AppText style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
              Categories
            </AppText>
            <AppText style={styles.subtitle}>
              Group favorites into collections. Items move to General when a category is deleted.
            </AppText>
          </View>

          <GlassCard style={styles.addCard}>
            <AppText style={styles.sectionLabel}>New category</AppText>
            <TextInput
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="e.g. Watches, Furniture"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={handleAddCategory}
            />
            <Button
              label="Add category"
              fullWidth
              disabled={newCategoryName.trim().length === 0}
              onPress={handleAddCategory}
            />
          </GlassCard>

          <View style={styles.listSection}>
            <AppText style={styles.sectionLabel}>Your categories</AppText>
            <View style={styles.list}>
              {categories.map(category => {
                const isDefault = category.id === DEFAULT_FAVORITE_CATEGORY_ID;
                const isEditing = editingId === category.id;

                return (
                  <GlassCard key={category.id} style={styles.categoryRow}>
                    {isEditing ? (
                      <>
                        <TextInput
                          value={editingName}
                          onChangeText={setEditingName}
                          autoFocus
                          style={styles.input}
                          placeholderTextColor={colors.textMuted}
                        />
                        <View style={[styles.editActions, isCompact && styles.editActionsStack]}>
                          <Button
                            label="Save"
                            onPress={handleSaveRename}
                            style={styles.editButton}
                            fullWidth={isCompact}
                          />
                          <Button
                            label="Cancel"
                            variant="secondary"
                            onPress={() => {
                              setEditingId(null);
                              setEditingName('');
                            }}
                            style={styles.editButton}
                            fullWidth={isCompact}
                          />
                        </View>
                      </>
                    ) : (
                      <View style={styles.categoryContent}>
                        <View style={styles.categoryTextBlock}>
                          <AppText style={styles.categoryName} numberOfLines={2}>
                            {category.name}
                          </AppText>
                          {isDefault ? (
                            <AppText style={styles.categoryMeta}>Default category</AppText>
                          ) : null}
                        </View>
                        {!isDefault ? (
                          <View style={styles.iconActions}>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Rename ${category.name}`}
                              onPress={() => {
                                setEditingId(category.id);
                                setEditingName(category.name);
                              }}
                              style={styles.iconButton}>
                              <Pencil color={colors.textMuted} size={18} strokeWidth={2} />
                            </Pressable>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Delete ${category.name}`}
                              onPress={() => setDeleteTargetId(category.id)}
                              style={[styles.iconButton, styles.deleteButton]}>
                              <Trash2 color={colors.danger} size={18} strokeWidth={2} />
                            </Pressable>
                          </View>
                        ) : null}
                      </View>
                    )}
                  </GlassCard>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmDialog
        visible={deleteTargetId != null}
        title="Delete category?"
        message={
          deleteTarget
            ? `Items in "${deleteTarget.name}" will move to General.`
            : 'Items in this category will move to General.'
        }
        confirmLabel="Delete"
        cancelLabel="Keep"
        destructive
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
      />
    </Screen>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean, isCompact: boolean) {
  return StyleSheet.create({
    flex: {
      flex: 1,
    },
    scroll: {
      gap: spacing.lg,
      width: '100%',
    },
    header: {
      marginTop: spacing.md,
      gap: spacing.sm,
    },
    backButton: {
      alignSelf: 'flex-start',
      minHeight: 44,
      paddingHorizontal: spacing.md,
    },
    title: {
      ...typography.title,
      color: colors.textPrimary,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
    },
    addCard: {
      gap: spacing.sm,
    },
    sectionLabel: {
      ...typography.label,
      color: colors.textMuted,
    },
    input: {
      ...typography.body,
      color: colors.textPrimary,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      maxWidth: '100%',
    },
    listSection: {
      gap: spacing.sm,
    },
    list: {
      gap: spacing.sm,
    },
    categoryRow: {
      gap: spacing.sm,
    },
    categoryContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    categoryTextBlock: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    categoryName: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    categoryMeta: {
      ...typography.caption,
      color: colors.textMuted,
    },
    iconActions: {
      flexDirection: 'row',
      gap: spacing.xs,
      flexShrink: 0,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    deleteButton: {
      backgroundColor: colors.dangerSoft,
    },
    editActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    editActionsStack: {
      flexDirection: 'column',
    },
    editButton: {
      flex: isCompact ? undefined : 1,
      minWidth: 0,
    },
  });
}
