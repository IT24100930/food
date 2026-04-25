import React, { useContext, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, TextInput, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CartContext } from '../Menu/MenuScreen';
import { orderAPI, discountAPI } from '../../services/api';
import { Button, Card, Divider, LoadingSpinner } from '../../components';
import { COLORS, SIZES, SHADOWS } from '../../utils/theme';

export default function CartScreen({ navigation }) {
  const { cart, updateQty, removeItem, clearCart, totalPrice } = useContext(CartContext);
  const [orderType, setOrderType]   = useState('Dine-in');
  const [tableNum, setTableNum]     = useState('');
  const [address, setAddress]       = useState('');
  const [note, setNote]             = useState('');
  const [discountCode, setDiscount] = useState('');
  const [tip, setTip]               = useState(0);
  const [discountInfo, setDiscountInfo] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [validatingCode, setValidatingCode] = useState(false);

  const ORDER_TYPES = ['Dine-in', 'Takeaway', 'Delivery'];
  const TIP_OPTIONS = [0, 5, 10, 15, 20];

  const validateDiscount = async () => {
    if (!discountCode.trim()) return;
    setValidatingCode(true);
    try {
      const res = await discountAPI.validate({ code: discountCode.trim(), orderAmount: totalPrice, orderType });
      setDiscountInfo(res.data.discount);
      Alert.alert('✅ Applied!', `Discount "${res.data.discount.name}" applied!`);
    } catch (err) {
      setDiscountInfo(null);
      Alert.alert('Invalid Code', err.response?.data?.message || 'Invalid discount code');
    } finally {
      setValidatingCode(false);
    }
  };

  const discountAmt = discountInfo?.discountAmount || 0;
  const tipAmt      = parseFloat(((totalPrice * tip) / 100).toFixed(2));
  const grandTotal  = parseFloat((totalPrice - discountAmt + tipAmt).toFixed(2));

  const placeOrder = async () => {
    if (!cart.length) return Alert.alert('Cart Empty', 'Add items to your cart first');
    if (orderType === 'Dine-in' && !tableNum.trim()) return Alert.alert('Required', 'Please enter table number');
    if (orderType === 'Delivery' && !address.trim()) return Alert.alert('Required', 'Please enter delivery address');

    setLoading(true);
    try {
      const payload = {
        items: cart.map(c => ({ menuItem: c.menuItem, quantity: c.quantity })),
        orderType, tableNumber: tableNum, deliveryAddress: address,
        specialInstructions: note,
        discountCode: discountInfo ? discountCode : undefined,
        tipAmount: tipAmt,
      };
      const res = await orderAPI.create(payload);
      clearCart();
      Alert.alert('Order Placed! 🎉', `Order #${res.data.order.orderNumber} placed successfully!`, [
        { text: 'View Order', onPress: () => navigation.replace('MyOrders') },
        { text: 'OK' }
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!cart.length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={COLORS.text} /></TouchableOpacity><Text style={styles.headerTitle}>My Cart</Text><View style={{ width: 24 }} /></View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 60 }}>🛒</Text>
          <Text style={{ fontSize: SIZES.font.lg, fontWeight: '700', color: COLORS.text, marginTop: SIZES.md }}>Cart is empty</Text>
          <Text style={{ color: COLORS.textLight, marginTop: 6 }}>Add items from the menu</Text>
          <Button title="Browse Menu" variant="gradient" onPress={() => navigation.goBack()} style={{ marginTop: SIZES.lg, paddingHorizontal: 32 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={COLORS.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart ({cart.length})</Text>
        <TouchableOpacity onPress={() => Alert.alert('Clear Cart', 'Remove all items?', [{ text: 'Cancel' }, { text: 'Clear', style: 'destructive', onPress: clearCart }])}>
          <Ionicons name="trash-outline" size={22} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        <View style={styles.section}>
          {cart.map(item => (
            <View key={item.menuItem} style={styles.cartItem}>
              <View style={styles.cartItemInfo}>
                <Text style={styles.cartItemName}>{item.name}</Text>
                <Text style={styles.cartItemPrice}>LKR {(item.price * item.quantity).toLocaleString()}</Text>
              </View>
              <View style={styles.qtyRow}>
                <TouchableOpacity onPress={() => updateQty(item.menuItem, item.quantity - 1)} style={styles.qtyBtn}><Ionicons name="remove" size={14} color={COLORS.primary} /></TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => updateQty(item.menuItem, item.quantity + 1)} style={styles.qtyBtn}><Ionicons name="add" size={14} color={COLORS.primary} /></TouchableOpacity>
                <TouchableOpacity onPress={() => removeItem(item.menuItem)} style={[styles.qtyBtn, { backgroundColor: COLORS.error + '20', marginLeft: 4 }]}>
                  <Ionicons name="trash-outline" size={14} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Order Type */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Order Type</Text>
          <View style={styles.typeRow}>
            {ORDER_TYPES.map(t => (
              <TouchableOpacity key={t} onPress={() => setOrderType(t)} style={[styles.typeChip, orderType === t && styles.typeChipActive]}>
                <Text style={[styles.typeChipText, orderType === t && { color: '#fff' }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {orderType === 'Dine-in' && (
            <TextInput style={styles.textInput} placeholder="Table Number *" value={tableNum} onChangeText={setTableNum} keyboardType="number-pad" />
          )}
          {orderType === 'Delivery' && (
            <TextInput style={styles.textInput} placeholder="Delivery Address *" value={address} onChangeText={setAddress} multiline />
          )}
          <TextInput style={[styles.textInput, { marginTop: 8 }]} placeholder="Special instructions (optional)" value={note} onChangeText={setNote} multiline />
        </Card>

        {/* Tip */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Add a Tip</Text>
          <View style={styles.typeRow}>
            {TIP_OPTIONS.map(t => (
              <TouchableOpacity key={t} onPress={() => setTip(t)} style={[styles.typeChip, tip === t && styles.typeChipActive]}>
                <Text style={[styles.typeChipText, tip === t && { color: '#fff' }]}>{t}%</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Discount */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Discount Code</Text>
          <View style={styles.discountRow}>
            <TextInput style={[styles.textInput, { flex: 1, marginBottom: 0 }]} placeholder="Enter code..." autoCapitalize="characters" value={discountCode} onChangeText={setDiscount} />
            <Button title="Apply" variant="outline" onPress={validateDiscount} loading={validatingCode} style={{ marginLeft: 8, paddingVertical: 13 }} />
          </View>
          {discountInfo && <Text style={styles.discountApplied}>✅ {discountInfo.name} — LKR {discountAmt} off</Text>}
        </Card>

        {/* Summary */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryValue}>LKR {totalPrice.toLocaleString()}</Text></View>
          {discountAmt > 0 && <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: COLORS.success }]}>Discount</Text><Text style={[styles.summaryValue, { color: COLORS.success }]}>-LKR {discountAmt}</Text></View>}
          {tipAmt > 0 && <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Tip ({tip}%)</Text><Text style={styles.summaryValue}>LKR {tipAmt}</Text></View>}
          <Divider />
          <View style={styles.summaryRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>LKR {grandTotal.toLocaleString()}</Text></View>
        </Card>
      </ScrollView>

      <View style={styles.placeOrderBar}>
        <LinearGradient colors={['#FF6B35', '#FF8C5A']} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={styles.placeOrderGrad}>
          <TouchableOpacity onPress={placeOrder} disabled={loading} style={styles.placeOrderBtn}>
            {loading ? <Text style={styles.placeOrderText}>Placing Order...</Text> : (
              <><Text style={styles.placeOrderText}>Place Order</Text><Text style={styles.placeOrderPrice}>LKR {grandTotal.toLocaleString()}</Text></>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.background },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SIZES.md, paddingTop: 50, backgroundColor: '#fff', ...SHADOWS.sm },
  headerTitle:   { fontSize: SIZES.font.lg, fontWeight: '800', color: COLORS.text },
  section:       { marginHorizontal: SIZES.md, marginTop: SIZES.md },
  sectionTitle:  { fontSize: SIZES.font.md, fontWeight: '700', color: COLORS.text, marginBottom: SIZES.sm },
  cartItem:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  cartItemInfo:  { flex: 1 },
  cartItemName:  { fontSize: SIZES.font.sm, fontWeight: '600', color: COLORS.text },
  cartItemPrice: { fontSize: SIZES.font.sm, color: COLORS.primary, fontWeight: '700', marginTop: 2 },
  qtyRow:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn:        { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.primary + '20', alignItems: 'center', justifyContent: 'center' },
  qtyText:       { fontSize: SIZES.font.sm, fontWeight: '700', color: COLORS.text, minWidth: 16, textAlign: 'center' },
  typeRow:       { flexDirection: 'row', gap: 8, marginBottom: SIZES.sm },
  typeChip:      { paddingHorizontal: 16, paddingVertical: 8, borderRadius: SIZES.radiusFull, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: '#fff' },
  typeChipActive:{ backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeChipText:  { fontSize: SIZES.font.sm, fontWeight: '600', color: COLORS.textLight },
  textInput:     { backgroundColor: COLORS.inputBg, borderRadius: SIZES.radiusSm, borderWidth: 1.5, borderColor: COLORS.border, padding: 12, fontSize: SIZES.font.sm, color: COLORS.text, marginBottom: SIZES.sm },
  discountRow:   { flexDirection: 'row', alignItems: 'center' },
  discountApplied:{ color: COLORS.success, fontSize: SIZES.font.sm, fontWeight: '600', marginTop: 6 },
  summaryRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel:  { fontSize: SIZES.font.sm, color: COLORS.textLight },
  summaryValue:  { fontSize: SIZES.font.sm, fontWeight: '600', color: COLORS.text },
  totalLabel:    { fontSize: SIZES.font.md, fontWeight: '800', color: COLORS.text },
  totalValue:    { fontSize: SIZES.font.md, fontWeight: '800', color: COLORS.primary },
  placeOrderBar: { padding: SIZES.md, backgroundColor: '#fff', ...SHADOWS.lg },
  placeOrderGrad:{ borderRadius: SIZES.radius, overflow: 'hidden' },
  placeOrderBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SIZES.md },
  placeOrderText:{ color: '#fff', fontSize: SIZES.font.md, fontWeight: '800' },
  placeOrderPrice:{ color: '#fff', fontSize: SIZES.font.md, fontWeight: '700' },
});
