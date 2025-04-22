import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text, Surface, List, Chip, IconButton } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import TaskModal from '../components/TaskModal';
import TeamMemberModal from '../components/TeamMemberModal';
import { projectAPI, taskAPI } from '../services/api';
import { COLORS } from '../constants/theme';

const validationSchema = Yup.object().shape({
  title: Yup.string()
    .required('Başlık gerekli')
    .min(3, 'Başlık en az 3 karakter olmalı')
    .max(50, 'Başlık en fazla 50 karakter olabilir'),
  description: Yup.string()
    .required('Açıklama gerekli')
    .min(10, 'Açıklama en az 10 karakter olmalı')
    .max(500, 'Açıklama en fazla 500 karakter olabilir'),
  startDate: Yup.date().required('Başlangıç tarihi gerekli'),
  endDate: Yup.date()
    .min(Yup.ref('startDate'), 'Bitiş tarihi başlangıç tarihinden sonra olmalı')
    .required('Bitiş tarihi gerekli'),
  tasks: Yup.array().of(
    Yup.object().shape({
      title: Yup.string().required('Görev başlığı gerekli'),
      description: Yup.string().required('Görev açıklaması gerekli'),
      assignedTo: Yup.string().required('Görev atanacak kişi gerekli'),
      startDate: Yup.date().required('Görev başlangıç tarihi gerekli'),
      endDate: Yup.date()
        .min(Yup.ref('startDate'), 'Görev bitiş tarihi başlangıç tarihinden sonra olmalı')
        .required('Görev bitiş tarihi gerekli'),
    })
  ),
  teamMembers: Yup.array().of(
    Yup.object().shape({
      id: Yup.string().required('Ekip üyesi ID gerekli'),
      name: Yup.string().required('Ekip üyesi adı gerekli'),
    })
  ),
});

const CreateProjectScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTeamMemberModal, setShowTeamMemberModal] = useState(false);

  const initialValues = {
    title: '',
    description: '',
    startDate: null,
    endDate: null,
    teamMembers: [],
    tasks: [],
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setError('');
      // teamMembers'ı backend'in beklediği şekilde team arrayine dönüştür
      const projectPayload = {
        title: values.title,
        description: values.description,
        startDate: values.startDate,
        endDate: values.endDate,
        team: values.teamMembers.map((m) => m.id),
        status: 'Not Started', // veya başka bir varsayılan durum
      };
      // Önce projeyi oluştur
      const response = await projectAPI.createProject(projectPayload);
      const projectId = response.data._id;
      // Görevleri backend'e ayrı ayrı ekle
      for (const task of values.tasks) {
        await taskAPI.createTask(projectId, {
          title: task.title,
          description: task.description,
          assignedTo: task.assignedTo,
          startDate: task.startDate,
          endDate: task.endDate,
          status: 'Yapılacak',
        });
      }
      navigation.goBack();
    } catch (err) {
      console.error('Proje oluşturulurken hata:', err);
      setError(err.response?.data?.message || 'Proje oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };


  const formatDate = useCallback((date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('tr-TR');
  }, []);

  const handleAddTask = useCallback((formikProps) => (taskData) => {
    const currentTasks = formikProps.values.tasks || [];
    formikProps.setFieldValue('tasks', [...currentTasks, taskData]);
    setShowTaskModal(false);
  }, []);

  const handleAddTeamMember = useCallback((formikProps) => (memberData) => {
    const currentMembers = formikProps.values.teamMembers || [];
    if (!currentMembers.some(member => member.id === memberData.id)) {
      formikProps.setFieldValue('teamMembers', [...currentMembers, memberData]);
    }
    setShowTeamMemberModal(false);
  }, []);

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
    >
      <Surface style={styles.surface}>
        <Text style={styles.title}>Yeni Proje</Text>
        
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {(formikProps) => (
            <View style={styles.form}>
              <TextInput
                label="Proje Başlığı"
                value={formikProps.values.title}
                onChangeText={formikProps.handleChange('title')}
                onBlur={formikProps.handleBlur('title')}
                error={formikProps.touched.title && formikProps.errors.title}
                style={styles.input}
                mode="outlined"
              />
              {formikProps.touched.title && formikProps.errors.title && (
                <Text style={styles.errorText}>{formikProps.errors.title}</Text>
              )}

              <TextInput
                label="Proje Açıklaması"
                value={formikProps.values.description}
                onChangeText={formikProps.handleChange('description')}
                onBlur={formikProps.handleBlur('description')}
                error={formikProps.touched.description && formikProps.errors.description}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={4}
              />
              {formikProps.touched.description && formikProps.errors.description && (
                <Text style={styles.errorText}>{formikProps.errors.description}</Text>
              )}

              {/* Tarih seçiciler */}
              <Button
                mode="outlined"
                onPress={() => setShowStartDatePicker(true)}
                style={styles.dateButton}
              >
                {formikProps.values.startDate ? `Başlangıç: ${formatDate(formikProps.values.startDate)}` : 'Başlangıç Tarihi Seç'}
              </Button>

              <Button
                mode="outlined"
                onPress={() => setShowEndDatePicker(true)}
                style={styles.dateButton}
              >
                {formikProps.values.endDate ? `Bitiş: ${formatDate(formikProps.values.endDate)}` : 'Bitiş Tarihi Seç'}
              </Button>

              {/* Ekip üyeleri */}
              <List.Section>
                <List.Subheader>Ekip Üyeleri</List.Subheader>
                <View style={styles.teamMembers}>
                  {formikProps.values.teamMembers.map((member, index) => (
                    <Chip
                      key={member.id}
                      onClose={() => {
                        const newMembers = formikProps.values.teamMembers.filter((m) => m.id !== member.id);
                        formikProps.setFieldValue('teamMembers', newMembers);
                      }}
                      style={styles.chip}
                      avatar={
                        <Text style={styles.avatarText}>
                          {member.name.charAt(0).toUpperCase()}
                        </Text>
                      }
                    >
                      {member.name}
                    </Chip>
                  ))}
                  <IconButton
                    icon="account-plus"
                    onPress={() => setShowTeamMemberModal(true)}
                  />
                </View>
              </List.Section>

              {/* Görevler */}
              <List.Section>
                <List.Subheader>Görevler</List.Subheader>
                {formikProps.values.tasks.map((task, index) => {
                  const assignedMember = formikProps.values.teamMembers.find(m => m.id === task.assignedTo);
                  return (
                    <List.Item
                      key={index}
                      title={task.title}
                      description={`${task.description}\nAtanan: ${assignedMember ? assignedMember.name : 'Atanmamış'}\nBaşlangıç: ${formatDate(task.startDate)}\nBitiş: ${formatDate(task.endDate)}`}
                      right={props => (
                        <IconButton
                          icon="delete"
                          onPress={() => {
                            const newTasks = formikProps.values.tasks.filter((_, i) => i !== index);
                            formikProps.setFieldValue('tasks', newTasks);
                          }}
                        />
                      )}
                      style={styles.taskItem}
                    />
                  );
                })}
                <Button
                  mode="contained"
                  onPress={() => setShowTaskModal(true)}
                  style={styles.addButton}
                  icon="plus"
                >
                  Görev Ekle
                </Button>
              </List.Section>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Button
                mode="contained"
                onPress={formikProps.handleSubmit}
                disabled={!formikProps.isValid || loading}
                loading={loading}
                style={styles.submitButton}
              >
                Proje Oluştur
              </Button>

              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={styles.button}
                disabled={loading}
              >
                İptal
              </Button>

              {/* Tarih seçici modalleri */}
              <DateTimePickerModal
                isVisible={showStartDatePicker}
                mode="date"
                onConfirm={(date) => {
                  formikProps.setFieldValue('startDate', date);
                  setShowStartDatePicker(false);
                }}
                onCancel={() => setShowStartDatePicker(false)}
              />
              <DateTimePickerModal
                isVisible={showEndDatePicker}
                mode="date"
                onConfirm={(date) => {
                  formikProps.setFieldValue('endDate', date);
                  setShowEndDatePicker(false);
                }}
                onCancel={() => setShowEndDatePicker(false)}
              />

              {/* Görev ekleme modalı */}
              <TaskModal
                visible={showTaskModal}
                onClose={() => setShowTaskModal(false)}
                onSubmit={handleAddTask(formikProps)}
                teamMembers={formikProps.values.teamMembers}
              />

              {/* Ekip üyesi ekleme modalı */}
              <TeamMemberModal
                visible={showTeamMemberModal}
                onClose={() => setShowTeamMemberModal(false)}
                onSubmit={handleAddTeamMember(formikProps)}
                currentMembers={formikProps.values.teamMembers}
              />
            </View>
          )}
        </Formik>
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  surface: {
    padding: 16,
    borderRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: COLORS.white,
    marginBottom: 8,
  },
  dateButton: {
    marginVertical: 8,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginBottom: 8,
  },
  teamMembers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 8,
  },
  chip: {
    margin: 4,
  },
  avatarText: {
    fontSize: 14,
    color: COLORS.primary,
  },
  addButton: {
    marginTop: 8,
  },
  submitButton: {
    marginTop: 24,
  },
  button: {
    marginTop: 8,
  },
  taskItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 8,
  },
});

export default CreateProjectScreen;
