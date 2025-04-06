import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, ActivityIndicator, Text } from 'react-native-paper';
import { projectAPI } from '../services/api';
import { COLORS } from '../constants/theme';

const ProjectEditScreen = ({ route, navigation }) => {
  const { projectId } = route.params;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProject = async () => {
      try {
        setError('');
        const response = await projectAPI.getProjectById(projectId);
        setTitle(response.data.title);
        setDescription(response.data.description);
      } catch (err) {
        console.error('Proje yüklenirken hata:', err);
        setError('Proje bilgileri yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      await projectAPI.updateProject(projectId, { title, description });
      navigation.goBack(); // Return to the previous screen
    } catch (err) {
      console.error('Proje güncellenirken hata:', err);
      setError('Proje güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        label="Proje Başlığı"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        mode="outlined"
      />
      <TextInput
        label="Proje Açıklaması"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
        mode="outlined"
        multiline
      />
      <Button
        mode="contained"
        onPress={handleSave}
        style={styles.saveButton}
        loading={loading}
      >
        Kaydet
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: COLORS.background,
  },
  input: {
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    color: COLORS.danger,
    textAlign: 'center',
    marginHorizontal: 32,
  },
});

export default ProjectEditScreen;