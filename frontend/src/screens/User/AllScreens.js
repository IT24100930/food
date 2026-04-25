import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Image, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { userAPI, menuAPI, orderAPI, inventoryAPI } from '../../services/api';
import { Card, Button, StatusBadge, LoadingSpinner, EmptyState, Badge, Avatar, Input } from '../../components';
import { COLORS, SIZES, SHADOWS } from '../../utils/theme';

// ── DASHBOARD ──────────────────────────────────────────────────────────────────
export function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [stats, setStats]   = useState({ orders: 0, pending: 0, lowStock: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const [ordersRes, invRes] = await Promise.all([
        orderAPI.getAll({ limit: 5, sort: '-createdAt' }),
        inventoryAPI.getAlerts()
      ]);
      setRecentOrders(ordersRes.data.orders);
      setStats({
        orders:   ordersRes.data.total,
        pending:  ordersRes.data.orders.filter(o => o.status === 'Pending').length,
        lowStock: invRes.data.alerts.totalAlerts
      });
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  const QUICK_ACTIONS = [
    { icon: '🍽️', label: 'Menu',      color: '#FF6B35', screen: 'Menu' },
    { icon: '📋', label: 'Orders',    color: '#3498DB', screen: 'Orders' },
    { icon: '📦', label: 'Inventory', color: '#27AE60', screen: 'Admin' },
    { icon: '💰', label: 'Payments',  color: '#9B59B6', screen: 'More' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#FF6B35', '#FF8C5A']} style={styles.dashHeader}>
        <View style={styles.dashHeaderTop}>
          <View>
            <Text style={styles.dashGreet}>Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'} 👋</Text>
            <Text style={styles.dashName}>{user?.name}</Text>
            <View style={[styles.roleBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <Text style={styles.roleText}>{user?.role}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: 'Total Orders', value: stats.orders,   icon: '📋' },
            { label: 'Pending',      value: stats.pending,  icon: '⏳' },
            { label: 'Alerts',       value: stats.lowStock, icon: '⚠️' },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.dashContent}>
        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((a, i) => (
            <TouchableOpacity key={i} onPress={() => navigation.navigate(a.screen)} style={[styles.actionCard, { borderTopColor: a.color }]}>
              <Text style={styles.actionIcon}>{a.icon}</Text>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Orders */}
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {loading ? <LoadingSpinner /> : recentOrders.map(order => (
          <Card key={order._id} onPress={() => navigation.navigate('Orders')}>
            <View style={styles.orderRow}>
              <View>
                <Text style={styles.orderNum}>#{order.orderNumber}</Text>
                <Text style={styles.orderCustomer}>{order.customer?.name}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <StatusBadge status={order.status} />
                <Text style={styles.orderAmt}>LKR {order.totalAmount?.toLocaleString()}</Text>
              </View>
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

// ── PROFILE SCREEN ────────────────────────────────────────────────────────────
export function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await userAPI.updateProfile(form);
      updateUser(res.data.user);
      setEditing(false);
      Alert.alert('Updated', 'Profile saved!');
    } catch (err) { Alert.alert('Error', err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#FF6B35', '#FF8C5A']} style={styles.profileHeader}>
        <Avatar name={user?.name} size={80} />
        <Text style={styles.profileName}>{user?.name}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: 'rgba(255,255,255,0.25)', marginTop: 8 }]}>
          <Text style={styles.roleText}>{user?.role}</Text>
        </View>
      </LinearGradient>

      <View style={styles.dashContent}>
        {/* Trust Score */}
        <Card>
          <Text style={styles.sectionTitle}>Trust Score</Text>
          <View style={styles.trustRow}>
            <Text style={styles.trustScore}>{user?.trustScore || 50}</Text>
            <Text style={styles.trustLabel}>/100</Text>
          </View>
          <View style={styles.trustBarBg}>
            <LinearGradient colors={['#FF6B35', '#27AE60']} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={[styles.trustBarFill, { width: `${user?.trustScore || 50}%` }]} />
          </View>
          <Text style={styles.trustNote}>
            {(user?.trustScore || 50) >= 75 ? '⭐ Trusted Customer' : (user?.trustScore || 50) >= 40 ? '👍 Good Standing' : '⚠️ Low Trust'}
          </Text>
        </Card>

        {/* Edit Profile */}
        <Card>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Profile Info</Text>
            <TouchableOpacity onPress={() => setEditing(!editing)}>
              <Ionicons name={editing ? 'close-outline' : 'pencil-outline'} size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          {editing ? (
            <>
              <Input label="Full Name" value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} />
              <Input label="Phone" value={form.phone} onChangeText={v => setForm(p => ({ ...p, phone: v }))} keyboardType="phone-pad" />
              <Button title="Save Changes" variant="gradient" onPress={handleSave} loading={loading} />
            </>
          ) : (
            <>
              <View style={styles.infoRow}><Ionicons name="person-outline" size={16} color={COLORS.textMuted} /><Text style={styles.infoText}>{user?.name}</Text></View>
              <View style={styles.infoRow}><Ionicons name="mail-outline" size={16} color={COLORS.textMuted} /><Text style={styles.infoText}>{user?.email}</Text></View>
              <View style={styles.infoRow}><Ionicons name="call-outline" size={16} color={COLORS.textMuted} /><Text style={styles.infoText}>{user?.phone || 'Not set'}</Text></View>
              <View style={styles.infoRow}><Ionicons name="checkmark-circle-outline" size={16} color={user?.isEmailVerified ? COLORS.success : COLORS.error} />
                <Text style={[styles.infoText, { color: user?.isEmailVerified ? COLORS.success : COLORS.error }]}>{user?.isEmailVerified ? 'Email Verified' : 'Email Not Verified'}</Text>
              </View>
            </>
          )}
        </Card>

        <Button title="Sign Out" variant="outline" onPress={() => Alert.alert('Logout', 'Sign out?', [{ text: 'Cancel' }, { text: 'Logout', style: 'destructive', onPress: logout }])}
          style={{ borderColor: COLORS.error }} textStyle={{ color: COLORS.error }}
          icon={<Ionicons name="log-out-outline" size={18} color={COLORS.error} />} />
      </View>
    </ScrollView>
  );
}

// ── USERS SCREEN ──────────────────────────────────────────────────────────────
export function UsersScreen({ navigation }) {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const ROLES = ['', 'Admin', 'Staff', 'Customer'];

  useEffect(() => { fetchUsers(); }, [roleFilter]);
  const fetchUsers = async () => {
    try { const res = await userAPI.getAll(roleFilter ? { role: roleFilter } : {}); setUsers(res.data.users); }
    catch { Alert.alert('Error', 'Failed to load users'); }
    finally { setLoading(false); }
  };

  const handleRoleChange = (userId, newRole) => {
    Alert.alert('Change Role', `Set user role to ${newRole}?`, [
      { text: 'Cancel' },
      { text: 'Confirm', onPress: async () => { await userAPI.updateRole(userId, { role: newRole }); fetchUsers(); }}
    ]);
  };

  const handleToggle = async (userId) => {
    await userAPI.toggleStatus(userId);
    fetchUsers();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Users</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Inventory')} style={styles.addBtn}>
          <Ionicons name="cube-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 52 }} contentContainerStyle={{ gap: 8, paddingHorizontal: SIZES.md, paddingVertical: 10 }}>
        {ROLES.map(r => (
          <TouchableOpacity key={r || 'All'} onPress={() => setRoleFilter(r)} style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: SIZES.radiusFull, borderWidth: 1.5, borderColor: roleFilter === r ? COLORS.primary : COLORS.border, backgroundColor: roleFilter === r ? COLORS.primary : '#fff' }}>
            <Text style={{ fontSize: SIZES.font.sm, fontWeight: '600', color: roleFilter === r ? '#fff' : COLORS.textLight }}>{r || 'All'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {loading ? <LoadingSpinner /> : (
        <FlatList data={users} keyExtractor={i => i._id} contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState title="No users found" icon="👥" />}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.userRow}>
                <Avatar name={item.name} size={44} uri={item.avatar} />
                <View style={{ flex: 1, marginLeft: SIZES.sm }}>
                  <Text style={styles.userName}>{item.name}</Text>
                  <Text style={styles.userEmail}>{item.email}</Text>
                  <Text style={styles.userMeta}>Trust: {item.trustScore}/100 · Joined {new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <StatusBadge status={item.role} />
                  <StatusBadge status={item.isActive ? 'Active' : 'Inactive'} />
                </View>
              </View>
              <View style={styles.actionRow}>
                {['Admin','Staff','Customer'].filter(r => r !== item.role).map(r => (
                  <Button key={r} title={`→ ${r}`} variant="outline" onPress={() => handleRoleChange(item._id, r)} style={{ flex: 1, paddingVertical: 6 }} textStyle={{ fontSize: 11 }} />
                ))}
                <Button title={item.isActive ? 'Deactivate' : 'Activate'} variant={item.isActive ? 'danger' : 'success'}
                  onPress={() => handleToggle(item._id)} style={{ flex: 1, paddingVertical: 6 }} textStyle={{ fontSize: 11 }} />
              </View>
            </Card>
          )} />
      )}
    </View>
  );
}

// ── MANAGE MENU SCREEN ─────────────────────────────────────────────────────────
export function ManageMenuScreen({ navigation }) {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchItems(); }, []);
  const fetchItems = async () => {
    try { const res = await menuAPI.getAll({ limit: 50 }); setItems(res.data.items); }
    catch { Alert.alert('Error', 'Failed to load menu'); }
    finally { setLoading(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Item', 'Remove this menu item?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await menuAPI.delete(id); fetchItems(); }}
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu Management</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MenuForm', {})} style={styles.addBtn}><Ionicons name="add" size={22} color="#fff" /></TouchableOpacity>
      </View>
      {loading ? <LoadingSpinner /> : (
        <FlatList data={items} keyExtractor={i => i._id} contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState title="No menu items" icon="🍽️" />}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.menuItemRow}>
                <Image source={{ uri: item.image || 'https://via.placeholder.com/60' }} style={styles.menuThumb} />
                <View style={{ flex: 1, marginLeft: SIZES.sm }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSub}>{item.category} · LKR {item.price.toLocaleString()}</Text>
                  <Text style={styles.itemSub}>Ordered: {item.totalOrdered} times</Text>
                </View>
                <StatusBadge status={item.isAvailable ? 'Active' : 'Inactive'} />
              </View>
              <View style={styles.actionRow}>
                <Button title={item.isAvailable ? 'Hide' : 'Show'} variant="outline" onPress={async () => { await menuAPI.toggleAvailability(item._id); fetchItems(); }} style={{ flex: 1, paddingVertical: 8 }} />
                <Button title="Edit"   variant="outline" onPress={() => navigation.navigate('MenuForm', { item })} style={{ flex: 1, paddingVertical: 8 }} />
                <Button title="Delete" variant="danger"  onPress={() => handleDelete(item._id)} style={{ flex: 1, paddingVertical: 8 }} />
              </View>
            </Card>
          )} />
      )}
    </View>
  );
}

