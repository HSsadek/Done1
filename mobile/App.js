import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { storage } from './src/utils/storage';
import { setMemoryToken } from './src/services/api';

export default function App() {
  // Uygulama başlatıldığında token'ı yükle
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await storage.getToken();
        if (token) {
          console.log('Token yüklendi');
          setMemoryToken(token);
        }
      } catch (err) {
        console.error('Token yüklenirken hata:', err);
      }
    };
    
    loadToken();
  }, []);

  return (
    <PaperProvider>
      <AppNavigator />
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
