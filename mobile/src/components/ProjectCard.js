import React from 'react';
import { StyleSheet } from 'react-native';
import { Surface, Text, Chip } from 'react-native-paper';
import { COLORS } from '../constants/theme';

const ProjectCard = ({ project, onPress }) => {
  const { title, description, taskCount = 0, status } = project;

  return (
    <Surface style={styles.card} onTouchEnd={onPress}>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <Text style={styles.description} numberOfLines={2}>{description}</Text>
      
      <Chip 
        mode="outlined" 
        style={styles.taskCount}
        textStyle={styles.taskCountText}
      >
        {taskCount} Görev
      </Chip>
      
      {status && (
        <Chip 
          mode="flat"
          style={[styles.status, { backgroundColor: COLORS.primary }]}
          textStyle={styles.statusText}
        >
          {status}
        </Chip>
      )}
    </Surface>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 16,
  },
  taskCount: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.light,
    marginBottom: 8,
  },
  taskCountText: {
    color: COLORS.gray,
    fontSize: 12,
  },
  status: {
    alignSelf: 'flex-start',
  },
  statusText: {
    color: COLORS.white,
    fontSize: 12,
  },
});

export default ProjectCard;
