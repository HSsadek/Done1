export const COLORS = {
  primary: '#4A90E2',    // Modern mavi
  secondary: '#5C6BC0',  // İndigo tonu
  success: '#4CAF50',    // Yeşil
  danger: '#F44336',     // Kırmızı
  warning: '#FFC107',    // Sarı
  info: '#2196F3',       // Açık mavi
  light: '#F5F5F5',      // Açık gri
  dark: '#212121',       // Koyu gri
  gray: '#757575',       // Orta gri
  white: '#FFFFFF',      // Beyaz
  black: '#000000',      // Siyah
  background: '#F0F2F5', // Sayfa arkaplanı
  card: '#FFFFFF',       // Kart arkaplanı
  border: '#E0E0E0',     // Kenarlık rengi
  text: '#212121',       // Ana metin rengi
  textLight: '#757575',  // İkincil metin rengi
  placeholder: '#9E9E9E', // Input placeholder rengi
  disabled: '#BDBDBD',   // Devre dışı öğe rengi
  ripple: 'rgba(0, 0, 0, 0.1)', // Dokunma efekti rengi
};

export const FONTS = {
  regular: {
    fontFamily: 'System',
    fontWeight: 'normal',
  },
  medium: {
    fontFamily: 'System',
    fontWeight: '500',
  },
  bold: {
    fontFamily: 'System',
    fontWeight: 'bold',
  },
  light: {
    fontFamily: 'System',
    fontWeight: '300',
  },
};

export const SIZES = {
  // Global sizes
  base: 8,
  font: 14,
  radius: 12,
  padding: 24,

  // Font sizes
  largeTitle: 40,
  h1: 30,
  h2: 22,
  h3: 18,
  h4: 16,
  h5: 14,
  body1: 30,
  body2: 22,
  body3: 16,
  body4: 14,
  body5: 12,

  // App dimensions
  width: null,
  height: null,
};

export const SHADOWS = {
  light: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.29,
    shadowRadius: 4.65,
    elevation: 4,
  },
  dark: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.32,
    shadowRadius: 5.46,
    elevation: 6,
  },
};

export default { COLORS, FONTS, SIZES, SHADOWS };
