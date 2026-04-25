import React, { useContext } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from './MenuScreen';
import { Button, Badge } from '../../components';
import { COLORS, SIZES, SHADOWS } from '../../utils/theme';

export default function MenuDetailScreen({ route, navigation }) {
  const { item } = route.params;
  const { addItem, cart } = useContext(CartContext);
  const cartItem = cart.find(c => c.menuItem === item._id);

  return (
    <View style={{ flex:1, backgroundColor: COLORS.background }}>
      <Image source={{ uri: item.image || 'https://via.placeholder.com/400x250' }} style={{ width:'100%', height:260 }} />
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ position:'absolute', top:50, left:16, backgroundColor:'rgba(0,0,0,0.4)', borderRadius:20, padding:8 }}>
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={{ padding:SIZES.lg }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:SIZES.sm }}>
          <Text style={{ fontSize:SIZES.font.xl, fontWeight:'800', color:COLORS.text, flex:1 }}>{item.name}</Text>
          <Text style={{ fontSize:SIZES.font.xl, fontWeight:'900', color:COLORS.primary }}>LKR {item.price.toLocaleString()}</Text>
        </View>
        <Badge label={item.category} />
        {item.weeklyOrdered >= 10 && <Badge label="🔥 Trending this week" color="#F39C12" bgColor="#FEF9E7" style={{ marginTop:6 }} />}
        <Text style={{ fontSize:SIZES.font.md, color:COLORS.textLight, marginTop:SIZES.md, lineHeight:24 }}>{item.description || 'No description available.'}</Text>
        {item.availableFrom && <Text style={{ color:COLORS.textMuted, fontSize:SIZES.font.sm, marginTop:SIZES.md }}>⏰ Available: {item.availableFrom} – {item.availableTo}</Text>}
        <Text style={{ fontSize:SIZES.font.sm, color:COLORS.textMuted, marginTop:6 }}>📊 Ordered {item.totalOrdered} times total</Text>
        <Button
          title={cartItem ? `In Cart (${cartItem.quantity}) · Add More` : 'Add to Cart'}
          variant="gradient"
          onPress={() => { addItem(item); navigation.goBack(); }}
          style={{ marginTop:SIZES.xl }}
        />
      </ScrollView>
    </View>
  );
}
