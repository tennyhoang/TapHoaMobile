import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { driverService } from '@/services/driver.service';
import { useToast } from '@/components/Toast';
import { formatCurrency } from '@/lib/utils';
import type { DriverHubBatch, Order, OptimizeRouteResponse, AssignedWarehouseDto } from '@/types';

const C = {
  primary: '#7C3AED',
  primaryLight: '#EDE9FE',
  primaryDark: '#5B21B6',
  teal: '#0EA5AE',
  text: '#111827',
  muted: '#6B7280',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  border: '#F3F4F6',
  amber: '#F59E0B',
  blue: '#3B82F6',
  green: '#22C55E',
  red: '#EF4444',
};

type Tab = 'pickup' | 'transit' | 'history' | 'route';

function buildMapsUrl(origin: string, stops: OptimizeRouteResponse['stops']): string {
  const enc = encodeURIComponent;
  const base = 'https://www.google.com/maps/dir/?api=1&travelmode=driving';
  if (!stops.length) return base;
  if (stops.length === 1)
    return `${base}&origin=${enc(origin)}&destination=${enc(stops[0].address)}`;
  const dest = enc(stops[stops.length - 1].address);
  const wps = stops
    .slice(0, -1)
    .map(s => enc(s.address))
    .join('|');
  return `${base}&origin=${enc(origin)}&destination=${dest}&waypoints=${wps}`;
}