// ── MENU FORM SCREEN ──────────────────────────────────────────────────────────
export function MenuFormScreen({ route, navigation }) {
  const existing = route.params?.item;
  const [form, setForm] = useState({
    name: existing?.name || '', description: existing?.description || '',
    category: existing?.category || 'Main Course', price: String(existing?.price || ''),
    availableFrom: existing?.availableFrom || '', availableTo: existing?.availableTo || '',
  });
  const [loading, setLoading] = useState(false);
  const CATS = ['Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Side Dish', 'Special'];

  const handleSave = async () => {
    if (!form.name || !form.price) return Alert.alert('Error', 'Name and price are required');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.keys(form).forEach(k => fd.append(k, form[k]));
      if (existing) await menuAPI.update(existing._id, fd);
      else          await menuAPI.create(fd);
      navigation.goBack();
    } catch (err) { Alert.alert('Error', err.response?.data?.message || 'Failed to save'); }
    finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={COLORS.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>{existing ? 'Edit Item' : 'Add Menu Item'}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: SIZES.md, gap: SIZES.sm }} keyboardShouldPersistTaps="handled">
        <Input label="Item Name *" value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} placeholder="e.g. Grilled Chicken" />
        <Input label="Description" value={form.description} onChangeText={v => setForm(p => ({ ...p, description: v }))} placeholder="Describe the item..." multiline />
        <Text style={{ fontSize: SIZES.font.sm, fontWeight: '600', color: COLORS.text, marginBottom: 6 }}>Category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SIZES.md }}>
          {CATS.map(c => <TouchableOpacity key={c} onPress={() => setForm(p => ({ ...p, category: c }))} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: SIZES.radiusFull, borderWidth: 1.5, borderColor: form.category === c ? COLORS.primary : COLORS.border, backgroundColor: form.category === c ? COLORS.primary : '#fff' }}><Text style={{ color: form.category === c ? '#fff' : COLORS.textLight, fontWeight: '600', fontSize: SIZES.font.sm }}>{c}</Text></TouchableOpacity>)}
        </View>
        <Input label="Price (LKR) *" keyboardType="numeric" value={form.price} onChangeText={v => setForm(p => ({ ...p, price: v }))} placeholder="0.00" />
        <Input label="Available From (HH:MM)" value={form.availableFrom} onChangeText={v => setForm(p => ({ ...p, availableFrom: v }))} placeholder="08:00" />
        <Input label="Available To (HH:MM)" value={form.availableTo} onChangeText={v => setForm(p => ({ ...p, availableTo: v }))} placeholder="22:00" />
        <Button title={existing ? 'Update Item' : 'Add Item'} variant="gradient" onPress={handleSave} loading={loading} />
      </ScrollView>
    </View>
  );
}

