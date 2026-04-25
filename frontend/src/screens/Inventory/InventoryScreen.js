import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, Modal, TextInput, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { inventoryAPI } from '../../services/api';
import { LoadingSpinner, EmptyState, Card, Button, Input, Badge, Divider } from '../../components';
import { COLORS, SIZES, SHADOWS } from '../../utils/theme';

export default function InventoryScreen({ navigation }) {
  const [items, setItems]       = useState([]);
  const [alerts, setAlerts]     = useState({ lowStock: [], expiringSoon: [] });
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('');
  const [adjustModal, setAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustForm, setAdjustForm]     = useState({ type: 'Add', quantity: '', reason: '' });

  useEffect(() => { fetchAll(); }, [filter]);

  const fetchAll = async () => {
    try {
      const params = {};
      if (filter === 'low')     params.lowStock     = 'true';
      if (filter === 'expiring') params.expiringSoon = 'true';
      const [inv, alts] = await Promise.all([
        inventoryAPI.getAll(params),
        inventoryAPI.getAlerts()
      ]);
      setItems(inv.data.items);
      setAlerts(alts.data.alerts);
    } catch { Alert.alert('Error', 'Failed to load inventory'); }
    finally  { setLoading(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Item', 'Remove this inventory item?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await inventoryAPI.delete(id);
        fetchAll();
      }}
    ]);
  };

  const openAdjust = (item) => {
    setSelectedItem(item);
    setAdjustForm({ type: 'Add', quantity: '', reason: '' });
    setAdjustModal(true);
  };

  const handleAdjust = async () => {
    if (!adjustForm.quantity || isNaN(adjustForm.quantity)) return Alert.alert('Error', 'Enter valid quantity');
    try {
      await inventoryAPI.adjustStock(selectedItem._id, {
        type: adjustForm.type,
        quantity: parseFloat(adjustForm.quantity),
        reason: adjustForm.reason
      });
      setAdjustModal(false);
      fetchAll();
      Alert.alert('Updated', 'Stock adjusted successfully');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to adjust stock');
    }
  };

  const renderItem = ({ item }) => (
    <Card>
      <View style={styles.itemHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemCategory}>{item.category} · {item.unit}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => openAdjust(item)} style={styles.actionBtn}>
            <Ionicons name="layers-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('InvForm', { item })} style={styles.actionBtn}>
            <Ionicons name="pencil-outline" size={18} color={COLORS.info} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.stockRow}>
        <View style={styles.stockInfo}>
          <Text style={styles.stockLabel}>Current</Text>
          <Text style={[styles.stockValue, item.isLowStock && { color: COLORS.error }]}>
            {item.currentStock} {item.unit}
          </Text>
        </View>
        <View style={styles.stockInfo}>
          <Text style={styles.stockLabel}>Min Stock</Text>
          <Text style={styles.stockValue}>{item.minimumStock} {item.unit}</Text>
        </View>
        {item.hasExpiry && item.expiryDate && (
          <View style={styles.stockInfo}>
            <Text style={styles.stockLabel}>Expires</Text>
            <Text style={[styles.stockValue, item.isExpiringSoon && { color: COLORS.warning }]}>
              {new Date(item.expiryDate).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      {(item.isLowStock || item.isExpiringSoon) && (
        <View style={styles.alertRow}>
          {item.isLowStock     && <Badge label="⚠️ Low Stock"     color={COLORS.error}   bgColor="#FDEDEC" />}
          {item.isExpiringSoon && <Badge label="⏰ Expiring Soon" color={COLORS.warning} bgColor="#FEF9E7" />}
        </View>
      )}

      {/* Stock Bar */}
      <View style={styles.stockBarBg}>
        <View style={[styles.stockBarFill, {
          width: `${Math.min(100, (item.currentStock / (item.maximumStock || item.minimumStock * 5)) * 100)}%`,
          backgroundColor: item.isLowStock ? COLORS.error : COLORS.success
        }]} />
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
        <TouchableOpacity onPress={() => navigation.navigate('InvForm', {})} style={styles.addBtn}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Alert Counts */}
      <View style={styles.alertBanner}>
        <TouchableOpacity onPress={() => setFilter(filter === 'low' ? '' : 'low')} style={[styles.alertChip, filter === 'low' && { backgroundColor: COLORS.error }]}>
          <Ionicons name="warning-outline" size={14} color={filter === 'low' ? '#fff' : COLORS.error} />
          <Text style={[styles.alertChipText, { color: filter === 'low' ? '#fff' : COLORS.error }]}>{alerts.lowStock?.length || 0} Low Stock</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter(filter === 'expiring' ? '' : 'expiring')} style={[styles.alertChip, { borderColor: COLORS.warning }, filter === 'expiring' && { backgroundColor: COLORS.warning }]}>
          <Ionicons name="time-outline" size={14} color={filter === 'expiring' ? '#fff' : COLORS.warning} />
          <Text style={[styles.alertChipText, { color: filter === 'expiring' ? '#fff' : COLORS.warning }]}>{alerts.expiringSoon?.length || 0} Expiring</Text>
        </TouchableOpacity>
        {filter && <TouchableOpacity onPress={() => setFilter('')}><Text style={{ color: COLORS.primary, fontSize: SIZES.font.sm, fontWeight: '600' }}>Show All</Text></TouchableOpacity>}
      </View>

      {loading ? <LoadingSpinner /> : (
        <FlatList data={items} keyExtractor={i => i._id} renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState title="No inventory items" icon="📦" />}
          onRefresh={fetchAll} refreshing={loading} />
      )}

      {/* Adjust Stock Modal */}
      <Modal visible={adjustModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Adjust Stock · {selectedItem?.name}</Text>
            <Text style={styles.modalCurrent}>Current: {selectedItem?.currentStock} {selectedItem?.unit}</Text>

            <View style={styles.typeRow}>
              {['Add', 'Reduce', 'Adjustment'].map(t => (
                <TouchableOpacity key={t} onPress={() => setAdjustForm(p => ({ ...p, type: t }))}
                  style={[styles.typeChip, adjustForm.type === t && styles.typeChipActive]}>
                  <Text style={[styles.typeChipText, adjustForm.type === t && { color: '#fff' }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input label={adjustForm.type === 'Adjustment' ? 'Set Stock To' : 'Quantity'} keyboardType="numeric"
              placeholder="Enter quantity" value={adjustForm.quantity}
              onChangeText={v => setAdjustForm(p => ({ ...p, quantity: v }))} />
            <Input label="Reason (optional)" placeholder="e.g. New delivery"
              value={adjustForm.reason} onChangeText={v => setAdjustForm(p => ({ ...p, reason: v }))} />

            <View style={styles.modalBtns}>
              <Button title="Cancel" variant="ghost" onPress={() => setAdjustModal(false)} style={{ flex: 1 }} />
              <Button title="Confirm" variant="gradient" onPress={handleAdjust} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SIZES.md, paddingTop: 50, backgroundColor: '#fff', ...SHADOWS.sm },
  headerTitle:  { fontSize: SIZES.font.lg, fontWeight: '800', color: COLORS.text },
  addBtn:       { backgroundColor: COLORS.primary, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  alertBanner:  { flexDirection: 'row', alignItems: 'center', gap: 8, padding: SIZES.md, paddingBottom: 0 },
  alertChip:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: SIZES.radiusFull, borderWidth: 1.5, borderColor: COLORS.error, backgroundColor: '#fff' },
  alertChipText:{ fontSize: SIZES.font.xs, fontWeight: '700' },
  list:         { padding: SIZES.md },
  itemHeader:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SIZES.sm },
  itemName:     { fontSize: SIZES.font.md, fontWeight: '700', color: COLORS.text },
  itemCategory: { fontSize: SIZES.font.xs, color: COLORS.textLight, marginTop: 2 },
  actions:      { flexDirection: 'row', gap: 4 },
  actionBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  stockRow:     { flexDirection: 'row', gap: SIZES.md, marginBottom: SIZES.sm },
  stockInfo:    { flex: 1 },
  stockLabel:   { fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', fontWeight: '600' },
  stockValue:   { fontSize: SIZES.font.md, fontWeight: '800', color: COLORS.text, marginTop: 2 },
  alertRow:     { flexDirection: 'row', gap: 6, marginBottom: SIZES.sm },
  stockBarBg:   { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  stockBarFill: { height: '100%', borderRadius: 3 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:    { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SIZES.lg, paddingBottom: 34 },
  modalTitle:   { fontSize: SIZES.font.lg, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  modalCurrent: { fontSize: SIZES.font.sm, color: COLORS.textLight, marginBottom: SIZES.md },
  typeRow:      { flexDirection: 'row', gap: 8, marginBottom: SIZES.md },
  typeChip:     { flex: 1, paddingVertical: 8, borderRadius: SIZES.radiusSm, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' },
  typeChipActive:{ backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeChipText: { fontSize: SIZES.font.sm, fontWeight: '600', color: COLORS.textLight },
  modalBtns:    { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.sm },
});
