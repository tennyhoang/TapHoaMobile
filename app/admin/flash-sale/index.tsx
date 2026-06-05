import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
  Switch,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '@/components/ScreenHeader';
import { C } from '@/constants/Colors';
import { useRoleGuard } from '@/lib/useRoleGuard';
import { adminService, type CreateFlashSaleSessionPayload } from '@/services/admin.service';
import { productsService } from '@/services/products.service';
import { useToast } from '@/components/Toast';
import { formatCurrency } from '@/lib/utils';
import type { AdminFlashSaleSession, AdminFlashSaleItem, Product } from '@/types';
import EmptyState from '@/components/EmptyState';

function CreateSessionModal({
  onSave,
  onClose,
  loading,
}: {
  onSave: (p: CreateFlashSaleSessionPayload) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const defaultStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const later = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const defaultEnd = `${later.getFullYear()}-${pad(later.getMonth() + 1)}-${pad(later.getDate())}T${pad(later.getHours())}:${pad(later.getMinutes())}`;

  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);
  const [isActive, setIsActive] = useState(false);

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  const timeValid = endDate > startDate;
  const valid = name.trim() && startTime && endTime && timeValid;

  return (
    <View style={cs.container}>
      <View style={cs.header}>
        <Text style={cs.title}>Tạo phiên Flash Sale</Text>
        <TouchableOpacity onPress={onClose} style={cs.closeBtn}>
          <Ionicons name="close" size={22} color={C.muted} />
        </TouchableOpacity>
      </View>
      <ScrollView style={cs.body} keyboardShouldPersistTaps="handled">
        <Text style={cs.label}>Tên phiên *</Text>
        <TextInput
          style={cs.input}
          value={name}
          onChangeText={setName}
          placeholder="VD: Flash Sale cuối tuần"
          placeholderTextColor={C.muted}
        />

        <Text style={cs.label}>Thời gian bắt đầu *</Text>
        <TextInput
          style={cs.input}
          value={startTime}
          onChangeText={setStartTime}
          placeholder="YYYY-MM-DDTHH:mm"
          placeholderTextColor={C.muted}
          autoCapitalize="none"
        />

        <Text style={cs.label}>Thời gian kết thúc *</Text>
        <TextInput
          style={cs.input}
          value={endTime}
          onChangeText={setEndTime}
          placeholder="YYYY-MM-DDTHH:mm"
          placeholderTextColor={C.muted}
          autoCapitalize="none"
        />

        <View style={cs.switchRow}>
          <Text style={cs.label}>Kích hoạt ngay</Text>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: '#E5E7EB', true: C.primary + '80' }}
            thumbColor={isActive ? C.primary : '#9CA3AF'}
          />
        </View>

        {!timeValid && startTime && endTime ? (
          <Text style={cs.warning}>Thời gian kết thúc phải sau thời gian bắt đầu</Text>
        ) : null}

        <TouchableOpacity
          style={[cs.saveBtn, (!valid || loading) && cs.saveBtnDim]}
          onPress={() =>
            onSave({
              name: name.trim(),
              startTime: new Date(startTime).toISOString(),
              endTime: new Date(endTime).toISOString(),
              isActive,
            })
          }
          disabled={!valid || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={cs.saveBtnText}>Tạo phiên</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function SessionItemsModal({
  session,
  onClose,
}: {
  session: AdminFlashSaleSession;
  onClose: () => void;
}) {
  const { show } = useToast();
  const [items, setItems] = useState<AdminFlashSaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchText, setSearchText] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPrice, setPickerPrice] = useState('');
  const [pickerStock, setPickerStock] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const loadItems = useCallback(async () => {
    try {
      const data = await adminService.flashSale.getItems(session.id);
      setItems(data);
    } catch {
      show('Không thể tải sản phẩm', 'error');
    } finally {
      setLoading(false);
    }
  }, [session.id]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  const searchProducts = async () => {
    if (!searchText.trim()) return;
    try {
      const res = await productsService.getAll({ search: searchText, pageSize: 10 });
      setProducts(res.items ?? []);
    } catch {
      show('Không thể tìm sản phẩm', 'error');
    }
  };

  const handleSelectProduct = (p: Product) => {
    setSelectedProduct(p);
    setPickerPrice(String(p.price));
    setPickerStock('50');
  };

  const handleAddItem = async () => {
    if (!selectedProduct) return;
    const price = Number(pickerPrice);
    const stock = Number(pickerStock);
    if (!price || !stock) {
      show('Giá và số lượng không hợp lệ', 'error');
      return;
    }
    if (price >= selectedProduct.price) {
      show('Giá Flash Sale phải thấp hơn giá gốc', 'error');
      return;
    }
    if (selectedProduct.stock > 0 && stock > selectedProduct.stock) {
      show('Số lượng FL không thể lớn hơn tồn kho', 'error');
      return;
    }
    setAddingId(selectedProduct.id);
    try {
      const newItem = await adminService.flashSale.addItem(session.id, {
        productId: selectedProduct.id,
        flashSalePrice: price,
        flashSaleStock: stock,
      });
      setItems(prev => [...prev, newItem]);
      setSelectedProduct(null);
      setPickerPrice('');
      setPickerStock('');
      setShowPicker(false);
      show('Đã thêm sản phẩm');
    } catch {
      show('Thêm sản phẩm thất bại', 'error');
    } finally {
      setAddingId(null);
    }
  };

  const handleRemoveItem = async (item: AdminFlashSaleItem) => {
    Alert.alert('Xoá sản phẩm', `Xoá "${item.productName}" khỏi phiên?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          setRemovingId(item.id);
          try {
            await adminService.flashSale.removeItem(session.id, item.id);
            setItems(prev => prev.filter(i => i.id !== item.id));
            show('Đã xoá sản phẩm');
          } catch {
            show('Không thể xoá', 'error');
          } finally {
            setRemovingId(null);
          }
        },
      },
    ]);
  };

  const existingProductIds = new Set(items.map(i => i.productId));

  return (
    <View style={im.container}>
      <View style={im.header}>
        <View style={{ flex: 1 }}>
          <Text style={im.title}>{session.name}</Text>
          <Text style={im.subtitle}>{items.length} sản phẩm</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={im.closeBtn}>
          <Ionicons name="close" size={22} color={C.muted} />
        </TouchableOpacity>
      </View>

      <ScrollView style={im.body} keyboardShouldPersistTaps="handled">
        {/* Add product button */}
        <TouchableOpacity style={im.addProductBtn} onPress={() => setShowPicker(v => !v)}>
          <Ionicons
            name={showPicker ? 'chevron-up' : 'add-circle-outline'}
            size={18}
            color={C.primary}
          />
          <Text style={im.addProductBtnText}>{showPicker ? 'Ẩn tìm kiếm' : 'Thêm sản phẩm'}</Text>
        </TouchableOpacity>

        {showPicker && (
          <View style={im.pickerBox}>
            <View style={im.searchRow}>
              <TextInput
                style={im.searchInput}
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Tìm sản phẩm..."
                placeholderTextColor={C.muted}
                returnKeyType="search"
                onSubmitEditing={searchProducts}
              />
              <TouchableOpacity style={im.searchBtn} onPress={searchProducts}>
                <Ionicons name="search" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {products.map(p => {
              const alreadyAdded = existingProductIds.has(p.id);
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    im.productItem,
                    alreadyAdded && { opacity: 0.5 },
                    selectedProduct?.id === p.id && im.productItemSelected,
                  ]}
                  onPress={() => !alreadyAdded && handleSelectProduct(p)}
                  disabled={alreadyAdded}
                >
                  <Text style={im.productName} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={im.productPrice}>{formatCurrency(p.discountPrice ?? p.price)}</Text>
                  {alreadyAdded && <Text style={im.addedLabel}>Đã thêm</Text>}
                </TouchableOpacity>
              );
            })}

            {selectedProduct && (
              <View style={im.priceStockBox}>
                <Text style={im.priceStockTitle}>Cấu hình: {selectedProduct.name}</Text>
                <View style={im.priceStockRow}>
                  <View style={im.priceStockField}>
                    <Text style={im.priceStockLabel}>Giá Flash Sale</Text>
                    <TextInput
                      style={im.priceStockInput}
                      value={pickerPrice}
                      onChangeText={setPickerPrice}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={C.muted}
                    />
                  </View>
                  <View style={im.priceStockField}>
                    <Text style={im.priceStockLabel}>Số lượng</Text>
                    <TextInput
                      style={im.priceStockInput}
                      value={pickerStock}
                      onChangeText={setPickerStock}
                      keyboardType="numeric"
                      placeholder="50"
                      placeholderTextColor={C.muted}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={[im.confirmAddBtn, addingId === selectedProduct.id && { opacity: 0.6 }]}
                  onPress={handleAddItem}
                  disabled={!!addingId}
                >
                  {addingId === selectedProduct.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={im.confirmAddBtnText}>Xác nhận thêm</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Current items */}
        <Text style={im.sectionTitle}>Sản phẩm trong phiên</Text>
        {loading ? (
          <ActivityIndicator color={C.primary} style={{ padding: 20 }} />
        ) : items.length === 0 ? (
          <Text style={im.emptyText}>Chưa có sản phẩm nào</Text>
        ) : (
          items.map(item => (
            <View key={item.id} style={im.itemCard}>
              <View style={{ flex: 1 }}>
                <Text style={im.itemName} numberOfLines={2}>
                  {item.productName}
                </Text>
                <View style={im.itemPriceRow}>
                  <Text style={im.itemOrigPrice}>{formatCurrency(item.originalPrice)}</Text>
                  <Ionicons name="arrow-forward" size={12} color={C.muted} />
                  <Text style={im.itemFlashPrice}>{formatCurrency(item.flashSalePrice)}</Text>
                </View>
                <Text style={im.itemStock}>
                  Tồn: {item.flashSaleStock} · Đã bán: {item.soldCount}
                </Text>
              </View>
              <TouchableOpacity
                style={im.removeBtn}
                onPress={() => handleRemoveItem(item)}
                disabled={removingId === item.id}
              >
                {removingId === item.id ? (
                  <ActivityIndicator color="#EF4444" size="small" />
                ) : (
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                )}
              </TouchableOpacity>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

export default function AdminFlashSaleScreen() {
  const unauthorized = useRoleGuard('Admin');
  const { show } = useToast();

  const [sessions, setSessions] = useState<AdminFlashSaleSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<AdminFlashSaleSession | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await adminService.flashSale.getSessions();
      setSessions(data);
    } catch {
      show('Không thể tải phiên Flash Sale', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleCreate = async (payload: CreateFlashSaleSessionPayload) => {
    setCreating(true);
    try {
      await adminService.flashSale.createSession(payload);
      show('Đã tạo phiên Flash Sale');
      setCreateModalVisible(false);
      load(true);
    } catch {
      show('Tạo phiên thất bại', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (session: AdminFlashSaleSession) => {
    setTogglingId(session.id);
    try {
      const res = await adminService.flashSale.toggleSession(session.id);
      setSessions(prev =>
        prev.map(s => (s.id === session.id ? { ...s, isActive: res.isActive } : s))
      );
    } catch {
      show('Không thể thay đổi trạng thái', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = (session: AdminFlashSaleSession) => {
    Alert.alert('Xoá phiên', `Xoá phiên "${session.name}"?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminService.flashSale.deleteSession(session.id);
            setSessions(prev => prev.filter(s => s.id !== session.id));
            show('Đã xoá phiên');
          } catch {
            show('Không thể xoá phiên', 'error');
          }
        },
      },
    ]);
  };

  const renderSession = ({ item }: { item: AdminFlashSaleSession }) => {
    const start = new Date(item.startTime);
    const end = new Date(item.endTime);
    const now = new Date();
    const isInTimeRange = now >= start && now <= end;
    const isLive = item.isActive && isInTimeRange;
    const isScheduled = item.isActive && now < start;
    const isExpired = end < now;
    const fmt = (d: Date) =>
      d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

    let statusLabel = 'Tắt';
    let statusColor: string = C.muted;
    if (isLive) {
      statusLabel = 'Đang diễn ra';
      statusColor = '#16A34A';
    } else if (isScheduled) {
      statusLabel = 'Sắp diễn ra';
      statusColor = '#F59E0B';
    } else if (isExpired) {
      statusLabel = 'Đã kết thúc';
      statusColor = '#9CA3AF';
    }

    return (
      <View style={s.card}>
        <View style={s.cardTop}>
          <View style={s.cardLeft}>
            <View style={s.nameRow}>
              <Ionicons name="flash-outline" size={16} color="#F59E0B" />
              <Text style={s.sessionName}>{item.name}</Text>
              {isLive && <View style={s.liveDot} />}
            </View>
            <Text style={s.sessionTime}>
              {fmt(start)} → {fmt(end)}
            </Text>
            <Text style={s.itemCount}>{item.itemCount} sản phẩm</Text>
          </View>
          <View style={s.toggleWrap}>
            {togglingId === item.id ? (
              <ActivityIndicator color={C.primary} size="small" />
            ) : (
              <Switch
                value={item.isActive}
                onValueChange={() => handleToggle(item)}
                trackColor={{ false: '#E5E7EB', true: C.primary + '80' }}
                thumbColor={item.isActive ? C.primary : '#9CA3AF'}
              />
            )}
            <Text style={[s.activeLabel, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
        <View style={s.cardBtns}>
          <TouchableOpacity style={s.manageBtn} onPress={() => setSelectedSession(item)}>
            <Ionicons name="list-outline" size={14} color={C.primary} />
            <Text style={s.manageBtnText}>Quản lý SP</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={14} color="#EF4444" />
            <Text style={s.deleteBtnText}>Xoá</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (unauthorized) return null;

  return (
    <View style={s.root}>
      <ScreenHeader
        title="Flash Sale"
        right={
          <TouchableOpacity onPress={() => setCreateModalVisible(true)} style={s.addBtn}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={item => item.id}
          renderItem={renderSession}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={C.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState icon="flash-outline" title="Chưa có phiên Flash Sale nào" />
          }
        />
      )}

      <Modal
        visible={createModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <CreateSessionModal
          onSave={handleCreate}
          onClose={() => setCreateModalVisible(false)}
          loading={creating}
        />
      </Modal>

      <Modal
        visible={!!selectedSession}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedSession(null)}
      >
        {selectedSession && (
          <SessionItemsModal session={selectedSession} onClose={() => setSelectedSession(null)} />
        )}
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  addBtn: { backgroundColor: C.primary, borderRadius: 8, padding: 6 },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardLeft: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sessionName: { fontSize: 15, fontWeight: '700', color: C.text, flex: 1 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' },
  sessionTime: { fontSize: 12, color: C.muted },
  itemCount: { fontSize: 12, color: C.primary, fontWeight: '600' },
  toggleWrap: { alignItems: 'center', gap: 4 },
  activeLabel: { fontSize: 10, fontWeight: '700' },
  cardBtns: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 10,
  },
  manageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.primary,
    backgroundColor: '#E5F9FA',
  },
  manageBtnText: { fontSize: 13, color: C.primary, fontWeight: '700' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  deleteBtnText: { fontSize: 13, color: '#EF4444', fontWeight: '700' },
});

const cs = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.card },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  title: { fontSize: 18, fontWeight: '700', color: C.text },
  closeBtn: { padding: 4 },
  body: { padding: 20 },
  label: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: C.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: C.text,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  warning: { fontSize: 12, color: '#EF4444', marginTop: 8, textAlign: 'center' },
  saveBtn: {
    marginTop: 16,
    marginBottom: 40,
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDim: { opacity: 0.5 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

const im = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.card },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  title: { fontSize: 17, fontWeight: '700', color: C.text },
  subtitle: { fontSize: 12, color: C.muted, marginTop: 2 },
  closeBtn: { padding: 4 },
  body: { flex: 1, padding: 16 },
  addProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#E5F9FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.primary,
    marginBottom: 12,
  },
  addProductBtnText: { fontSize: 14, color: C.primary, fontWeight: '700' },
  pickerBox: {
    backgroundColor: C.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: C.text,
  },
  searchBtn: {
    backgroundColor: C.primary,
    borderRadius: 8,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productItem: {
    backgroundColor: C.card,
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productItemSelected: { borderWidth: 1, borderColor: C.primary },
  productName: { fontSize: 13, color: C.text, flex: 1 },
  productPrice: { fontSize: 13, color: C.primary, fontWeight: '600', marginLeft: 8 },
  addedLabel: { fontSize: 11, color: C.muted, marginLeft: 8 },
  priceStockBox: {
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.primary,
    padding: 12,
    gap: 10,
    marginTop: 4,
  },
  priceStockTitle: { fontSize: 13, fontWeight: '700', color: C.text },
  priceStockRow: { flexDirection: 'row', gap: 10 },
  priceStockField: { flex: 1 },
  priceStockLabel: { fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: '600' },
  priceStockInput: {
    backgroundColor: C.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: C.text,
  },
  confirmAddBtn: {
    backgroundColor: C.primary,
    borderRadius: 10,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmAddBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 10, marginTop: 4 },
  emptyText: { fontSize: 14, color: C.muted, textAlign: 'center', padding: 20 },
  itemCard: {
    backgroundColor: C.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  itemName: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 4 },
  itemPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemOrigPrice: { fontSize: 12, color: C.muted, textDecorationLine: 'line-through' },
  itemFlashPrice: { fontSize: 13, color: '#F59E0B', fontWeight: '700' },
  itemStock: { fontSize: 11, color: C.muted, marginTop: 3 },
  removeBtn: { padding: 6 },
});
