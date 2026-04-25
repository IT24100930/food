// RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../../components';
import { COLORS, SIZES, SHADOWS } from '../../utils/theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name     = 'Full name is required';
    if (!form.email)           e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password)        e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password, phone: form.phone });
      Alert.alert('Success! 🎉', 'Account created! Please check your email to verify.');
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <LinearGradient colors={['#FF6B35', '#FF8C5A']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerEmoji}>🍽️</Text>
        <Text style={styles.headerTitle}>Create Account</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Input label="Full Name" placeholder="John Doe" value={form.name}
            onChangeText={v => setForm(p => ({ ...p, name: v }))} error={errors.name}
            icon={<Ionicons name="person-outline" size={20} color={COLORS.textMuted} />} />

          <Input label="Email Address" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none"
            value={form.email} onChangeText={v => setForm(p => ({ ...p, email: v }))} error={errors.email}
            icon={<Ionicons name="mail-outline" size={20} color={COLORS.textMuted} />} />

          <Input label="Phone (Optional)" placeholder="+94 71 234 5678" keyboardType="phone-pad"
            value={form.phone} onChangeText={v => setForm(p => ({ ...p, phone: v }))}
            icon={<Ionicons name="call-outline" size={20} color={COLORS.textMuted} />} />

          <Input label="Password" placeholder="Min 6 characters" secureTextEntry={!showPass}
            value={form.password} onChangeText={v => setForm(p => ({ ...p, password: v }))} error={errors.password}
            icon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} />}
            rightIcon={<TouchableOpacity onPress={() => setShowPass(!showPass)}><Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} /></TouchableOpacity>} />

          <Input label="Confirm Password" placeholder="Repeat your password" secureTextEntry={!showPass}
            value={form.confirmPassword} onChangeText={v => setForm(p => ({ ...p, confirmPassword: v }))} error={errors.confirmPassword}
            icon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} />} />

          <Button title="Create Account" variant="gradient" onPress={handleRegister} loading={loading} style={{ marginTop: SIZES.sm }} />

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ alignItems: 'center', marginTop: SIZES.md }}>
            <Text style={{ color: COLORS.textLight, fontSize: SIZES.font.sm }}>
              Already have an account? <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.background },
  header:      { paddingTop: 50, paddingBottom: 30, alignItems: 'center' },
  back:        { position: 'absolute', top: 50, left: SIZES.md },
  headerEmoji: { fontSize: 40 },
  headerTitle: { fontSize: SIZES.font.xl, fontWeight: '800', color: '#fff', marginTop: 8 },
  content:     { padding: SIZES.md },
  card:        { backgroundColor: '#fff', borderRadius: SIZES.radiusLg, padding: SIZES.lg, ...SHADOWS.md },
});
