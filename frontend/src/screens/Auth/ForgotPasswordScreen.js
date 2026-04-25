import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../../services/api';
import { Button, Input } from '../../components';
import { COLORS, SIZES, SHADOWS } from '../../utils/theme';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return Alert.alert('Error', 'Please enter your email');
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email: email.trim() });
      setSent(true);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FF6B35', '#FF8C5A']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerEmoji}>{sent ? '📬' : '🔐'}</Text>
        <Text style={styles.headerTitle}>{sent ? 'Email Sent!' : 'Forgot Password'}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          {sent ? (
            <>
              <Text style={styles.sentTitle}>Check your inbox</Text>
              <Text style={styles.sentText}>
                We sent a password reset link to{'\n'}<Text style={{ color: COLORS.primary, fontWeight: '700' }}>{email}</Text>
              </Text>
              <Text style={styles.sentNote}>The link expires in 1 hour. Check your spam folder if you don't see it.</Text>
              <Button title="Back to Login" variant="gradient" onPress={() => navigation.navigate('Login')} style={{ marginTop: SIZES.lg }} />
            </>
          ) : (
            <>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>Enter your email and we'll send you a reset link.</Text>
              <Input
                label="Email Address"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                icon={<Ionicons name="mail-outline" size={20} color={COLORS.textMuted} />}
              />
              <Button title="Send Reset Link" variant="gradient" onPress={handleSubmit} loading={loading} />
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Text style={styles.backText}>← Back to Login</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
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
  title:       { fontSize: SIZES.font.xl, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  subtitle:    { fontSize: SIZES.font.sm, color: COLORS.textLight, marginBottom: SIZES.lg },
  sentTitle:   { fontSize: SIZES.font.xl, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  sentText:    { fontSize: SIZES.font.md, color: COLORS.textLight, textAlign: 'center', marginBottom: SIZES.md },
  sentNote:    { fontSize: SIZES.font.sm, color: COLORS.textMuted, textAlign: 'center', fontStyle: 'italic' },
  backBtn:     { alignItems: 'center', marginTop: SIZES.md },
  backText:    { color: COLORS.primary, fontWeight: '600', fontSize: SIZES.font.sm },
});
