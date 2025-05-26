import React, { useState, useCallback } from 'react';
import { TouchableOpacity } from 'react-native';
import TaskModal from '../components/TaskModal';
import { StyleSheet, View, ScrollView, RefreshControl, Alert, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Surface, Text, Button, Chip, ActivityIndicator, List, ProgressBar, Avatar } from 'react-native-paper';
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
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const windowWidth = Dimensions.get('window').width;
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

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
        const todoTasks = tasksResponse.data.filter(t => t.status === 'Yapılacak');
        const inProgressTasks = tasksResponse.data.filter(t => t.status === 'Devam Etmekte');
        const doneTasks = tasksResponse.data.filter(t => t.status === 'Tamamlandı');
        const toTestTasks = tasksResponse.data.filter(t => t.status === 'Test Edilecek');
        
        setBoardTasks({
          TODO: todoTasks,
          IN_PROGRESS: inProgressTasks,
          DONE: doneTasks,
          TO_TEST: toTestTasks,
        });
        
        // İlerleme yüzdesini hesapla - sadece tamamlanan görevlere göre
        const totalTasks = tasksResponse.data.length;
        if (totalTasks > 0) {
          // Sadece tamamlanmış görevleri hesaba kat
          const completedTasks = doneTasks.length;
          
          // Tamamlanan görev sayısını toplam görev sayısına böl
          const percentage = completedTasks / totalTasks;
          setProgressPercentage(percentage);
        } else {
          setProgressPercentage(0);
        }
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
    // Kullanıcı bilgilerini al
    const checkUserPermission = async () => {
      try {
        const storage = require('../utils/storage').storage;
        const userData = await storage.getUserData();
        
        if (!userData || !project) return;
        
        // Kullanıcı proje sahibi mi kontrol et
        const isOwner = project.owner && 
          (project.owner._id === userData._id || project.owner === userData._id);
        
        // Sadece proje sahibi düzenleyebilir
        if (isOwner) {
          navigation.setOptions({
            headerRight: () => (
              <Button
                icon="pencil"
                mode="text"
                compact
                onPress={() => navigation.navigate('EditProject', { projectId: project?._id })}
              >
                Düzenle
              </Button>
            )
          });
        } else {
          // Proje sahibi değilse düzenle butonu gösterme
          navigation.setOptions({
            headerRight: () => null
          });
        }
      } catch (err) {
        console.error('Kullanıcı yetkisi kontrol edilirken hata:', err);
      }
    };
    
    checkUserPermission();
  }, [navigation, project]);

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

  // Kullanıcının görevi değiştirme yetkisi var mı kontrol et
  const canUserModifyTask = async (task) => {
    try {
      const storage = require('../utils/storage').storage;
      const userData = await storage.getUserData();
      
      if (!userData || !task) return false;
      
      // Kullanıcı proje sahibi mi?
      const isOwner = project.owner && 
        (project.owner._id === userData._id || project.owner === userData._id);
      
      // Görev kullanıcıya mı atanmış?
      const isAssignee = task.assignedTo && 
        (task.assignedTo._id === userData._id || task.assignedTo === userData._id);
      
      // Proje sahibi veya görev atanan kişi ise değiştirebilir
      return isOwner || isAssignee;
    } catch (err) {
      console.error('Kullanıcı yetkisi kontrol edilirken hata:', err);
      return false;
    }
  };

  const handleMoveTask = async (task, currentStatus) => {
    // Önce kullanıcının yetkisi var mı kontrol et
    const hasPermission = await canUserModifyTask(task);
    
    if (!hasPermission) {
      Alert.alert('Yetki Hatası', 'Bu görevin durumunu değiştirme yetkiniz yok. Sadece size atanan görevlerin durumunu değiştirebilirsiniz.');
      return;
    }
    
    // Sıradaki statüye geçir (örnek: TODO -> IN_PROGRESS -> TO_TEST -> DONE)
    const statusOrder = ['Yapılacak', 'Devam Etmekte', 'Test Edilecek', 'Tamamlandı'];
    const nextIndex = (statusOrder.indexOf(currentStatus) + 1) % statusOrder.length;
    const newStatus = statusOrder[nextIndex];
    
    try {
      // Güncellenmiş taskAPI servisini kullan
      console.log(`Görev durumu güncelleniyor: ProjectID=${project._id}, TaskID=${task._id}, Status=${newStatus}`);
      await taskAPI.updateTaskStatus(project._id, task._id, newStatus);
      console.log('Görev durumu başarıyla güncellendi');
      await loadProjectData();
    } catch (e) {
      console.error('Görev durumu güncelleme hatası:', e);
      Alert.alert('Hata', 'Görev durumu güncellenemedi');
    }
  };

  const handleReorder = (status, newData) => {
    setBoardTasks(prev => ({ ...prev, [status]: newData }));
    // Burada sıralama backend'e gönderilmiyorsa sadece localde değişir.
  };
  
  const handleAdvanceStatus = async (task) => {
    // Önce kullanıcının yetkisi var mı kontrol et
    const hasPermission = await canUserModifyTask(task);
    
    if (!hasPermission) {
      Alert.alert('Yetki Hatası', 'Bu görevin durumunu değiştirme yetkiniz yok. Sadece size atanan görevlerin durumunu değiştirebilirsiniz.');
      return;
    }
    
    const statusOrder = ['Yapılacak', 'Devam Etmekte', 'Test Edilecek', 'Tamamlandı'];
    const currentIndex = statusOrder.indexOf(task.status);
    if (currentIndex === -1 || currentIndex === statusOrder.length - 1) return; // Tamamlandı ise ilerlemesin
    const nextStatus = statusOrder[currentIndex + 1];
    
    try {
      // Güncellenmiş taskAPI servisini kullan
      console.log(`Görev durumu ilerletiliyor: ProjectID=${project._id}, TaskID=${task._id}, Status=${task.status} -> ${nextStatus}`);
      await taskAPI.updateTaskStatus(project._id, task._id, nextStatus);
      console.log('Görev durumu başarıyla ilerletildi');
      await loadProjectData();
    } catch (error) {
      console.error('Görev durumu güncellenirken hata:', error);
      Alert.alert('Hata', 'Görev durumu güncellenemedi. Lütfen tekrar deneyin.');
    }
  };
  
  const handleBackStatus = async (task) => {
    // Önce kullanıcının yetkisi var mı kontrol et
    const hasPermission = await canUserModifyTask(task);
    
    if (!hasPermission) {
      Alert.alert('Yetki Hatası', 'Bu görevin durumunu değiştirme yetkiniz yok. Sadece size atanan görevlerin durumunu değiştirebilirsiniz.');
      return;
    }
    
    const statusOrder = ['Yapılacak', 'Devam Etmekte', 'Test Edilecek', 'Tamamlandı'];
    const currentIndex = statusOrder.indexOf(task.status);
    if (currentIndex <= 0) return; // İlk durumdaysa geri gitmesin
    const prevStatus = statusOrder[currentIndex - 1];
    
    try {
      // Güncellenmiş taskAPI servisini kullan
      console.log(`Görev durumu geri alınıyor: ProjectID=${project._id}, TaskID=${task._id}, Status=${task.status} -> ${prevStatus}`);
      await taskAPI.updateTaskStatus(project._id, task._id, prevStatus);
      console.log('Görev durumu başarıyla geri alındı');
      await loadProjectData();
    } catch (error) {
      console.error('Görev durumu güncellenirken hata:', error);
      Alert.alert('Hata', 'Görev durumu geri alınamadı. Lütfen tekrar deneyin.');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadProjectData();
            }}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        <Surface style={styles.headerCard}>
          <Text style={styles.projectTitle}>{project.title}</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressLabelContainer}>
              <Text style={styles.progressLabel}>Tamamlanan Görevler</Text>
              <Text style={styles.progressPercentage}>{Math.round(progressPercentage * 100)}%</Text>
            </View>
            <ProgressBar 
              progress={progressPercentage} 
              color={COLORS.primary} 
              style={styles.progressBar} 
            />
          </View>
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
                    member.profileImage ? (
                      <Avatar.Image 
                        {...props} 
                        size={40} 
                        source={{ uri: member.profileImage }} 
                        style={{ marginRight: 8, marginLeft: 8 }}
                      />
                    ) : (
                      <Avatar.Icon 
                        {...props} 
                        size={40} 
                        icon="account" 
                        color={COLORS.white}
                        style={{ backgroundColor: COLORS.primary, marginRight: 8, marginLeft: 8 }}
                      />
                    )
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
                    <Surface
                      key={item._id}
                      style={{ marginBottom: 12, borderRadius: 8, elevation: 2, backgroundColor: COLORS.white }}
                    >
                      <TouchableOpacity onPress={() => {
                        setSelectedTask(item);
                        setShowTaskDetail(true);
                      }}>
                        <View style={{ padding: 12 }}>
                          <Text style={{ fontWeight: 'bold', fontSize: 15 }}>{item.title}</Text>
                          <Text style={{ color: COLORS.textLight, fontSize: 13, marginVertical: 2 }}>{item.description}</Text>
                          <Text style={{ color: COLORS.gray, fontSize: 12 }}>Atanan: {item.assignedTo?.name || 'Bilinmiyor'}</Text>
                          <Text style={{ color: COLORS.gray, fontSize: 12 }}>
                            Tarih: {(() => {
                              const format = (d) => {
                                if (!d || (typeof d === 'string' && d.trim() === '')) return '-';
                                const dateObj = d instanceof Date ? d : new Date(d);
                                return isNaN(dateObj.getTime()) ? '-' : dateObj.toLocaleDateString('tr-TR');
                              };
                              return `${format(item.startDate)} - ${format(item.endDate)}`;
                            })()}
                          </Text>
                           <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            {/* SADECE GÖREV DURUM BUTONLARI */}
                            {(() => {
                              const statusOrder = ['Yapılacak', 'Devam Etmekte', 'Test Edilecek', 'Tamamlandı'];
                              const idx = statusOrder.indexOf(item.status);
                              return (
                                <>
                                  {idx > 0 && idx < statusOrder.length && (
                                    <Button
                                      mode="outlined"
                                      compact
                                      style={{ 
                                        marginHorizontal: 2, 
                                        borderColor: TASK_STATUS_COLORS[item.status] || COLORS.primary,
                                        color: TASK_STATUS_COLORS[item.status] || COLORS.primary
                                      }}
                                      labelStyle={{ color: TASK_STATUS_COLORS[item.status] || COLORS.primary }}
                                      onPress={() => handleBackStatus(item)}
                                    >Önceki Durum</Button>
                                  )}
                                  {idx > -1 && idx < statusOrder.length - 1 && (
                                    <Button
                                      mode="contained"
                                      compact
                                      style={{ 
                                        marginHorizontal: 2, 
                                        backgroundColor: TASK_STATUS_COLORS[item.status] || COLORS.primary
                                      }}
                                      labelStyle={{ color: '#fff' }}
                                      onPress={() => handleAdvanceStatus(item)}
                                    >İlerle</Button>
                                  )}
                                </>
                              );
                            })()}
                          </View>
                        </View>
                      </TouchableOpacity>
                    </Surface>
                  ))
                ) : (
                  <Text style={styles.emptyText}>Henüz görev yok</Text>
                )}
              </View>
            ))}
          </View>
        </Surface>

      </ScrollView>
      {/* Görev Detay Modalı */}
      <TaskModal
        visible={showTaskDetail}
        onClose={() => setShowTaskDetail(false)}
        initialValues={selectedTask || {}}
        teamMembers={project.team || []}
        onSubmit={() => setShowTaskDetail(false)}
        readOnly={true}
      />
    </View>
  );
};


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
  progressContainer: {
    marginVertical: 12,
  },
  progressLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.light,
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
