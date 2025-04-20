import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, FlatList } from 'react-native';
import { Surface, Text, List, Searchbar, Button, ActivityIndicator } from 'react-native-paper';
import { COLORS } from '../constants/theme';
import { authAPI } from '../services/api';

const TeamMemberModal = ({ visible, onClose, onSubmit, currentMembers = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      loadUsers();
    }
  }, [visible]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authAPI.getUsers();
      if (response.data?.length > 0) {
        setUsers(response.data);
      } else {
        setError('Henüz sisteme kayıtlı kullanıcı bulunmuyor.');
      }
    } catch (err) {
      console.error('Kullanıcılar yüklenirken hata:', err);
      setError(err.message || 'Kullanıcılar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    !currentMembers.find(member => member.id === user._id) &&
    (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSubmit = () => {
    if (selectedMember) {
      const selectedUser = users.find(user => user._id === selectedMember);
      if (selectedUser) {
        onSubmit({
          id: selectedUser._id,
          name: selectedUser.name,
          email: selectedUser.email
        });
      }
      setSelectedMember(null);
      setSearchQuery('');
    }
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
          <Text style={styles.modalTitle}>Ekip Üyesi Ekle</Text>

          <Searchbar
            placeholder="Kullanıcı ara..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loading} />
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <Button mode="contained" onPress={loadUsers} style={styles.retryButton}>
                Tekrar Dene
              </Button>
            </View>
          ) : (
            <FlatList
              data={filteredUsers}
              keyExtractor={item => item._id}
              renderItem={({ item }) => (
                <List.Item
                  title={item.name}
                  description={item.email}
                  onPress={() => setSelectedMember(item._id)}
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={selectedMember === item._id ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                      color={selectedMember === item._id ? COLORS.primary : COLORS.gray}
                    />
                  )}
                  style={[
                    styles.listItem,
                    selectedMember === item._id && styles.selectedItem
                  ]}
                />
              )}
              style={styles.list}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  {searchQuery ? 'Kullanıcı bulunamadı' : 'Henüz kullanıcı yok'}
                </Text>
              }
            />
          )}

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              disabled={!selectedMember}
              style={styles.button}
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
  searchBar: {
    marginBottom: 16,
  },
  list: {
    maxHeight: 300,
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedItem: {
    backgroundColor: COLORS.primary + '20',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  loading: {
    marginVertical: 20,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: COLORS.danger,
    marginBottom: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.gray,
    marginTop: 16,
  },
});

export default TeamMemberModal;