import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Avatar, Text, Surface } from 'react-native-paper';
import { COLORS } from '../constants/theme';

const FollowedUserCard = ({ user, onPress }) => {
  return (
    <TouchableOpacity onPress={() => onPress(user)}>
      <Surface style={styles.card}>
        <View style={styles.row}>
          {user.profileImage ? (
            <Avatar.Image size={48} source={{ uri: user.profileImage }} />
          ) : (
            <Avatar.Icon size={48} icon="account" color={COLORS.white} style={{ backgroundColor: COLORS.primary }} />
          )}
          <View style={styles.info}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    marginHorizontal: 2,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    elevation: 2,
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    marginLeft: 14,
    justifyContent: 'center',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    color: COLORS.text,
  },
  email: {
    color: COLORS.gray,
    fontSize: 13,
    marginTop: 2,
  },
});

export default FollowedUserCard;
