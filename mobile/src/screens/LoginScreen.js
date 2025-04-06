import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { authAPI } from '../services/api';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const loginValidationSchema = Yup.object().shape({
  email: Yup.string().email('Geçerli bir e-posta giriniz').required('E-posta gerekli'),
  password: Yup.string().min(6, 'Şifre en az 6 karakter olmalı').required('Şifre gerekli'),
});

const registerValidationSchema = Yup.object().shape({
  name: Yup.string().required('Ad Soyad gerekli'),
  email: Yup.string().email('Geçerli bir e-posta giriniz').required('E-posta gerekli'),
  password: Yup.string().min(6, 'Şifre en az 6 karakter olmalı').required('Şifre gerekli'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Şifreler eşleşmiyor')
    .required('Şifre tekrarı gerekli'),
});

const LoginScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setError('');
      console.log(`${isRegister ? 'Kayıt' : 'Giriş'} isteği gönderiliyor:`, values);
      
      if (isRegister) {
        const { confirmPassword, ...registerData } = values;
        const response = await authAPI.register(registerData);
        console.log('Kayıt yanıtı:', response.data);
        setIsRegister(false);
        setError('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
      } else {
        const response = await authAPI.login(values);
        console.log('Giriş yanıtı:', response.data);
        navigation.replace('Projects');
      }
    } catch (err) {
      console.error('Hata:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.message === 'Invalid email or password' 
        ? 'E-posta veya şifre hatalı'
        : 'Giriş yapılırken bir hata oluştu';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.secondary]}
      style={styles.background}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <Surface style={styles.card}>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Proje Yönetimi</Text>
              <Text style={styles.subtitle}>{isRegister ? 'Hesap Oluştur' : 'Hoş Geldiniz'}</Text>
            </View>

            <Formik
              initialValues={isRegister ? 
                { name: '', email: '', password: '', confirmPassword: '' } : 
                { email: '', password: '' }
              }
              validationSchema={isRegister ? registerValidationSchema : loginValidationSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ handleChange, handleSubmit, values, errors, touched }) => (
                <View style={styles.form}>
                  {isRegister && (
                    <TextInput
                      label="Ad Soyad"
                      value={values.name}
                      onChangeText={handleChange('name')}
                      mode="outlined"
                      error={touched.name && errors.name}
                      style={styles.input}
                      left={<TextInput.Icon icon="account" />}
                      theme={{ colors: { primary: COLORS.primary }}}
                    />
                  )}
                  {isRegister && touched.name && errors.name && (
                    <Text style={styles.errorText}>{errors.name}</Text>
                  )}

                  <TextInput
                    label="E-posta"
                    value={values.email}
                    onChangeText={handleChange('email')}
                    mode="outlined"
                    error={touched.email && errors.email}
                    style={styles.input}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    left={<TextInput.Icon icon="email" />}
                    theme={{ colors: { primary: COLORS.primary }}}
                  />
                  {touched.email && errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}

                  <TextInput
                    label="Şifre"
                    value={values.password}
                    onChangeText={handleChange('password')}
                    mode="outlined"
                    secureTextEntry={!showPassword}
                    error={touched.password && errors.password}
                    style={styles.input}
                    left={<TextInput.Icon icon="lock" />}
                    right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
                    theme={{ colors: { primary: COLORS.primary }}}
                  />
                  {touched.password && errors.password && (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  )}

                  {isRegister && (
                    <TextInput
                      label="Şifre Tekrarı"
                      value={values.confirmPassword}
                      onChangeText={handleChange('confirmPassword')}
                      mode="outlined"
                      secureTextEntry={!showConfirmPassword}
                      error={touched.confirmPassword && errors.confirmPassword}
                      style={styles.input}
                      left={<TextInput.Icon icon="lock-check" />}
                      right={<TextInput.Icon icon={showConfirmPassword ? "eye-off" : "eye"} onPress={() => setShowConfirmPassword(!showConfirmPassword)} />}
                      theme={{ colors: { primary: COLORS.primary }}}
                    />
                  )}
                  {isRegister && touched.confirmPassword && errors.confirmPassword && (
                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                  )}

                  {error ? (
                    <Text style={[styles.errorText, error.includes('başarılı') && styles.successText]}>
                      {error}
                    </Text>
                  ) : null}

                  <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={loading}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                  >
                    {isRegister ? 'Kayıt Ol' : 'Giriş Yap'}
                  </Button>

                  <Button
                    mode="text"
                    onPress={() => {
                      setIsRegister(!isRegister);
                      setError('');
                      setShowPassword(false);
                      setShowConfirmPassword(false);
                    }}
                    style={styles.switchButton}
                    labelStyle={styles.switchButtonText}
                  >
                    {isRegister ? 'Zaten hesabınız var mı? Giriş yapın' : 'Hesabınız yok mu? Kayıt olun'}
                  </Button>
                </View>
              )}
            </Formik>
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: width,
    height: height,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 20,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.95)',
    elevation: 5,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.gray,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  button: {
    marginTop: 24,
    borderRadius: 8,
    elevation: 2,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  switchButton: {
    marginTop: 16,
  },
  switchButtonText: {
    fontSize: 14,
    color: COLORS.primary,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  successText: {
    color: COLORS.success,
  },
});

export default LoginScreen;
