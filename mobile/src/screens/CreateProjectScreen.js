import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { projectAPI } from '../services/api';
import { COLORS } from '../constants/theme';

const validationSchema = Yup.object().shape({
  title: Yup.string()
    .required('Başlık gerekli')
    .min(3, 'Başlık en az 3 karakter olmalı')
    .max(50, 'Başlık en fazla 50 karakter olabilir'),
  description: Yup.string()
    .required('Açıklama gerekli')
    .min(10, 'Açıklama en az 10 karakter olmalı')
    .max(500, 'Açıklama en fazla 500 karakter olabilir'),
});

const CreateProjectScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setError('');
      await projectAPI.createProject(values);
      navigation.goBack();
    } catch (err) {
      console.error('Proje oluşturulurken hata:', err);
      setError(err.response?.data?.message || 'Proje oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
    >
      <Surface style={styles.surface}>
        <Text style={styles.title}>Yeni Proje</Text>
        
        <Formik
          initialValues={{ title: '', description: '' }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
            isValid,
          }) => (
            <View style={styles.form}>
              <TextInput
                label="Proje Başlığı"
                value={values.title}
                onChangeText={handleChange('title')}
                onBlur={handleBlur('title')}
                error={touched.title && errors.title}
                style={styles.input}
                mode="outlined"
              />
              {touched.title && errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}

              <TextInput
                label="Proje Açıklaması"
                value={values.description}
                onChangeText={handleChange('description')}
                onBlur={handleBlur('description')}
                error={touched.description && errors.description}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={4}
              />
              {touched.description && errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Button
                mode="contained"
                onPress={handleSubmit}
                disabled={!isValid || loading}
                loading={loading}
                style={styles.button}
              >
                Proje Oluştur
              </Button>

              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={styles.button}
                disabled={loading}
              >
                İptal
              </Button>
            </View>
          )}
        </Formik>
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  surface: {
    padding: 16,
    borderRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: COLORS.white,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: -8,
  },
  button: {
    marginTop: 8,
  },
});

export default CreateProjectScreen;