function buildSingleUrl(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`;
}

export default function DriverScreen() {
  const { top } = useSafeAreaInsets();
  const { show } = useToast();

  const [tab, setTab] = useState<Tab>('pickup');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [batches, setBatches] = useState<DriverHubBatch[]>([]);
  const [transitOrders, setTransitOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [warehouse, setWarehouse] = useState<AssignedWarehouseDto | null>(null);
  const [warehouseError, setWarehouseError] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pickingUp, setPickingUp] = useState(false);

  // Route tab state
  const [selectedHubIds, setSelectedHubIds] = useState<Set<string> | null>(null);
  const [routeResult, setRouteResult] = useState<OptimizeRouteResponse | null>(null);
  const [optimizing, setOptimizing] = useState(false);

  const allPickupOrders = batches.flatMap(b => b.orders);

  const load = useCallback(async () => {
    try {
      const [batchRes, transitRes] = await Promise.all([
        driverService.getOrders(),
        driverService.getShippingOrders(),
      ]);
      setBatches(batchRes);
      setTransitOrders(transitRes.items);
    } catch {
      show('Không tải được dữ liệu', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const res = await driverService.getCompletedOrders();
      setHistoryOrders(res.items);
    } catch {
      /* silent */
    }
  }, []);

  const loadWarehouse = useCallback(async () => {
    try {
      const w = await driverService.getMyWarehouse();
      setWarehouse(w);
      setWarehouseError(false);
    } catch {
      setWarehouseError(true);
    }
  }, []);

  useEffect(() => {
    load();
    loadWarehouse();
  }, [load, loadWarehouse]);
  useEffect(() => {
    if (tab === 'history') loadHistory();
  }, [tab, loadHistory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
    if (tab === 'history') loadHistory();
  }, [load, loadHistory, tab]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(
      selected.size === allPickupOrders.length ? new Set() : new Set(allPickupOrders.map(o => o.id))
    );
  };

  const handlePickup = async (ids: string[]) => {
    setPickingUp(true);
    try {
      const res = await driverService.pickupOrders(ids);
      setSelected(new Set());
      await load();
      if (res.errors?.length) {
        show(`${res.shipped} đơn thành công, ${res.errors.length} lỗi`, 'error');
      } else {
        show(`Đã xác nhận lấy ${res.shipped} đơn!`);
      }
    } catch {
      show('Xác nhận lấy hàng thất bại', 'error');
    } finally {
      setPickingUp(false);
    }
  };

  // Route helpers
  const routeBases =
    transitOrders.length > 0
      ? transitOrders.reduce<
          Map<
            string,
            {
              hubId: string;
              hubName: string;
              hubFullAddress: string;
              orderCount: number;
              totalAmount: number;
            }
          >
        >((map, o) => {
          if (!o.hub) return map;
          const entry = map.get(o.hub.id) ?? {
            hubId: o.hub.id,
            hubName: o.hub.name,
            hubFullAddress: [o.hub.address, o.hub.ward, o.hub.district, o.hub.city]
              .filter(Boolean)
              .join(', '),
            orderCount: 0,
            totalAmount: 0,
          };
          entry.orderCount++;
          entry.totalAmount += o.totalAmount;
          map.set(o.hub.id, entry);
          return map;
        }, new Map())
      : batches.reduce<
          Map<
            string,
            {
              hubId: string;
              hubName: string;
              hubFullAddress: string;
              orderCount: number;
              totalAmount: number;
            }
          >
        >((map, b) => {
          map.set(b.hubId, {
            hubId: b.hubId,
            hubName: b.hubName,
            hubFullAddress: b.hubFullAddress,
            orderCount: b.orderCount,
            totalAmount: b.totalAmount,
          });
          return map;
        }, new Map());
  const routeList = [...routeBases.values()];

  const effectiveHubIds = selectedHubIds ?? new Set(routeList.map(b => b.hubId));
  const toggleHub = (hubId: string) => {
    setSelectedHubIds(prev => {
      const base = prev !== null ? new Set(prev) : new Set(routeList.map(b => b.hubId));
      if (base.has(hubId)) {
        base.delete(hubId);
      } else {
        base.add(hubId);
      }
      return base;
    });
    setRouteResult(null);
  };
  const selectedBatches = routeList.filter(b => effectiveHubIds.has(b.hubId));

  const handleOptimize = async () => {
    setOptimizing(true);
    try {
      const addresses = selectedBatches.map(b => b.hubFullAddress);
      const res = await driverService.optimizeRoute(addresses);
      setRouteResult(res);
      if (!res.isOptimized) show('Không tối ưu được, hiển thị thứ tự gốc', 'error');
    } catch (err: any) {
      const code = err?.errorCode;
      if (code === 'DRIVER_NO_WAREHOUSE') {
        show('Kho xuất phát chưa được gán. Liên hệ Admin!', 'error');
      } else {
        show('Tối ưu lộ trình thất bại', 'error');
      }
    } finally {
      setOptimizing(false);
    }
  };

  const openMaps = (url: string) => {
    Linking.openURL(url).catch(() => show('Không mở được Google Maps', 'error'));
  };

  const TABS: { key: Tab; label: string; icon: string; count: number; color: string }[] = [
    {
      key: 'pickup',
      label: 'Cần lấy',
      icon: 'cube-outline',
      count: allPickupOrders.length,
      color: C.amber,
    },
    {
      key: 'transit',
      label: 'Đang giao',
      icon: 'bicycle-outline',
      count: transitOrders.length,
      color: C.blue,
    },
    {
      key: 'history',
      label: 'Hôm nay',
      icon: 'time-outline',
      count: historyOrders.length,
      color: C.green,
    },
    { key: 'route', label: 'Lộ trình', icon: 'map-outline', count: 0, color: C.primary },
  ];

  if (loading) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator color={C.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      {/* Header */}
      <View style={[s.header, { paddingTop: top + 16 }]}>
        <View style={s.blob} />
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={s.headerTitle}>
          <View style={s.headerTitleRow}>
            <Ionicons name="bicycle" size={22} color="#fff" />
            <Text style={s.headerText}>Cổng Tài xế</Text>
          </View>
          <Text style={s.headerSub}>Nhận hàng từ kho — giao đến Hub</Text>
        </View>

        {/* Confirm pickup FAB in header */}
        {tab === 'pickup' && selected.size > 0 && (
          <TouchableOpacity
            style={[s.pickupFab, pickingUp && { opacity: 0.6 }]}
            onPress={() => handlePickup([...selected])}
            disabled={pickingUp}
            activeOpacity={0.85}
          >
            {pickingUp ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                <Text style={s.pickupFabText}>Lấy {selected.size} đơn</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Tab bar */}
      <View style={s.tabs}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabBtn, tab === t.key && s.tabBtnActive]}
            onPress={() => setTab(t.key)}
            activeOpacity={0.8}
          >
            <Ionicons name={t.icon as any} size={18} color={tab === t.key ? t.color : C.muted} />
            <Text style={[s.tabLabel, tab === t.key && { color: t.color }]}>{t.label}</Text>
            {t.count > 0 && (
              <View style={[s.tabBadge, { backgroundColor: t.color }]}>
                <Text style={s.tabBadgeText}>{t.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={s.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.bodyContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
        }
      >
        {/* ── TAB: CẦN LẤY ── */}
        {tab === 'pickup' && (
          <>
            {/* Hub summary cards */}
            {batches.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={s.hubScroll}
                contentContainerStyle={s.hubScrollContent}
              >
                {batches.map(b => (
                  <View key={b.hubId} style={s.hubCard}>
                    <Text style={s.hubCardName} numberOfLines={1}>
                      {b.hubName}
                    </Text>
                    <Text style={s.hubCardCount}>{b.orderCount} đơn</Text>
                    <Text style={s.hubCardAmount}>{formatCurrency(b.totalAmount)}</Text>
                  </View>
                ))}
              </ScrollView>
            )}

            {allPickupOrders.length === 0 ? (
              <View style={s.empty}>
                <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
                <Text style={s.emptyTitle}>Không có đơn cần lấy</Text>
                <Text style={s.emptySub}>Các đơn đã thanh toán sẽ xuất hiện ở đây</Text>
              </View>
            ) : (
              <>
                <View style={s.selectRow}>
                  <TouchableOpacity onPress={selectAll} activeOpacity={0.7}>
                    <Text style={s.selectAll}>
                      {selected.size === allPickupOrders.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={s.selectCount}>
                    {allPickupOrders.length} đơn · đã chọn {selected.size}
                  </Text>
                </View>
                {allPickupOrders.map(order => (
                  <TouchableOpacity
                    key={order.id}
                    style={[s.orderCard, selected.has(order.id) && s.orderCardSelected]}
                    onPress={() => toggleSelect(order.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[s.checkbox, selected.has(order.id) && s.checkboxActive]}>
                      {selected.has(order.id) && (
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      )}
                    </View>
                    <View style={s.orderInfo}>
                      <View style={s.orderTopRow}>
                        <Text style={s.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                        <View style={[s.statusBadge, { backgroundColor: C.amber + '22' }]}>
                          <Text style={[s.statusText, { color: C.amber }]}>Chờ lấy</Text>
                        </View>
                      </View>
                      <Text style={s.orderMeta}>
                        {order.items.length} sản phẩm · {formatCurrency(order.totalAmount)}
                      </Text>
                      <View style={s.orderHubRow}>
                        <Ionicons name="location-outline" size={12} color={C.muted} />
                        <Text style={s.orderHub} numberOfLines={1}>
                          {order.hub?.name} — {order.hub?.district}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={s.singlePickupBtn}
                      onPress={() => {
                        Alert.alert(
                          'Xác nhận lấy hàng',
                          `Lấy đơn #${order.id.slice(0, 8).toUpperCase()}?`,
                          [
                            { text: 'Huỷ', style: 'cancel' },
                            { text: 'Xác nhận', onPress: () => handlePickup([order.id]) },
                          ]
                        );
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={s.singlePickupText}>Lấy</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        )}

        {/* ── TAB: ĐANG GIAO ── */}
        {tab === 'transit' &&
          (transitOrders.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="bicycle-outline" size={48} color="#D1D5DB" />
              <Text style={s.emptyTitle}>Chưa có đơn đang giao</Text>
              <Text style={s.emptySub}>
                Đơn đã lấy từ kho đang vận chuyển đến Hub sẽ hiện ở đây
              </Text>
            </View>
          ) : (
            transitOrders.map(order => (
              <View key={order.id} style={[s.orderCard, s.orderCardBlue]}>
                <View style={s.orderInfo}>
                  <View style={s.orderTopRow}>
                    <Text style={s.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                    <View style={[s.statusBadge, { backgroundColor: C.blue + '22' }]}>
                      <Text style={[s.statusText, { color: C.blue }]}>Đang giao</Text>
                    </View>
                  </View>
                  <Text style={s.orderMeta}>
                    {order.items.length} sản phẩm · {formatCurrency(order.totalAmount)}
                  </Text>
                  <View style={s.orderHubRow}>
                    <Ionicons name="location-outline" size={12} color={C.muted} />
                    <Text style={s.orderHub} numberOfLines={1}>
                      {order.hub?.name}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={s.navBtn}
                  onPress={() =>
                    openMaps(
                      buildSingleUrl(
                        [order.hub?.address, order.hub?.ward, order.hub?.district, order.hub?.city]
                          .filter(Boolean)
                          .join(', ')
                      )
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Ionicons name="navigate-outline" size={18} color={C.blue} />
                </TouchableOpacity>
              </View>
            ))
          ))}

        {/* ── TAB: HÔM NAY ── */}
        {tab === 'history' &&
          (historyOrders.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="checkmark-done-outline" size={48} color="#D1D5DB" />
              <Text style={s.emptyTitle}>Chưa có đơn hoàn thành hôm nay</Text>
              <Text style={s.emptySub}>Lịch sử giao hàng trong ngày sẽ hiện ở đây</Text>
            </View>
          ) : (
            <>
              <Text style={s.historyCount}>{historyOrders.length} đơn hoàn thành hôm nay</Text>
              {historyOrders.map(order => (
                <View key={order.id} style={[s.orderCard, s.orderCardGreen]}>
                  <View style={[s.doneIcon]}>
                    <Ionicons name="checkmark-circle" size={20} color={C.green} />
                  </View>
                  <View style={s.orderInfo}>
                    <View style={s.orderTopRow}>
                      <Text style={s.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                      <View style={[s.statusBadge, { backgroundColor: C.green + '22' }]}>
                        <Text style={[s.statusText, { color: C.green }]}>Hoàn thành</Text>
                      </View>
                    </View>
                    <Text style={s.orderMeta}>
                      {order.items.length} sản phẩm · {formatCurrency(order.totalAmount)}
                    </Text>
                    <View style={s.orderHubRow}>
                      <Ionicons name="location-outline" size={12} color={C.muted} />
                      <Text style={s.orderHub} numberOfLines={1}>
                        {order.hub?.name}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          ))}

        {/* ── TAB: LỘ TRÌNH ── */}
        {tab === 'route' && (
          <View style={s.routeWrap}>
            {routeList.length === 0 ? (
              <View style={s.empty}>
                <Ionicons name="map-outline" size={48} color="#D1D5DB" />
                <Text style={s.emptyTitle}>Không có đơn nào</Text>
                <Text style={s.emptySub}>Cần có đơn đang giao hoặc chờ lấy để tính lộ trình</Text>
              </View>
            ) : (
              <>
                {/* Hub picker */}
                <View style={s.routeCard}>
                  <View style={s.routeCardHeader}>
                    <Text style={s.routeCardTitle}>Chọn Hub cần giao</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedHubIds(
                          effectiveHubIds.size === routeList.length ? new Set() : null
                        );
                        setRouteResult(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={s.selectAll}>
                        {effectiveHubIds.size === routeList.length
                          ? 'Bỏ chọn tất cả'
                          : 'Chọn tất cả'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {routeList.map((b, i) => {
                    const checked = effectiveHubIds.has(b.hubId);
                    return (
                      <TouchableOpacity
                        key={b.hubId}
                        style={[
                          s.hubPickRow,
                          i < routeList.length - 1 && s.hubPickBorder,
                          checked && s.hubPickActive,
                        ]}
                        onPress={() => toggleHub(b.hubId)}
                        activeOpacity={0.8}
                      >
                        <View style={[s.checkbox, checked && s.checkboxActive]}>
                          {checked && <Ionicons name="checkmark" size={12} color="#fff" />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.hubPickName} numberOfLines={1}>
                            {b.hubName}
                          </Text>
                          <Text style={s.hubPickAddr} numberOfLines={1}>
                            {b.hubFullAddress}
                          </Text>
                        </View>
                        <View style={s.hubPickMeta}>
                          <Text style={s.hubPickCount}>{b.orderCount} đơn</Text>
                          <Text style={s.hubPickAmount}>{formatCurrency(b.totalAmount)}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Warehouse info */}
                <View style={s.routeCard}>
                  <Text style={s.routeCardTitle}>Kho xuất phát</Text>
                  {warehouseError ? (
                    <View style={s.warehouseWarning}>
                      <Ionicons name="warning-outline" size={18} color={C.amber} />
                      <Text style={s.warehouseWarningText}>
                        Tài khoản chưa được gán kho. Liên hệ Admin để phân bổ trước khi tối ưu lộ
                        trình.
                      </Text>
                    </View>
                  ) : warehouse ? (
                    <View style={s.warehouseInfo}>
                      <Ionicons name="business-outline" size={16} color={C.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.warehouseName}>{warehouse.name}</Text>
                        <Text style={s.warehouseAddr}>{warehouse.fullAddress}</Text>
                      </View>
                    </View>
                  ) : (
                    <ActivityIndicator color={C.primary} style={{ marginVertical: 12 }} />
                  )}

                  {warehouse && !warehouseError && (
                    <TouchableOpacity
                      style={[
                        s.optimizeBtn,
                        (selectedBatches.length === 0 || optimizing) && s.optimizeBtnDim,
                      ]}
                      onPress={handleOptimize}
                      disabled={selectedBatches.length === 0 || optimizing}
                      activeOpacity={0.85}
                    >
                      {optimizing ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="git-branch-outline" size={16} color="#fff" />
                          <Text style={s.optimizeBtnText}>
                            Tối ưu lộ trình
                            {selectedBatches.length > 0 ? ` (${selectedBatches.length} hub)` : ''}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Route result */}
                {routeResult && (
                  <View style={s.routeResult}>
                    <TouchableOpacity
                      style={s.openMapsBtn}
                      onPress={() =>
                        openMaps(buildMapsUrl(warehouse?.fullAddress ?? '', routeResult.stops))
                      }
                      activeOpacity={0.85}
                    >
                      <Ionicons name="navigate" size={18} color="#fff" />
                      <Text style={s.openMapsBtnText}>
                        Mở Google Maps — {routeResult.stops.length} điểm
                      </Text>
                    </TouchableOpacity>

                    <View style={s.routeHeader}>
                      <Text style={s.routeCardTitle}>Thứ tự giao hàng</Text>
                      <View
                        style={[
                          s.optimizedBadge,
                          {
                            backgroundColor: routeResult.isOptimized
                              ? C.green + '22'
                              : C.amber + '22',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            s.optimizedBadgeText,
                            { color: routeResult.isOptimized ? C.green : C.amber },
                          ]}
                        >
                          {routeResult.isOptimized ? '✓ Đã tối ưu' : 'Thứ tự gốc'}
                        </Text>
                      </View>
                    </View>

                    {routeResult.stops.map(stop => {
                      const batch = selectedBatches[stop.originalIndex];
                      return (
                        <View key={stop.originalIndex} style={s.stopCard}>
                          <View style={s.stopNumber}>
                            <Text style={s.stopNumberText}>{stop.stopNumber}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={s.stopName} numberOfLines={1}>
                              {batch?.hubName ?? stop.address}
                            </Text>
                            <View style={s.stopAddrRow}>
                              <Ionicons name="location-outline" size={12} color={C.muted} />
                              <Text style={s.stopAddr} numberOfLines={1}>
                                {stop.address}
                              </Text>
                            </View>
                            {batch && (
                              <Text style={s.stopMeta}>
                                {batch.orderCount} đơn · {formatCurrency(batch.totalAmount)}
                              </Text>
                            )}
                          </View>
                          <TouchableOpacity
                            style={s.stopNavBtn}
                            onPress={() => openMaps(buildSingleUrl(stop.address))}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="navigate-outline" size={18} color={C.green} />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { alignItems: 'center', justifyContent: 'center' },

  header: {
    backgroundColor: C.primaryDark,
    paddingHorizontal: 16,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerTitle: { flex: 1 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  headerText: { fontSize: 22, fontWeight: '900', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  pickupFab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    position: 'absolute',
    right: 16,
    bottom: 20,
    backgroundColor: C.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  pickupFabText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  tabs: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: C.primary },
  tabLabel: { fontSize: 11, fontWeight: '600', color: C.muted },
  tabBadge: {
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  tabBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 40, gap: 10 },

  // Hub summary scroll
  hubScroll: { marginBottom: 4, marginHorizontal: -16 },
  hubScrollContent: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  hubCard: {
    backgroundColor: C.primaryLight,
    borderRadius: 14,
    padding: 14,
    minWidth: 130,
    borderWidth: 1,
    borderColor: C.primary + '33',
  },
  hubCardName: { fontSize: 12, fontWeight: '700', color: C.primaryDark, marginBottom: 4 },
  hubCardCount: { fontSize: 22, fontWeight: '900', color: C.primary },
  hubCardAmount: { fontSize: 11, color: C.primary, marginTop: 2 },

  // Select row
  selectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  selectAll: { fontSize: 13, fontWeight: '600', color: C.primary },
  selectCount: { fontSize: 12, color: C.muted },

  // Order cards
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  orderCardSelected: { borderColor: C.primary, backgroundColor: C.primaryLight },
  orderCardBlue: { borderColor: C.blue + '33' },
  orderCardGreen: { borderColor: C.green + '33' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: C.primary, borderColor: C.primary },
  orderInfo: { flex: 1 },
  orderTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  orderId: { fontSize: 12, fontWeight: '800', color: C.muted, fontVariant: ['tabular-nums'] },
  statusBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: '700' },
  orderMeta: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 3 },
  orderHubRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orderHub: { fontSize: 11, color: C.muted, flex: 1 },
  singlePickupBtn: {
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  singlePickupText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.blue + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneIcon: { width: 38, alignItems: 'center', justifyContent: 'center' },
  historyCount: { fontSize: 12, color: C.muted, marginBottom: 4 },

  // Empty state
  empty: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 60 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: C.muted },
  emptySub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },

  // Route tab
  routeWrap: { gap: 12 },
  routeCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  routeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  routeCardTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  hubPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  hubPickBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  hubPickActive: { backgroundColor: C.primaryLight },
  hubPickName: { fontSize: 13, fontWeight: '600', color: C.text },
  hubPickAddr: { fontSize: 11, color: C.muted, marginTop: 1 },
  hubPickMeta: { alignItems: 'flex-end' },
  hubPickCount: { fontSize: 13, fontWeight: '700', color: C.primary },
  hubPickAmount: { fontSize: 11, color: C.muted },

  warehouseWarning: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    margin: 12,
    padding: 12,
    backgroundColor: C.amber + '15',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.amber + '44',
  },
  warehouseWarningText: { flex: 1, fontSize: 13, color: '#92400E', lineHeight: 18 },
  warehouseInfo: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    margin: 12,
    padding: 12,
    backgroundColor: C.primaryLight,
    borderRadius: 10,
  },
  warehouseName: { fontSize: 14, fontWeight: '700', color: C.primaryDark, marginBottom: 2 },
  warehouseAddr: { fontSize: 12, color: C.primary },

  optimizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 12,
    height: 46,
    backgroundColor: C.primary,
    borderRadius: 12,
  },
  optimizeBtnDim: { opacity: 0.45 },
  optimizeBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Route result
  routeResult: { gap: 10 },
  openMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    backgroundColor: C.green,
    borderRadius: 14,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  openMapsBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  optimizedBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  optimizedBadgeText: { fontSize: 11, fontWeight: '700' },
  stopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  stopNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopNumberText: { fontSize: 14, fontWeight: '900', color: '#fff' },
  stopName: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 3 },
  stopAddrRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  stopAddr: { fontSize: 11, color: C.muted, flex: 1 },
  stopMeta: { fontSize: 11, fontWeight: '600', color: C.primary },
  stopNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.green + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
