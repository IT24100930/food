import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  primary:     '#FF6B35',
  primaryDark: '#E55A25',
  primaryLight:'#FF8C5A',
  secondary:   '#2D3748',
  accent:      '#F7C59F',
  success:     '#27AE60',
  warning:     '#F39C12',
  error:       '#E74C3C',
  info:        '#3498DB',

  white:       '#FFFFFF',
  black:       '#000000',
  background:  '#F8F9FA',
  card:        '#FFFFFF',
  border:      '#E2E8F0',
  text:        '#2D3748',
  textLight:   '#718096',
  textMuted:   '#A0AEC0',
  inputBg:     '#F7FAFC',

  // Status colors
  pending:   '#F39C12',
  confirmed: '#3498DB',
  preparing: '#9B59B6',
  ready:     '#27AE60',
  delivered: '#2ECC71',
  cancelled: '#E74C3C',

  // Gradient
  gradient:  ['#FF6B35', '#FF8C5A'],
};

export const SIZES = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,

  radius:     12,
  radiusSm:   8,
  radiusLg:   20,
  radiusFull: 100,

  width,
  height,

  font: {
    xs:   11,
    sm:   13,
    md:   15,
    lg:   17,
    xl:   20,
    xxl:  24,
    xxxl: 30,
  }
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  primary: {
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  }
};

export const STATUS_COLORS = {
  Pending:   { bg: '#FFF8E1', text: '#F39C12', border: '#F39C12' },
  Confirmed: { bg: '#EBF5FB', text: '#3498DB', border: '#3498DB' },
  Preparing: { bg: '#F4ECF7', text: '#9B59B6', border: '#9B59B6' },
  Ready:     { bg: '#EAFAF1', text: '#27AE60', border: '#27AE60' },
  Delivered: { bg: '#D5F5E3', text: '#1E8449', border: '#1E8449' },
  Cancelled: { bg: '#FDEDEC', text: '#E74C3C', border: '#E74C3C' },
  Paid:      { bg: '#EAFAF1', text: '#27AE60', border: '#27AE60' },
  Refunded:  { bg: '#EBF5FB', text: '#3498DB', border: '#3498DB' },
};
