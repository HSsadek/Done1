import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, Alert, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Surface, Text, Button, Chip, List, ActivityIndicator } from 'react-native-paper';
import { projectAPI, taskAPI } from '../services/api';
import { COLORS } from '../constants/theme';
import { TASK_STATUS_COLORS } from '../constants/taskStatus';

const ProjectDetailScreen = ({ route, navigation }) => {
  const { projectId } = route.params;
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const windowWidth = Dimensions.get('window').width;

  const loadProjectData = async () => {
    try {
      setError('');
      setLoading(true);
      const [projectResponse, tasksResponse] = await Promise.all([
        projectAPI.getProjectById(projectId),
        taskAPI.getProjectTasks(projectId),
      ]);

      if (projectResponse.data && tasksResponse.data) {
        console.log('Proje Detayı:', projectResponse.data); // Debug log
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

  const handleDelete = () => {
    Alert.alert(
      'Projeyi Sil',
      'Bu projeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Sil',
          onPress: async () => {
            try {
              setLoading(true);
              await projectAPI.deleteProject(project._id);
              navigation.goBack();
            } catch (err) {
              console.error('Proje silinirken hata:', err);
              Alert.alert('Hata', 'Proje silinirken bir hata oluştu');
            } finally {
              setLoading(false);
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadProjectData();
    }, [projectId])
  );

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const params = navigation.getParent()?.getParams();
      if (params?.projectId === projectId) {
        navigation.getParent()?.setParams({ showMenu: false });
      }
    });

    return unsubscribe;
  }, [navigation, projectId]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => null
    });
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={loadProjectData} style={styles.retryButton}>
          Tekrar Dene
        </Button>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.centerContainer}>
        <Text>Proje bulunamadı</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadProjectData}
            colors={[COLORS.primary]}
          />
        }
      >
        <Surface style={styles.headerCard}>
          <Text style={styles.projectTitle}>{project.title}</Text>
          <Chip 
            mode="flat"
            style={[styles.statusChip, { backgroundColor: COLORS.primary }]}
          >
            {project.status}
          </Chip>
          <Text style={styles.description}>{project.description}</Text>
          
          <View style={styles.ownerSection}>
            <Text style={styles.sectionLabel}>Proje Sahibi:</Text>
            <Text style={styles.ownerText}>
              {project.owner?.name} ({project.owner?.email})
            </Text>
          </View>
          
          <View style={styles.dateSection}>
            <Text style={styles.dateText}>
              Başlangıç: {new Date(project.startDate).toLocaleDateString('tr-TR')}
            </Text>
            <Text style={styles.dateText}>
              Bitiş: {new Date(project.endDate).toLocaleDateString('tr-TR')}
            </Text>
          </View>
        </Surface>

        <Surface style={styles.section}>
          <Text style={styles.sectionTitle}>Görev İstatistikleri</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{project.taskStats?.total || 0}</Text>
              <Text style={styles.statLabel}>Toplam</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: TASK_STATUS_COLORS['DONE'] }]}>
                {project.taskStats?.completed || 0}
              </Text>
              <Text style={styles.statLabel}>Tamamlanan</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: TASK_STATUS_COLORS['IN_PROGRESS'] }]}>
                {project.taskStats?.inProgress || 0}
              </Text>
              <Text style={styles.statLabel}>Devam Eden</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: TASK_STATUS_COLORS['TODO'] }]}>
                {project.taskStats?.todo || 0}
              </Text>
              <Text style={styles.statLabel}>Yapılacak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: TASK_STATUS_COLORS['TO_TEST'] }]}>
                {project.taskStats?.toTest || 0}
              </Text>
              <Text style={styles.statLabel}>Test Edilecek</Text>
            </View>
          </View>
        </Surface>

        <Surface style={styles.section}>
          <List.Section>
            <List.Subheader>Ekip Üyeleri ({project.team?.length || 0})</List.Subheader>
            {project.team && project.team.length > 0 ? (
              project.team.map((member) => (
                <List.Item
                  key={member._id}
                  title={member.name}
                  description={member.email}
                  left={props => (
                    <List.Icon {...props} icon="account" />
                  )}
                />
              ))
            ) : (
              <Text style={styles.emptyText}>Henüz ekip üyesi eklenmemiş</Text>
            )}
          </List.Section>
        </Surface>

        <Surface style={styles.section}>
          <List.Section>
            <List.Subheader>Görevler ({tasks.length})</List.Subheader>
            {tasks.map((task) => (
              <List.Item
                key={task._id}
                title={task.title}
                description={
                  <View style={styles.taskDescription}>
                    <Text style={styles.taskDescText}>{task.description}</Text>
                    {task.assignedTo && (
                      <Text style={styles.taskAssignee}>
                        Atanan: {project.team?.find(m => m._id === task.assignedTo)?.name || 'Bilinmiyor'}
                      </Text>
                    )}
                    <Text style={styles.taskDate}>
                      {new Date(task.startDate).toLocaleDateString('tr-TR')} - {new Date(task.endDate).toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
                }
                left={props => (
                  <List.Icon {...props} 
                    icon={task.status === 'DONE' ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                    color={TASK_STATUS_COLORS[task.status] || COLORS.gray}
                  />
                )}
                right={props => (
                  <Chip 
                    mode="flat" 
                    style={[styles.taskStatusChip, { backgroundColor: TASK_STATUS_COLORS[task.status] || COLORS.primary }]}
                  >
                    {task.status}
                  </Chip>
                )}
              />
            ))}
          </List.Section>
        </Surface>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    padding: 16,
    margin: 16,
    borderRadius: 8,
    elevation: 4,
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: COLORS.text,
  },
  description: {
    fontSize: 16,
    color: COLORS.textLight,
    marginVertical: 12,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  ownerSection: {
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionLabel: {
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: 8,
  },
  ownerText: {
    color: COLORS.textLight,
  },
  dateSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dateText: {
    color: COLORS.gray,
    fontSize: 14,
  },
  section: {
    margin: 16,
    borderRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    padding: 16,
    paddingBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 16,
    paddingTop: 8,
  },
  statItem: {
    alignItems: 'center',
    minWidth: '18%',
    marginVertical: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
    textAlign: 'center',
  },
  taskDescription: {
    marginTop: 4,
  },
  taskDescText: {
    color: COLORS.textLight,
    fontSize: 14,
    marginBottom: 4,
  },
  taskAssignee: {
    color: COLORS.gray,
    fontSize: 12,
    marginBottom: 2,
  },
  taskDate: {
    color: COLORS.gray,
    fontSize: 12,
  },
  taskStatusChip: {
    height: 24,
    justifyContent: 'center',
  },
  errorText: {
    color: COLORS.danger,
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.gray,
    marginVertical: 8,
  },
  addButton: {
    marginTop: 8,
  },
  menuContent: {
    backgroundColor: COLORS.white,
  },
  menu: {
    backgroundColor: COLORS.white,
    borderRadius: 4,
    elevation: 8,
  },
});

export default ProjectDetailScreen;
