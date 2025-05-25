import React, { useState, useCallback } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, RefreshControl, Alert } from 'react-native';
import { FAB, Text, Chip, Divider, Searchbar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import ProjectCard from '../components/ProjectCard';
import { projectAPI } from '../services/api';
import { COLORS } from '../constants/theme';
import { IconButton } from 'react-native-paper';
import { TASK_STATUS } from '../constants/taskStatus';

const CompletedProjectsScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const storage = require('../utils/storage').storage;
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState([]);


  
  const fetchCompletedProjects = async () => {
    try {
      // Kullanıcıyı storage'dan çek
      let currentUser = user;
      if (!currentUser || !currentUser._id) {
        currentUser = await storage.getUserData();
        setUser(currentUser);
      }
      if (!currentUser || !currentUser._id) {
        console.log('Kullanıcı bulunamadı, projeler filtrelenemedi');
        setProjects([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      const response = await projectAPI.getAllProjects();
      console.log('Tüm projeler API response:', response.data);
      
      // Kullanıcının sahibi olduğu veya ekip üyesi olduğu projeleri filtrele
      const userProjects = response.data.filter(project => {
        const userId = String(currentUser._id);
        // Sahibi mi?
        const ownerId = project.owner && (project.owner._id || project.owner);
        if (String(ownerId) === userId) return true;
        // Ekip üyesi mi?
        if (Array.isArray(project.team)) {
          return project.team.some(member => {
            const memberId = member && (member._id || member);
            return String(memberId) === userId;
          });
        }
        return false;
      });
      
      // Tamamlanan tüm projeleri al - sadece görevlerin tamamlanma durumuna göre
      const completedProjects = userProjects.filter(project => 
        // Sadece tüm görevleri tamamlanmış projeleri göster
        project.tasks && project.tasks.length > 0 && 
        project.tasks.every(task => task.status === TASK_STATUS.DONE || task.status === 'Tamamlandı')
      );
      
      // Projeleri tarihe göre sırala (en yeni en üstte)
      const sortedProjects = completedProjects.sort((a, b) => {
        return new Date(b.completedAt || b.updatedAt || b.createdAt) - 
               new Date(a.completedAt || a.updatedAt || a.createdAt);
      });
      
      setProjects(sortedProjects);
      setFilteredProjects(sortedProjects); // Arama filtresini de güncelle
      console.log('Tamamlanmış projeler:', sortedProjects);
    } catch (error) {
      console.error('Error fetching completed projects:', error);
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
      fetchCompletedProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      Alert.alert('Hata', 'Proje silinirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCompletedProjects();
  }, []);
  
  // Arama sorgusunu güncelle ve filtreleme yap
  const onChangeSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project => 
        project.title.toLowerCase().includes(query.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredProjects(filtered);
    }
  };

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        setUserLoading(true);
        // Önce storage'dan dene
        let userData = await storage.getUserData();
        if (!userData || !userData._id) {
          // API'den çek
          const response = await require('../services/api').authAPI.getProfile();
          userData = response.data;
          await storage.setUserData(userData);
        }
        setUser(userData);
      } catch (err) {
        setUser(null);
        console.error('Kullanıcı profili alınamadı, hata:', err);
        // Hata durumunda storage temizle ve Login ekranına yönlendir
        if (storage.clearAll) await storage.clearAll();
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

  useFocusEffect(
    useCallback(() => {
      const refreshUserAndProjects = async () => {
        const storage = require('../utils/storage').storage;
        const latestUser = await storage.getUserData();
        setUser(latestUser);
        if (latestUser && latestUser._id) {
          fetchCompletedProjects();
        }
      };
      refreshUserAndProjects();
    }, [])
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
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Tamamlanan proje ara..."
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor={COLORS.primary}
          clearButtonMode="while-editing"
          theme={{ roundness: 12 }}
          icon={() => <IconButton icon="magnify" size={20} color={COLORS.primary} style={{margin: 0, padding: 0}} />}
          clearIcon={() => <IconButton icon="close-circle" size={16} color={COLORS.gray} style={{margin: 0, padding: 0}} />}
        />
      </View>
      
      <Divider style={styles.divider} />
      
      <FlatList
        data={filteredProjects}
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
        contentContainerStyle={[
          styles.listContent,
          projects.length === 0 && styles.emptyList
        ]}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <IconButton
              icon="check-circle-outline"
              size={60}
              color={COLORS.gray}
            />
            <View style={styles.emptyTextContainer}>
              <Text style={styles.emptyTitle}>Tamamlanmış Proje Yok</Text>
              <Text style={styles.emptyDescription}>
                Seçilen filtreye göre tamamlanmış proje bulunamadı.
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerTitleContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  divider: {
    backgroundColor: COLORS.lightGray,
    height: 1,
    marginHorizontal: 16,
  },
  searchContainer: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  searchBar: {
    elevation: 2,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    height: 46,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    fontSize: 14,
    marginLeft: -4,
  },
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyTextContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginHorizontal: 20,
  },
});

export default CompletedProjectsScreen;
