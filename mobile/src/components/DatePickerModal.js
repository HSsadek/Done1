import React from 'react';
import { Modal, Portal, Button } from 'react-native-paper';
import { View, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const DatePickerModal = ({ visible, date, onConfirm, onCancel, mode = 'date', minimumDate, maximumDate }) => {
  const [tempDate, setTempDate] = React.useState(date || new Date());
  const [pickerVisible, setPickerVisible] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      setTempDate(date || new Date());
      setPickerVisible(true);
    } else {
      setPickerVisible(false);
    }
  }, [visible, date]);

  // Android: DateTimePicker is shown as a dialog, so we can close modal onChange
  const handleChange = (event, selectedDate) => {
    if (event.type === 'set' && selectedDate) {
      setTempDate(selectedDate);
      setPickerVisible(false);
      onConfirm(selectedDate);
    } else if (event.type === 'dismissed') {
      setPickerVisible(false);
      onCancel();
    }
  };

  // For Android/iOS, show only the DateTimePicker dialog, no modal box/buttons
  if ((Platform.OS === 'android' || Platform.OS === 'ios') && pickerVisible) {
    return (
      <DateTimePicker
        value={tempDate}
        mode={mode}
        display="default"
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onChange={handleChange}
      />
    );
  }
  // For web or fallback, show modal with buttons
  return (
    <Portal>
      <Modal visible={visible} onDismiss={onCancel} contentContainerStyle={{ justifyContent: 'center', alignItems: 'center', margin: 32, backgroundColor: 'white', borderRadius: 10, padding: 20 }}>
        <View>
          <DateTimePicker
            value={tempDate}
            mode={mode}
            display="default"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onChange={handleChange}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button onPress={() => { setPickerVisible(false); onCancel(); }} style={{ marginRight: 8 }}>İptal</Button>
            <Button mode="contained" onPress={() => { setPickerVisible(false); onConfirm(tempDate); }}>Seç</Button>
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

export default DatePickerModal;
