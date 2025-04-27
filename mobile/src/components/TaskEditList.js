import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton, Button, TextInput, Dialog, Portal } from 'react-native-paper';
import DatePickerModal from './DatePickerModal';

const TaskEditList = ({ tasks, onTaskUpdate, onTaskDelete, onTaskAdd, team = [] }) => {
  const [editIdx, setEditIdx] = React.useState(null);
  const [editTitle, setEditTitle] = React.useState('');
  const [editDesc, setEditDesc] = React.useState('');
  const [showDialog, setShowDialog] = React.useState(false);
  const [editAssignedTo, setEditAssignedTo] = React.useState('');
  const [assignedMenuVisible, setAssignedMenuVisible] = React.useState(false);
  const [editStartDate, setEditStartDate] = React.useState(null);
  const [editEndDate, setEditEndDate] = React.useState(null);
  const [showStartPicker, setShowStartPicker] = React.useState(false);
  const [showEndPicker, setShowEndPicker] = React.useState(false);

  const openEdit = (idx) => {
    const t = tasks[idx];
    console.log('DEBUG task:', t);
    console.log('DEBUG team:', team);
    setEditIdx(idx);
    setEditTitle(t.title || '');
    setEditDesc(t.description || '');
    // assignedTo might be an object or string
    let assignedToValue = '';
    if (t.assignedTo) {
      if (typeof t.assignedTo === 'object') {
        assignedToValue = t.assignedTo._id || t.assignedTo.email || t.assignedTo.name || '';
      } else {
        assignedToValue = t.assignedTo;
      }
    }
    setEditAssignedTo(assignedToValue);
    setEditStartDate(t.startDate ? new Date(t.startDate) : null);
    setEditEndDate(t.endDate ? new Date(t.endDate) : null);
    setShowDialog(true);
  };



  const handleSave = () => {
    if (editIdx !== null) {
      onTaskUpdate(editIdx, {
        ...tasks[editIdx],
        title: editTitle,
        description: editDesc,
        assignedTo: editAssignedTo,
        startDate: editStartDate,
        endDate: editEndDate,
      });
    }
    setShowDialog(false);
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
      <Button icon="plus" mode="outlined" onPress={onTaskAdd} style={{marginTop:6}}>Görev Ekle</Button>

      <Portal>
        <Dialog visible={showDialog} onDismiss={()=>setShowDialog(false)}>
          <Dialog.Title>Görev Düzenle</Dialog.Title>
          <Dialog.Content>
            <View style={{backgroundColor:'#f3f4f6', borderRadius:12, padding:10, marginBottom:8}}>
              <Text style={{fontWeight:'bold', fontSize:16, marginBottom:6}}>Görev Bilgileri</Text>
              <TextInput label="Başlık" value={editTitle} onChangeText={setEditTitle} style={{marginBottom:10, backgroundColor:'#fff'}} mode="outlined" />
              <TextInput label="Açıklama" value={editDesc} onChangeText={setEditDesc} multiline style={{marginBottom:10, backgroundColor:'#fff'}} mode="outlined" />
            </View>
            <View style={{height:1, backgroundColor:'#ddd', marginVertical:8}} />
            <View style={{backgroundColor:'#f3f4f6', borderRadius:12, padding:10, marginBottom:8}}>
              <Text style={{fontWeight:'bold', fontSize:15, marginBottom:6}}>Atama</Text>
              <Button mode="outlined" onPress={()=>setAssignedMenuVisible(true)} style={{marginBottom:0, backgroundColor:'#fff', borderRadius:8, borderColor:'#bbb', borderWidth:1}} labelStyle={{color:'#333', textAlign:'left'}} contentStyle={{justifyContent:'flex-start'}}>
                {(() => {
                  const found = team.find(m => (m._id || m) === editAssignedTo);
                  if (found) return found.name || found.email;
                  const t = editIdx !== null ? tasks[editIdx] : null;
                  if (t && t.assignedTo && typeof t.assignedTo === 'object') {
                    return t.assignedTo.name || t.assignedTo.email || t.assignedTo._id || 'Seçiniz';
                  }
                  return editAssignedTo || 'Seçiniz';
                })()}
              </Button>
              <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:2}}>
                <Text style={{fontSize:11, color:'#888', fontStyle:'italic'}}>Seçili: {
                  (() => {
                    const found = team.find(m => (m._id || m) === editAssignedTo);
                    if (found) return found.name || found.email || '-';
                    if (typeof editAssignedTo === 'string') return editAssignedTo;
                    return '-';
                  })()
                }</Text>
                <Text style={{fontSize:11, color:'#b0b', fontStyle:'italic'}}>Önceki: {
                  (() => {
                    if (editIdx !== null) {
                      const t = tasks[editIdx];
                      if (t.assignedTo && typeof t.assignedTo === 'object') {
                        return t.assignedTo.name || t.assignedTo.email || t.assignedTo._id || '-';
                      }
                      const found = team.find(m => (m._id || m) === t.assignedTo);
                      if (found) return found.name || found.email || '-';
                      if (typeof t.assignedTo === 'string') return t.assignedTo;
                    }
                    return '-';
                  })()
                }</Text>
              </View>
              <Portal>
                <Dialog visible={assignedMenuVisible} onDismiss={()=>setAssignedMenuVisible(false)}>
                  <Dialog.Title>Kişi Seç</Dialog.Title>
                  <Dialog.Content>
                    {team.length === 0 && <Text>Hiç ekip üyesi yok</Text>}
                    {team.map(m => (
                      <Button key={m._id || m} onPress={()=>{
                        setEditAssignedTo(m._id || m);
                        setAssignedMenuVisible(false);
                      }} style={{marginBottom:4}}>{m.name || m.email || m}</Button>
                    ))}
                  </Dialog.Content>
                </Dialog>
              </Portal>
            </View>
            <View style={{height:1, backgroundColor:'#ddd', marginVertical:8}} />
            <View style={{backgroundColor:'#f3f4f6', borderRadius:12, padding:10, marginBottom:8}}>
              <Text style={{fontWeight:'bold', fontSize:15, marginBottom:6}}>Tarihler</Text>
              <View style={{flexDirection:'row', alignItems:'center', marginBottom:0}}>
                <Text style={{flex:1}}>Başlangıç Tarihi:</Text>
                <Button compact mode="outlined" onPress={()=>setShowStartPicker(true)} style={{backgroundColor:'#fff', borderRadius:8, borderColor:'#bbb', borderWidth:1}} labelStyle={{color:'#333'}}>
                  {editStartDate ? editStartDate.toLocaleDateString('tr-TR') : 'Tarih Seç'}
                </Button>
              </View>
              <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:2, marginBottom:4}}>
                <Text style={{fontSize:11, color:'#888', fontStyle:'italic'}}>Seçili: {editStartDate ? editStartDate.toLocaleDateString('tr-TR') : '-'}</Text>
                <Text style={{fontSize:11, color:'#b0b', fontStyle:'italic'}}>Önceki: {(() => {
  if (editIdx !== null && tasks[editIdx].startDate) {
    const d = tasks[editIdx].startDate;
    const dateObj = d instanceof Date ? d : new Date(d);
    return isNaN(dateObj.getTime()) ? '-' : dateObj.toLocaleDateString('tr-TR');
  }
  return '-';
})()}</Text>
              </View>
              <DatePickerModal
                visible={showStartPicker}
                date={editStartDate || new Date()}
                onConfirm={date => { setShowStartPicker(false); setEditStartDate(date); }}
                onCancel={()=>setShowStartPicker(false)}
              />
              <View style={{flexDirection:'row', alignItems:'center', marginBottom:0, marginTop:8}}>
                <Text style={{flex:1}}>Bitiş Tarihi:</Text>
                <Button compact mode="outlined" onPress={()=>setShowEndPicker(true)} style={{backgroundColor:'#fff', borderRadius:8, borderColor:'#bbb', borderWidth:1}} labelStyle={{color:'#333'}}>
                  {editEndDate ? editEndDate.toLocaleDateString('tr-TR') : 'Tarih Seç'}
                </Button>
              </View>
              <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:2}}>
                <Text style={{fontSize:11, color:'#888', fontStyle:'italic'}}>Seçili: {editEndDate ? editEndDate.toLocaleDateString('tr-TR') : '-'}</Text>
                <Text style={{fontSize:11, color:'#b0b', fontStyle:'italic'}}>Önceki: {(() => {
  if (editIdx !== null && tasks[editIdx].endDate) {
    const d = tasks[editIdx].endDate;
    const dateObj = d instanceof Date ? d : new Date(d);
    return isNaN(dateObj.getTime()) ? '-' : dateObj.toLocaleDateString('tr-TR');
  }
  return '-';
})()}</Text>
              </View>
              <DatePickerModal
                visible={showEndPicker}
                date={editEndDate || new Date()}
                onConfirm={date => { setShowEndPicker(false); setEditEndDate(date); }}
                onCancel={()=>setShowEndPicker(false)}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={()=>setShowDialog(false)}>İptal</Button>
            <Button mode="contained" onPress={handleSave}>Kaydet</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
