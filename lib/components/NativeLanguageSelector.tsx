import { useMemo, useState } from 'react';
import { useTranslation } from '../i18n';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeLanguage } from '../FontContext';
import { useFont } from '../FontContext';
import type { Theme } from '../theme';
import { useTheme } from '../ThemeContext';

const NATIVE_LANGUAGE_OPTIONS: {
  value: NativeLanguage;
  labelKey: string;
}[] = [
  { value: 'en', labelKey: 'langEnglish' },
  { value: 'zh', labelKey: 'langChinese' },
  { value: 'es', labelKey: 'langSpanish' },
  { value: 'ms', labelKey: 'langMalay' },
  { value: 'ar', labelKey: 'langArabic' },
];

export function NativeLanguageSelector() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { nativeLanguage, setNativeLanguage } = useFont();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOpt = NATIVE_LANGUAGE_OPTIONS.find(
    (o) => o.value === nativeLanguage,
  );
  const selectedLabel = selectedOpt ? t(selectedOpt.labelKey) : t('select');

  return (
    <>
      <View style={styles.etchedSection}>
        <Text style={styles.sectionLabel}>
          {t('nativeLanguage')}
        </Text>
        <Text style={styles.nativeLanguageHint}>
          {t('nativeLanguageHint')}
        </Text>
        <Pressable
          style={styles.dropdown}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.dropdownLabel}>
            {selectedLabel}
          </Text>
          <Text style={styles.dropdownChevron}>▼</Text>
        </Pressable>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
            onPress={() => {}}
          >
            <Text style={styles.modalTitle}>
              {t('selectNativeLanguage')}
            </Text>
            <ScrollView
              style={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
              {NATIVE_LANGUAGE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    setNativeLanguage(opt.value);
                    setModalVisible(false);
                  }}
                  style={[
                    styles.modalOption,
                    nativeLanguage === opt.value && styles.modalOptionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.modalOptionLabel,
                      nativeLanguage === opt.value &&
                        styles.modalOptionLabelSelected,
                    ]}
                  >
                    {t(opt.labelKey)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    etchedSection: {
      marginTop: 12,
      padding: 12,
      backgroundColor: theme.etchedBg,
      borderRadius: 8,
      borderWidth: 1,
      borderTopColor: theme.etchedBorderLight,
      borderLeftColor: theme.etchedBorderLight,
      borderBottomColor: theme.etchedBorderDark,
      borderRightColor: theme.etchedBorderDark,
    },
    sectionLabel: {
      fontSize: 13,
      color: theme.text,
    },
    nativeLanguageHint: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 4,
      lineHeight: 16,
    },
    dropdown: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 6,
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: theme.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    dropdownLabel: {
      fontSize: 15,
      color: theme.text,
    },
    dropdownChevron: {
      fontSize: 10,
      color: theme.textSecondary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: 24,
    },
    modalContent: {
      borderRadius: 12,
      maxHeight: '70%',
      overflow: 'hidden',
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalScroll: {
      maxHeight: 320,
    },
    modalOption: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalOptionSelected: {
      backgroundColor: theme.accent + '22',
    },
    modalOptionLabel: {
      fontSize: 16,
      color: theme.text,
    },
    modalOptionLabelSelected: {
      color: theme.accent,
      fontWeight: '600',
    },
  });
}
