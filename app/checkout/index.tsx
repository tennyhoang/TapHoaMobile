import React, { useState, useEffect } from 'react';
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
import { cartService } from '@/services/cart.service';
import { walletService } from '@/services/wallet.service';
import { addressesService } from '@/services/addresses.service';
import { vouchersService } from '@/services/vouchers.service';
import { biometrics } from '@/lib/biometrics';
import { formatCurrency } from '@/lib/utils';
import * as Location from 'expo-location';
import { C } from '@/constants/Colors';
import type { Hub, Cart, Address } from '@/types';

type PaymentMethod = 'COD' | 'BankTransfer' | 'Wallet';

export default function CheckoutScreen() {
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
  const [voucherOk, setVoucherOk] = useState(false);
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addrModalVisible, setAddrModalVisible] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );

  useEffect(() => {
    Promise.all([
      cartService.get(),
      hubsService.getActive(),
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
  }, []);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim() || applyingVoucher) return;
    setApplyingVoucher(true);
    try {
      const result = await vouchersService.validate(voucherCode.trim(), cart?.totalAmount ?? 0);
      setVoucherOk(true);
      setVoucherMsg(result.label);
      setVoucherDiscount(result.discount);
    } catch {
      setVoucherOk(false);
      setVoucherMsg('Mã voucher không hợp lệ hoặc đã hết hạn');
      setVoucherDiscount(0);
    } finally {
      setApplyingVoucher(false);
    }
  };

  const finalAmount = Math.max(0, (cart?.totalAmount ?? 0) - voucherDiscount);

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
      });
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

        <VoucherInput
          voucherCode={voucherCode}
          onChange={v => {
            setVoucherCode(v);
            setVoucherMsg('');
            setVoucherDiscount(0);
            setVoucherOk(false);
          }}
          onApply={handleApplyVoucher}
          applying={applyingVoucher}
          voucherMsg={voucherMsg}
          voucherOk={voucherOk}
        />

        <OrderTotal
          totalAmount={cart?.totalAmount ?? 0}
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
          style={[s.placeBtn, placing && s.placeBtnDim]}
          onPress={handlePlaceOrder}
          disabled={placing}
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
  errBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
  },
  errText: { fontSize: 13, color: C.error, flex: 1 },
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
