import axios from 'axios';

const API_URL = 'http://10.14.13.142:5000/api'; ///ip adressi her seferinde değiştirilecektir

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 saniye timeout
});

// Bellekte token saklamak için değişken
let memoryToken = null;

// Login veya register sonrası token'ı belleğe kaydet
export const setMemoryToken = (token) => {
  memoryToken = token;
};

// Request interceptor - token eklemek için
api.interceptors.request.use(
  async (config) => {
    // Önce bellekteki token'a bak
    if (memoryToken) {
      config.headers.Authorization = `Bearer ${memoryToken}`;
    } else {
      // Bellekte yoksa AsyncStorage'dan almayı dene
      try {
        const storage = require('../utils/storage').storage;
        const token = await storage.getToken();
        if (token) {
          memoryToken = token; // Bellekte sakla
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.error('Token alınırken hata:', err);
      }
    }

    console.log('Request:', {
      method: config.method.toUpperCase(),
      url: config.url,
      data: config.data,
      headers: config.headers,
    }); // Debug için
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  },
);

// Response interceptor - hata yönetimi için
api.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      status: response.status,
      data: response.data,
    }); // Debug için
    return response;
  },
  (error) => {
    console.error('Response Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    if (error.response?.status === 401) {
      // Token geçersiz veya süresi dolmuş
      // Logout işlemlerini yapın
      // TODO: Kullanıcıyı login ekranına yönlendir
    }

    if (!error.response) {
      // Eğer hiç cevap alınmazsa, ağ hatası
      console.error('Network Error: Sunucuya bağlanılamıyor');
    }

    return Promise.reject(error);
  },
);

export const authAPI = {
  // Profil güncelleme
  updateProfile: async (profileData) => {
    try {
      // Varsayılan endpoint: /auth/profile (PUT)
      const response = await api.put('/auth/profile', profileData);
      // İsterseniz endpoint'i burada kolayca değiştirebilirsiniz
      return response;
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      throw error;
    }
  },
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      // Token'ı hem belleğe hem de AsyncStorage'a kaydet
      if (response.data.token) {
        setMemoryToken(response.data.token);
        const storage = require('../utils/storage').storage;
        await storage.setToken(response.data.token);

        // Kullanıcı verilerini de kaydet
        if (response.data.user) {
          await storage.setUserData(response.data.user);
        }
      }
      return response;
    } catch (error) {
      console.error('Login Error:', error);
      throw error;
    }
  },
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      // Token'ı belleğe kaydet
      if (response.data.token) setMemoryToken(response.data.token);
      return response;
    } catch (error) {
      console.error('Registration Error:', error);
      throw error;
    }
  },
  logout: async () => {
    memoryToken = null;
  },
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response;
    } catch (error) {
      console.error('Profil getirme hatası:', error);
      throw error;
    }
  },
  getUsers: async () => {
    try {
      const response = await api.get('/auth/users'); // /users yerine /auth/users olarak değiştirildi
      return response;
    } catch (error) {
      if (!error.response) {
        // Network hatası veya timeout
        throw new Error(
          'Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.',
        );
      } else if (error.response.status === 401) {
        // Yetkilendirme hatası
        throw new Error(
          'Bu işlem için yetkiniz yok. Lütfen tekrar giriş yapın.',
        );
      } else {
        // Diğer API hataları
        throw new Error(
          error.response?.data?.message ||
            'Kullanıcılar yüklenirken bir hata oluştu',
        );
      }
    }
  },
};

export const projectAPI = {
  getAllProjects: () => api.get('/projects'),
  getProjectById: (id) => api.get(`/projects/${id}`),
  createProject: (projectData) => api.post('/projects', projectData),
  updateProject: async (id, projectData) => {
    try {
      // Önce token'i kontrol et
      if (!memoryToken) {
        const storage = require('../utils/storage').storage;
        const token = await storage.getToken();
        if (token) {
          setMemoryToken(token);
        } else {
          throw new Error(
            'Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.',
          );
        }
      }

      console.log('Proje güncelleme isteği gönderiliyor:', {
        id,
        data: projectData,
        token: memoryToken ? 'Token var' : 'Token yok',
      });

      return await api.put(`/projects/${id}`, projectData);
    } catch (error) {
      console.error('Proje güncelleme hatası:', error);
      throw error;
    }
  },
  deleteProject: (id) => api.delete(`/projects/${id}`),

  // Proje ekip üyeleri
  getProjectMembers: (projectId) => api.get(`/projects/${projectId}/members`),
  addProjectMember: (projectId, userId) =>
    api.post(`/projects/${projectId}/members`, { userId }),
  removeProjectMember: (projectId, userId) =>
    api.delete(`/projects/${projectId}/members/${userId}`),
};

export const taskAPI = {
  getProjectTasks: (projectId) => api.get(`/projects/${projectId}/tasks`),
  getTaskById: (projectId, taskId) =>
    api.get(`/projects/${projectId}/tasks/${taskId}`),
  createTask: (projectId, taskData) =>
    api.post(`/projects/${projectId}/tasks`, taskData),
  updateTask: (projectId, taskId, taskData) =>
    api.put(`/projects/${projectId}/tasks/${taskId}`, taskData),
  deleteTask: (projectId, taskId) =>
    api.delete(`/projects/${projectId}/tasks/${taskId}`),

  // Görev atama
  assignTask: (projectId, taskId, userId) =>
    api.put(`/projects/${projectId}/tasks/${taskId}/assign`, { userId }),
  unassignTask: (projectId, taskId) =>
    api.put(`/projects/${projectId}/tasks/${taskId}/unassign`),

  // Görev durumu güncelleme - Backend API'nin doğru endpoint'i: /api/projects/:projectId/tasks/:taskId
  updateTaskStatus: async (projectId, taskId, status) => {
    try {
      console.log(
        `Görev durumu güncelleniyor: ProjectID=${projectId}, TaskID=${taskId}, Status=${status}`,
      );

      // Backend'in doğru endpoint'ini kullan
      const response = await api.put(`/projects/${projectId}/tasks/${taskId}`, {
        status,
      });
      console.log('Görev durumu başarıyla güncellendi');
      return response;
    } catch (error) {
      console.error('Görev durumu güncelleme hatası:', error);
      throw error;
    }
  },
};

export default api;
