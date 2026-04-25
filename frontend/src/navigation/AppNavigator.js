import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/theme';

// Auth Screens
import LoginScreen     from '../screens/Auth/LoginScreen';
import RegisterScreen  from '../screens/Auth/RegisterScreen';
import ForgotPassword  from '../screens/Auth/ForgotPasswordScreen';

// Customer Screens
import MenuScreen      from '../screens/Menu/MenuScreen';
import MenuDetailScreen from '../screens/Menu/MenuDetailScreen';
import CartScreen      from '../screens/Order/CartScreen';
import MyOrdersScreen  from '../screens/Order/MyOrdersScreen';
import OrderDetailScreen from '../screens/Order/OrderDetailScreen';
import ProfileScreen   from '../screens/User/ProfileScreen';

// Admin/Staff Screens
import DashboardScreen   from '../screens/User/DashboardScreen';
import ManageMenuScreen  from '../screens/Menu/ManageMenuScreen';
import MenuFormScreen    from '../screens/Menu/MenuFormScreen';
import OrdersScreen      from '../screens/Order/OrdersScreen';
import PaymentScreen     from '../screens/Payment/PaymentScreen';
import PaymentListScreen from '../screens/Payment/PaymentListScreen';
import InventoryScreen   from '../screens/Inventory/InventoryScreen';
import InventoryFormScreen from '../screens/Inventory/InventoryFormScreen';
import TaxScreen         from '../screens/Tax/TaxScreen';
import DiscountScreen    from '../screens/Discount/DiscountScreen';
import RefundScreen      from '../screens/Refund/RefundScreen';
import UsersScreen       from '../screens/User/UsersScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const screenOptions = { headerShown: false };

// ── Customer Tab Navigator ─────────────────────────────────────────────────────
function CustomerTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor:   COLORS.primary,
      tabBarInactiveTintColor: COLORS.textMuted,
      tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 0, elevation: 10, shadowOpacity: 0.1, height: 65, paddingBottom: 10 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      tabBarIcon: ({ color, size, focused }) => {
        const icons = { Menu:'restaurant-outline', Orders:'receipt-outline', Profile:'person-outline' };
        const focusedIcons = { Menu:'restaurant', Orders:'receipt', Profile:'person' };
        return <Ionicons name={focused ? focusedIcons[route.name] : icons[route.name]} size={size} color={color} />;
      },
    })}>
      <Tab.Screen name="Menu"    component={CustomerMenuStack} />
      <Tab.Screen name="Orders"  component={CustomerOrderStack} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function CustomerMenuStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="MenuList"   component={MenuScreen} />
      <Stack.Screen name="MenuDetail" component={MenuDetailScreen} />
      <Stack.Screen name="Cart"       component={CartScreen} />
    </Stack.Navigator>
  );
}

function CustomerOrderStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="MyOrders"    component={MyOrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="Payment"     component={PaymentScreen} />
    </Stack.Navigator>
  );
}

// ── Admin/Staff Tab Navigator ──────────────────────────────────────────────────
function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor:   COLORS.primary,
      tabBarInactiveTintColor: COLORS.textMuted,
      tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 0, elevation: 10, height: 65, paddingBottom: 10 },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      tabBarIcon: ({ color, size, focused }) => {
        const icons = { Dashboard:'grid-outline',Menu:'restaurant-outline',Orders:'receipt-outline',Admin:'settings-outline',More:'ellipsis-horizontal-outline' };
        const f     = { Dashboard:'grid',Menu:'restaurant',Orders:'receipt',Admin:'settings',More:'ellipsis-horizontal' };
        return <Ionicons name={focused ? f[route.name] : icons[route.name]} size={size} color={color} />;
      },
    })}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Menu"      component={AdminMenuStack} />
      <Tab.Screen name="Orders"    component={AdminOrderStack} />
      <Tab.Screen name="Admin"     component={AdminStack} />
      <Tab.Screen name="More"      component={MoreStack} />
    </Tab.Navigator>
  );
}

function AdminMenuStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ManageMenu" component={ManageMenuScreen} />
      <Stack.Screen name="MenuForm"   component={MenuFormScreen} />
      <Stack.Screen name="MenuDetail" component={MenuDetailScreen} />
    </Stack.Navigator>
  );
}

function AdminOrderStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="OrdersList"  component={OrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="Payment"     component={PaymentScreen} />
    </Stack.Navigator>
  );
}

function AdminStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="UsersList"  component={UsersScreen} />
      <Stack.Screen name="Inventory"  component={InventoryScreen} />
      <Stack.Screen name="InvForm"    component={InventoryFormScreen} />
    </Stack.Navigator>
  );
}

function MoreStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Payments"   component={PaymentListScreen} />
      <Stack.Screen name="Taxes"      component={TaxScreen} />
      <Stack.Screen name="Discounts"  component={DiscountScreen} />
      <Stack.Screen name="Refunds"    component={RefundScreen} />
      <Stack.Screen name="Profile"    component={ProfileScreen} />
    </Stack.Navigator>
  );
}

// ── Auth Stack ────────────────────────────────────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Forgot"   component={ForgotPassword} />
    </Stack.Navigator>
  );
}

// ── Root Navigator ─────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? <AuthStack /> : (
        user.role === 'Customer' ? <CustomerTabs /> : <AdminTabs />
      )}
    </NavigationContainer>
  );
}
