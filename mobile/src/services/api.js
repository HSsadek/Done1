import axios from 'axios';


const API_URL = 'http://10.14.8.250:5000/api';///önemli değiştirme 


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
    if (memoryToken) {
      config.headers.Authorization = `Bearer ${memoryToken}`;
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
      // Token'ı belleğe kaydet
      if (response.data.token) setMemoryToken(response.data.token);
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
      const response = await api.get('/auth/users');  // /users yerine /auth/users olarak değiştirildi
      return response;
    } catch (error) {
      if (!error.response) {
        // Network hatası veya timeout
        throw new Error('Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
      } else if (error.response.status === 401) {
        // Yetkilendirme hatası
        throw new Error('Bu işlem için yetkiniz yok. Lütfen tekrar giriş yapın.');
      } else {
        // Diğer API hataları
        throw new Error(error.response?.data?.message || 'Kullanıcılar yüklenirken bir hata oluştu');
      }
    }
  },
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
  updateTaskStatus: (projectId, taskId, status) => api.put(`/projects/${projectId}/tasks/${taskId}`, { status }),
};

export default api;
