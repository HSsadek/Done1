import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Modal, TextInput, ScrollView, FlatList } from 'react-native';
import { Text, Button, ActivityIndicator, Avatar, IconButton, Surface } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { COLORS } from '../constants/theme';

import { authAPI } from '../services/api';
import FollowedUserCard from '../components/FollowedUserCard';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [image, setImage] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [followedUsers, setFollowedUsers] = useState([]);
  const [loadingFollowed, setLoadingFollowed] = useState(false);
  const [errorFollowed, setErrorFollowed] = useState('');

  // Fetch user info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError('');
        // Her zaman API'dan güncel kullanıcı verisini çek
        const response = await authAPI.getProfile();
        setUser(response.data);
        setImage(response.data.profileImage && response.data.profileImage.trim() !== '' ? response.data.profileImage : null);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          setError('Yetkisiz erişim. Lütfen tekrar giriş yapın.');
        } else {
          setError('Profil bilgileri yüklenemedi');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Fetch followed users
  useEffect(() => {
    const fetchFollowed = async () => {
      if (!user || !user.following) return;
      setLoadingFollowed(true);
      setErrorFollowed('');
      try {
        // Get all users and filter by user.following ids
        const response = await authAPI.getUsers();
        const allUsers = response.data;
        const followed = allUsers.filter(u => user.following.includes(u._id));
        setFollowedUsers(followed);
      } catch (err) {
        setErrorFollowed('Takip edilen kullanıcılar yüklenemedi');
      } finally {
        setLoadingFollowed(false);
      }
    };
    if (user && user.following) fetchFollowed();
  }, [user]);

  const pickImage = async (setTargetImage) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setTargetImage(result.assets[0].uri);
      // TODO: Backend'e profil fotoğrafı gönderme işlemi burada yapılabilir
    }
  };

  const openEditModal = () => {
    setEditName(user?.name || '');
    setEditImage(image);
    setEditModalVisible(true);
  };

  const saveProfileEdit = async () => {
    setSavingEdit(true);
    try {
      let profileImageToSend = editImage;
      // Eğer local bir dosya ise ve base64 değilse, base64'e çevir
      if (editImage && editImage.startsWith('file://')) {
        const base64 = await FileSystem.readAsStringAsync(editImage, { encoding: FileSystem.EncodingType.Base64 });
        profileImageToSend = `data:image/jpeg;base64,${base64}`;
      }
      // Backend'e profil güncelleme isteği gönder
      const payload = { name: editName, profileImage: profileImageToSend };
      await authAPI.updateProfile(payload);
      setUser(prev => ({ ...prev, name: editName, profileImage: profileImageToSend }));
      setImage(profileImageToSend);

      setEditModalVisible(false);
      // Başarı mesajı göstermek için kısa süreli bir feedback ekleyebilirsiniz
    } catch (err) {
      alert('Profil güncellenirken bir hata oluştu.');
    } finally {
      setSavingEdit(false);
    }
  };



  const handleFollowedUserPress = (user) => {
    navigation.push('Profile', { userId: user._id });
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
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }} contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => pickImage(setImage)} style={styles.avatarContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.avatar} />
          ) : (
            <Avatar.Icon size={100} icon="account" color={COLORS.white} style={{ backgroundColor: COLORS.primary }} />
          )}
          <Text style={styles.changePhotoText}>Profil Fotoğrafı Değiştir</Text>
        </TouchableOpacity>
        <Surface style={styles.infoContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.label}>Ad Soyad</Text>
            <IconButton icon="pencil" size={20} onPress={openEditModal} />
          </View>
          <Text style={styles.value}>{user?.name || '-'}</Text>
          <Text style={styles.label}>E-posta</Text>
          <Text style={styles.value}>{user?.email || '-'}</Text>
          <Text style={styles.label}>Rol</Text>
          <Text style={styles.value}>{user?.role || '-'}</Text>
        </Surface>

        {/* Followed Users Section */}
        <Surface style={styles.followedContainer}>
          <Text style={styles.sectionTitle}>Takip Ettiklerim</Text>
          {loadingFollowed ? (
            <ActivityIndicator size={28} color={COLORS.primary} style={{ marginVertical: 12 }} />
          ) : errorFollowed ? (
            <Text style={styles.errorText}>{errorFollowed}</Text>
          ) : followedUsers.length === 0 ? (
            <Text style={styles.emptyText}>Henüz kimseyi takip etmiyorsunuz.</Text>
          ) : (
            <FlatList
              data={followedUsers}
              keyExtractor={item => item._id}
              renderItem={({ item }) => (
                <FollowedUserCard user={item} onPress={handleFollowedUserPress} />
              )}
              contentContainerStyle={{ paddingVertical: 4 }}
            />
          )}
        </Surface>

        <Button mode="contained" style={styles.logoutButton} onPress={async () => {
          await authAPI.logout();
          navigation.replace('Login');
        }}>
          Çıkış Yap
        </Button>
      </View>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Surface style={styles.modalContent}>
            <Text style={styles.modalTitle}>Profili Düzenle</Text>
            <TouchableOpacity onPress={() => pickImage(setEditImage)} style={styles.avatarEditContainer}>
              {editImage ? (
                <Image source={{ uri: editImage }} style={styles.avatarEdit} />
              ) : (
                <Avatar.Icon size={80} icon="account" color={COLORS.white} style={{ backgroundColor: COLORS.primary }} />
              )}
              <Text style={styles.changePhotoText}>Fotoğrafı Değiştir</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Ad Soyad"
              mode="outlined"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <Button onPress={() => setEditModalVisible(false)} mode="outlined" style={{ marginRight: 8 }}>İptal</Button>
              <Button onPress={saveProfileEdit} mode="contained" loading={savingEdit} disabled={savingEdit}>Kaydet</Button>
            </View>
          </Surface>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    paddingBottom: 32,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    padding: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
  },
  changePhotoText: {
    color: COLORS.primary,
    marginTop: 8,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  infoContainer: {
    width: '100%',
    marginBottom: 32,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
  },
  label: {
    color: COLORS.gray,
    fontSize: 13,
    marginTop: 10,
  },
  value: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: 'bold',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    marginBottom: 8,
  },
  logoutButton: {
    marginTop: 32,
    width: '100%',
    borderRadius: 8,
    backgroundColor: COLORS.danger,
  },
  followedContainer: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 28,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  emptyText: {
    color: COLORS.gray,
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 24,
    elevation: 8,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 18,
  },
  avatarEditContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarEdit: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.white,
    marginBottom: 10,
  },
});

export default ProfileScreen;
