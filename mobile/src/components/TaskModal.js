import React, { useState } from 'react';
import { View, StyleSheet, Modal, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Button, Surface, Text, List, IconButton } from 'react-native-paper';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { COLORS } from '../constants/theme';

const TaskModal = ({ visible, onClose, onSubmit, teamMembers = [], initialValues = {}, readOnly = false }) => {
  // Date picker state
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  // Memoize initialValues to prevent unnecessary re-renders
  const memoizedInitialValues = React.useMemo(() => ({
    title: initialValues.title || '',
    description: initialValues.description || '',
    assignedTo: initialValues.assignedTo || null,
    startDate: initialValues.startDate || null,
    endDate: initialValues.endDate || null
  }), [initialValues.title, initialValues.description, initialValues.assignedTo, 
       initialValues.startDate, initialValues.endDate]);
  
  // Form state - initialize once and then only update when needed
  const [formData, setFormData] = useState(memoizedInitialValues);
  
  // Reset form when modal is opened with new initialValues
  React.useEffect(() => {
    if (visible) {
      setFormData(memoizedInitialValues);
    }
  }, [visible, memoizedInitialValues]);

  // Update form field
  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleSubmit = () => {
    onSubmit(formData);
    // Don't reset the form here, let the modal close first
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('tr-TR');
  };

  // Get assigned user name for display
  const getAssignedUserName = () => {
    const { assignedTo } = formData;
    if (!assignedTo) return 'Görev Atanacak Kişi Seç';
    
    // If assignedTo is an object
    if (typeof assignedTo === 'object' && assignedTo !== null) {
      return assignedTo.name || assignedTo.email || assignedTo._id || 'Görev Atanacak Kişi Seç';
    }
    
    // If assignedTo is an ID, find in teamMembers
    const member = teamMembers.find(m => m.id === assignedTo || m._id === assignedTo);
    return member ? member.name : String(assignedTo);
  };

  // Check if form is valid
  const isFormValid = () => {
    const { title, description, assignedTo, startDate, endDate } = formData;
    return title && description && assignedTo && startDate && endDate;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <Surface style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {readOnly ? 'Görev Detayı' : 'Görev Düzenle'}
            </Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {readOnly ? (
              // Read-only view
              <View style={styles.readOnlyContainer}>
                <View style={styles.readOnlySection}>
                  <Text style={styles.readOnlyTitle}>Başlık</Text>
                  <Text style={styles.readOnlyText}>{formData.title}</Text>
                </View>
                
                <View style={styles.readOnlySection}>
                  <Text style={styles.readOnlyTitle}>Açıklama</Text>
                  <Text style={styles.readOnlyText}>{formData.description}</Text>
                </View>
                
                <View style={styles.readOnlySection}>
                  <Text style={styles.readOnlyTitle}>Atanan Kişi</Text>
                  <Text style={styles.readOnlyText}>{getAssignedUserName()}</Text>
                </View>
                
                <View style={styles.readOnlySection}>
                  <Text style={styles.readOnlyTitle}>Başlangıç Tarihi</Text>
                  <Text style={styles.readOnlyText}>{formatDate(formData.startDate)}</Text>
                </View>
                
                <View style={styles.readOnlySection}>
                  <Text style={styles.readOnlyTitle}>Bitiş Tarihi</Text>
                  <Text style={styles.readOnlyText}>{formatDate(formData.endDate)}</Text>
                </View>
                
                <Button
                  mode="contained"
                  onPress={onClose}
                  style={styles.closeButton}
                  labelStyle={styles.closeButtonLabel}
                >
                  Kapat
                </Button>
              </View>
            ) : (
              // Edit view
              <View>
                {/* Title Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Görev Başlığı</Text>
                  <TextInput
                    value={formData.title}
                    onChangeText={(text) => updateField('title', text)}
                    style={styles.textInput}
                    placeholder="Görev başlığını girin"
                  />
                </View>
                
                {/* Description Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Görev Açıklaması</Text>
                  <TextInput
                    value={formData.description}
                    onChangeText={(text) => updateField('description', text)}
                    style={[styles.textInput, styles.textArea]}
                    placeholder="Görev açıklamasını girin"
                    multiline
                    numberOfLines={3}
                  />
                </View>
                
                {/* Team Member Selection */}
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Görevi Atanacak Kişi</Text>
                  <View style={styles.teamMembersList}>
                    {teamMembers.map((member) => (
                      <TouchableOpacity
                        key={member.id || member._id}
                        style={[
                          styles.teamMemberItem,
                          formData.assignedTo === member.id && styles.selectedTeamMember
                        ]}
                        onPress={() => updateField('assignedTo', member.id || member._id)}
                      >
                        <View style={styles.teamMemberContent}>
                          <View style={styles.checkboxContainer}>
                            <View style={[
                              styles.checkbox,
                              formData.assignedTo === (member.id || member._id) && styles.checkboxSelected
                            ]} />
                          </View>
                          <View style={styles.teamMemberInfo}>
                            <Text style={styles.teamMemberName}>{member.name}</Text>
                            {member.email && <Text style={styles.teamMemberEmail}>{member.email}</Text>}
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {/* Date Selection */}
                <View style={styles.dateContainer}>
                  <TouchableOpacity 
                    style={styles.dateButton}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Text style={styles.dateButtonText}>
                      {formData.startDate ? `Başlangıç: ${formatDate(formData.startDate)}` : 'Başlangıç Tarihi Seç'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.dateButton}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Text style={styles.dateButtonText}>
                      {formData.endDate ? `Bitiş: ${formatDate(formData.endDate)}` : 'Bitiş Tarihi Seç'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.submitButton, !isFormValid() && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={!isFormValid()}
                  >
                    <Text style={styles.buttonText}>Ekle</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={onClose}
                  >
                    <Text style={styles.cancelButtonText}>İptal</Text>
                  </TouchableOpacity>
                </View>

                {/* Date Pickers */}
                <DateTimePickerModal
                  isVisible={showStartDatePicker}
                  mode="date"
                  onConfirm={(date) => {
                    updateField('startDate', date);
                    setShowStartDatePicker(false);
                  }}
                  onCancel={() => setShowStartDatePicker(false)}
                />

                <DateTimePickerModal
                  isVisible={showEndDatePicker}
                  mode="date"
                  onConfirm={(date) => {
                    updateField('endDate', date);
                    setShowEndDatePicker(false);
                  }}
                  onCancel={() => setShowEndDatePicker(false)}
                />
              </View>
            )}
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
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    flex: 1,
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    marginTop: 20,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
    width: '80%',
  },
  closeButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Read-only styles
  readOnlyContainer: {
    padding: 8,
  },
  readOnlyTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
  },
  readOnlyDescription: {
    marginBottom: 15,
    color: '#555',
  },
  readOnlyField: {
    marginBottom: 8,
  },
  readOnlyLabel: {
    fontWeight: 'bold',
  },
  // Input styles
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: COLORS.primary,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  // Team member selection styles
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: COLORS.primary,
  },
  teamMembersList: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  teamMemberItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedTeamMember: {
    backgroundColor: COLORS.primary + '15',
  },
  teamMemberContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#aaa',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  teamMemberInfo: {
    flex: 1,
  },
  teamMemberName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  teamMemberEmail: {
    color: '#666',
    fontSize: 14,
  },
  // Date selection styles
  dateContainer: {
    marginBottom: 16,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  dateButtonText: {
    color: '#333',
    textAlign: 'center',
  },
  // Button styles
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#333',
  },
});

export default TaskModal;