import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../../components';
import { COLORS, SIZES, SHADOWS } from '../../utils/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <LinearGradient colors={['#FF6B35', '#FF8C5A', '#F7C59F']} style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🍽️</Text>
          <Text style={styles.logoText}>Smart Food</Text>
          <Text style={styles.logoSubtext}>Ordering & Management System</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <Input
            label="Email Address"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(v) => setForm(p => ({ ...p, email: v }))}
            error={errors.email}
            icon={<Ionicons name="mail-outline" size={20} color={COLORS.textMuted} />}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            secureTextEntry={!showPass}
            value={form.password}
            onChangeText={(v) => setForm(p => ({ ...p, password: v }))}
            error={errors.password}
            icon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            }
          />

          <TouchableOpacity onPress={() => navigation.navigate('Forgot')} style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button title="Sign In" variant="gradient" onPress={handleLogin} loading={loading} style={styles.loginBtn} />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerBtn}>
            <Text style={styles.registerText}>Don't have an account? <Text style={styles.registerLink}>Sign Up</Text></Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.background },
  header:     { paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  logoContainer: { alignItems: 'center' },
  logoEmoji:  { fontSize: 56 },
  logoText:   { fontSize: SIZES.font.xxxl, fontWeight: '800', color: '#fff', marginTop: 8 },
  logoSubtext:{ fontSize: SIZES.font.sm, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  content:    { padding: SIZES.md, paddingTop: SIZES.lg },
  card:       { backgroundColor: '#fff', borderRadius: SIZES.radiusLg, padding: SIZES.lg, ...SHADOWS.md, marginBottom: SIZES.md },
  title:      { fontSize: SIZES.font.xxl, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  subtitle:   { fontSize: SIZES.font.sm, color: COLORS.textLight, marginBottom: SIZES.lg },
  forgotBtn:  { alignSelf: 'flex-end', marginBottom: SIZES.md },
  forgotText: { color: COLORS.primary, fontSize: SIZES.font.sm, fontWeight: '600' },
  loginBtn:   { marginTop: SIZES.sm },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: SIZES.md },
  dividerLine:{ flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText:{ marginHorizontal: SIZES.md, color: COLORS.textMuted, fontSize: SIZES.font.sm },
  registerBtn:{ alignItems: 'center' },
  registerText:{ color: COLORS.textLight, fontSize: SIZES.font.sm },
  registerLink:{ color: COLORS.primary, fontWeight: '700' },
  demoCard:   { backgroundColor: '#FFF8F5', borderRadius: SIZES.radius, padding: SIZES.md, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  demoTitle:  { fontSize: SIZES.font.sm, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  demoText:   { fontSize: SIZES.font.xs, color: COLORS.textLight, marginBottom: 2 },
});
