import React, { useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, ActivityIndicator } from 'react-native-paper';
import { projectAPI, taskAPI } from '../services/api';

const ProjectDetailScreen = ({ route, navigation }) => {
  const { projectId } = route.params;
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadProjectData = async () => {
    try {
      setError('');
      setLoading(true);
      console.log('Proje ve görevler yükleniyor...');
      const [projectResponse, tasksResponse] = await Promise.all([
        projectAPI.getProjectById(projectId),
        taskAPI.getProjectTasks(projectId),
      ]);
      console.log('Proje:', projectResponse.data);
      console.log('Görevler:', tasksResponse.data);

      if (projectResponse.data && tasksResponse.data) {
        setProject(projectResponse.data);
        setTasks(tasksResponse.data);
      } else {
        throw new Error('Veri boş');
      }
    } catch (err) {
      console.error('Proje detayı yüklenirken hata:', err);
      setError('Proje detayı yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (route.params?.refresh) {
        loadProjectData();
        navigation.setParams({ refresh: false });
      }
    }, [route.params?.refresh])
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <>
          <Text style={styles.projectTitle}>{project?.title}</Text>
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.taskItem}>
                <Text>{item.title}</Text>
              </View>
            )}
            refreshing={refreshing}
            onRefresh={loadProjectData}
          />
        </>
      )}
      <Button
        mode="contained"
        onPress={() => navigation.navigate('CreateTask', { projectId })}
        style={styles.createTaskButton}
      >
        Görev Oluştur
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  taskItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 16,
  },
  createTaskButton: {
    margin: 16,
  },
});

export default ProjectDetailScreen;
