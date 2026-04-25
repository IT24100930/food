import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, TextInput, ScrollView, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { orderAPI } from '../../services/api';
import { LoadingSpinner, EmptyState, StatusBadge, Card, Button, Divider } from '../../components';
import { COLORS, SIZES, SHADOWS } from '../../utils/theme';

// ── My Orders (Customer) ──────────────────────────────────────────────────────
export function MyOrdersScreen({ navigation }) {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('');
  const STATUSES = ['', 'Pending', 'Confirmed', 'Preparing', 'Ready', 'Delivered', 'Cancelled'];

  useEffect(() => { fetchOrders(); }, [filter]);

  const fetchOrders = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const res = await orderAPI.getMyOrders(params);
      setOrders(res.data.orders);
    } catch { Alert.alert('Error', 'Failed to load orders'); }
    finally  { setLoading(false); }
  };

  const renderOrder = ({ item }) => (
    <Card onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNum}>#{item.orderNumber}</Text>
        <StatusBadge status={item.status} />
      </View>
      <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleString()}</Text>
      <Text style={styles.orderItems}>{item.items.map(i => `${i.name} ×${i.quantity}`).join(', ')}</Text>
      <Divider />
      <View style={styles.orderFooter}>
        <Text style={styles.orderType}>{item.orderType} {item.tableNumber ? `· Table ${item.tableNumber}` : ''}</Text>
        <Text style={styles.orderTotal}>LKR {item.totalAmount.toLocaleString()}</Text>
      </View>
      <View style={styles.orderPayStatus}>
        <StatusBadge status={item.paymentStatus} />
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ gap: 8, paddingHorizontal: SIZES.md, paddingVertical: 10 }}>
        {STATUSES.map(s => (
          <TouchableOpacity key={s || 'All'} onPress={() => setFilter(s)} style={[styles.filterChip, filter === s && styles.filterChipActive]}>
            <Text style={[styles.filterChipText, filter === s && { color: '#fff' }]}>{s || 'All'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {loading ? <LoadingSpinner /> : (
        <FlatList data={orders} keyExtractor={i => i._id} renderItem={renderOrder}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState title="No orders yet" subtitle="Place an order from the menu!" icon="🧾" />}
          onRefresh={fetchOrders} refreshing={loading} />
      )}
    </View>
  );
}

// ── Orders Screen (Admin/Staff) ───────────────────────────────────────────────
export function OrdersScreen({ navigation }) {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('');
  const STATUSES = ['', 'Pending', 'Confirmed', 'Preparing', 'Ready', 'Delivered', 'Cancelled'];

  useEffect(() => { fetchOrders(); }, [filter]);

  const fetchOrders = async () => {
    try {
      const params = {};
      if (filter) params.status = filter;
      if (search) params.search = search;
      const res = await orderAPI.getAll(params);
      setOrders(res.data.orders);
    } catch { Alert.alert('Error', 'Failed to load orders'); }
    finally  { setLoading(false); }
  };

  const renderOrder = ({ item }) => (
    <Card onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNum}>#{item.orderNumber}</Text>
          <Text style={styles.customerName}>{item.customer?.name}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>
      <Text style={styles.orderItems} numberOfLines={1}>{item.items.map(i => `${i.name} ×${i.quantity}`).join(', ')}</Text>
      <Divider />
      <View style={styles.orderFooter}>
        <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleString()}</Text>
        <Text style={styles.orderTotal}>LKR {item.totalAmount.toLocaleString()}</Text>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Orders</Text>
      </View>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} />
        <TextInput style={styles.searchInput} placeholder="Search by order # or customer name..." value={search} onChangeText={setSearch} onSubmitEditing={fetchOrders} returnKeyType="search" />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ gap: 8, paddingHorizontal: SIZES.md, paddingVertical: 10 }}>
        {STATUSES.map(s => (
          <TouchableOpacity key={s || 'All'} onPress={() => setFilter(s)} style={[styles.filterChip, filter === s && styles.filterChipActive]}>
            <Text style={[styles.filterChipText, filter === s && { color: '#fff' }]}>{s || 'All'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {loading ? <LoadingSpinner /> : (
        <FlatList data={orders} keyExtractor={i => i._id} renderItem={renderOrder}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState title="No orders found" icon="📋" />}
          onRefresh={fetchOrders} refreshing={loading} />
      )}
    </View>
  );
}

// ── Order Detail Screen ───────────────────────────────────────────────────────
export function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const NEXT_STATUS = { Pending:'Confirmed', Confirmed:'Preparing', Preparing:'Ready', Ready:'Delivered' };

  useEffect(() => { fetchOrder(); }, []);

  const fetchOrder = async () => {
    try {
      const res = await orderAPI.getOne(orderId);
      setOrder(res.data.order);
    } catch { Alert.alert('Error', 'Failed to load order'); }
    finally  { setLoading(false); }
  };

  const updateStatus = async (status) => {
    setUpdating(true);
    try {
      await orderAPI.updateStatus(orderId, { status });
      fetchOrder();
      Alert.alert('Updated', `Order status set to ${status}`);
    } catch (err) { Alert.alert('Error', err.response?.data?.message || 'Failed to update'); }
    finally { setUpdating(false); }
  };

  if (loading) return <LoadingSpinner message="Loading order..." />;
  if (!order)  return <EmptyState title="Order not found" />;

  const nextStatus = NEXT_STATUS[order.status];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={COLORS.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>#{order.orderNumber}</Text>
        <StatusBadge status={order.status} />
      </View>
      <ScrollView contentContainerStyle={styles.detailContent}>
        <Card>
          <Text style={styles.detailSection}>Customer</Text>
          <Text style={styles.detailValue}>{order.customer?.name} · {order.customer?.email}</Text>
          <Text style={styles.detailValue}>{order.orderType} {order.tableNumber ? `· Table ${order.tableNumber}` : ''}</Text>
          {order.deliveryAddress && <Text style={styles.detailValue}>📍 {order.deliveryAddress}</Text>}
          {order.specialInstructions && <Text style={styles.detailNote}>📝 {order.specialInstructions}</Text>}
        </Card>

        <Card>
          <Text style={styles.detailSection}>Items</Text>
          {order.items.map((item, i) => (
            <View key={i} style={styles.detailItem}>
              <Text style={styles.detailItemName}>{item.name} × {item.quantity}</Text>
              <Text style={styles.detailItemPrice}>LKR {item.subtotal.toLocaleString()}</Text>
            </View>
          ))}
          <Divider />
          <View style={styles.detailItem}><Text style={styles.summaryLabel}>Subtotal</Text><Text>LKR {order.subtotal.toLocaleString()}</Text></View>
          {order.taxAmount > 0   && <View style={styles.detailItem}><Text style={styles.summaryLabel}>Tax</Text><Text>LKR {order.taxAmount}</Text></View>}
          {order.discountAmount > 0 && <View style={styles.detailItem}><Text style={[styles.summaryLabel, { color: COLORS.success }]}>Discount</Text><Text style={{ color: COLORS.success }}>-LKR {order.discountAmount}</Text></View>}
          {order.tipAmount > 0   && <View style={styles.detailItem}><Text style={styles.summaryLabel}>Tip</Text><Text>LKR {order.tipAmount}</Text></View>}
          <View style={styles.detailItem}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>LKR {order.totalAmount.toLocaleString()}</Text></View>
        </Card>

        <Card>
          <Text style={styles.detailSection}>Payment</Text>
          <StatusBadge status={order.paymentStatus} />
          {order.payment && <Button title="Process Payment" variant="gradient" onPress={() => navigation.navigate('Payment', { orderId: order._id })} style={{ marginTop: SIZES.md }} />}
        </Card>

        {nextStatus && (
          <Button title={`Mark as ${nextStatus}`} variant="gradient" onPress={() => updateStatus(nextStatus)} loading={updating} style={{ marginHorizontal: SIZES.md }} />
        )}
        {order.status === 'Pending' && (
          <Button title="Cancel Order" variant="danger" onPress={() => Alert.alert('Cancel', 'Cancel this order?', [{ text: 'No' }, { text: 'Yes', onPress: () => updateStatus('Cancelled') }])} style={{ marginHorizontal: SIZES.md, marginTop: SIZES.sm }} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.background },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SIZES.md, paddingTop: 50, backgroundColor: '#fff', ...SHADOWS.sm },
  headerTitle:   { fontSize: SIZES.font.lg, fontWeight: '800', color: COLORS.text },
  searchBar:     { flexDirection: 'row', alignItems: 'center', margin: SIZES.md, marginBottom: 0, backgroundColor: '#fff', borderRadius: SIZES.radius, paddingHorizontal: SIZES.md, paddingVertical: 10, gap: 8, ...SHADOWS.sm },
  searchInput:   { flex: 1, fontSize: SIZES.font.md, color: COLORS.text },
  filterScroll:  { maxHeight: 52 },
  filterChip:    { paddingHorizontal: 14, paddingVertical: 7, borderRadius: SIZES.radiusFull, backgroundColor: '#fff', borderWidth: 1.5, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText:{ fontSize: SIZES.font.xs, fontWeight: '600', color: COLORS.textLight },
  list:          { padding: SIZES.md },
  orderHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  orderNum:      { fontSize: SIZES.font.md, fontWeight: '800', color: COLORS.text },
  customerName:  { fontSize: SIZES.font.xs, color: COLORS.textLight },
  orderDate:     { fontSize: SIZES.font.xs, color: COLORS.textMuted, marginBottom: 4 },
  orderItems:    { fontSize: SIZES.font.xs, color: COLORS.textLight },
  orderFooter:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderType:     { fontSize: SIZES.font.xs, color: COLORS.textLight },
  orderTotal:    { fontSize: SIZES.font.sm, fontWeight: '800', color: COLORS.primary },
  orderPayStatus:{ marginTop: 6 },
  // Detail
  detailContent:  { padding: SIZES.md, gap: SIZES.sm, paddingBottom: 32 },
  detailSection:  { fontSize: SIZES.font.sm, fontWeight: '700', color: COLORS.primary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue:    { fontSize: SIZES.font.sm, color: COLORS.text, marginBottom: 4 },
  detailNote:     { fontSize: SIZES.font.sm, color: COLORS.textLight, fontStyle: 'italic' },
  detailItem:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  detailItemName: { fontSize: SIZES.font.sm, color: COLORS.text, flex: 1 },
  detailItemPrice:{ fontSize: SIZES.font.sm, fontWeight: '700', color: COLORS.text },
  summaryLabel:   { fontSize: SIZES.font.sm, color: COLORS.textLight },
  totalLabel:     { fontSize: SIZES.font.md, fontWeight: '800', color: COLORS.text },
  totalValue:     { fontSize: SIZES.font.md, fontWeight: '800', color: COLORS.primary },
});

export default OrderDetailScreen;
