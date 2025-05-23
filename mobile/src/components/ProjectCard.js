import React from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Surface, Text, Chip, Avatar, IconButton } from 'react-native-paper';
import { COLORS } from '../constants/theme';

const ProjectCard = ({ project, onPress, onDelete }) => {
  const { 
    title, 
    description, 
    team = [],
    status = 'Devam Ediyor',
    tasks = [] 
  } = project;

  const MAX_MEMBERS_SHOWN = 3;

  const handleDelete = (event) => {
    if (event) {
      event.stopPropagation();
    }
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
          onPress: () => onDelete(project._id),
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Surface style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        </View>

        <Text style={styles.description} numberOfLines={2}>{description}</Text>
        
        <View style={styles.teamSection}>
          <View style={styles.avatarStack}>
            {team.slice(0, MAX_MEMBERS_SHOWN).map((member, index) => (
              <Avatar.Text
                key={member._id}
                label={member.name.charAt(0).toUpperCase()}
                size={24}
                style={[
                  styles.avatar,
                  { marginLeft: index > 0 ? -10 : 0 }
                ]}
                color={COLORS.white}
                backgroundColor={COLORS.primary}
              />
            ))}
            {team.length > MAX_MEMBERS_SHOWN && (
              <Avatar.Text
                label={`+${team.length - MAX_MEMBERS_SHOWN}`}
                size={24}
                style={[styles.avatar, { marginLeft: -10 }]}
                color={COLORS.white}
                backgroundColor={COLORS.gray}
              />
            )}
          </View>
          <Text style={styles.memberCount}>
            {team.length} Üye
          </Text>
        </View>

        <View style={styles.footer}>
          <Chip 
            mode="outlined" 
            style={styles.taskCount}
            textStyle={styles.taskCountText}
            icon="checkbox-marked"
          >
            {tasks.length} Görev
          </Chip>
        </View>

        <IconButton
          icon="delete"
          iconColor={COLORS.danger}
          size={20}
          onPress={handleDelete}
          style={styles.deleteButton}
        />
      </Surface>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  description: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 16,
  },
  teamSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarStack: {
    flexDirection: 'row',
    marginRight: 8,
  },
  avatar: {
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  memberCount: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    margin: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  statusChip: {
    height: 24,
    minWidth: 90,
    justifyContent: 'center',
  },
  statusText: {
    color: COLORS.white,
    fontSize: 12,
    textAlign: 'center',
  },
  taskCount: {
    backgroundColor: COLORS.light,
  },
  taskCountText: {
    color: COLORS.gray,
    fontSize: 12,
  },
});

export default ProjectCard;
