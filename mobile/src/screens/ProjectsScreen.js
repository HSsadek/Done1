import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { FAB, ActivityIndicator, Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { projectAPI } from '../services/api';
import { COLORS } from '../constants/theme';
import ProjectCard from '../components/ProjectCard';

const ProjectsScreen = ({ navigation }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadProjects = async () => {
    try {
      setError('');
      const response = await projectAPI.getAllProjects();
      setProjects(response.data);
    } catch (err) {
      console.error('Projeler yüklenirken hata:', err);
      setError('Projeler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadProjects();
  };

  const handleProjectPress = (project) => {
    navigation.navigate('ProjectDetail', { projectId: project.id });
  };

  const handleAddProject = () => {
    navigation.navigate('CreateProject');
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
    <View style={styles.container}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ProjectCard
            project={item}
            onPress={() => handleProjectPress(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Henüz proje bulunmuyor</Text>
            <Text style={styles.emptySubText}>Yeni bir proje eklemek için + butonuna dokunun</Text>
          </View>
        }
      />
      
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddProject}
        color={COLORS.white}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  errorText: {
    color: COLORS.danger,
    textAlign: 'center',
    marginHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: COLORS.primary,
  },
});

export default ProjectsScreen;
