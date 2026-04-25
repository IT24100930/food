import React, { useState, useEffect, useContext, createContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Image, ScrollView, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { menuAPI } from '../../services/api';
import { LoadingSpinner, EmptyState, StatusBadge, Card } from '../../components';
import { COLORS, SIZES, SHADOWS } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';

// ── Cart Context (lightweight, lives within Menu stack) ────────────────────────
export const CartContext = createContext({ cart: [], addItem: () => {}, removeItem: () => {}, clearCart: () => {} });

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const addItem = (item, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem === item._id);
      if (existing) return prev.map(c => c.menuItem === item._id ? { ...c, quantity: c.quantity + qty } : c);
      return [...prev, { menuItem: item._id, name: item.name, price: item.price, quantity: qty, image: item.image }];
    });
  };
  const removeItem = (menuItemId) => setCart(prev => prev.filter(c => c.menuItem !== menuItemId));
  const updateQty  = (menuItemId, qty) => {
    if (qty <= 0) return removeItem(menuItemId);
    setCart(prev => prev.map(c => c.menuItem === menuItemId ? { ...c, quantity: qty } : c));
  };
  const clearCart  = () => setCart([]);
  const totalItems = cart.reduce((s, c) => s + c.quantity, 0);
  const totalPrice = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  return <CartContext.Provider value={{ cart, addItem, removeItem, updateQty, clearCart, totalItems, totalPrice }}>{children}</CartContext.Provider>;
};

const CATEGORIES = ['All', 'Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Side Dish', 'Special'];

export default function MenuScreen({ navigation }) {
  const { user } = useAuth();
  const { cart, addItem, totalItems } = useContext(CartContext);
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchMenu(); }, [category, search]);

  const fetchMenu = async () => {
    try {
      const params = { available: 'true' };
      if (category !== 'All') params.category = category;
      if (search) params.search = search;
      const res = await menuAPI.getAll(params);
      setItems(res.data.items);
    } catch (err) {
      Alert.alert('Error', 'Failed to load menu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getCartQty = (id) => {
    const c = cart.find(i => i.menuItem === id);
    return c ? c.quantity : 0;
  };

  const renderItem = ({ item }) => {
    const qty = getCartQty(item._id);
    return (
      <Card style={styles.menuCard} onPress={() => navigation.navigate('MenuDetail', { item })}>
        <Image source={{ uri: item.image || 'https://via.placeholder.com/200' }} style={styles.itemImage} />
        <View style={styles.itemBadgeRow}>
          <View style={[styles.catBadge, { backgroundColor: COLORS.primary + '20' }]}>
            <Text style={[styles.catBadgeText, { color: COLORS.primary }]}>{item.category}</Text>
          </View>
          {item.weeklyOrdered >= 10 && (
            <View style={[styles.catBadge, { backgroundColor: '#F39C12' + '20' }]}>
              <Text style={[styles.catBadgeText, { color: '#F39C12' }]}>🔥 Trending</Text>
            </View>
          )}
        </View>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
        <View style={styles.itemFooter}>
          <Text style={styles.itemPrice}>LKR {item.price.toLocaleString()}</Text>
          {qty > 0 ? (
            <View style={styles.qtyRow}>
              <TouchableOpacity onPress={() => addItem(item, -1)} style={styles.qtyBtn}>
                <Ionicons name="remove" size={16} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{qty}</Text>
              <TouchableOpacity onPress={() => addItem(item, 1)} style={styles.qtyBtn}>
                <Ionicons name="add" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => { addItem(item); }} style={styles.addBtn}>
              <Ionicons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#FF6B35', '#FF8C5A']} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
            <Text style={styles.headerTitle}>What would you like?</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.cartBtn}>
            <Ionicons name="cart" size={26} color="#fff" />
            {totalItems > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalItems}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search menu..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={18} color={COLORS.textMuted} /></TouchableOpacity> : null}
        </View>
      </LinearGradient>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catContent}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat} onPress={() => setCategory(cat)} style={[styles.catChip, category === cat && styles.catChipActive]}>
            <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Menu List */}
      {loading ? <LoadingSpinner message="Loading menu..." /> : (
        <FlatList
          data={items}
          keyExtractor={i => i._id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={() => { setRefreshing(true); fetchMenu(); }}
          refreshing={refreshing}
          ListEmptyComponent={<EmptyState title="No items found" subtitle="Try a different category" icon="🍽️" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.background },
  header:         { paddingTop: 50, paddingHorizontal: SIZES.md, paddingBottom: SIZES.md },
  headerTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SIZES.md },
  greeting:       { color: 'rgba(255,255,255,0.85)', fontSize: SIZES.font.sm },
  headerTitle:    { color: '#fff', fontSize: SIZES.font.xl, fontWeight: '800' },
  cartBtn:        { position: 'relative' },
  cartBadge:      { position: 'absolute', top: -6, right: -6, backgroundColor: COLORS.secondary, borderRadius: 10, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText:  { color: '#fff', fontSize: 10, fontWeight: '700' },
  searchBar:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: SIZES.radius, paddingHorizontal: SIZES.md, paddingVertical: 10, gap: 8 },
  searchInput:    { flex: 1, fontSize: SIZES.font.md, color: COLORS.text },
  catScroll:      { maxHeight: 52 },
  catContent:     { paddingHorizontal: SIZES.md, paddingVertical: 10, gap: 8 },
  catChip:        { paddingHorizontal: 16, paddingVertical: 7, borderRadius: SIZES.radiusFull, backgroundColor: '#fff', borderWidth: 1.5, borderColor: COLORS.border },
  catChipActive:  { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipText:    { fontSize: SIZES.font.sm, fontWeight: '600', color: COLORS.textLight },
  catChipTextActive: { color: '#fff' },
  list:           { padding: SIZES.md, paddingTop: 0 },
  row:            { justifyContent: 'space-between' },
  menuCard:       { width: (SIZES.width - SIZES.md * 2 - SIZES.sm) / 2, padding: 0, overflow: 'hidden', marginBottom: SIZES.sm },
  itemImage:      { width: '100%', height: 120, backgroundColor: '#f0f0f0' },
  itemBadgeRow:   { flexDirection: 'row', gap: 4, padding: SIZES.sm, paddingBottom: 0, flexWrap: 'wrap' },
  catBadge:       { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  catBadgeText:   { fontSize: 9, fontWeight: '700' },
  itemName:       { fontSize: SIZES.font.sm, fontWeight: '700', color: COLORS.text, paddingHorizontal: SIZES.sm, marginTop: 4 },
  itemDesc:       { fontSize: 11, color: COLORS.textLight, paddingHorizontal: SIZES.sm, marginTop: 2 },
  itemFooter:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SIZES.sm },
  itemPrice:      { fontSize: SIZES.font.sm, fontWeight: '800', color: COLORS.primary },
  addBtn:         { backgroundColor: COLORS.primary, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  qtyRow:         { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn:         { backgroundColor: COLORS.primary + '20', width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  qtyText:        { fontSize: SIZES.font.sm, fontWeight: '700', color: COLORS.text, minWidth: 16, textAlign: 'center' },
});
