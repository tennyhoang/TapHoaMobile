import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { C } from '@/constants/Colors';

interface Props {
  note: string;
  onChange: (text: string) => void;
}

export default function NoteInput({ note, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{t('checkout.delivery_note')}</Text>
      <View style={s.noteWrap}>
        <TextInput
          style={s.noteInput}
          placeholder={t('checkout.note_hint')}
          placeholderTextColor="#9CA3AF"
          value={note}
          onChangeText={onChange}
          multiline
          numberOfLines={3}
          maxLength={500}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 8 },
  noteWrap: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  noteInput: { fontSize: 14, color: C.text, minHeight: 72, textAlignVertical: 'top' },
});
