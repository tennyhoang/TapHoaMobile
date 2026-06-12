import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { C } from '@/constants/Colors';

interface Props {
  voucherCode: string;
  onChange: (code: string) => void;
  onApply: () => void;
  applying: boolean;
  voucherMsg: string;
  voucherOk: boolean;
  voucherNote?: string;
}

export default function VoucherInput({
  voucherCode,
  onChange,
  onApply,
  applying,
  voucherMsg,
  voucherOk,
  voucherNote,
}: Props) {
  const { t } = useTranslation();
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{t('checkout.voucher')}</Text>
      <View style={s.voucherRow}>
        <TextInput
          style={s.voucherInput}
          placeholder={t('checkout.enter_voucher')}
          placeholderTextColor="#9CA3AF"
          value={voucherCode}
          onChangeText={v => {
            onChange(v);
          }}
          autoCapitalize="characters"
          returnKeyType="done"
          onSubmitEditing={onApply}
        />
        <TouchableOpacity
          style={[s.voucherBtn, (!voucherCode.trim() || applying) && s.voucherBtnDim]}
          onPress={onApply}
          disabled={!voucherCode.trim() || applying}
          activeOpacity={0.85}
        >
          {applying ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={s.voucherBtnText}>{t('checkout.apply')}</Text>
          )}
        </TouchableOpacity>
      </View>
      {!!voucherMsg && (
        <View style={[s.voucherResult, voucherOk ? s.voucherResultOk : s.voucherResultErr]}>
          <Ionicons
            name={voucherOk ? 'checkmark-circle-outline' : 'close-circle-outline'}
            size={15}
            color={voucherOk ? '#22C55E' : C.error}
          />
          <Text style={[s.voucherResultText, { color: voucherOk ? '#16A34A' : C.error }]}>
            {voucherMsg}
          </Text>
        </View>
      )}
      {voucherOk && !!voucherNote && (
        <View style={s.voucherNote}>
          <Ionicons name="information-circle-outline" size={13} color="#92400E" />
          <Text style={s.voucherNoteText}>{voucherNote}</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 8 },
  voucherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  voucherInput: {
    flex: 1,
    height: 46,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    fontSize: 14,
    color: C.text,
    fontWeight: '600',
    letterSpacing: 1,
  },
  voucherBtn: {
    height: 46,
    paddingHorizontal: 18,
    backgroundColor: C.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherBtnDim: { opacity: 0.5 },
  voucherBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  voucherResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  voucherResultOk: { backgroundColor: '#F0FDF4' },
  voucherResultErr: { backgroundColor: '#FEF2F2' },
  voucherResultText: { fontSize: 13, fontWeight: '500' },
  voucherNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 6,
  },
  voucherNoteText: { fontSize: 11, color: '#92400E', fontStyle: 'italic', flex: 1 },
});
