import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, ActivityIndicator, Text, Menu, IconButton } from 'react-native-paper';
import { projectAPI } from '../services/api';
import { COLORS } from '../constants/theme';
import DatePickerModal from '../components/DatePickerModal';
import TaskEditList from '../components/TaskEditList';

const ProjectEditScreen = ({ route, navigation }) => {
  const { projectId } = route.params;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [status, setStatus] = useState('Devam Ediyor');
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setError('');
        const response = await projectAPI.getProjectById(projectId);
        setTitle(response.data.title);
        setDescription(response.data.description);
        setStartDate(response.data.startDate ? new Date(response.data.startDate) : null);
        setEndDate(response.data.endDate ? new Date(response.data.endDate) : null);
        setStatus(response.data.status || 'Devam Ediyor');
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
      setLoading(true);
      setError('');
      await projectAPI.updateProject(projectId, {
        title,
        description,
        startDate,
        endDate,
        status,
        team: team.map(m => m._id || m),
      });
      // Update tasks in backend
      for (const task of tasks) {
        if (task._id) {
          await require('../services/api').taskAPI.updateTask(task._id, task);
        } else {
          await require('../services/api').taskAPI.createTask(projectId, task);
        }
      }
      navigation.goBack(); // Return to the previous screen
    } catch (err) {
      console.error('Proje güncellenirken hata:', err);
      setError('Proje güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
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
    setTasks(prev => [
      ...prev,
      { title: '', description: '', status: 'Yapılacak' }
    ]);
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
      <View style={{flexDirection:'row', alignItems:'center', marginBottom:16}}>
        <Text style={{flex:1}}>Başlangıç Tarihi: {startDate ? startDate.toLocaleDateString('tr-TR') : '-'}</Text>
        <Button mode="outlined" compact onPress={() => { setShowStartPicker(true); setShowEndPicker(false); }}>Tarih Seç</Button>
      </View>
      <View style={{flexDirection:'row', alignItems:'center', marginBottom:16}}>
        <Text style={{flex:1}}>Bitiş Tarihi: {endDate ? endDate.toLocaleDateString('tr-TR') : '-'}</Text>
        <Button mode="outlined" compact onPress={() => { setShowEndPicker(true); setShowStartPicker(false); }}>Tarih Seç</Button>
      </View>
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
      <View style={{marginBottom: 16}}>
        <Text style={{marginBottom: 6, fontWeight: 'bold'}}>Proje Durumu</Text>
        <Menu
          visible={statusMenuVisible}
          onDismiss={() => setStatusMenuVisible(false)}
          anchor={
            <Button mode="outlined" onPress={() => setStatusMenuVisible(true)}>{status || 'Durum Seçin'}</Button>
          }
        >
          <Menu.Item onPress={() => { setStatus('Yapılacak'); setStatusMenuVisible(false); }} title="Yapılacak" />
          <Menu.Item onPress={() => { setStatus('Devam Ediyor'); setStatusMenuVisible(false); }} title="Devam Ediyor" />
          <Menu.Item onPress={() => { setStatus('Test Edilecek'); setStatusMenuVisible(false); }} title="Test Edilecek" />
          <Menu.Item onPress={() => { setStatus('Tamamlandı'); setStatusMenuVisible(false); }} title="Tamamlandı" />
        </Menu>
      </View>
      <TaskEditList
        tasks={tasks}
        onTaskUpdate={handleTaskUpdate}
        onTaskDelete={handleTaskDelete}
        onTaskAdd={handleTaskAdd}
        team={team}
      />
      <Text style={{marginBottom: 8, fontWeight:'bold'}}>Ekip Üyeleri</Text>
      {team.map((member, idx) => (
        <View key={member._id || member} style={{flexDirection:'row',alignItems:'center',marginBottom:4}}>
          <Text style={{flex:1}}>{member.name || member.email || member}</Text>
          <IconButton icon="delete" size={20} color="#d32f2f" onPress={() => {
            setTeam(team.filter((_, i) => i !== idx));
          }} />
        </View>
      ))}
      {/* Ekip üyesi ekleme/çıkarma UI'si eklenebilir */}
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