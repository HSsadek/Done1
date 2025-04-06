import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, TextInput, ActivityIndicator } from 'react-native-paper';
import DateTimePickerModal from 'react-native-modal-datetime-picker';  // Tarih seçici ekledik
import { taskAPI } from '../services/api';

const CreateTask = ({ route, navigation }) => {
  const { projectId } = route.params;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isDatePickerVisible, setDatePickerVisible] = useState(false); // Tarih seçici görünürlüğü
  const [loading, setLoading] = useState(false); // Yükleniyor durumu

  const handleCreateTask = async () => {
    setLoading(true); // Görev oluşturma işlemi başlarken yükleniyor
    try {
      // Görev oluşturma işlemi
      await taskAPI.createTask(projectId, { title, description, dueDate });
      // Proje Detayı ekranına geri dön ve yenileme sinyali gönder
      navigation.navigate('ProjectDetail', { refresh: true });
    } catch (err) {
      console.error('Görev oluşturulurken hata:', err);
    } finally {
      setLoading(false); // Yükleniyor durumunu sonlandır
    }
  };

  // Tarih seçici için
  const handleDateConfirm = (date) => {
    setDueDate(date.toISOString()); // Tarih formatını uygun şekilde ayarlıyoruz
    setDatePickerVisible(false); // Tarih seçiciyi kapatıyoruz
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Görev Başlığı"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        mode="outlined"
      />
      <TextInput
        label="Görev Açıklaması"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
        mode="outlined"
        multiline
      />
      <Button
        mode="outlined"
        onPress={() => setDatePickerVisible(true)}  // Tarih seçici açılacak
        style={styles.input}
      >
        {dueDate ? `Teslim Tarihi: ${new Date(dueDate).toLocaleDateString()}` : "Teslim Tarihi Seç"}
      </Button>
      
      {/* Tarih Seçici Modal */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={() => setDatePickerVisible(false)}
      />

      {/* Yükleniyor durumu */}
      {loading ? (
        <ActivityIndicator animating={true} size="large" style={styles.loading} />
      ) : (
        <Button
          mode="contained"
          onPress={handleCreateTask}
          style={styles.createButton}
        >
          Görev Oluştur
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  createButton: {
    marginTop: 16,
  },
  loading: {
    marginTop: 20,
  },
});

export default CreateTask;
