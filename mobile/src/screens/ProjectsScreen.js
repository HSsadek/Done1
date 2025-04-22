import React, { useState, useCallback } from 'react';
import { Image } from 'react-native';
import { View, FlatList, ActivityIndicator, StyleSheet, RefreshControl, Alert } from 'react-native';
import { FAB } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import ProjectCard from '../components/ProjectCard';
import { projectAPI } from '../services/api';
import { COLORS } from '../constants/theme';

import { IconButton } from 'react-native-paper';

const ProjectsScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getAllProjects();
      console.log('Projeler API response:', response.data);
      console.log('Projeler API response status:', response.status);
      console.log('Projeler API response headers:', response.headers);
      // Sadece kullanıcının sahibi olduğu veya ekip üyesi olduğu projeleri filtrele
      const filtered = response.data.filter(project => {
        if (!user || !user._id) return false;
        // Sahibi mi? (owner nesne veya string olabilir)
        if (project.owner && (project.owner === user._id || project.owner._id === user._id)) return true;
        // Ekip üyesi mi? (team dizisi string veya nesne olabilir)
        if (Array.isArray(project.team)) {
          // team dizisi string id veya nesne olabilir
          return project.team.some(member => {
            if (typeof member === 'string') return member === user._id;
            if (member && member._id) return member._id === user._id;
            return false;
          });
        }
        return false;
      });
      // Projeleri tarihe göre sırala (en yeni en üstte)
      const sortedProjects = filtered.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setProjects(sortedProjects);
      console.log('Filtrelenmiş ve sıralanmış projeler:', sortedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = async (projectId) => {
    try {
      setLoading(true);
      await projectAPI.deleteProject(projectId);
      // Immediately refresh the list after deletion
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      Alert.alert('Hata', 'Proje silinirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProjects();
  }, []);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        setUserLoading(true);
        const response = await require('../services/api').authAPI.getProfile();
        console.log('Kullanıcı profili API response:', response.data);
        setUser(response.data);
      } catch (err) {
        setUser(null);
        console.error('Kullanıcı profili alınamadı, hata:', err);
        // Hata durumunda storage temizle ve Login ekranına yönlendir
        const { clearAll } = require('../utils/storage').storage;
        await clearAll();
        if (navigation && navigation.reset) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      } finally {
        setUserLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Eğer user null ise storage'dan tekrar çek
  React.useEffect(() => {
    if (!user) {
      (async () => {
        try {
          const { getItem } = require('../utils/storage').storage;
          const userStr = await getItem('user');
          if (userStr) {
            const userObj = JSON.parse(userStr);
            setUser(userObj);
          }
        } catch (e) {
          // ignore
        }
      })();
    }
  }, [user]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <IconButton
          icon={() => (
            user && user.profileImage && user.profileImage.trim() !== '' ?
              <Image source={{ uri: user.profileImage }} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary }} />
              :
              <IconButton icon="account-circle" color={COLORS.white} size={28} style={{ margin: 0, padding: 0 }} />
          )}
          onPress={() => navigation.navigate('Profile')}
          style={{ marginRight: 8, marginLeft: 0, padding: 0 }}
        />
      ),
    });
  }, [navigation, user]);

  useFocusEffect(
    useCallback(() => {
      if (user && user._id) {
        fetchProjects();
      }
    }, [user])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size={40} color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item._id.toString()}
        renderItem={({ item }) => (
          <ProjectCard
            project={item}
            onPress={() => navigation.navigate('ProjectDetail', { projectId: item._id })}
            onDelete={handleDelete}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={styles.listContent}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateProject')}
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
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
  },
});

export default ProjectsScreen;
