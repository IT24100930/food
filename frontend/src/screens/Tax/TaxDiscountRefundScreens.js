import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { taxAPI, discountAPI, refundAPI, paymentAPI } from '../../services/api';
import { LoadingSpinner, EmptyState, Card, Button, Input, Badge, StatusBadge, Divider } from '../../components';
import { COLORS, SIZES, SHADOWS } from '../../utils/theme';

// ────────────────────────────────────────────────────────────────────────────
// TAX SCREEN
// ────────────────────────────────────────────────────────────────────────────
export function TaxScreen() {
  const [taxes, setTaxes]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm]       = useState({ name: '', rate: '', description: '', isDefault: false });

  useEffect(() => { fetchTaxes(); }, []);
  const fetchTaxes = async () => {
    try { const res = await taxAPI.getAll(); setTaxes(res.data.taxes); }
    catch { Alert.alert('Error', 'Failed to load taxes'); }
    finally { setLoading(false); }
  };

  const openModal = (item = null) => {
    setEditItem(item);
    setForm(item ? { name: item.name, rate: String(item.rate), description: item.description || '', isDefault: item.isDefault } : { name: '', rate: '', description: '', isDefault: false });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.rate) return Alert.alert('Error', 'Name and rate are required');
    try {
      if (editItem) await taxAPI.update(editItem._id, { ...form, rate: parseFloat(form.rate) });
      else          await taxAPI.create({ ...form, rate: parseFloat(form.rate) });
      setModal(false); fetchTaxes();
    } catch (err) { Alert.alert('Error', err.response?.data?.message || 'Failed to save'); }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Tax', 'Delete this tax?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await taxAPI.delete(id); fetchTaxes(); }}
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tax Management</Text>
        <TouchableOpacity onPress={() => openModal()} style={styles.addBtn}><Ionicons name="add" size={22} color="#fff" /></TouchableOpacity>
      </View>
      {loading ? <LoadingSpinner /> : (
        <FlatList data={taxes} keyExtractor={i => i._id} contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState title="No taxes configured" icon="💰" />}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.itemName}>{item.name} {item.isDefault && <Text style={{ color: COLORS.primary }}>(Default)</Text>}</Text>
                  <Text style={styles.itemSub}>{item.rate}% · {item.description || 'No description'}</Text>
                </View>
                <View style={styles.actions}>
                  <StatusBadge status={item.isActive ? 'Active' : 'Inactive'} />
                </View>
              </View>
              <View style={styles.actionRow}>
                <Button title={item.isActive ? 'Deactivate' : 'Activate'} variant="outline" onPress={async () => { await taxAPI.toggle(item._id); fetchTaxes(); }} style={styles.actionBtn} />
                <Button title="Edit"   variant="outline" onPress={() => openModal(item)} style={styles.actionBtn} />
                <Button title="Delete" variant="danger"  onPress={() => handleDelete(item._id)} style={styles.actionBtn} />
              </View>
            </Card>
          )} />
      )}
      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editItem ? 'Edit Tax' : 'Add Tax'}</Text>
            <Input label="Tax Name" placeholder="e.g. VAT, GST" value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} />
            <Input label="Rate (%)" keyboardType="numeric" placeholder="e.g. 10" value={form.rate} onChangeText={v => setForm(p => ({ ...p, rate: v }))} />
            <Input label="Description" placeholder="Optional" value={form.description} onChangeText={v => setForm(p => ({ ...p, description: v }))} />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Set as Default</Text>
              <Switch value={form.isDefault} onValueChange={v => setForm(p => ({ ...p, isDefault: v }))} trackColor={{ true: COLORS.primary }} />
            </View>
            <View style={styles.modalBtns}>
              <Button title="Cancel" variant="ghost" onPress={() => setModal(false)} style={{ flex: 1 }} />
              <Button title="Save"   variant="gradient" onPress={handleSave} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DISCOUNT SCREEN
