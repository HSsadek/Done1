import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, Alert, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Surface, Text, Button, Chip, ActivityIndicator, List } from 'react-native-paper';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { projectAPI, taskAPI } from '../services/api';
import { COLORS } from '../constants/theme';
import { TASK_STATUS_COLORS } from '../constants/taskStatus';

const ProjectDetailScreen = ({ route, navigation }) => {
  const { projectId } = route.params;
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [boardTasks, setBoardTasks] = useState({
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
    TO_TEST: []
  });
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
        setProject(projectResponse.data);
        setTasks(tasksResponse.data);
        // Görevleri durumlarına göre ayır
        setBoardTasks({
          TODO: tasksResponse.data.filter(t => t.status === 'Yapılacak'),
          IN_PROGRESS: tasksResponse.data.filter(t => t.status === 'Devam Etmekte'),
          DONE: tasksResponse.data.filter(t => t.status === 'Tamamlandı'),
          TO_TEST: tasksResponse.data.filter(t => t.status === 'Test Edilecek'),
        });
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
        <ActivityIndicator size={40} color={COLORS.primary} />
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

  const statusLabels = {
    TODO: 'Yapılacak',
    IN_PROGRESS: 'Devam Etmekte',
    TO_TEST: 'Test Edilecek',
    DONE: 'Tamamlandı',
    'Yapılacak': 'Yapılacak',
    'Devam Etmekte': 'Devam Etmekte',
    'Test Edilecek': 'Test Edilecek',
    'Tamamlandı': 'Tamamlandı'
  };

  const handleMoveTask = async (task, currentStatus) => {
    // Sıradaki statüye geçir (örnek: TODO -> IN_PROGRESS -> TO_TEST -> DONE)
    const statusOrder = ['Yapılacak', 'Devam Etmekte', 'Test Edilecek', 'Tamamlandı'];
    const nextIndex = (statusOrder.indexOf(currentStatus) + 1) % statusOrder.length;
    const newStatus = statusOrder[nextIndex];
    try {
      await taskAPI.updateTaskStatus(project._id, task._id, newStatus);
      loadProjectData();
    } catch (e) {
      Alert.alert('Hata', 'Görev durumu güncellenemedi');
    }
  };

  const handleReorder = (status, newData) => {
    setBoardTasks(prev => ({ ...prev, [status]: newData }));
    // Burada sıralama backend'e gönderilmiyorsa sadece localde değişir.
  };

  const handleAdvanceStatus = (task) => {
    const statusOrder = ['Yapılacak', 'Devam Etmekte', 'Test Edilecek', 'Tamamlandı'];
    const currentIndex = statusOrder.indexOf(task.status);
    if (currentIndex === -1 || currentIndex === statusOrder.length - 1) return; // Tamamlandı ise ilerlemesin
    const nextStatus = statusOrder[currentIndex + 1];
    taskAPI.updateTaskStatus(project._id, task._id, nextStatus)
      .then(() => loadProjectData())
      .catch(() => alert('Durum güncellenemedi!'))
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
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
              <Text style={[styles.statNumber, { color: TASK_STATUS_COLORS['DONE'] }]}>{project.taskStats?.completed || 0}</Text>
              <Text style={styles.statLabel}>Tamamlanan</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: TASK_STATUS_COLORS['IN_PROGRESS'] }]}>{project.taskStats?.inProgress || 0}</Text>
              <Text style={styles.statLabel}>Devam Eden</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: TASK_STATUS_COLORS['TODO'] }]}>{project.taskStats?.todo || 0}</Text>
              <Text style={styles.statLabel}>Yapılacak</Text>
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
          <View style={{paddingBottom: 16}}>
            {['TODO', 'IN_PROGRESS', 'TO_TEST', 'DONE'].map((status) => (
              <View key={status} style={{ width: windowWidth * 0.8, marginHorizontal: 8, marginBottom: 24 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: TASK_STATUS_COLORS[status] || COLORS.primary }}>
                  {statusLabels[status]}
                </Text>
                {boardTasks[status] && boardTasks[status].length > 0 ? (
                  boardTasks[status].map(item => (
                    <Surface key={item._id} style={{ marginBottom: 12, borderRadius: 8, elevation: 2, backgroundColor: COLORS.white }}>
                      <View style={{ padding: 12 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 15 }}>{item.title}</Text>
                        <Text style={{ color: COLORS.textLight, fontSize: 13, marginVertical: 2 }}>{item.description}</Text>
                        <Text style={{ color: COLORS.gray, fontSize: 12 }}>Atanan: {item.assignedTo?.name || 'Bilinmiyor'}</Text>
                        <Text style={{ color: COLORS.gray, fontSize: 12 }}>
                          Tarih: {item.startDate ? new Date(item.startDate).toLocaleDateString('tr-TR') : '-'} - {item.endDate ? new Date(item.endDate).toLocaleDateString('tr-TR') : '-'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                          <Chip
                            mode="flat"
                            style={[styles.taskStatusChip, { backgroundColor: TASK_STATUS_COLORS[item.status] || COLORS.primary }]}
                          >
                            {item.status}
                          </Chip>
                          <Button compact onPress={() => handleAdvanceStatus(item)} style={{ marginLeft: 8 }}>
                            Durumu İlerle
                          </Button>
                        </View>
                      </View>
                    </Surface>
                  ))
                ) : (
                  <Text style={{ color: COLORS.gray, fontStyle: 'italic' }}>Görev yok</Text>
                )}
              </View>
            ))}
          </View>
        </Surface>

      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  loadingContainer: {
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
