import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Text, Button, ActivityIndicator, Avatar, IconButton, Surface, TextInput, Portal, Modal } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { COLORS } from '../constants/theme';

import { authAPI } from '../services/api';

const ProfileScreen = ({ navigation }) => {
  // Çıkış (logout) fonksiyonu
  const handleLogout = async () => {
    try {
      // Tüm local storage temizle
      const { clearAll } = require('../utils/storage').storage;
      await clearAll();
      // API belleğindeki token'ı sıfırla
      if (typeof require('../services/api').setMemoryToken === 'function') {
        require('../services/api').setMemoryToken(null);
      }
      // API logout fonksiyonu çağrılabiliyorsa çağır
      await authAPI.logout && authAPI.logout();
      // Kendi state'lerini de sıfırla (user, token vs.)
      setUser(null);
      setImage(null);
      // Navigation stack'i sıfırla ve Login ekranına yönlendir
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      // Konsola bilgi bırak
      console.log('Kullanıcı çıkış yaptı ve uygulama sıfırlandı');
    } catch (err) {
      console.log('Çıkış sırasında hata:', err);
    }
  };
  const [showImageModal, setShowImageModal] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [image, setImage] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [editRole, setEditRole] = useState('');
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
    if (!user) return; // Kullanıcı verisi yoksa modalı açma
    setEditName(user.name || '');
    setEditImage(image);
    setEditRole(user.role || '');
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
      const payload = { name: editName, profileImage: profileImageToSend, role: editRole };
      await authAPI.updateProfile(payload);
      setUser(prev => ({ ...prev, name: editName, profileImage: profileImageToSend, role: editRole }));
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
    <>
      <LinearGradient
        colors={[COLORS.primary, '#f5f7fa']}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.container, Platform.OS === 'ios' ? { marginTop: 48 } : { marginTop: 24 }]}> 
          <Surface style={styles.profileCard}>
            <View style={styles.avatarModernContainer}>
              <View style={styles.avatarShadow}>
                <TouchableOpacity onPress={() => setShowImageModal(true)} activeOpacity={0.8}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.avatarModern} />
                  ) : (
                    <Avatar.Icon size={120} icon="account" color={COLORS.white} style={{ backgroundColor: COLORS.primary, ...styles.avatarModern }} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.infoModernSection}>
              <View style={styles.infoRow}>
                <IconButton icon="account" size={22} color={COLORS.primary} style={{ marginRight: 8, marginLeft: -8 }} disabled />
                <Text style={styles.profileValue}>{user?.name || '-'}</Text>
                <IconButton icon="pencil" size={20} onPress={openEditModal} style={styles.editIcon} />
              </View>
              <View style={styles.infoRow}>
                <IconButton icon="email-outline" size={20} color={COLORS.primary} style={{ marginRight: 8, marginLeft: -8 }} disabled />
                <Text style={styles.profileValue}>{user?.email || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <IconButton icon="account-tie" size={20} color={COLORS.primary} style={{ marginRight: 8, marginLeft: -8 }} disabled />
                <Text style={styles.profileValue}>{user?.role || '-'}</Text>
              </View>
            </View>
          </Surface>
          <Button mode="contained" style={styles.logoutModernButton} labelStyle={{ fontWeight: 'bold', fontSize: 16 }} onPress={handleLogout}>
            <IconButton icon="logout" size={20} color={COLORS.white} style={{ margin: 0, padding: 0 }} disabled /> Çıkış Yap
          </Button>
        </View>
      </ScrollView>
    </LinearGradient>
    <Portal>
      <Modal visible={showImageModal} onDismiss={() => setShowImageModal(false)} contentContainerStyle={{ justifyContent: 'center', alignItems: 'center', flex: 1, backgroundColor: 'rgba(0,0,0,0.85)' }}>
        <View style={{ alignItems: 'center' }}>
          {image && (
            <Image source={{ uri: image }} style={{ width: 300, height: 300, borderRadius: 12, marginBottom: 24 }} resizeMode="contain" />
          )}
          <Button mode="contained" onPress={() => setShowImageModal(false)} style={{ marginTop: 12 }}>Kapat</Button>
        </View>
      </Modal>
    </Portal>
    <Portal>
      <Modal
        visible={editModalVisible}
        onDismiss={() => setEditModalVisible(false)}
        contentContainerStyle={styles.modalContentModern}
      >
        <Text style={styles.modalTitleModern}>Profili Düzenle</Text>
        <TouchableOpacity onPress={() => pickImage(setEditImage)} style={styles.avatarEditContainerModern}>
          {editImage ? (
            <Image source={{ uri: editImage }} style={styles.avatarEditModern} />
          ) : (
            <Avatar.Icon size={90} icon="account" color={COLORS.white} style={{ backgroundColor: COLORS.primary, ...styles.avatarEditModern }} />
          )}
          <Text style={styles.changePhotoTextModern}>Fotoğrafı Değiştir</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.inputModern}
          value={editName}
          onChangeText={setEditName}
          placeholder="Ad Soyad"
          mode="outlined"
          left={<TextInput.Icon icon="account" />}
        />
        <TextInput
          style={styles.inputModern}
          value={editRole}
          onChangeText={setEditRole}
          placeholder="Rol"
          mode="outlined"
          left={<TextInput.Icon icon="account-tie" />}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
          <Button onPress={() => setEditModalVisible(false)} mode="outlined" style={{ marginRight: 8 }}>İptal</Button>
          <Button onPress={saveProfileEdit} mode="contained" loading={savingEdit} disabled={savingEdit}>Kaydet</Button>
        </View>
      </Modal>
    </Portal>
  </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: 0,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  profileCard: {
    width: '95%',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 32,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  avatarModernContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  avatarShadow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
    borderRadius: 70,
    backgroundColor: COLORS.white,
    padding: 6,
  },
  avatarModern: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  infoModernSection: {
    marginTop: 10,
    width: '100%',
    paddingHorizontal: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#f6f8fb',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.06,
    elevation: 1,
  },
  profileValue: {
    fontSize: 17,
    color: COLORS.text,
    fontWeight: 'bold',
    flex: 1,
  },
  editIcon: {
    marginLeft: 0,
    marginRight: -12,
    marginTop: -2,
  },
  logoutModernButton: {
    marginTop: 8,
    width: '95%',
    borderRadius: 12,
    backgroundColor: COLORS.danger,
    alignSelf: 'center',
    elevation: 4,
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    flexDirection: 'row',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentModern: {
    width: '90%',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 28,
    elevation: 12,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
  },
  modalTitleModern: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 18,
    alignSelf: 'flex-start',
  },
  avatarEditContainerModern: {
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarEditModern: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  changePhotoTextModern: {
    color: COLORS.primary,
    marginTop: 8,
    fontSize: 14,
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
  inputModern: {
    width: '100%',
    backgroundColor: COLORS.white,
    marginBottom: 14,
    borderRadius: 8,
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