// ────────────────────────────────────────────────────────────────────────────
export function DiscountScreen() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [form, setForm]           = useState({ name:'', code:'', type:'Percentage', value:'', minimumOrderAmount:'0', usageLimit:'', expiryDate:'', description:'' });

  useEffect(() => { fetchDiscounts(); }, []);
  const fetchDiscounts = async () => {
    try { const res = await discountAPI.getAll(); setDiscounts(res.data.discounts); }
    catch { Alert.alert('Error', 'Failed to load discounts'); }
    finally { setLoading(false); }
  };

  const openModal = (item = null) => {
    setEditItem(item);
    setForm(item ? {
      name: item.name, code: item.code, type: item.type,
      value: String(item.value), minimumOrderAmount: String(item.minimumOrderAmount || 0),
      usageLimit: String(item.usageLimit || ''), description: item.description || '',
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().slice(0,10) : ''
    } : { name:'', code:'', type:'Percentage', value:'', minimumOrderAmount:'0', usageLimit:'', expiryDate:'', description:'' });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code || !form.value || !form.expiryDate) return Alert.alert('Error', 'All required fields must be filled');
    try {
      const payload = { ...form, value: parseFloat(form.value), minimumOrderAmount: parseFloat(form.minimumOrderAmount), usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null };
      if (editItem) await discountAPI.update(editItem._id, payload);
      else          await discountAPI.create(payload);
      setModal(false); fetchDiscounts();
    } catch (err) { Alert.alert('Error', err.response?.data?.message || 'Failed to save'); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discounts</Text>
        <TouchableOpacity onPress={() => openModal()} style={styles.addBtn}><Ionicons name="add" size={22} color="#fff" /></TouchableOpacity>
      </View>
      {loading ? <LoadingSpinner /> : (
        <FlatList data={discounts} keyExtractor={i => i._id} contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState title="No discounts" icon="🏷️" />}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <View style={styles.codeRow}><Text style={styles.codeTag}>{item.code}</Text><Text style={styles.itemSub}>{item.type === 'Percentage' ? `${item.value}% off` : `LKR ${item.value} off`}</Text></View>
                </View>
                <StatusBadge status={item.isActive && new Date(item.expiryDate) > new Date() ? 'Active' : 'Inactive'} />
              </View>
              <Text style={styles.itemSub}>Used: {item.usedCount}/{item.usageLimit || '∞'} · Expires: {new Date(item.expiryDate).toLocaleDateString()}</Text>
              <View style={styles.actionRow}>
                <Button title="Edit"   variant="outline" onPress={() => openModal(item)} style={styles.actionBtn} />
                <Button title="Delete" variant="danger"  onPress={async () => { await discountAPI.delete(item._id); fetchDiscounts(); }} style={styles.actionBtn} />
              </View>
            </Card>
          )} />
      )}
      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalCard} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>{editItem ? 'Edit Discount' : 'Add Discount'}</Text>
            <Input label="Name" placeholder="e.g. Summer Sale" value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} />
            <Input label="Code" placeholder="SUMMER20" autoCapitalize="characters" value={form.code} onChangeText={v => setForm(p => ({ ...p, code: v.toUpperCase() }))} />
            <View style={styles.typeRow}>
              {['Percentage', 'Fixed'].map(t => (
                <TouchableOpacity key={t} onPress={() => setForm(p => ({ ...p, type: t }))} style={[styles.typeChip, form.type === t && styles.typeChipActive]}>
                  <Text style={[styles.typeChipText, form.type === t && { color: '#fff' }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input label={form.type === 'Percentage' ? 'Percentage (%)' : 'Fixed Amount (LKR)'} keyboardType="numeric" value={form.value} onChangeText={v => setForm(p => ({ ...p, value: v }))} />
            <Input label="Minimum Order (LKR)" keyboardType="numeric" value={form.minimumOrderAmount} onChangeText={v => setForm(p => ({ ...p, minimumOrderAmount: v }))} />
            <Input label="Usage Limit (blank = unlimited)" keyboardType="numeric" value={form.usageLimit} onChangeText={v => setForm(p => ({ ...p, usageLimit: v }))} />
            <Input label="Expiry Date (YYYY-MM-DD)" placeholder="2025-12-31" value={form.expiryDate} onChangeText={v => setForm(p => ({ ...p, expiryDate: v }))} />
            <View style={styles.modalBtns}>
              <Button title="Cancel" variant="ghost" onPress={() => setModal(false)} style={{ flex: 1 }} />
              <Button title="Save"   variant="gradient" onPress={handleSave} style={{ flex: 1 }} />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// REFUND SCREEN
// ────────────────────────────────────────────────────────────────────────────
export function RefundScreen() {
  const [refunds, setRefunds]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState({ paymentId:'', refundType:'Full', amount:'', reason:'', refundMethod:'Cash' });

  useEffect(() => { fetchRefunds(); }, []);
  const fetchRefunds = async () => {
    try { const res = await refundAPI.getAll(); setRefunds(res.data.refunds); }
    catch { Alert.alert('Error', 'Failed to load refunds'); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.paymentId || !form.amount || !form.reason) return Alert.alert('Error', 'Fill all required fields');
    try {
      await refundAPI.create({ ...form, amount: parseFloat(form.amount) });
      setModal(false); fetchRefunds();
      Alert.alert('Success', 'Refund processed successfully!');
    } catch (err) { Alert.alert('Error', err.response?.data?.message || 'Failed to process refund'); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Refunds</Text>
        <TouchableOpacity onPress={() => { setForm({ paymentId:'', refundType:'Full', amount:'', reason:'', refundMethod:'Cash' }); setModal(true); }} style={styles.addBtn}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      {loading ? <LoadingSpinner /> : (
        <FlatList data={refunds} keyExtractor={i => i._id} contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState title="No refunds" icon="↩️" />}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.itemName}>#{item.refundNumber}</Text>
                <StatusBadge status={item.status} />
              </View>
              <Text style={styles.itemSub}>Customer: {item.customer?.name}</Text>
              <Text style={styles.itemSub}>Order: #{item.order?.orderNumber} · Invoice: #{item.payment?.invoiceNumber}</Text>
              <Divider />
              <View style={styles.rowBetween}>
                <Text style={styles.itemSub}>{item.refundType} Refund · {item.refundMethod}</Text>
                <Text style={[styles.itemName, { color: COLORS.error }]}>LKR {item.amount.toLocaleString()}</Text>
              </View>
              <Text style={styles.itemSub}>Reason: {item.reason}</Text>
            </Card>
          )} />
      )}
      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalCard} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>Process Refund</Text>
            <Input label="Payment ID" placeholder="Paste payment _id" value={form.paymentId} onChangeText={v => setForm(p => ({ ...p, paymentId: v }))} />
            <View style={styles.typeRow}>
              {['Full', 'Partial'].map(t => (
                <TouchableOpacity key={t} onPress={() => setForm(p => ({ ...p, refundType: t }))} style={[styles.typeChip, form.refundType === t && styles.typeChipActive]}>
                  <Text style={[styles.typeChipText, form.refundType === t && { color: '#fff' }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input label="Refund Amount (LKR)" keyboardType="numeric" value={form.amount} onChangeText={v => setForm(p => ({ ...p, amount: v }))} />
            <Input label="Reason *" placeholder="Why is this refund being processed?" value={form.reason} onChangeText={v => setForm(p => ({ ...p, reason: v }))} />
            <View style={styles.typeRow}>
              {['Cash', 'Original Method', 'Credit'].map(m => (
                <TouchableOpacity key={m} onPress={() => setForm(p => ({ ...p, refundMethod: m }))} style={[styles.typeChip, form.refundMethod === m && styles.typeChipActive]}>
                  <Text style={[styles.typeChipText, form.refundMethod === m && { color: '#fff' }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalBtns}>
              <Button title="Cancel" variant="ghost" onPress={() => setModal(false)} style={{ flex: 1 }} />
              <Button title="Process Refund" variant="danger" onPress={handleCreate} style={{ flex: 1 }} />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.background },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SIZES.md, paddingTop: 50, backgroundColor: '#fff', ...SHADOWS.sm },
  headerTitle:   { fontSize: SIZES.font.lg, fontWeight: '800', color: COLORS.text },
  addBtn:        { backgroundColor: COLORS.primary, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  list:          { padding: SIZES.md },
  rowBetween:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  itemName:      { fontSize: SIZES.font.sm, fontWeight: '700', color: COLORS.text },
  itemSub:       { fontSize: SIZES.font.xs, color: COLORS.textLight, marginTop: 2 },
  actions:       { flexDirection: 'row', gap: 6 },
  actionRow:     { flexDirection: 'row', gap: 8, marginTop: SIZES.sm },
  actionBtn:     { flex: 1, paddingVertical: 8 },
  codeRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  codeTag:       { backgroundColor: COLORS.primary + '20', color: COLORS.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, fontSize: SIZES.font.xs, fontWeight: '700' },
  switchRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.md },
  switchLabel:   { fontSize: SIZES.font.sm, fontWeight: '600', color: COLORS.text },
  typeRow:       { flexDirection: 'row', gap: 8, marginBottom: SIZES.md, flexWrap: 'wrap' },
  typeChip:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: SIZES.radiusSm, borderWidth: 1.5, borderColor: COLORS.border },
  typeChipActive:{ backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeChipText:  { fontSize: SIZES.font.sm, fontWeight: '600', color: COLORS.textLight },
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:     { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SIZES.lg, paddingBottom: 34 },
  modalTitle:    { fontSize: SIZES.font.lg, fontWeight: '800', color: COLORS.text, marginBottom: SIZES.md },
  modalBtns:     { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.sm },
});
