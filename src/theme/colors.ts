export const colors = {
  background: '#0F141A',
  card: '#1B222B',
  inputBackground: '#1E2732',
  textPrimary: '#FFFFFF',
  textSecondary: '#C7CED6',
  placeholder: '#7A8694',
  border: '#2A3440',
  accent: '#FFB41F', // warm yellow from reference
  accentDark: '#E6A10F',
  accentTint: 'rgba(255,180,31,0.12)',
  danger: '#FF5454',
  success: '#2ECC71',
  overlay: 'rgba(0,0,0,0.3)'
} as const;

export type AppColors = typeof colors;


