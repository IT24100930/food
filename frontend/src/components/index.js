import React from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  ActivityIndicator, StyleSheet, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';

// ── Button ────────────────────────────────────────────────────────────────────
export const Button = ({ title, onPress, loading, variant = 'primary', style, textStyle, icon, disabled }) => {
  if (variant === 'gradient') {
    return (
      <TouchableOpacity onPress={onPress} disabled={loading || disabled} style={[styles.btnWrapper, style]}>
        <LinearGradient colors={['#FF6B35', '#FF8C5A']} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={styles.btnGradient}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text style={[styles.btnTextWhite, textStyle]}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  const variantStyle = {
    primary:   { bg: COLORS.primary,   text: '#fff' },
    secondary: { bg: COLORS.secondary, text: '#fff' },
    outline:   { bg: 'transparent',    text: COLORS.primary, border: COLORS.primary },
    danger:    { bg: COLORS.error,     text: '#fff' },
    success:   { bg: COLORS.success,   text: '#fff' },
    ghost:     { bg: 'transparent',    text: COLORS.text },
  }[variant] || { bg: COLORS.primary, text: '#fff' };

  return (
    <TouchableOpacity
      onPress={onPress} disabled={loading || disabled}
      style={[styles.btn, { backgroundColor: variantStyle.bg, borderColor: variantStyle.border, borderWidth: variantStyle.border ? 1.5 : 0, opacity: disabled ? 0.6 : 1 }, style]}
    >
      {loading ? <ActivityIndicator color={variantStyle.text} /> : (
        <>
          {icon && <View style={{ marginRight: 6 }}>{icon}</View>}
          <Text style={[styles.btnText, { color: variantStyle.text }, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

// ── Input ─────────────────────────────────────────────────────────────────────
export const Input = ({ label, error, icon, rightIcon, style, containerStyle, ...props }) => (
  <View style={[styles.inputContainer, containerStyle]}>
    {label && <Text style={styles.label}>{label}</Text>}
    <View style={[styles.inputWrapper, error && styles.inputError, style]}>
      {icon && <View style={styles.inputIcon}>{icon}</View>}
      <TextInput style={[styles.input, icon && { paddingLeft: 0 }]} placeholderTextColor={COLORS.textMuted} {...props} />
      {rightIcon && <View style={styles.inputRightIcon}>{rightIcon}</View>}
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// ── Card ──────────────────────────────────────────────────────────────────────
export const Card = ({ children, style, onPress }) => {
  const Comp = onPress ? TouchableOpacity : View;
  return <Comp onPress={onPress} style={[styles.card, style]}>{children}</Comp>;
};

// ── Badge ─────────────────────────────────────────────────────────────────────
export const Badge = ({ label, color = COLORS.primary, bgColor, style }) => (
  <View style={[styles.badge, { backgroundColor: bgColor || color + '20', borderColor: color }, style]}>
    <Text style={[styles.badgeText, { color }]}>{label}</Text>
  </View>
);

// ── StatusBadge ───────────────────────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const colors = {
    Pending:   { bg:'#FFF8E1', text:'#F39C12' },
    Confirmed: { bg:'#EBF5FB', text:'#3498DB' },
    Preparing: { bg:'#F4ECF7', text:'#9B59B6' },
    Ready:     { bg:'#EAFAF1', text:'#27AE60' },
    Delivered: { bg:'#D5F5E3', text:'#1E8449' },
    Cancelled: { bg:'#FDEDEC', text:'#E74C3C' },
    Paid:      { bg:'#EAFAF1', text:'#27AE60' },
    Refunded:  { bg:'#EBF5FB', text:'#3498DB' },
    Active:    { bg:'#EAFAF1', text:'#27AE60' },
    Inactive:  { bg:'#F2F3F4', text:'#717D7E' },
  };
  const c = colors[status] || { bg:'#F2F3F4', text:'#717D7E' };
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{status}</Text>
    </View>
  );
};

// ── LoadingSpinner ─────────────────────────────────────────────────────────────
export const LoadingSpinner = ({ message = 'Loading...' }) => (
  <View style={styles.center}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

// ── EmptyState ────────────────────────────────────────────────────────────────
export const EmptyState = ({ title, subtitle, icon }) => (
  <View style={styles.center}>
    <Text style={styles.emptyIcon}>{icon || '📭'}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
  </View>
);

// ── SectionHeader ─────────────────────────────────────────────────────────────
export const SectionHeader = ({ title, action, onAction }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action && <TouchableOpacity onPress={onAction}><Text style={styles.sectionAction}>{action}</Text></TouchableOpacity>}
  </View>
);

// ── Divider ───────────────────────────────────────────────────────────────────
export const Divider = ({ style }) => <View style={[styles.divider, style]} />;

// ── Avatar ────────────────────────────────────────────────────────────────────
export const Avatar = ({ name, size = 40, uri, style }) => {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  if (uri) return <Image source={{ uri }} style={[styles.avatar, { width: size, height: size, borderRadius: size/2 }, style]} />;
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size/2, backgroundColor: COLORS.primary }, style]}>
      <Text style={{ color: '#fff', fontSize: size * 0.35, fontWeight: '700' }}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // Button
  btnWrapper:   { borderRadius: SIZES.radius, overflow: 'hidden' },
  btnGradient:  { paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  btn:          { paddingVertical: 14, paddingHorizontal: 24, borderRadius: SIZES.radius, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  btnText:      { fontSize: SIZES.font.md, fontWeight: '700' },
  btnTextWhite: { color: '#fff', fontSize: SIZES.font.md, fontWeight: '700' },
  // Input
  inputContainer: { marginBottom: SIZES.md },
  label:          { fontSize: SIZES.font.sm, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  inputWrapper:   { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg, borderRadius: SIZES.radius, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: SIZES.md },
  inputError:     { borderColor: COLORS.error },
  inputIcon:      { marginRight: 10 },
  inputRightIcon: { marginLeft: 10 },
  input:          { flex: 1, paddingVertical: 13, fontSize: SIZES.font.md, color: COLORS.text },
  errorText:      { color: COLORS.error, fontSize: SIZES.font.xs, marginTop: 4 },
  // Card
  card:    { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: SIZES.md, ...SHADOWS.sm, marginBottom: SIZES.md },
  // Badge
  badge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: SIZES.radiusFull, alignSelf: 'flex-start' },
  badgeText: { fontSize: SIZES.font.xs, fontWeight: '700' },
  // Loading / Empty
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SIZES.xl },
  loadingText:   { marginTop: SIZES.md, color: COLORS.textLight, fontSize: SIZES.font.md },
  emptyIcon:     { fontSize: 48, marginBottom: SIZES.md },
  emptyTitle:    { fontSize: SIZES.font.lg, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  emptySubtitle: { fontSize: SIZES.font.sm, color: COLORS.textLight, textAlign: 'center', marginTop: 6 },
  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.md },
  sectionTitle:  { fontSize: SIZES.font.lg, fontWeight: '700', color: COLORS.text },
  sectionAction: { fontSize: SIZES.font.sm, color: COLORS.primary, fontWeight: '600' },
  // Divider
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SIZES.md },
  // Avatar
  avatar: { alignItems: 'center', justifyContent: 'center' },
});
