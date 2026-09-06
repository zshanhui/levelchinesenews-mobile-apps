import { useMemo, useState } from 'react';
import { useTranslation } from '../i18n';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { NativeLanguage } from '../nativeLanguage';
import { useNativeLanguage } from '../NativeLanguageContext';
import type { Theme } from '../theme';
import { useTheme } from '../ThemeContext';

const NATIVE_LANGUAGE_OPTIONS: {
  value: NativeLanguage;
  labelKey: string;
  noteKey?: string;
}[] = [
  { value: NativeLanguage.EN, labelKey: 'langEnglish' },
  { value: NativeLanguage.ZH, labelKey: 'langChinese', noteKey: 'langChineseUiNote' },
  { value: NativeLanguage.AR, labelKey: 'langArabic' },
  { value: NativeLanguage.ID, labelKey: 'langIndonesian' },
  { value: NativeLanguage.VI, labelKey: 'langVietnamese' },
  { value: NativeLanguage.ES, labelKey: 'langSpanish' },
  { value: NativeLanguage.MS, labelKey: 'langMalay' },
  { value: NativeLanguage.RU, labelKey: 'langRussian' },
  { value: NativeLanguage.DE, labelKey: 'langGerman' },
  { value: NativeLanguage.JA, labelKey: 'langJapanese' },
];

function LanguageOptionLabel({
  name,
  note,
  style,
  fontSize,
}: {
  name: string;
  note?: string;
  style: object;
  fontSize: number;
}) {
  return (
    <Text style={style}>
      {name}
      {note ? (
        <Text style={{ fontSize: fontSize * 0.8 }}>{` ${note}`}</Text>
      ) : null}
    </Text>
  );
}

export function NativeLanguageSelector() {
  const { theme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const { t } = useTranslation();
  const { nativeLanguage, setNativeLanguage } = useNativeLanguage();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [modalVisible, setModalVisible] = useState(false);

  /** Large enough to show the full list on typical phones without scrolling. */
  const modalListMaxHeight = Math.round(
    Math.min(windowHeight * 0.72, 720),
  );

  const selectedOpt = NATIVE_LANGUAGE_OPTIONS.find(
    (o) => o.value === nativeLanguage,
  );
  const selectedName = selectedOpt ? t(selectedOpt.labelKey) : t('select');
  const selectedNote = selectedOpt?.noteKey ? t(selectedOpt.noteKey) : undefined;

  return (
    <>
      <View style={styles.etchedSection}>
        <Text style={styles.nativeLanguageHint}>
          {t('nativeLanguageHint')}
        </Text>
        <Pressable
          style={styles.dropdown}
          onPress={() => setModalVisible(true)}
        >
          <LanguageOptionLabel
            name={selectedName}
            note={selectedNote}
            style={styles.dropdownLabel}
            fontSize={15}
          />
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
              style={{ maxHeight: modalListMaxHeight }}
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
                  <LanguageOptionLabel
                    name={t(opt.labelKey)}
                    note={opt.noteKey ? t(opt.noteKey) : undefined}
                    style={[
                      styles.modalOptionLabel,
                      nativeLanguage === opt.value &&
                        styles.modalOptionLabelSelected,
                    ]}
                    fontSize={16}
                  />
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
    nativeLanguageHint: {
      fontSize: 12,
      color: theme.textSecondary,
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
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    modalContent: {
      borderRadius: 12,
      maxHeight: '88%',
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
