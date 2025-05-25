import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, ActivityIndicator, Text, Surface, IconButton, Divider, Avatar, Chip } from 'react-native-paper';
import { projectAPI } from '../services/api';
import { COLORS } from '../constants/theme';
import DatePickerModal from '../components/DatePickerModal';
import TaskEditList from '../components/TaskEditList';
import TeamMemberModal from '../components/TeamMemberModal';
import TaskModalNew from '../components/TaskModalNew';

const ProjectEditScreen = ({ route, navigation }) => {
  const { projectId } = route.params;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [showTeamMemberModal, setShowTeamMemberModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setError('');
        const response = await projectAPI.getProjectById(projectId);
        setTitle(response.data.title);
        setDescription(response.data.description);
        setStartDate(response.data.startDate ? new Date(response.data.startDate) : null);
        setEndDate(response.data.endDate ? new Date(response.data.endDate) : null);
        setTeam(response.data.team || []);
        // Fetch tasks
        const taskRes = await require('../services/api').taskAPI.getProjectTasks(projectId);
        setTasks(taskRes.data || []);
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
      setSaving(true);
      setError('');
      
      // Validasyon kontrolleri
      if (!title.trim()) {
        Alert.alert('Hata', 'Proje başlığı boş olamaz');
        setSaving(false);
        return;
      }
      
      // Kullanıcı token'ını kontrol et
      const storage = require('../utils/storage').storage;
      const token = await storage.getToken();
      
      if (!token) {
        Alert.alert('Hata', 'Oturum süresi dolmuş olabilir. Lütfen tekrar giriş yapın.');
        setSaving(false);
        return;
      }
      
      // Token'i API servisine ayarla
      require('../services/api').setMemoryToken(token);
      
      // Proje bilgilerini güncelle
      const projectData = {
        title,
        description,
        startDate,
        endDate,
        team: team.map(m => m._id || m),
      };
      
      console.log('Güncellenecek proje verileri:', projectData);
      
      await projectAPI.updateProject(projectId, projectData);
      
      // Görevleri güncelle
      try {
        for (const task of tasks) {
          // Görev verilerini hazırla - assignedTo alanını çıkar
          const { assignedTo, ...taskData } = task;
          
          console.log('Güncellenecek görev verileri:', {
            title: taskData.title,
            description: taskData.description,
            startDate: taskData.startDate,
            endDate: taskData.endDate,
            status: taskData.status
          });
          
          if (task._id) {
            // Güncellenmiş API fonksiyonunu kullan - projectId parametresi eklendi
            // assignedTo alanını göndermiyoruz
            await require('../services/api').taskAPI.updateTask(projectId, task._id, taskData);
            console.log(`Görev güncellendi: ${task._id}`);
          } else {
            // Yeni görev oluşturma - assignedTo alanını ekleyebiliriz
            // Çünkü backend bunu kontrol edecek
            await require('../services/api').taskAPI.createTask(projectId, {
              ...taskData,
              assignedTo: assignedTo
            });
            console.log('Yeni görev oluşturuldu');
          }
        }
      } catch (err) {
        console.error('Görev güncelleme hatası:', err);
        throw err;
      }
      
      Alert.alert('Başarılı', 'Proje başarıyla güncellendi', [
        { text: 'Tamam', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.error('Proje güncellenirken hata:', err);
      
      if (err.response && err.response.status === 401) {
        setError('Bu projeyi güncelleme yetkiniz yok');
        Alert.alert('Yetki Hatası', 'Bu projeyi güncelleme yetkiniz yok. Lütfen tekrar giriş yapın.');
      } else {
        setError('Proje güncellenirken bir hata oluştu');
        Alert.alert('Hata', 'Proje güncellenirken bir hata oluştu');
      }
    } finally {
      setSaving(false);
    }
  };

  // Task edit handlers
  const handleTaskUpdate = (idx, updatedTask) => {
    setTasks(prev => prev.map((t, i) => i === idx ? updatedTask : t));
  };
  const handleTaskDelete = (idx) => {
    const taskToDelete = tasks[idx];
    if (taskToDelete._id) {
      require('../services/api').taskAPI.deleteTask(taskToDelete._id);
    }
    setTasks(prev => prev.filter((_, i) => i !== idx));
  };
  const handleTaskAdd = () => {
    // Görev ekleme modalını göster
    setShowTaskModal(true);
  };
  
  const handleTaskSubmit = (newTask) => {
    // Modal'dan gelen yeni görevi tasks listesine ekle
    setTasks(prev => [
      ...prev,
      { 
        ...newTask,
        status: 'Yapılacak'
      }
    ]);
    setShowTaskModal(false);
  };
  
  const handleAddTeamMember = (newMember) => {
    // Ekip üyesi zaten eklenmiş mi kontrol et
    if (team.some(m => (m._id || m) === newMember.id)) {
      Alert.alert('Uyarı', 'Bu ekip üyesi zaten eklenmiş');
      return;
    }
    
    setTeam([...team, {
      _id: newMember.id,
      name: newMember.name,
      email: newMember.email
    }]);
    setShowTeamMemberModal(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size={40} color={COLORS.primary} />
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
      <Surface style={styles.headerCard}>
        <Text style={styles.sectionTitle}>Proje Bilgileri</Text>
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
          numberOfLines={4}
        />
        
        <Text style={styles.subsectionTitle}>Proje Tarihleri</Text>
        <View style={styles.dateContainer}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Başlangıç Tarihi</Text>
            <Chip 
              icon="calendar" 
              onPress={() => { setShowStartPicker(true); setShowEndPicker(false); }}
              style={styles.dateChip}
            >
              {startDate ? startDate.toLocaleDateString('tr-TR') : 'Tarih seç'}
            </Chip>
          </View>
          
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Bitiş Tarihi</Text>
            <Chip 
              icon="calendar" 
              onPress={() => { setShowEndPicker(true); setShowStartPicker(false); }}
              style={styles.dateChip}
            >
              {endDate ? endDate.toLocaleDateString('tr-TR') : 'Tarih seç'}
            </Chip>
          </View>
        </View>
      </Surface>
      
      <DatePickerModal
        visible={showStartPicker}
        date={startDate || new Date()}
        onConfirm={date => { setShowStartPicker(false); setStartDate(date); }}
        onCancel={() => setShowStartPicker(false)}
      />
      <DatePickerModal
        visible={showEndPicker}
        date={endDate || new Date()}
        onConfirm={date => { setShowEndPicker(false); setEndDate(date); }}
        onCancel={() => setShowEndPicker(false)}
      />

      <Surface style={styles.teamCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ekip Üyeleri</Text>
          <Button 
            mode="contained" 
            icon="account-plus" 
            onPress={() => setShowTeamMemberModal(true)}
            style={styles.addButton}
          >
            Ekle
          </Button>
        </View>
        
        {team.length === 0 ? (
          <Text style={styles.emptyText}>Henüz ekip üyesi eklenmemiş</Text>
        ) : (
          <View style={styles.teamList}>
            {team.map((member, idx) => (
              <Chip
                key={member._id || member}
                style={styles.teamMemberChip}
                avatar={<Avatar.Text size={24} label={member.name ? member.name.charAt(0).toUpperCase() : 'U'} />}
                onClose={() => setTeam(team.filter((_, i) => i !== idx))}
              >
                {member.name || member.email || member}
              </Chip>
            ))}
          </View>
        )}
      </Surface>
      
      <Surface style={styles.tasksCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Görevler</Text>
          <Button 
            mode="contained" 
            icon="plus" 
            onPress={handleTaskAdd}
            style={styles.addButton}
          >
            Görev Ekle
          </Button>
        </View>
        <TaskEditList
          tasks={tasks}
          onTaskUpdate={handleTaskUpdate}
          onTaskDelete={handleTaskDelete}
          team={team}
        />
      </Surface>
      
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveButton}
          loading={saving}
          icon="content-save"
        >
          Kaydet
        </Button>
        
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
          disabled={saving}
        >
          İptal
        </Button>
      </View>
      
      <TeamMemberModal
        visible={showTeamMemberModal}
        onClose={() => setShowTeamMemberModal(false)}
        onSubmit={handleAddTeamMember}
        currentMembers={team.map(m => ({ id: m._id || m, name: m.name, email: m.email }))}
      />
      
      <TaskModalNew
        visible={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSubmit={handleTaskSubmit}
        teamMembers={team.map(m => ({ id: m._id || m, name: m.name || m.email || m, email: m.email || '' }))}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: COLORS.background,
    gap: 16,
  },
  headerCard: {
    padding: 16,
    borderRadius: 8,
    elevation: 4,
  },
  teamCard: {
    padding: 16,
    borderRadius: 8,
    elevation: 4,
  },
  tasksCard: {
    padding: 16,
    borderRadius: 8,
    elevation: 4,
  },
  input: {
    marginBottom: 16,
    backgroundColor: COLORS.white,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  dateChip: {
    backgroundColor: COLORS.lightBackground,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    height: 36,
    justifyContent: 'center',
  },
  teamList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  teamMemberChip: {
    marginBottom: 8,
    backgroundColor: COLORS.lightBackground,
  },
  emptyText: {
    color: COLORS.gray,
    textAlign: 'center',
    marginVertical: 16,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  saveButton: {
    flex: 2,
    marginRight: 8,
    backgroundColor: COLORS.primary,
  },
  cancelButton: {
    flex: 1,
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