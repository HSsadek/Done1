import axios from 'axios';
import storage from '../utils/storage';

const API_URL = 'http://10.192.189.100:5000/api';///önemli değiştirme 


const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5 saniye timeout (daha kısa süre)
});

// Request interceptor - token eklemek için
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Request:', {
      method: config.method.toUpperCase(),
      url: config.url,
      data: config.data,
      headers: config.headers
    }); // Debug için
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - hata yönetimi için
api.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      status: response.status,
      data: response.data
    }); // Debug için
    return response;
  },
  (error) => {
    console.error('Response Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    if (error.response?.status === 401) {
      // Token geçersiz veya süresi dolmuş
      // Logout işlemlerini yapın
      storage.clearAll();
      // TODO: Kullanıcıyı login ekranına yönlendir
    }

    if (!error.response) {
      // Eğer hiç cevap alınmazsa, ağ hatası
      console.error('Network Error: Sunucuya bağlanılamıyor');
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { token, ...userData } = response.data;
      if (token) {
        await storage.setToken(token);
        await storage.setUserData(userData);
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
      const { token, ...user } = response.data;
      if (token) {
        await storage.setToken(token);
        await storage.setUserData(user);
      }
      return response;
    } catch (error) {
      console.error('Registration Error:', error);
      throw error;
    }
  },
  logout: async () => {
    await storage.clearAll();
  }
};

export const projectAPI = {
  getAllProjects: () => api.get('/projects'),
  getProjectById: (id) => api.get(`/projects/${id}`),
  createProject: (projectData) => api.post('/projects', projectData),
  updateProject: (id, projectData) => api.put(`/projects/${id}`, projectData),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  
  // Proje ekip üyeleri
  getProjectMembers: (projectId) => api.get(`/projects/${projectId}/members`),
  addProjectMember: (projectId, userId) => api.post(`/projects/${projectId}/members`, { userId }),
  removeProjectMember: (projectId, userId) => api.delete(`/projects/${projectId}/members/${userId}`),
};

export const taskAPI = {
  getProjectTasks: (projectId) => api.get(`/projects/${projectId}/tasks`),
  getTaskById: (taskId) => api.get(`/tasks/${taskId}`),
  createTask: (projectId, taskData) => api.post(`/projects/${projectId}/tasks`, taskData),
  updateTask: (taskId, taskData) => api.put(`/tasks/${taskId}`, taskData),
  deleteTask: (taskId) => api.delete(`/tasks/${taskId}`),
  
  // Görev atama
  assignTask: (taskId, userId) => api.put(`/tasks/${taskId}/assign`, { userId }),
  unassignTask: (taskId) => api.put(`/tasks/${taskId}/unassign`),
  
  // Görev durumu
  updateTaskStatus: (taskId, status) => api.put(`/tasks/${taskId}/status`, { status }),
};

export default api;
