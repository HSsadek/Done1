import React, { useState } from 'react';
import { View, StyleSheet, Modal, ScrollView } from 'react-native';
import { TextInput, Button, Surface, Text, List } from 'react-native-paper';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { COLORS } from '../constants/theme';

const TaskModal = ({ visible, onClose, onSubmit, teamMembers = [], initialValues = {} }) => {
  const [title, setTitle] = useState(initialValues.title || '');
  const [description, setDescription] = useState(initialValues.description || '');
  const [assignedTo, setAssignedTo] = useState(initialValues.assignedTo || null);
  const [startDate, setStartDate] = useState(initialValues.startDate || null);
  const [endDate, setEndDate] = useState(initialValues.endDate || null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handleSubmit = () => {
    onSubmit({
      title,
      description,
      assignedTo,
      startDate,
      endDate,
    });
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAssignedTo(null);
    setStartDate(null);
    setEndDate(null);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('tr-TR');
  };

  const getAssignedUserName = () => {
    if (!assignedTo) return 'Görev Atanacak Kişi Seç';
    const member = teamMembers.find(m => m.id === assignedTo);
    return member ? member.name : 'Görev Atanacak Kişi Seç';
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <Surface style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>Görev Ekle</Text>

            <TextInput
              label="Görev Başlığı"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Görev Açıklaması"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            {/* Ekip üyesi seçimi */}
            <List.Section style={styles.memberSection}>
              <List.Subheader>Görevi Atanacak Kişi</List.Subheader>
              {teamMembers.map((member) => (
                <List.Item
                  key={member.id}
                  title={member.name}
                  description={member.email}
                  onPress={() => setAssignedTo(member.id)}
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={assignedTo === member.id ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                      color={assignedTo === member.id ? COLORS.primary : COLORS.gray}
                    />
                  )}
                  style={[
                    styles.memberItem,
                    assignedTo === member.id && styles.selectedMemberItem
                  ]}
                />
              ))}
            </List.Section>

            <Button
              mode="outlined"
              onPress={() => setShowStartDatePicker(true)}
              style={styles.dateButton}
            >
              {startDate ? `Başlangıç: ${formatDate(startDate)}` : 'Başlangıç Tarihi Seç'}
            </Button>

            <Button
              mode="outlined"
              onPress={() => setShowEndDatePicker(true)}
              style={styles.dateButton}
            >
              {endDate ? `Bitiş: ${formatDate(endDate)}` : 'Bitiş Tarihi Seç'}
            </Button>

            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.button}
                disabled={!title || !description || !assignedTo || !startDate || !endDate}
              >
                Ekle
              </Button>
              <Button
                mode="outlined"
                onPress={onClose}
                style={styles.button}
              >
                İptal
              </Button>
            </View>

            <DateTimePickerModal
              isVisible={showStartDatePicker}
              mode="date"
              onConfirm={(date) => {
                setStartDate(date);
                setShowStartDatePicker(false);
              }}
              onCancel={() => setShowStartDatePicker(false)}
            />

            <DateTimePickerModal
              isVisible={showEndDatePicker}
              mode="date"
              onConfirm={(date) => {
                setEndDate(date);
                setShowEndDatePicker(false);
              }}
              onCancel={() => setShowEndDatePicker(false)}
            />
          </ScrollView>
        </Surface>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  modalContent: {
    padding: 16,
    borderRadius: 8,
    elevation: 4,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
    backgroundColor: COLORS.white,
  },
  memberSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  memberItem: {
    borderRadius: 8,
    marginVertical: 4,
  },
  selectedMemberItem: {
    backgroundColor: COLORS.primary + '20',
  },
  dateButton: {
    marginVertical: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default TaskModal;