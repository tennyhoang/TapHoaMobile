import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '@/components/ScreenHeader';
import KeyboardAwareScreen from '@/components/KeyboardAwareScreen';
import OrderSummary from '@/components/checkout/OrderSummary';
import RecipientSelector from '@/components/checkout/RecipientSelector';
import HubSelector from '@/components/checkout/HubSelector';
import PaymentMethodSelector from '@/components/checkout/PaymentMethodSelector';
import NoteInput from '@/components/checkout/NoteInput';
import VoucherInput from '@/components/checkout/VoucherInput';
import OrderTotal from '@/components/checkout/OrderTotal';
import HubMapModal from '@/components/checkout/HubMapModal';
import AddressPickerModal from '@/components/checkout/AddressPickerModal';
import { hubsService } from '@/services/hubs.service';
import { ordersService } from '@/services/orders.service';
import { loyaltyService } from '@/services/loyalty.service';
import { cartService } from '@/services/cart.service';
import { walletService } from '@/services/wallet.service';
import { addressesService } from '@/services/addresses.service';
import { vouchersService } from '@/services/vouchers.service';
import { biometrics } from '@/lib/biometrics';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import * as Location from 'expo-location';
import { C } from '@/constants/Colors';
import type { Hub, Cart, Address } from '@/types';

type PaymentMethod = 'COD' | 'BankTransfer' | 'Wallet' | 'Vnpay' | 'Momo';

