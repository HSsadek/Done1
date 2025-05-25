import React, { useState, useCallback } from 'react';
import { Image } from 'react-native';
import { View, FlatList, ActivityIndicator, StyleSheet, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { FAB, Button, Text, Chip, Searchbar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import ProjectCard from '../components/ProjectCard';
import { projectAPI } from '../services/api';
import { COLORS } from '../constants/theme';
import { TASK_STATUS } from '../constants/taskStatus';

import { IconButton } from 'react-native-paper';

const ProjectsScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  // Storage helper
  const storage = require('../utils/storage').storage;
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeProjects, setActiveProjects] = useState([]);
  const [completedProjects, setCompletedProjects] = useState([]);
  const [tasksCompletedProjects, setTasksCompletedProjects] = useState([]);
  const [allCompletedProjects, setAllCompletedProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredActiveProjects, setFilteredActiveProjects] = useState([]);

  // Tüm görevleri tamamlanmış projeleri kontrol eden fonksiyon
  const isProjectTasksCompleted = (project) => {
    if (!project.tasks || project.tasks.length === 0) {
      return false; // Görev yoksa tamamlanmış sayılmaz
    }
    
    // Tüm görevlerin tamamlanmış olup olmadığını kontrol et
    return project.tasks.every(task => 
      task.status === TASK_STATUS.DONE || task.status === 'Tamamlandı'
    );
  };

  const fetchProjects = async () => {
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
      console.log('Projeler API response:', response.data);
      // Sadece kullanıcının sahibi olduğu veya ekip üyesi olduğu projeleri filtrele
      const filtered = response.data.filter(project => {
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
      
      // Tüm görevleri tamamlanmış projeleri bul
      const tasksCompleted = filtered.filter(project => isProjectTasksCompleted(project));
      
      // Durumu "Tamamlandı" olan projeleri bul
      const statusCompleted = filtered.filter(project => project.status === 'Tamamlandı');
      
      // Her iki koşulu da sağlayan projeleri birleştir ve tekrar edenleri kaldır
      const allCompleted = [...new Set([...statusCompleted, ...tasksCompleted])];
      
      // Aktif projeleri bul - sadece görevlerin tamamlanma durumuna bak
      const active = filtered.filter(project => {
        // Tüm görevleri tamamlanmamışsa aktif say
        return !isProjectTasksCompleted(project);
      });
      
      // Projeleri tarihe göre sırala (en yeni en üstte)
      const sortedActive = active.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      const sortedStatusCompleted = statusCompleted.sort((a, b) => {
        return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
      });
      
      const sortedTasksCompleted = tasksCompleted.sort((a, b) => {
        return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
      });
      
      const sortedAllCompleted = allCompleted.sort((a, b) => {
        return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
      });
      
      // Aktif projeleri ana sayfada göstermek için projects state'ine ata
      setProjects(sortedActive);
      
      // Diğer state'leri güncelle
      setActiveProjects(sortedActive);
      setFilteredActiveProjects(sortedActive); // Arama filtresini de güncelle
      setCompletedProjects(sortedStatusCompleted);
      setTasksCompletedProjects(sortedTasksCompleted);
      setAllCompletedProjects(sortedAllCompleted);
      console.log('Kullanıcı ID:', currentUser._id);
      console.log('Aktif projeler:', sortedActive);
      console.log('Durumu Tamamlandı olan projeler:', sortedStatusCompleted);
      console.log('Görevleri tamamlanmış projeler:', sortedTasksCompleted);
      console.log('Tüm tamamlanmış projeler:', sortedAllCompleted);
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
  
  // Arama sorgusunu güncelle ve filtreleme yap
  const onChangeSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredActiveProjects(activeProjects);
    } else {
      const filtered = activeProjects.filter(project => 
        project.title.toLowerCase().includes(query.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredActiveProjects(filtered);
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
      const refreshUserAndProjects = async () => {
        const storage = require('../utils/storage').storage;
        const latestUser = await storage.getUserData();
        setUser(latestUser);
        if (latestUser && latestUser._id) {
          fetchProjects();
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
      <View style={styles.headerContainer}>
        
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Proje ara..."
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
        
        <TouchableOpacity 
          style={styles.completedButton}
          onPress={() => navigation.navigate('CompletedProjects')}
        >
          <Text style={styles.completedButtonText}>Tamamlanan Projeler ({allCompletedProjects.length})</Text>
          <IconButton icon="chevron-right" size={20} color={COLORS.primary} style={{margin: 0, padding: 0}} />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={filteredActiveProjects}
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
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <IconButton
              icon="folder-outline"
              size={60}
              color={COLORS.gray}
            />
            <View style={styles.emptyTextContainer}>
              <Text style={styles.emptyTitle}>Aktif Proje Yok</Text>
              <Text style={styles.emptyDescription}>
                Henüz aktif projeniz bulunmuyor. Yeni bir proje oluşturmak için sağ alttaki + butonuna tıklayın.
              </Text>
            </View>
          </View>
        )}
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
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  searchContainer: {
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
  statsChip: {
    marginRight: 8,
    backgroundColor: COLORS.light,
  },
  statsChipText: {
    color: COLORS.text,
    fontSize: 12,
  },
  completedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.lightBackground,
    borderRadius: 8,
    marginBottom: 8,
  },
  completedButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 40,
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
  },
});

export default ProjectsScreen;
