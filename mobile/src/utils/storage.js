import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  USER_DATA: '@user_data',
};

export const storage = {
  // Token işlemleri
  setToken: async (token) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (error) {
      console.error('Token kaydedilirken hata:', error);
    }
  },

  getToken: async () => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Token alınırken hata:', error);
      return null;
    }
  },

  removeToken: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Token silinirken hata:', error);
    }
  },

  // Kullanıcı verileri işlemleri
  setUserData: async (userData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Kullanıcı verileri kaydedilirken hata:', error);
    }
  },

  getUserData: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Kullanıcı verileri alınırken hata:', error);
      return null;
    }
  },

  removeUserData: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error('Kullanıcı verileri silinirken hata:', error);
    }
  },

  // Tüm verileri temizle (logout için)
  clearAll: async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
    } catch (error) {
      console.error('Veriler temizlenirken hata:', error);
    }
  },
};

export default storage;