export default function CheckoutScreen() {
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();
  const [cart, setCart] = useState<Cart | null>(null);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [selectedHub, setSelectedHub] = useState<Hub | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherMsg, setVoucherMsg] = useState('');
  const [voucherNote, setVoucherNote] = useState('');
  const [voucherOk, setVoucherOk] = useState(false);
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addrModalVisible, setAddrModalVisible] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );

  useEffect(() => {
    const fetchHubsWithLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          return hubsService.getActive({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
          });
        }
      } catch {}
      return hubsService.getActive();
    };

    Promise.all([
      cartService.get(),
      fetchHubsWithLocation(),
      walletService.getBalance(),
      addressesService.getAll(),
    ])
      .then(([c, h, w, addrs]) => {
        setCart(c);
        setHubs(h);
        setWalletBalance(w?.balance ?? 0);
        if (h.length > 0) setSelectedHub(h[0]);
        setAddresses(addrs);
        const def = addrs.find(a => a.isDefault) ?? addrs[0] ?? null;
        setSelectedAddress(def);
      })
      .catch(() => router.back())
      .finally(() => setLoading(false));
    loyaltyService
      .getBalance()
      .then(b => setLoyaltyPoints(b?.points ?? 0))
      .catch(() => {});
  }, []);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim() || applyingVoucher) return;
    setApplyingVoucher(true);
    try {
      const result = await vouchersService.validate(voucherCode.trim(), cart?.totalAmount ?? 0);
      setVoucherOk(true);
      setVoucherMsg(result.label);
      setVoucherNote(result.note ?? '');
      setVoucherDiscount(result.discount);
    } catch {
      setVoucherOk(false);
      setVoucherMsg('Mã voucher không hợp lệ hoặc đã hết hạn');
      setVoucherNote('');
      setVoucherDiscount(0);
    } finally {
      setApplyingVoucher(false);
    }
  };

  useEffect(() => {
    if (voucherOk) {
      setVoucherCode('');
      setVoucherDiscount(0);
      setVoucherMsg('');
      setVoucherNote('');
      setVoucherOk(false);
    }
  }, [selectedHub?.id]);

  const subtotal = cart?.totalAmount ?? 0;
  const shippingFee = selectedHub
    ? subtotal >= selectedHub.freeShippingThreshold
      ? 0
      : selectedHub.shippingFee
    : 0;
  const freeShipRemaining = selectedHub
    ? Math.max(0, selectedHub.freeShippingThreshold - subtotal)
    : 0;
  const minOrderMet = !selectedHub || subtotal >= selectedHub.minimumOrderAmount;
  const minOrderRemaining = selectedHub
    ? Math.max(0, selectedHub.minimumOrderAmount - subtotal)
    : 0;
  const finalAmount = Math.max(0, subtotal + shippingFee - voucherDiscount);

  const openMap = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    }
    setMapVisible(true);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setError('Vui lòng chọn địa chỉ người nhận');
      return;
    }
    if (!selectedHub) {
      setError('Vui lòng chọn điểm nhận hàng');
      return;
    }
    const confirmed = await biometrics.authenticate('Xác nhận đặt hàng');
    if (!confirmed) return;
    setError('');
    setPlacing(true);
    try {
      const order = await ordersService.create({
        hubId: selectedHub.id,
        addressId: selectedAddress.id,
        note: note.trim() || undefined,
        paymentMethod,
        voucherCode: voucherOk && voucherCode.trim() ? voucherCode.trim() : undefined,
        pointsToRedeem,
      });

      if (paymentMethod === 'Vnpay') {
        const { paymentUrl } = await api.post<{ paymentUrl: string }>('/payment/vnpay/create', {
          orderId: order.id,
        });
        router.push(
          `/payment?url=${encodeURIComponent(paymentUrl)}&orderId=${order.id}&gateway=vnpay` as any
        );
        return;
      }
      if (paymentMethod === 'Momo') {
        const { payUrl } = await api.post<{ payUrl: string }>('/payment/momo/create', {
          orderId: order.id,
        });
        router.push(
          `/payment?url=${encodeURIComponent(payUrl)}&orderId=${order.id}&gateway=momo` as any
        );
        return;
      }

      router.replace(`/order/${order.id}` as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đặt hàng thất bại');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={C.primary} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAwareScreen style={s.root}>
      <ScreenHeader title="Xác nhận đơn hàng" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.body}>
        {cart && <OrderSummary items={cart.items} totalItems={cart.totalItems} />}

        <RecipientSelector
          selectedAddress={selectedAddress}
          onPress={() => setAddrModalVisible(true)}
          onAddNew={() => router.push('/addresses' as any)}
        />

        <HubSelector
          hubs={hubs}
          selectedHub={selectedHub}
          onSelect={setSelectedHub}
          onOpenMap={openMap}
        />

        <PaymentMethodSelector
          paymentMethod={paymentMethod}
          onChange={setPaymentMethod}
          walletBalance={walletBalance}
        />

        <NoteInput note={note} onChange={setNote} />

        {/* BR-013: minimum order warning */}
        {!minOrderMet && (
          <View style={s.warnBox}>
            <Ionicons name="alert-circle" size={16} color="#B45309" />
            <Text style={s.warnText}>
              Đơn tối thiểu {formatCurrency(selectedHub!.minimumOrderAmount)} — cần thêm{' '}
              <Text style={{ fontWeight: '700' }}>{formatCurrency(minOrderRemaining)}</Text>
            </Text>
          </View>
        )}

        {/* BR-013: free shipping progress */}
        {minOrderMet && freeShipRemaining > 0 && (
          <View style={s.shippingBox}>
            <Ionicons name="bicycle-outline" size={16} color={C.primary} />
            <Text style={s.shippingText}>
              Mua thêm{' '}
              <Text style={{ fontWeight: '700', color: C.primary }}>
                {formatCurrency(freeShipRemaining)}
              </Text>{' '}
              để miễn phí ship
            </Text>
          </View>
        )}

        <VoucherInput
          voucherCode={voucherCode}
          onChange={v => {
            setVoucherCode(v);
            setVoucherMsg('');
            setVoucherNote('');
            setVoucherDiscount(0);
            setVoucherOk(false);
          }}
          onApply={handleApplyVoucher}
          applying={applyingVoucher}
          voucherMsg={voucherMsg}
          voucherOk={voucherOk}
          voucherNote={voucherNote}
        />

        {/* Loyalty points */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{t('loyalty.title')}</Text>
          <View style={s.card}>
            <View style={s.hubRow}>
              <View style={s.payIcon}>
                <Ionicons name="star-outline" size={18} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.hubName}>{t('loyalty.redeem')}</Text>
                <Text style={s.hubAddr}>
                  {t('loyalty.available', { points: loyaltyPoints.toLocaleString() })}
                </Text>
              </View>
              <TouchableOpacity
                style={[s.redeemBtn, pointsToRedeem > 0 && s.redeemBtnActive]}
                onPress={() => {
                  if (pointsToRedeem > 0) {
                    setPointsToRedeem(0);
                  } else if (loyaltyPoints > 0) {
                    const max = Math.min(loyaltyPoints, Math.floor(finalAmount / 200));
                    setPointsToRedeem(max);
                  }
                }}
              >
                <Text style={[s.redeemBtnText, pointsToRedeem > 0 && s.redeemBtnTextActive]}>
                  {pointsToRedeem > 0
                    ? t('loyalty.redeem_applied', {
                        points: pointsToRedeem.toLocaleString(),
                        amount: formatCurrency(pointsToRedeem * 200),
                      })
                    : t('loyalty.redeem')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <OrderTotal
          totalAmount={subtotal}
          shippingFee={shippingFee}
          voucherDiscount={voucherDiscount}
          finalAmount={finalAmount}
        />

        {!!error && (
          <View style={s.errBox}>
            <Ionicons name="alert-circle-outline" size={16} color={C.error} />
            <Text style={s.errText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={[s.footer, { paddingBottom: Platform.OS === 'ios' ? bottom + 8 : 16 }]}>
        <TouchableOpacity
          style={[s.placeBtn, (placing || !minOrderMet) && s.placeBtnDim]}
          onPress={handlePlaceOrder}
          disabled={placing || !minOrderMet}
          activeOpacity={0.85}
        >
          {placing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={s.placeBtnText}>Đặt hàng · {formatCurrency(finalAmount)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <HubMapModal
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        hubs={hubs}
        selectedHub={selectedHub}
        onSelectHub={setSelectedHub}
        userLocation={userLocation}
      />

      <AddressPickerModal
        visible={addrModalVisible}
        onClose={() => setAddrModalVisible(false)}
        addresses={addresses}
        selectedAddress={selectedAddress}
        onSelect={setSelectedAddress}
        onAddNew={() => router.push('/addresses' as any)}
        bottom={bottom}
      />
    </KeyboardAwareScreen>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 16, paddingBottom: 120 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 8 },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  hubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  hubName: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 2 },
  hubAddr: { fontSize: 12, color: C.muted, lineHeight: 18 },
  payIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redeemBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  redeemBtnActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  redeemBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.primary,
  },
  redeemBtnTextActive: {
    color: '#92400E',
  },
  errBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
  },
  errText: { fontSize: 13, color: C.error, flex: 1 },
  warnBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
    marginBottom: 8,
  },
  warnText: { fontSize: 13, color: '#92400E', flex: 1 },
  shippingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 12,
    marginBottom: 8,
  },
  shippingText: { fontSize: 13, color: '#166534', flex: 1 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.card,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  placeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    backgroundColor: C.primary,
    borderRadius: 14,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  placeBtnDim: { opacity: 0.65 },
  placeBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
