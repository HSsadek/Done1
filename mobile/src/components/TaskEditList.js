import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton, Button } from 'react-native-paper';
import TaskModalNew from './TaskModalNew';

const TaskEditList = ({ tasks, onTaskUpdate, onTaskDelete, onTaskAdd, team = [] }) => {
  const [editIdx, setEditIdx] = React.useState(null);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [currentTask, setCurrentTask] = React.useState({});

  const openEdit = (idx) => {
    const task = tasks[idx];
    console.log('DEBUG task:', task);
    console.log('DEBUG team:', team);
    setEditIdx(idx);
    
    // Prepare task data for the modal
    const taskData = {
      title: task.title || '',
      description: task.description || '',
      startDate: task.startDate ? new Date(task.startDate) : null,
      endDate: task.endDate ? new Date(task.endDate) : null
    };
    
    // Handle assignedTo which might be an object or string
    if (task.assignedTo) {
      if (typeof task.assignedTo === 'object') {
        taskData.assignedTo = task.assignedTo._id || task.assignedTo.id;
      } else {
        taskData.assignedTo = task.assignedTo;
      }
    }
    
    setCurrentTask(taskData);
    setShowEditModal(true);
  };

  const handleTaskUpdate = (updatedTask) => {
    if (editIdx !== null) {
      onTaskUpdate(editIdx, {
        ...tasks[editIdx],
        ...updatedTask
      });
    }
    setShowEditModal(false);
    setEditIdx(null);
  };

  return (
    <View style={{marginBottom:16}}>
      <Text style={{fontWeight:'bold', marginBottom:8}}>Görevler</Text>
      {tasks.map((task, idx) => {
        const assigned = team?.find(m => (m._id || m) === task.assignedTo);
        return (
          <View key={task._id || idx} style={styles.taskRow}>
            <View style={{flex:1}}>
              <Text style={{fontWeight:'bold'}}>{task.title}</Text>
              <Text style={{fontSize:12, color:'#666'}}>
                {(() => {
                  if (assigned) return `Atanan: ${assigned.name || assigned.email}`;
                  if (task.assignedTo && typeof task.assignedTo === 'object') {
                    return `Atanan: ${task.assignedTo.name || task.assignedTo.email || task.assignedTo._id || '-'}`;
                  }
                  if (task.assignedTo) return `Atanan: ${task.assignedTo}`;
                  return 'Atanan: -';
                })()}
              </Text>
              <Text style={{fontSize:12, color:'#666'}}>
                Başlangıç: {(() => {
                  if (!task.startDate || typeof task.startDate !== 'string' && !task.startDate) return '-';
                  if (typeof task.startDate === 'string' && task.startDate.trim() === '') return '-';
                  const dateObj = task.startDate instanceof Date ? task.startDate : new Date(task.startDate);
                  return isNaN(dateObj.getTime()) ? '-' : dateObj.toLocaleDateString('tr-TR');
                })()} | Bitiş: {(() => {
                  if (!task.endDate || typeof task.endDate !== 'string' && !task.endDate) return '-';
                  if (typeof task.endDate === 'string' && task.endDate.trim() === '') return '-';
                  const dateObj = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
                  return isNaN(dateObj.getTime()) ? '-' : dateObj.toLocaleDateString('tr-TR');
                })()}
              </Text>
            </View>
            <IconButton icon="pencil" size={20} onPress={() => openEdit(idx)} />
            <IconButton icon="delete" size={20} onPress={() => onTaskDelete(idx)} />
          </View>
        );
      })}
      {tasks.length === 0 && (
        <Text style={{textAlign:'center', fontStyle:'italic', color:'#888', marginTop:16}}>
          Henüz görev eklenmemiş
        </Text>
      )}
      {onTaskAdd && (
        <Button 
          mode="outlined" 
          icon="plus" 
          onPress={onTaskAdd}
          style={{marginTop:8}}
        >
          Görev Ekle
        </Button>
      )}
      <TaskModalNew
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleTaskUpdate}
        teamMembers={team.map(m => ({ 
          id: m._id || m, 
          name: m.name || m.email || m, 
          email: m.email || '' 
        }))}
        initialValues={currentTask}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: '#f7f7f7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});

export default TaskEditList;
