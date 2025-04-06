import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { IconButton } from 'react-native-paper';
import { COLORS } from '../constants/theme';

import LoginScreen from '../screens/LoginScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';
import CreateProjectScreen from '../screens/CreateProjectScreen';
import ProjectEditScreen from '../screens/ProjectEditScreen';
import CreateTask from '../screens/CreateTask';




const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.white,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        
        <Stack.Screen 
          name="Projects" 
          component={ProjectsScreen}
          options={{
            title: 'Projelerim',
            headerLeft: () => null, // Geri butonunu gizle
          }}
        />
        
        <Stack.Screen
          name="ProjectDetail"
          component={ProjectDetailScreen}
          options={({ navigation }) => ({
            title: 'Proje Detayı',
            headerLeft: () => (
              <IconButton
                icon="arrow-left"
                iconColor={COLORS.white}
                onPress={() => navigation.goBack()}
              />
            ),
          })}
        />

        <Stack.Screen
          name="CreateProject"
          component={CreateProjectScreen}
          options={({ navigation }) => ({
            title: 'Yeni Proje',
            headerLeft: () => (
              <IconButton
                icon="arrow-left"
                iconColor={COLORS.white}
                onPress={() => navigation.goBack()}
              />
            ),
          })}
        />

<Stack.Screen
  name="EditProject"
  component={ProjectEditScreen}
  options={{ title: 'Proje Düzenle' }}
/>


<Stack.Screen
  name="CreateTask"
  component={CreateTask}
  options={{ title: 'Görev Oluştur' }}
/>


      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
