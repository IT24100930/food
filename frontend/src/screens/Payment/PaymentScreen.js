import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { paymentAPI, orderAPI } from '../../services/api';
import { Button, Card, Divider, StatusBadge, LoadingSpinner } from '../../components';
import { COLORS, SIZES, SHADOWS } from '../../utils/theme';

export default function PaymentScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder]          = useState(null);
  const [rates, setRates]          = useState({});
  const [currencies, setCurrencies] = useState([]);
  const [currency, setCurrency]    = useState('LKR');
  const [payMethod, setPayMethod]  = useState('Cash');
  const [tip, setTip]              = useState(0);
  const [loading, setLoading]      = useState(true);
  const [processing, setProcessing] = useState(false);

  const PAY_METHODS = ['Cash', 'Card', 'Online', 'QR Code'];
  const TIP_OPTIONS = [0, 5, 10, 15, 20];

  useEffect(() => {
    Promise.all([fetchOrder(), fetchRates()]).finally(() => setLoading(false));
  }, []);

  const fetchOrder = async () => {
    const res = await orderAPI.getOne(orderId);
    setOrder(res.data.order);
  };

  const fetchRates = async () => {
    const res = await paymentAPI.getExchangeRates();
    setRates(res.data.rates);
    setCurrencies(res.data.currencies);
  };

  if (loading) return <LoadingSpinner message="Loading payment details..." />;
  if (!order)  return null;

  const exchangeRate   = rates[currency] || 1;
  const baseAmount     = order.totalAmount;
  const tipAmount      = parseFloat(((baseAmount * tip) / 100).toFixed(2));
  const totalLKR       = parseFloat((baseAmount + tipAmount).toFixed(2));
  const totalConverted = parseFloat((totalLKR * exchangeRate).toFixed(2));

  const processPayment = async () => {
    setProcessing(true);
    try {
      const res = await paymentAPI.process({
        orderId, paymentMethod: payMethod, currency,
        exchangeRate, tipAmount
      });
      Alert.alert('Payment Successful! 🎉',
        `Invoice #${res.data.payment.invoiceNumber}\nAmount: ${currency} ${totalConverted}\nInvoice sent to your email!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Payment Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={COLORS.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Process Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <Card>
          <Text style={styles.sectionTitle}>Order #{order.orderNumber}</Text>
          {order.items.map((item, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.itemName}>{item.name} × {item.quantity}</Text>
              <Text style={styles.itemPrice}>LKR {item.subtotal.toLocaleString()}</Text>
            </View>
          ))}
          <Divider />
          <View style={styles.row}><Text style={styles.label}>Subtotal</Text><Text>LKR {order.subtotal.toLocaleString()}</Text></View>
          {order.taxAmount > 0 && <View style={styles.row}><Text style={styles.label}>Tax</Text><Text>LKR {order.taxAmount}</Text></View>}
          {order.discountAmount > 0 && <View style={styles.row}><Text style={[styles.label, { color: COLORS.success }]}>Discount</Text><Text style={{ color: COLORS.success }}>-LKR {order.discountAmount}</Text></View>}
        </Card>

        {/* Tip */}
        <Card>
          <Text style={styles.sectionTitle}>Add Tip</Text>
          <View style={styles.chipRow}>
            {TIP_OPTIONS.map(t => (
              <TouchableOpacity key={t} onPress={() => setTip(t)} style={[styles.chip, tip === t && styles.chipActive]}>
                <Text style={[styles.chipText, tip === t && { color: '#fff' }]}>{t}%</Text>
              </TouchableOpacity>
            ))}
          </View>
          {tipAmount > 0 && <Text style={styles.tipAmt}>Tip amount: LKR {tipAmount}</Text>}
        </Card>

        {/* Currency */}
        <Card>
          <Text style={styles.sectionTitle}>Currency</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {currencies.map(c => (
                <TouchableOpacity key={c} onPress={() => setCurrency(c)} style={[styles.chip, currency === c && styles.chipActive]}>
                  <Text style={[styles.chipText, currency === c && { color: '#fff' }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          {currency !== 'LKR' && (
            <Text style={styles.rateNote}>1 LKR = {exchangeRate.toFixed(4)} {currency}</Text>
          )}
        </Card>

        {/* Payment Method */}
        <Card>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.chipRow}>
            {PAY_METHODS.map(m => (
              <TouchableOpacity key={m} onPress={() => setPayMethod(m)} style={[styles.chip, payMethod === m && styles.chipActive]}>
                <Text style={[styles.chipText, payMethod === m && { color: '#fff' }]}>
                  {m === 'Cash' ? '💵' : m === 'Card' ? '💳' : m === 'Online' ? '🌐' : '📱'} {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Total */}
        <LinearGradient colors={['#FF6B35', '#FF8C5A']} style={styles.totalCard}>
          <Text style={styles.totalTitle}>Total to Pay</Text>
          <Text style={styles.totalMainAmt}>{currency} {totalConverted.toLocaleString()}</Text>
          {currency !== 'LKR' && <Text style={styles.totalSub}>(LKR {totalLKR.toLocaleString()})</Text>}
          <Text style={styles.totalMethod}>via {payMethod}</Text>
        </LinearGradient>

        <Button
          title={processing ? 'Processing...' : `Confirm Payment · ${currency} ${totalConverted}`}
          variant="gradient"
          onPress={processPayment}
          loading={processing}
          style={styles.payBtn}
        />
        <Text style={styles.invoiceNote}>📧 Invoice will be emailed automatically</Text>
      </ScrollView>
    </View>
  );
}

// ── Payment List Screen (Admin) ───────────────────────────────────────────────
export function PaymentListScreen({ navigation }) {
  const [payments, setPayments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      paymentAPI.getAll().then(r => setPayments(r.data.payments)),
      paymentAPI.getAnalytics().then(r => setAnalytics(r.data.analytics)),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payments</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {analytics && (
          <View style={styles.analyticsRow}>
            {[
              { label: "Today's Revenue", value: `LKR ${(analytics.today?.total || 0).toLocaleString()}`, icon: '📅' },
              { label: 'This Month', value: `LKR ${(analytics.month?.total || 0).toLocaleString()}`, icon: '📆' },
              { label: 'Total Revenue', value: `LKR ${(analytics.total?.total || 0).toLocaleString()}`, icon: '💰' },
            ].map((a, i) => (
              <View key={i} style={styles.analyticsCard}>
                <Text style={styles.analyticsIcon}>{a.icon}</Text>
                <Text style={styles.analyticsValue}>{a.value}</Text>
                <Text style={styles.analyticsLabel}>{a.label}</Text>
              </View>
            ))}
          </View>
        )}
        {payments.map(p => (
          <Card key={p._id}>
            <View style={styles.row}>
              <View>
                <Text style={styles.invoiceNum}>#{p.invoiceNumber}</Text>
                <Text style={styles.customerName}>{p.customer?.name}</Text>
              </View>
              <StatusBadge status={p.status} />
            </View>
            <Divider />
            <View style={styles.row}>
              <Text style={styles.label}>{p.paymentMethod} · {p.currency}</Text>
              <Text style={styles.totalValue}>{p.currency} {p.amountPaid.toLocaleString()}</Text>
            </View>
            <Text style={styles.dateText}>{new Date(p.createdAt).toLocaleString()}</Text>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.background },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SIZES.md, paddingTop: 50, backgroundColor: '#fff', ...SHADOWS.sm },
  headerTitle:    { fontSize: SIZES.font.lg, fontWeight: '800', color: COLORS.text },
  content:        { padding: SIZES.md, gap: SIZES.sm, paddingBottom: 32 },
  sectionTitle:   { fontSize: SIZES.font.sm, fontWeight: '700', color: COLORS.text, marginBottom: SIZES.sm },
  chipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:           { paddingHorizontal: 14, paddingVertical: 8, borderRadius: SIZES.radiusFull, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: '#fff' },
  chipActive:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText:       { fontSize: SIZES.font.sm, fontWeight: '600', color: COLORS.textLight },
  tipAmt:         { fontSize: SIZES.font.sm, color: COLORS.success, fontWeight: '600', marginTop: 8 },
  rateNote:       { fontSize: SIZES.font.xs, color: COLORS.textMuted, marginTop: 8, fontStyle: 'italic' },
  row:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  itemName:       { fontSize: SIZES.font.sm, color: COLORS.text, flex: 1 },
  itemPrice:      { fontSize: SIZES.font.sm, fontWeight: '700', color: COLORS.text },
  label:          { fontSize: SIZES.font.sm, color: COLORS.textLight },
  totalCard:      { borderRadius: SIZES.radius, padding: SIZES.lg, alignItems: 'center', marginBottom: SIZES.sm },
  totalTitle:     { color: 'rgba(255,255,255,0.85)', fontSize: SIZES.font.sm, marginBottom: 4 },
  totalMainAmt:   { color: '#fff', fontSize: 32, fontWeight: '900' },
  totalSub:       { color: 'rgba(255,255,255,0.75)', fontSize: SIZES.font.sm },
  totalMethod:    { color: 'rgba(255,255,255,0.85)', fontSize: SIZES.font.sm, marginTop: 6 },
  payBtn:         { marginBottom: SIZES.sm },
  invoiceNote:    { textAlign: 'center', color: COLORS.textMuted, fontSize: SIZES.font.xs },
  analyticsRow:   { flexDirection: 'row', gap: SIZES.sm, marginBottom: SIZES.sm },
  analyticsCard:  { flex: 1, backgroundColor: '#fff', borderRadius: SIZES.radius, padding: SIZES.sm, alignItems: 'center', ...SHADOWS.sm },
  analyticsIcon:  { fontSize: 24, marginBottom: 4 },
  analyticsValue: { fontSize: SIZES.font.sm, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  analyticsLabel: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },
  invoiceNum:     { fontSize: SIZES.font.sm, fontWeight: '700', color: COLORS.text },
  customerName:   { fontSize: SIZES.font.xs, color: COLORS.textLight },
  totalValue:     { fontSize: SIZES.font.sm, fontWeight: '800', color: COLORS.primary },
  dateText:       { fontSize: SIZES.font.xs, color: COLORS.textMuted, marginTop: 4 },
});
