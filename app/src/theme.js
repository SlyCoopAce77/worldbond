import { Appearance } from 'react-native';

export const LIGHT = {
  bg:          '#FFFFFF',
  bgSecondary: '#F7F9FA',
  card:        '#FFFFFF',
  cardAlt:     '#F7F9FA',
  border:      '#EFF3F4',
  borderStrong:'#CFD9DE',
  text:        '#0F1419',
  textSub:     '#536471',
  textMuted:   '#8899A6',
  accent:      '#E8003D',
  accentDark:  '#C7003A',
  accentFaint: '#E8003D15',
  tabBg:       '#FFFFFF',
  tabBorder:   '#EFF3F4',
  tabActive:   '#0F1419',
  tabInactive: '#536471',
  inputBg:     '#F7F9FA',
  shadow:      '#00000015',
};

export const DARK = {
  bg:          '#15202B',
  bgSecondary: '#1E2732',
  card:        '#1E2732',
  cardAlt:     '#22303C',
  border:      '#38444D',
  borderStrong:'#38444D',
  text:        '#FFFFFF',
  textSub:     '#8899A6',
  textMuted:   '#536471',
  accent:      '#E8003D',
  accentDark:  '#C7003A',
  accentFaint: '#E8003D15',
  tabBg:       '#15202B',
  tabBorder:   '#38444D',
  tabActive:   '#FFFFFF',
  tabInactive: '#8899A6',
  inputBg:     '#1E2732',
  shadow:      '#00000040',
};

// follows system setting by default
const sys = Appearance.getColorScheme();
export const colors = sys === 'light' ? LIGHT : DARK;
export const isDark  = sys !== 'light';
