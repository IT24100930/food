import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { inventoryAPI } from '../../services/api';
import { Button, Input } from '../../components';
import { COLORS, SIZES, SHADOWS } from '../../utils/theme';

export default function InventoryFormScreen({ route, navigation }) {
  const existing = route.params?.item;
  const [form, setForm] = useState({
    name: existing?.name || '', category: existing?.category || 'Ingredient',
    unit: existing?.unit || 'kg', currentStock: String(existing?.currentStock || '0'),
    minimumStock: String(existing?.minimumStock || '10'),
    maximumStock: String(existing?.maximumStock || ''),
    costPerUnit: String(existing?.costPerUnit || '0'),
    supplier: existing?.supplier || '', notes: existing?.notes || '',
    hasExpiry: existing?.hasExpiry || false,
    expiryDate: existing?.expiryDate ? new Date(existing.expiryDate).toISOString().slice(0,10) : '',
  });
  const [loading, setLoading] = useState(false);

  const CATEGORIES = ['Ingredient', 'Beverage', 'Packaging', 'Other'];
  const UNITS = ['kg', 'g', 'L', 'ml', 'pcs', 'dozen'];

  const handleSave = async () => {
    if (!form.name.trim() || !form.unit) return Alert.alert('Error', 'Name and unit are required');
    setLoading(true);
    try {
      const payload = { ...form, currentStock: parseFloat(form.currentStock), minimumStock: parseFloat(form.minimumStock), maximumStock: form.maximumStock ? parseFloat(form.maximumStock) : undefined, costPerUnit: parseFloat(form.costPerUnit) };
      if (existing) await inventoryAPI.update(existing._id, payload);
      else          await inventoryAPI.create(payload);
      navigation.goBack();
    } catch (err) { Alert.alert('Error', err.response?.data?.message || 'Failed to save'); }
    finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:SIZES.md, paddingTop:50, backgroundColor:'#fff', ...SHADOWS.sm }}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={COLORS.text} /></TouchableOpacity>
        <Text style={{ fontSize:SIZES.font.lg, fontWeight:'800', color:COLORS.text }}>{existing ? 'Edit Item' : 'Add Inventory Item'}</Text>
        <View style={{ width:24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding:SIZES.md, gap:SIZES.sm }} keyboardShouldPersistTaps="handled">
        <Input label="Item Name *" value={form.name} onChangeText={v => setForm(p => ({ ...p, name:v }))} placeholder="e.g. Chicken Breast" />
        <Text style={{ fontSize:SIZES.font.sm, fontWeight:'600', color:COLORS.text, marginBottom:6 }}>Category</Text>
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:SIZES.md }}>
          {CATEGORIES.map(c => <TouchableOpacity key={c} onPress={() => setForm(p=>({...p,category:c}))} style={{ paddingHorizontal:14, paddingVertical:8, borderRadius:SIZES.radiusFull, borderWidth:1.5, borderColor:form.category===c?COLORS.primary:COLORS.border, backgroundColor:form.category===c?COLORS.primary:'#fff' }}><Text style={{ color:form.category===c?'#fff':COLORS.textLight, fontWeight:'600', fontSize:SIZES.font.sm }}>{c}</Text></TouchableOpacity>)}
        </View>
        <Text style={{ fontSize:SIZES.font.sm, fontWeight:'600', color:COLORS.text, marginBottom:6 }}>Unit</Text>
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:SIZES.md }}>
          {UNITS.map(u => <TouchableOpacity key={u} onPress={() => setForm(p=>({...p,unit:u}))} style={{ paddingHorizontal:14, paddingVertical:8, borderRadius:SIZES.radiusFull, borderWidth:1.5, borderColor:form.unit===u?COLORS.primary:COLORS.border, backgroundColor:form.unit===u?COLORS.primary:'#fff' }}><Text style={{ color:form.unit===u?'#fff':COLORS.textLight, fontWeight:'600', fontSize:SIZES.font.sm }}>{u}</Text></TouchableOpacity>)}
        </View>
        <Input label="Current Stock" keyboardType="numeric" value={form.currentStock} onChangeText={v => setForm(p=>({...p,currentStock:v}))} />
        <Input label="Minimum Stock (Alert Threshold)" keyboardType="numeric" value={form.minimumStock} onChangeText={v => setForm(p=>({...p,minimumStock:v}))} />
        <Input label="Maximum Stock" keyboardType="numeric" value={form.maximumStock} onChangeText={v => setForm(p=>({...p,maximumStock:v}))} placeholder="Optional" />
        <Input label="Cost per Unit (LKR)" keyboardType="numeric" value={form.costPerUnit} onChangeText={v => setForm(p=>({...p,costPerUnit:v}))} />
        <Input label="Supplier" value={form.supplier} onChangeText={v => setForm(p=>({...p,supplier:v}))} placeholder="Supplier name (optional)" />
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:SIZES.md }}>
          <Text style={{ fontSize:SIZES.font.sm, fontWeight:'600', color:COLORS.text }}>Track Expiry Date</Text>
          <Switch value={form.hasExpiry} onValueChange={v => setForm(p=>({...p,hasExpiry:v}))} trackColor={{ true:COLORS.primary }} />
        </View>
        {form.hasExpiry && <Input label="Expiry Date (YYYY-MM-DD)" value={form.expiryDate} onChangeText={v => setForm(p=>({...p,expiryDate:v}))} placeholder="2025-12-31" />}
        <Input label="Notes" value={form.notes} onChangeText={v => setForm(p=>({...p,notes:v}))} placeholder="Additional notes" multiline />
        <Button title={existing ? 'Update Item' : 'Add Item'} variant="gradient" onPress={handleSave} loading={loading} />
      </ScrollView>
    </View>
  );
}