export { ManageMenuScreen as default };

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.background },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SIZES.md, paddingTop: 50, backgroundColor: '#fff', ...SHADOWS.sm },
  headerTitle: { fontSize: SIZES.font.lg, fontWeight: '800', color: COLORS.text },
  addBtn:      { backgroundColor: COLORS.primary, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  list:        { padding: SIZES.md },
  dashHeader:  { paddingTop: 50, paddingHorizontal: SIZES.md, paddingBottom: SIZES.lg },
  dashHeaderTop:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SIZES.md },
  dashGreet:   { color: 'rgba(255,255,255,0.85)', fontSize: SIZES.font.sm },
  dashName:    { color: '#fff', fontSize: SIZES.font.xl, fontWeight: '800' },
  roleBadge:   { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: SIZES.radiusFull, marginTop: 4 },
  roleText:    { color: '#fff', fontSize: SIZES.font.xs, fontWeight: '700' },
  logoutBtn:   { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
  statsRow:    { flexDirection: 'row', gap: SIZES.sm },
  statCard:    { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: SIZES.radius, padding: SIZES.sm, alignItems: 'center' },
  statIcon:    { fontSize: 20, marginBottom: 4 },
  statValue:   { color: '#fff', fontSize: SIZES.font.xl, fontWeight: '900' },
  statLabel:   { color: 'rgba(255,255,255,0.85)', fontSize: 10, textAlign: 'center' },
  dashContent: { padding: SIZES.md },
  sectionTitle:{ fontSize: SIZES.font.md, fontWeight: '800', color: COLORS.text, marginBottom: SIZES.md },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm, marginBottom: SIZES.lg },
  actionCard:  { width: '47%', backgroundColor: '#fff', borderRadius: SIZES.radius, padding: SIZES.md, alignItems: 'center', borderTopWidth: 4, ...SHADOWS.sm },
  actionIcon:  { fontSize: 28, marginBottom: 6 },
  actionLabel: { fontSize: SIZES.font.sm, fontWeight: '700', color: COLORS.text },
  orderRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNum:    { fontSize: SIZES.font.sm, fontWeight: '700', color: COLORS.text },
  orderCustomer:{ fontSize: SIZES.font.xs, color: COLORS.textLight },
  orderAmt:    { fontSize: SIZES.font.sm, fontWeight: '700', color: COLORS.primary, marginTop: 4 },
  profileHeader:{ paddingTop: 60, paddingBottom: SIZES.xl, alignItems: 'center' },
  profileName: { color: '#fff', fontSize: SIZES.font.xl, fontWeight: '800', marginTop: SIZES.sm },
  profileEmail:{ color: 'rgba(255,255,255,0.85)', fontSize: SIZES.font.sm },
  trustRow:    { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  trustScore:  { fontSize: 48, fontWeight: '900', color: COLORS.primary },
  trustLabel:  { fontSize: SIZES.font.lg, color: COLORS.textLight },
  trustBarBg:  { height: 10, backgroundColor: COLORS.border, borderRadius: 5, overflow: 'hidden', marginVertical: SIZES.sm },
  trustBarFill:{ height: '100%', borderRadius: 5 },
  trustNote:   { fontSize: SIZES.font.sm, color: COLORS.textLight, textAlign: 'center' },
  rowBetween:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.sm },
  infoRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  infoText:    { fontSize: SIZES.font.sm, color: COLORS.text },
  userRow:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SIZES.sm },
  userName:    { fontSize: SIZES.font.sm, fontWeight: '700', color: COLORS.text },
  userEmail:   { fontSize: SIZES.font.xs, color: COLORS.textLight },
  userMeta:    { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  actionRow:   { flexDirection: 'row', gap: 6, marginTop: SIZES.sm },
  itemName:    { fontSize: SIZES.font.sm, fontWeight: '700', color: COLORS.text },
  itemSub:     { fontSize: SIZES.font.xs, color: COLORS.textLight, marginTop: 2 },
  menuItemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.sm },
  menuThumb:   { width: 56, height: 56, borderRadius: SIZES.radiusSm, backgroundColor: '#f0f0f0' },
});
