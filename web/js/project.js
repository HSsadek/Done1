// Proje Detay Sayfası JavaScript Kodu

// API URL'leri (Backend entegrasyonu için)
// Mobil erişim için IP adresini kullanır.
const API_URL = {
    projects: 'http://localhost:5000/api/projects',
    tasks: 'http://localhost:5000/api/projects', // Görevler projeler altında yönetiliyor
    profile: 'http://localhost:5000/api/auth/profile',
    activities: 'http://localhost:5000/api/activities',
    users: 'http://localhost:5000/api/auth'
};

// Güvenli modal kapatma fonksiyonu
function closeModal(modalId, reloadPage = true) {
    try {
        // Modal elementini bul
        const modalElement = document.getElementById(modalId);
        if (!modalElement) {
            console.warn(`Modal element bulunamadı: ${modalId}`);
            return;
        }

        // Bootstrap modal instance'ını al
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
            // Bootstrap 5 yöntemi ile modalı kapat
            modalInstance.hide();
            console.log(`Modal başarıyla kapatıldı: ${modalId}`);
        } else {
            console.warn(`Modal instance bulunamadı: ${modalId}`);
        }

        // Modal arka planını temizle
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
            console.log('Modal arka planı temizlendi');
        }

        // Body'den modal sınıflarını kaldır
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Sayfayı yeniden yükle (kullanıcının tercihi)
        if (reloadPage) {
            // Kısa bir süre bekleyip sayfayı yeniden yükle
            setTimeout(() => {
                window.location.reload();
            }, 500); // 500ms bekle
        }

    } catch (error) {
        console.error(`Modal kapatma hatası (${modalId}):`, error);
    }
}

// Proje ve görev verileri
let currentProject = null;
let tasks = [];
let currentUserId = null;

// Mevcut kullanıcı ID'sini al
async function getCurrentUserId() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        
        const response = await fetch('http://localhost:5000/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) return null;
        
        const user = await response.json();
        return user._id || user.id;
    } catch (error) {
        console.error('Kullanıcı ID alınırken hata:', error);
        return null;
    }
}

// DOM yüklendikten sonra çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', async () => {
    // Önce kullanıcı ID'sini al
    currentUserId = await getCurrentUserId();
    console.log('Mevcut kullanıcı ID:', currentUserId);
    
    // URL'den proje ID'sini al
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    
    if (!projectId) {
        showAlert('Proje ID bulunamadı.', 'danger');
        return;
    }
    
    // Proje detaylarını yükle
    loadProjectDetails(projectId);
    
    // Event listener'ları ekle
    setupEventListeners();
});

// Event listener'ları ayarla
function setupEventListeners() {
    // Proje düzenleme butonuna tıklandığında
    const editProjectButton = document.getElementById('editProjectButton');
    if (editProjectButton) {
        editProjectButton.addEventListener('click', function() {
            openEditProjectModal();
        });
    }
    
    // Proje kaydetme butonuna tıklandığında
    const saveProjectBtn = document.getElementById('saveProjectBtn');
    if (saveProjectBtn) {
        saveProjectBtn.addEventListener('click', function() {
            saveProject();
        });
    }
    
    // Yeni görev ekleme butonuna tıklandığında
    const addTaskBtn = document.getElementById('addTaskBtn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', function() {
            // Görev ekleme modalını aç
            const addTaskModal = new bootstrap.Modal(document.getElementById('addTaskModal'));
            addTaskModal.show();
            
            // Görev atama seçeneklerini güncelle
            updateTaskAssigneeOptions();
        });
    }
    
    // Görev kaydetme butonuna tıklandığında
    const saveTaskBtn = document.getElementById('saveTaskBtn');
    if (saveTaskBtn) {
        saveTaskBtn.addEventListener('click', function() {
            saveTask();
        });
    }
    
    // Üye ekleme butonuna tıklandığında
    const addTeamMemberButton = document.getElementById('addTeamMemberButton');
    if (addTeamMemberButton) {
        addTeamMemberButton.addEventListener('click', function() {
            // Üye ekleme modalını açmadan önce mevcut üyeleri göster
            openAddTeamMemberModal();
        });
    }
    
    // Ekip üyelerini kaydetme butonuna tıklandığında
    const saveTeamMembersBtn = document.getElementById('saveTeamMembersBtn');
    if (saveTeamMembersBtn) {
        saveTeamMembersBtn.addEventListener('click', function() {
            saveTeamMembers();
        });
    }
    
    // Sürükle-bırak işlemleri için event listener'lar
    setupDragAndDrop();
    
    // Ekip üyesi otomatik tamamlama kurulumu
    const teamMemberInput = document.getElementById('teamMemberInput');
    const teamMemberSuggestions = document.getElementById('teamMemberSuggestions');
    if (teamMemberInput && teamMemberSuggestions) {
        setupTeamMemberAutocomplete(teamMemberInput, teamMemberSuggestions, 'teamMembersList');
    }
}

// Görev düzenleme paneli açılırken ekip üyesi select'ini doldur
function fillAssigneeSelects() {
    const team = (currentProject && currentProject.teamMembers) ? currentProject.teamMembers : [];
    // Ekleme paneli
    const addAssigneeSelect = document.getElementById('taskAssignee');
    if (addAssigneeSelect) {
        addAssigneeSelect.innerHTML = '<option value="">Seçiniz</option>';
        team.forEach(member => {
            const option = document.createElement('option');
            option.value = member;
            option.textContent = member;
            addAssigneeSelect.appendChild(option);
        });
    }
}

// Proje detayları yüklenirken ekip üyesi select'ini doldur
function afterProjectLoaded() {
    // Ekip üyelerini görev atama seçeneğine ekle (eski projeler için)
    fillAssigneeSelects();
}

// Görev düzenleme panelini aç
function openTaskEditModal(taskData) {
    // Form alanlarını doldur
    document.getElementById('editTaskId').value = taskData.id || taskData._id;
    document.getElementById('editTaskTitle').value = taskData.title;
    document.getElementById('editTaskDescription').value = taskData.description || '';
    document.getElementById('editTaskStartDate').value = taskData.startDate ? taskData.startDate.substring(0,10) : '';
    document.getElementById('editTaskEndDate').value = taskData.endDate ? taskData.endDate.substring(0,10) : '';
    
    // Ekip üyelerini select olarak doldur
    const assigneeSelect = document.getElementById('editTaskAssignee');
    if (assigneeSelect) {
        assigneeSelect.innerHTML = '<option value="">Atanmamış</option>';
        (currentProject.teamMembers || []).forEach(member => {
            const option = document.createElement('option');
            option.value = member;
            option.textContent = member;
            assigneeSelect.appendChild(option);
        });
        assigneeSelect.value = taskData.assignee || '';
    }
    
    document.getElementById('editTaskStatus').value = taskData.status || 'notStarted';
    
    // Detay modalını kapat, düzenleme modalını aç
    const detailModal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
    if (detailModal) {
        detailModal.hide();
    }
    
    const editModal = new bootstrap.Modal(document.getElementById('editTaskModal'));
    editModal.show();
    
    // Düzenleme panelinde kaydet butonu
    const saveEditTaskBtn = document.getElementById('saveEditTaskBtn');
    if (saveEditTaskBtn) {
        saveEditTaskBtn.addEventListener('click', () => {
            const id = document.getElementById('editTaskId').value;
            const updatedTask = {
                id: id,
                title: document.getElementById('editTaskTitle').value,
                description: document.getElementById('editTaskDescription').value,
                startDate: document.getElementById('editTaskStartDate').value,
                endDate: document.getElementById('editTaskEndDate').value,
                assignee: document.getElementById('editTaskAssignee').value,
                status: document.getElementById('editTaskStatus').value
            };
            // Görevler dizisinde ilgili görevi güncelle
            const idx = tasks.findIndex(t => (t.id || t._id) == id);
            if (idx !== -1) {
                tasks[idx] = { ...tasks[idx], ...updatedTask };
                renderTasks();
                showAlert('Görev başarıyla güncellendi!', 'success');
            }
            // Modalı kapat
            const editModal = bootstrap.Modal.getInstance(document.getElementById('editTaskModal'));
            if (editModal) {
                editModal.hide();
            }
        });
    }
}

// Kullanıcı arama fonksiyonu
async function searchUsers() {
    console.log('searchUsers fonksiyonu çağrıldı');
    
    const searchInput = document.getElementById('teamMemberInput');
    const searchResultsList = document.getElementById('userSearchResults');
    
    if (!searchInput || !searchResultsList) {
        console.error('Arama bileşenleri bulunamadı');
        return;
    }
    
    // Arama sorgusu
    const query = searchInput.value.trim();
    
    if (query.length < 2) {
        searchResultsList.innerHTML = '<li class="list-group-item text-center text-muted">En az 2 karakter girin</li>';
        return;
    }
    
    // Yükleniyor mesajı göster
    searchResultsList.innerHTML = '<li class="list-group-item text-center"><div class="spinner-border spinner-border-sm" role="status"></div> Kullanıcılar yükleniyor...</li>';
    
    try {
        // API'den kullanıcıları getir
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL.users}/search?query=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Kullanıcı arama işlemi başarısız oldu');
        }
        
        const users = await response.json();
        console.log('API\'den gelen kullanıcılar:', users);
        
        // Arama sonuçlarını temizle
        searchResultsList.innerHTML = '';
        
        // Sonuçları göster
        if (!users || users.length === 0) {
            searchResultsList.innerHTML = '<li class="list-group-item text-center text-muted">Kullanıcı bulunamadı</li>';
            return;
        }
        
        // Kullanıcıları göster
        users.forEach(user => {
            const userItem = document.createElement('li');
            userItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            // Kullanıcı ID'sini al (backend'den gelen veride id veya _id olabilir)
            const userId = user.id || user._id || `temp_${Date.now()}`;
            
            // Kullanıcı fotoğrafı için URL al
            const profileImage = user.profileImage || user.avatar || user.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name || user.email || user.username) + '&background=random';
            
            userItem.innerHTML = `
                <div class="d-flex align-items-center">
                    <img src="${profileImage}" class="rounded-circle me-2" width="32" height="32" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email || user.username)}&background=random'">
                    <span>${user.name || user.email || user.username}</span>
                </div>
                <button class="btn btn-sm btn-primary add-user-btn" 
                    data-user-id="${userId}" 
                    data-user-name="${user.name || user.email || user.username}"
                    data-user-image="${profileImage}">
                    Ekle
                </button>
            `;
            
            searchResultsList.appendChild(userItem);
            
            // "Ekle" butonuna tıklama olayı ekle
            const addButton = userItem.querySelector('.add-user-btn');
            addButton.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                const userName = this.getAttribute('data-user-name');
                const userImage = this.getAttribute('data-user-image');
                
                console.log(`Ekip üyesi ekleniyor: ID=${userId}, Name=${userName}, Image=${userImage}`);
                
                // Kullanıcıyı ekip üyeleri listesine ekle
                addTeamMemberToBadgeList({
                    id: userId,
                    name: userName,
                    image: userImage
                }, 'teamMembersList');
                
                // Kullanıcı eklendikten sonra arama alanını temizle
                document.getElementById('teamMemberInput').value = '';
                
                // Arama sonuçlarını temizle
                searchResultsList.innerHTML = '';
                
                // Kullanıcı eklendi bildirimini göster
                showAlert(`${userName} ekip üyesi olarak eklendi`, 'success');
            });
        });
    } catch (error) {
        console.error('Kullanıcı arama hatası:', error);
        searchResultsList.innerHTML = `<li class="list-group-item text-center text-danger">Hata: ${error.message}</li>`;
        
        // API bağlantısı yoksa örnek kullanıcılarla devam et
        setTimeout(() => {
            searchResultsList.innerHTML = '<li class="list-group-item text-center text-warning">API bağlantısı yok, örnek kullanıcılar gösteriliyor</li>';
            
            // Örnek kullanıcı verileri
            const mockUsers = [
                { id: '1', name: 'Hussein Sadek', email: 'hussein@example.com', username: 'hsadek' },
                { id: '2', name: 'Ahmet Yılmaz', email: 'ahmet@example.com', username: 'ayilmaz' },
                { id: '3', name: 'Ayşe Demir', email: 'ayse@example.com', username: 'ademir' },
                { id: '4', name: 'Mehmet Kaya', email: 'mehmet@example.com', username: 'mkaya' },
                { id: '5', name: 'Zeynep Çelik', email: 'zeynep@example.com', username: 'zcelik' }
            ];
            
            // Kullanıcıları filtrele
            const filteredUsers = mockUsers.filter(user => {
                const searchTerms = query.toLowerCase();
                return (
                    (user.name && user.name.toLowerCase().includes(searchTerms)) ||
                    (user.email && user.email.toLowerCase().includes(searchTerms)) ||
                    (user.username && user.username.toLowerCase().includes(searchTerms))
                );
            });
            
            if (filteredUsers.length === 0) {
                searchResultsList.innerHTML += '<li class="list-group-item text-center text-muted">Kullanıcı bulunamadı</li>';
                return;
            }
            
            // Kullanıcıları göster
            filteredUsers.forEach(user => {
                const userItem = document.createElement('li');
                userItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                userItem.innerHTML = `
                    <span>${user.name || user.email || user.username}</span>
                    <button class="btn btn-sm btn-primary add-user-btn" data-user-id="${user.id}" data-user-name="${user.name || user.email || user.username}">Ekle</button>
                `;
                
                searchResultsList.appendChild(userItem);
                
                // "Ekle" butonuna tıklama olayı ekle
                const addButton = userItem.querySelector('.add-user-btn');
                addButton.addEventListener('click', function() {
                    const userId = this.getAttribute('data-user-id');
                    const userName = this.getAttribute('data-user-name');
                    
                    console.log(`Ekip üyesi ekleniyor: ID=${userId}, Name=${userName}`);
                    
                    // Kullanıcıyı ekip üyeleri listesine ekle
                    addTeamMemberToBadgeList({
                        id: userId,
                        name: userName
                    }, 'teamMembersList');
                    
                    // Kullanıcı eklendikten sonra arama alanını temizle
                    document.getElementById('teamMemberInput').value = '';
                    
                    // Arama sonuçlarını temizle
                    searchResultsList.innerHTML = '';
                    
                    // Kullanıcı eklendi bildirimini göster
                    showAlert(`${userName} ekip üyesi olarak eklendi`, 'success');
                });
            });
        }, 1000);
    }
}

// Ekip üyesi ekle
function addTeamMember(userId, userName) {
    console.log('addTeamMember fonksiyonu çağrıldı:', userId, userName);
    
    if (!userId || !userName) {
        console.error('Geçersiz kullanıcı bilgileri');
        return;
    }
    
    const teamMembersList = document.getElementById('teamMembersList');
    if (!teamMembersList) {
        console.error('teamMembersList elementi bulunamadı');
        return;
    }
    
    // Zaten eklenmiş mi kontrol et
    if (document.querySelector(`#teamMembersList [data-member-id="${userId}"]`)) {
        console.log('Bu üye zaten eklenmiş:', userId);
        showAlert('Bu kullanıcı zaten eklenmiş', 'info');
        return; // Zaten eklenmişse tekrar ekleme
    }
    
    // Yeni ekip üyesi badge'i oluştur
    const memberBadge = document.createElement('div');
    memberBadge.className = 'badge bg-primary d-flex align-items-center p-2 user-select-none';
    memberBadge.dataset.memberId = userId;
    memberBadge.innerHTML = `
        <span>${userName}</span>
        <button type="button" class="btn-close btn-close-white ms-2" aria-label="Kaldır"></button>
    `;
    
    // Silme butonu için event listener
    const removeButton = memberBadge.querySelector('.btn-close');
    removeButton.addEventListener('click', () => memberBadge.remove());
    
    // Ekip üyeleri listesine ekle
    teamMembersList.appendChild(memberBadge);
    console.log('Ekip üyesi başarıyla eklendi');
    showAlert(`${userName} ekip üyesi olarak eklendi`, 'success');
}

// Proje detaylarını yükle (API'den veri çekme)
async function loadProjectDetails(projectId) {
    try {
        console.log('Proje detayları yükleniyor, ID:', projectId);
        
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Token bulunamadı!');
            throw new Error('Kimlik doğrulama hatası!');
        }
        
        console.log('API isteği yapılıyor:', `${API_URL.projects}/${projectId}`);
        const response = await fetch(`${API_URL.projects}/${projectId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            console.error('API yanıt hatası:', response.status, response.statusText);
            throw new Error('Proje detayları getirilemedi!');
        }
        
        const data = await response.json();
        console.log('API\'den gelen ham veri:', data);
        
        // API'den gelen veriyi currentProject formatına dönüştür
        currentProject = {
            id: data._id || data.id,
            name: data.title || data.name,
            description: data.description,
            startDate: data.startDate,
            endDate: data.endDate,
            owner: data.owner || null,
            teamMembers: data.teamMembers || data.team || [],
            taskStats: data.taskStats || {
                total: 0,
                completed: 0,
                inProgress: 0,
                todo: 0,
                testing: 0
            }
        };
        
        console.log('Dönüştürülmüş proje verisi:', currentProject);

        // Görevleri işle
        if (Array.isArray(data.tasks)) {
            console.log('Görevler bulundu, sayı:', data.tasks.length);
            // Görevleri uygun formata dönüştür
            tasks = data.tasks.map(task => {
                // Eski ve yeni API formatı uyumluluğu
                let assignee = '';
                if (task.assignedTo) {
                    if (typeof task.assignedTo === 'string') {
                        assignee = task.assignedTo;
                    } else if (task.assignedTo.name) {
                        assignee = task.assignedTo.name;
                    } else if (task.assignedTo.email) {
                        assignee = task.assignedTo.email;
                    }
                }
                
                // Durum değerini kontrol et ve varsayılan olarak 'Yapılacak' kullan
                let status = task.status || 'Yapılacak';
                
                // İngilizce durum değerlerini Türkçe'ye çevir
                if (status === 'Not Started') status = 'Yapılacak';
                else if (status === 'In Progress') status = 'Devam Ediyor';
                else if (status === 'Testing') status = 'Test Edilecek';
                else if (status === 'Done') status = 'Tamamlandı';
                
                // 'Devam Etmekte' durumunu 'Devam Ediyor' olarak standartlaştır
                if (status === 'Devam Etmekte') status = 'Devam Ediyor';
                
                return {
                    id: task._id || task.id,
                    title: task.title,
                    description: task.description || '',
                    status: status,
                    assignee: assignee,
                    assignedToId: task.assignedTo ? (task.assignedTo._id || task.assignedTo) : null,
                    startDate: task.startDate || task.createdAt || '',
                    endDate: task.endDate || task.dueDate || '',
                    createdAt: task.createdAt || ''
                };
            });
            console.log('Dönüştürülmüş görevler:', tasks);
        } else {
            console.log('Görev listesi bulunamadı veya dizi değil');
            tasks = [];
        }

        // Proje detaylarını görüntüle
        console.log('Proje detayları render ediliyor...');
        renderProjectDetails();
        
        // Görevleri görüntüle
        console.log('Görevler render ediliyor...');
        renderTasks();
        
        // Ekip üyelerini görev atama seçeneğine ekle
        updateTaskAssigneeOptions();
        
        // Proje yüklendikten sonra çağrılacak fonksiyonlar
        if (typeof afterProjectLoaded === 'function') {
            afterProjectLoaded();
        }
        
        // Proje yüklendiğini bildir
        showAlert(`${currentProject.name} projesi yüklendi`, 'success');
    } catch (error) {
        console.error('Proje detayları yüklenirken hata oluştu:', error);
        showAlert('Proje detayları yüklenirken bir hata oluştu.', 'danger');
    }
}

function renderProjectDetails() {
    if (!currentProject) return;
    
    // Proje başlığını güncelle
    document.getElementById('projectTitle').textContent = currentProject.name || 'İsimsiz Proje';
    
    // Proje açıklamasını güncelle
    const descriptionElement = document.getElementById('projectDescription');
    descriptionElement.innerHTML = currentProject.description || '<em>Açıklama yok</em>';
    
    // İstatistik bilgilerini göster
    updateProjectStats();
    
    // Başlangıç ve bitiş tarihlerini göster
    updateProjectDates();
    
    // Proje sahibi ve ekip üyelerini göster
    updateProjectTeam();
    
    // Butonların görünürlüğünü kontrol et (sadece proje sahibi için göster)
    const isProjectOwner = checkIfUserIsProjectOwner();
    
    // Butonları bul
    const editProjectButton = document.getElementById('editProjectButton');
    const addTeamMemberButton = document.getElementById('addTeamMemberButton');
    const addTaskBtn = document.getElementById('addTaskBtn');
    
    // Butonların görünürlüğünü ayarla
    if (editProjectButton) {
        editProjectButton.style.display = isProjectOwner ? 'inline-block' : 'none';
    }
    
    if (addTeamMemberButton) {
        addTeamMemberButton.style.display = isProjectOwner ? 'inline-block' : 'none';
    }
    
    if (addTaskBtn) {
        addTaskBtn.style.display = isProjectOwner ? 'inline-block' : 'none';
    }
}

// Proje düzenleme modalını aç
function openEditProjectModal() {
    console.log('openEditProjectModal fonksiyonu çağrıldı');
    
    if (!currentProject) {
        showAlert('Proje bilgisi bulunamadı', 'danger');
        return;
    }
    
    // Modalı aç
    const editProjectModal = new bootstrap.Modal(document.getElementById('editProjectModal'));
    editProjectModal.show();
    
    // Proje bilgilerini form alanlarına doldur
    document.getElementById('projectName').value = currentProject.name || '';
    document.getElementById('projectDescriptionInput').value = currentProject.description || '';
    
    // Tarih formatını düzelt (YYYY-MM-DD)
    let startDate = '';
    let endDate = '';
    
    if (currentProject.startDate) {
        // Tarih string ise ve ISO formatında ise
        if (typeof currentProject.startDate === 'string' && currentProject.startDate.includes('T')) {
            startDate = currentProject.startDate.split('T')[0];
        } else if (currentProject.startDate instanceof Date) {
            // Tarih Date objesi ise
            startDate = currentProject.startDate.toISOString().split('T')[0];
        } else {
            // Diğer durumlar için
            startDate = currentProject.startDate;
        }
    }
    
    if (currentProject.endDate) {
        // Tarih string ise ve ISO formatında ise
        if (typeof currentProject.endDate === 'string' && currentProject.endDate.includes('T')) {
            endDate = currentProject.endDate.split('T')[0];
        } else if (currentProject.endDate instanceof Date) {
            // Tarih Date objesi ise
            endDate = currentProject.endDate.toISOString().split('T')[0];
        } else {
            // Diğer durumlar için
            endDate = currentProject.endDate;
        }
    }
    
    document.getElementById('projectStartDateInput').value = startDate;
    document.getElementById('projectEndDateInput').value = endDate;
    
    console.log('Proje düzenleme formu dolduruldu:', {
        name: currentProject.name,
        description: currentProject.description,
        startDate: startDate,
        endDate: endDate
    });
}

// Proje düzenleme formunu kaydet
async function saveProject() {
    console.log('saveProject fonksiyonu çağrıldı');
    
    if (!currentProject || !currentProject.id) {
        showAlert('Proje bilgisi bulunamadı', 'danger');
        return;
    }
    
    try {
        // Form verilerini al
        const name = document.getElementById('projectName').value.trim();
        const description = document.getElementById('projectDescriptionInput').value.trim();
        const startDate = document.getElementById('projectStartDateInput').value;
        const endDate = document.getElementById('projectEndDateInput').value;
        
        if (!name) {
            showAlert('Proje adı boş olamaz', 'warning');
            return;
        }
        
        // Güncellenmiş proje bilgilerini hazırla
        const updatedProject = {
            ...currentProject,
            name: name,
            description: description,
            startDate: startDate,
            endDate: endDate
        };
        
        // API'ye gönder
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Oturum bilgisi bulunamadı');
        }
        
        const response = await fetch(`${API_URL.projects}/${currentProject.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedProject)
        });
        
        if (!response.ok) {
            throw new Error('Proje güncellenirken bir hata oluştu');
        }
        
        // Modalı kapat
        const editProjectModal = bootstrap.Modal.getInstance(document.getElementById('editProjectModal'));
        if (editProjectModal) {
            editProjectModal.hide();
        }
        
        showAlert('Proje başarıyla güncellendi', 'success');
        
        // Projeyi yeniden yükle
        await loadProjectDetails(currentProject.id);
        
    } catch (error) {
        console.error('Proje kaydetme hatası:', error);
        showAlert(`Proje kaydedilirken bir hata oluştu: ${error.message}`, 'danger');
    }
}

// İlerleme yüzdesini hesapla ve istatistik bilgilerini göster
function updateProjectStats() {
    if (!currentProject) return;
    
    let statsRow = document.getElementById('projectStatsRow');
    if (!statsRow) {
        statsRow = document.createElement('div');
        statsRow.className = 'row mb-3 mt-3';
        statsRow.id = 'projectStatsRow';
        const descElem = document.getElementById('projectDescription');
        descElem.parentNode.insertBefore(statsRow, descElem.nextSibling);
    }
    
    // Görev istatistiklerini hesapla
    const stats = {
        total: tasks ? tasks.length : 0,
        completed: tasks ? tasks.filter(t => t.status === 'Tamamlandı').length : 0,
        inProgress: tasks ? tasks.filter(t => t.status === 'Devam Ediyor' || t.status === 'Devam Etmekte').length : 0,
        todo: tasks ? tasks.filter(t => t.status === 'Yapılacak').length : 0,
        testing: tasks ? tasks.filter(t => t.status === 'Test Edilecek').length : 0
    };
    
    // İlerleme yüzdesini hesapla
    const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    
    statsRow.innerHTML = `
        <div class="col-12 mb-3">
            <div class="progress" style="height: 10px;">
                <div class="progress-bar bg-success" role="progressbar" style="width: ${progress}%" 
                    aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100" title="${progress}% tamamlandı">
                </div>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-2">
                <span class="text-muted"><i class="bi bi-check-circle-fill text-success"></i> ${stats.completed}/${stats.total} görev tamamlandı</span>
                <span class="badge bg-success">${progress}%</span>
            </div>
        </div>
        <div class="col-md-3 col-6 mb-2">
            <div class="card border-0 bg-light h-100">
                <div class="card-body text-center py-2">
                    <h3 class="mb-0 text-secondary">${stats.todo}</h3>
                    <small class="text-muted">Yapılacak</small>
                </div>
            </div>
        </div>
        <div class="col-md-3 col-6 mb-2">
            <div class="card border-0 bg-light h-100">
                <div class="card-body text-center py-2">
                    <h3 class="mb-0 text-primary">${stats.inProgress}</h3>
                    <small class="text-muted">Devam Ediyor</small>
                </div>
            </div>
        </div>
        <div class="col-md-3 col-6 mb-2">
            <div class="card border-0 bg-light h-100">
                <div class="card-body text-center py-2">
                    <h3 class="mb-0 text-warning">${stats.testing}</h3>
                    <small class="text-muted">Test Edilecek</small>
                </div>
            </div>
        </div>
        <div class="col-md-3 col-6 mb-2">
            <div class="card border-0 bg-light h-100">
                <div class="card-body text-center py-2">
                    <h3 class="mb-0 text-success">${stats.completed}</h3>
                    <small class="text-muted">Tamamlandı</small>
                </div>
            </div>
        </div>
    `;
}

// Kullanıcının proje sahibi olup olmadığını kontrol et
function checkIfUserIsProjectOwner() {
    if (!currentProject || !currentProject.owner || !currentUserId) {
        return false;
    }
    
    // Proje sahibinin ID'sini al (API yanıt formatına göre farklı alanlar olabilir)
    const ownerId = currentProject.owner._id || currentProject.owner.id || currentProject.owner;
    
    // Kullanıcı ID'si ile proje sahibi ID'sini karşılaştır
    console.log('Proje sahibi kontrolü:', { ownerId, currentUserId });
    return ownerId === currentUserId;
}

// Başlangıç ve bitiş tarihlerini göster
function updateProjectDates() {
    if (!currentProject) return;
    
    // Başlangıç ve bitiş tarihlerini göster
    let dateRow = document.getElementById('projectDatesRow');
    if (!dateRow) {
        dateRow = document.createElement('div');
        dateRow.className = 'row mb-2';
        dateRow.id = 'projectDatesRow';
        const statsRow = document.getElementById('projectStatsRow');
        if (statsRow) {
            statsRow.parentNode.insertBefore(dateRow, statsRow.nextSibling);
        } else {
            const descElem = document.getElementById('projectDescription');
            descElem.parentNode.insertBefore(dateRow, descElem.nextSibling);
        }
    }
    
    dateRow.innerHTML = `
        <div class="col-auto">
            <span class="badge bg-light text-dark border me-1"><i class="bi bi-calendar-event"></i> Başlangıç: ${currentProject.startDate ? new Date(currentProject.startDate).toLocaleDateString('tr-TR') : '-'}</span>
        </div>
        <div class="col-auto">
            <span class="badge bg-light text-dark border"><i class="bi bi-calendar-check"></i> Bitiş: ${currentProject.endDate ? new Date(currentProject.endDate).toLocaleDateString('tr-TR') : '-'}</span>
        </div>
    `;
}

// Proje sahibi ve ekip üyelerini göster
function updateProjectTeam() {
    if (!currentProject) return;
    
    // Proje sahibi ve ekip üyelerini göster
    let teamRow = document.getElementById('projectTeamRow');
    if (!teamRow) {
        teamRow = document.createElement('div');
        teamRow.className = 'row mb-2 mt-4';
        teamRow.id = 'projectTeamRow';
        const titleElem = document.getElementById('projectTitle');
        titleElem.parentNode.insertBefore(teamRow, titleElem.nextSibling);
    }
    
    let ownerBadge = '';
    if (currentProject.owner && (typeof currentProject.owner === 'object')) {
        const ownerName = currentProject.owner.name || currentProject.owner.email || currentProject.owner.username || 'Sahip';
        const ownerPhoto = currentProject.owner.profilePhoto || currentProject.owner.profileImage || currentProject.owner.avatar || currentProject.owner.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(ownerName) + '&background=random';
        ownerBadge = `
            <span class='badge bg-warning text-dark me-2 d-flex align-items-center'>
                <img src="${ownerPhoto}" class="rounded-circle me-1" style="width:20px;height:20px;object-fit:cover;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(ownerName)}&background=random';">
                <i class="bi bi-person-badge ms-1"></i> Proje Sahibi: ${ownerName}
            </span>`;
    } else if (currentProject.owner) {
        ownerBadge = `<span class='badge bg-warning text-dark me-2'><i class="bi bi-person-badge"></i> Proje Sahibi: ${currentProject.owner}</span>`;
    }
    
    // Modern ekip üyesi kartları (grid)
    let teamListHTML = '';
    if (currentProject.teamMembers && currentProject.teamMembers.length > 0) {
        teamListHTML = `<div class="row row-cols-1 row-cols-sm-2 row-cols-md-4 g-3 mt-2">` +
            currentProject.teamMembers.map(member => {
                let memberName = '';
                let memberPhoto = '';
                
                if (typeof member === 'string') {
                    memberName = member;
                } else {
                    memberName = member.name || member.email || member.username || 'Kullanıcı';
                    memberPhoto = member.profilePhoto || member.profileImage || member.avatar || member.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(memberName) + '&background=random';
                }
                
                return `
                    <div class='col'>
                        <div class="card h-100 shadow-sm team-card team-card-hover">
                            <div class="card-body d-flex flex-column align-items-center justify-content-center">
                                <img src="${memberPhoto}" class="rounded-circle mb-2" style="width:48px;height:48px;object-fit:cover;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(memberName)}&background=random';">
                                <h6 class="mb-0">${memberName}</h6>
                            </div>
                        </div>
                    </div>`;
            }).join('') + `</div>`;
    } else {
        teamListHTML = `<p class="text-muted mt-2">Henüz ekip üyesi eklenmemiş.</p>`;
    }
    
    teamRow.innerHTML = `
        <div class="col-12">
            <div class="d-flex align-items-center">
                ${ownerBadge}
            </div>
            ${teamListHTML}
        </div>
    `;
    
    // Ekstra stil (hover vurgusu)
    const style = document.createElement('style');
    style.innerHTML = `
    .team-card-hover:hover {box-shadow:0 4px 24px #007bff33;border:1.5px solid #0d6efd;transform:translateY(-3px) scale(1.03);transition:all .2s;}
    .team-card {transition:all .2s;}
    .team-card img {transition:all .2s;}
    .team-card:hover img {transform:scale(1.1);}
    `;
    document.head.appendChild(style);
}

// Görevleri ekrana render et
function renderTasks() {
    console.log('renderTasks çağrıldı, görev sayısı:', tasks.length);
    console.log('Mevcut görevler:', JSON.stringify(tasks, null, 2));
    
    // Görev listesinin boş olup olmadığını kontrol et
    if (!tasks || tasks.length === 0) {
        console.warn('Görev listesi boş!');
    }
    
    // Tüm sütunları temizle
    document.querySelectorAll('.kanban-column-content').forEach(column => {
        column.innerHTML = '';
    });
    
    // Status eşleştirme tablosu (Türkçe -> İngilizce Kanban sütun id'leri)
    const statusMapping = {
        // Türkçe status değerleri (backend'den gelen)
        'yapılacak': 'notStarted',
        'yapilacak': 'notStarted',
        'devam ediyor': 'inProgress',
        'devamediyor': 'inProgress',
        'devam etmekte': 'inProgress',
        'devametmekte': 'inProgress',
        'test edilecek': 'test',
        'testedilecek': 'test',
        'tamamlandı': 'done',
        'tamamlandi': 'done',
        // İngilizce status değerleri (frontend'de kullanılan)
        'notstarted': 'notStarted',
        'inprogress': 'inProgress',
        'test': 'test',
        'done': 'done',
        // Backend'den gelebilecek diğer formatlar
        'not started': 'notStarted',
        'in progress': 'inProgress',
        'testing': 'test',
        'completed': 'done'
    };
    
    // Görev sayılarını sıfırla
    const taskCounts = {
        notStarted: 0,
        inProgress: 0,
        test: 0,
        done: 0
    };
    
    // Görevleri durumlarına göre ilgili sütunlara ekle
    tasks.forEach(task => {
        // Status değerini normalize et
        let status = (task.status || 'Yapılacak').toString().toLowerCase().trim();
        
        // Durumu konsola yazdır (hata ayıklama için)
        console.log(`Görev: ${task.title}, Durum: ${status}`);
        
        // Boşlukları kaldır ve Türkçe karakterleri normalize et
        const normalizedStatus = status
            .replace(/\s+/g, '')
            .replace(/[İIıi]/g, 'i');
        
        // Eşleştirme tablosundan doğru sütun id'sini bul
        let columnId = statusMapping[status];
        
        // Eğer bulunamadıysa, normalize edilmiş durumu dene
        if (!columnId) {
            columnId = statusMapping[normalizedStatus];
        }
        
        // Yine bulunamadıysa, manuel eşleştirme yap
        if (!columnId) {
            // Yapılacak
            if (status.includes('yap') || status.includes('not') || status.includes('start')) {
                columnId = 'notStarted';
            }
            // Devam Ediyor
            else if (status.includes('devam') || status.includes('progress') || status.includes('etmekte')) {
                columnId = 'inProgress';
            }
            // Test
            else if (status.includes('test')) {
                columnId = 'test';
            }
            // Tamamlandı
            else if (status.includes('tamam') || status.includes('done') || status.includes('complet')) {
                columnId = 'done';
            }
            // Varsayılan
            else {
                console.warn(`Bilinmeyen görev durumu: ${task.status}, varsayılan 'notStarted' kullanılıyor`);
                columnId = 'notStarted';
            }
        }
        
        // Görev sayısını artır
        taskCounts[columnId] = (taskCounts[columnId] || 0) + 1;
        
        // İlgili sütunu bul
        const column = document.querySelector(`.kanban-column-content[data-status="${columnId}"]`);
        if (column) {
            const taskCard = createTaskCard(task);
            column.appendChild(taskCard);
        } else {
            console.error(`'${columnId}' id'li sütun bulunamadı`);
        }
    });
    
    // Sütun başlıklarına görev sayılarını ekle
    document.querySelectorAll('.kanban-column-header').forEach(header => {
        const columnId = header.closest('.kanban-column').id;
        const countBadge = header.querySelector('.task-count-badge');
        
        if (countBadge) {
            countBadge.textContent = taskCounts[columnId] || 0;
        } else {
            const title = header.querySelector('h5');
            if (title) {
                const badge = document.createElement('span');
                badge.className = 'badge bg-light text-dark ms-2 task-count-badge';
                badge.textContent = taskCounts[columnId] || 0;
                title.appendChild(badge);
            }
        }
    });
    
    // Sürükle-bırak için olay dinleyicilerini yeniden ekle
    setupDragAndDrop();
}

// Yardımcı fonksiyon: Her türlü (string, Date objesi, null, undefined, geçersiz) tarihi düzgün formatlar
function formatDateTR(date) {
    // Boş, null veya undefined değerler için null döndür
    if (!date) return null;
    
    try {
        let d = date;
        
        // Eğer string ise ve ISO formatında değilse düzeltmeye çalış
        if (typeof d === 'string') {
            // Boş string kontrolü
            if (d.trim() === '') return null;
            
            // Türkçe tarih formatı (GG.AA.YYYY) kontrolü
            if (/^\d{1,2}[.\/-]\d{1,2}[.\/-]\d{4}$/.test(d)) {
                const parts = d.split(/[.\/-]/);
                d = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
            
            // Tarih nesnesine çevir
            d = new Date(d);
        } else if (typeof d === 'number') {
            // Timestamp ise Date nesnesine çevir
            d = new Date(d);
        }
        
        // Geçerli bir Date nesnesi mi kontrol et
        if (d instanceof Date && !isNaN(d.getTime())) {
            // Türkçe formatında döndür (GG.AA.YYYY)
            return d.toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
        
        return null;
    } catch (error) {
        console.error('Tarih formatı hatası:', error, 'Tarih:', date);
        return null;
    }
}

// Görev kartı oluştur
function createTaskCard(task) {
    const template = document.getElementById('taskCardTemplate');
    const taskCard = document.importNode(template.content, true).querySelector('.task-card');
    
    // Görev bilgilerini karta ekle
    taskCard.setAttribute('data-task-id', task.id || task._id || '');
    taskCard.setAttribute('data-status', task.status || 'Yapılacak');
    
    // Proje ID'sini de sakla
    const projectId = currentProject ? currentProject.id : '';
    taskCard.setAttribute('data-project-id', projectId);
    
    // Silme butonu ekle
    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-sm btn-danger position-absolute top-0 end-0 m-2';
    deleteButton.innerHTML = '<i class="bi bi-trash"></i>';
    deleteButton.style.opacity = '0';
    deleteButton.style.transition = 'opacity 0.2s';
    deleteButton.onclick = (e) => {
        e.stopPropagation(); // Kart tıklama olayını engelle
        if (confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
            deleteTask(task.id || task._id);
        }
    };
    taskCard.appendChild(deleteButton);
    
    // Hover efekti için event listener'lar
    taskCard.addEventListener('mouseenter', () => {
        deleteButton.style.opacity = '1';
    });
    
    taskCard.addEventListener('mouseleave', () => {
        deleteButton.style.opacity = '0';
    });
    
    // Başlık - max 2 satır göster
    const titleElement = taskCard.querySelector('.task-card-title');
    titleElement.textContent = task.title || 'Başlıksız Görev';
    titleElement.style.display = '-webkit-box';
    titleElement.style.webkitLineClamp = '2';
    titleElement.style.webkitBoxOrient = 'vertical';
    titleElement.style.overflow = 'hidden';
    titleElement.style.textOverflow = 'ellipsis';
    titleElement.style.fontWeight = '600';
    titleElement.style.fontSize = '1rem';
    titleElement.style.marginBottom = '8px';
    
    // Açıklama - max 2 satır göster
    const descElement = taskCard.querySelector('.task-card-description');
    descElement.textContent = task.description || 'Açıklama yok';
    descElement.style.display = '-webkit-box';
    descElement.style.webkitLineClamp = '2';
    descElement.style.webkitBoxOrient = 'vertical';
    descElement.style.overflow = 'hidden';
    descElement.style.textOverflow = 'ellipsis';
    descElement.style.flex = '1';
    descElement.style.fontSize = '0.85rem';
    descElement.style.color = '#6c757d';
    
    // Atanan kişi robust göster
    let assignee = '';
    if (typeof task.assignee === 'string' && task.assignee.trim() !== '') {
        assignee = task.assignee;
    } else if (task.assignee && task.assignee.name) {
        assignee = task.assignee.name;
    } else if (task.assignedTo) {
        if (typeof task.assignedTo === 'string' && task.assignedTo.trim() !== '') {
            assignee = task.assignedTo;
        } else if (task.assignedTo && task.assignedTo.name) {
            assignee = task.assignedTo.name;
        } else if (task.assignedTo && task.assignedTo.email) {
            assignee = task.assignedTo.email;
        }
    }
    
    if (!assignee || assignee.trim() === '') {
        assignee = 'Atanmamış';
    }
    
    const assigneeElement = taskCard.querySelector('.task-card-assignee');
    assigneeElement.innerHTML = `<i class="bi bi-person-circle me-1"></i>${assignee}`;
    assigneeElement.style.fontSize = '0.85rem';
    assigneeElement.style.color = '#495057';
    assigneeElement.style.padding = '4px 0';
    assigneeElement.style.display = 'flex';
    assigneeElement.style.alignItems = 'center';
    
    // Tarihleri robust göster - her durumda bir tarih gösterilmesini sağla
    const dateElement = taskCard.querySelector('.task-card-date');
    
    // Tüm olası tarih alanlarını kontrol et
    let startDate = null;
    let endDate = null;
    
    // Başlangıç tarihi için tüm olası alanları kontrol et
    if (task.startDate) startDate = task.startDate;
    else if (task.createdAt) startDate = task.createdAt;
    
    // Bitiş tarihi için tüm olası alanları kontrol et
    if (task.endDate) endDate = task.endDate;
    else if (task.dueDate) endDate = task.dueDate;
    
    // Tarihleri formatla
    const formattedStartDate = formatDateTR(startDate);
    const formattedEndDate = formatDateTR(endDate);
    
    // Tarih metni oluştur
    let dateText = '';
    if (formattedStartDate && formattedEndDate) {
        dateText = `<i class="bi bi-calendar-event me-1"></i>${formattedStartDate} - ${formattedEndDate}`;
    } else if (formattedStartDate) {
        dateText = `<i class="bi bi-calendar-event me-1"></i>Başlangıç: ${formattedStartDate}`;
    } else if (formattedEndDate) {
        dateText = `<i class="bi bi-calendar-check me-1"></i>Bitiş: ${formattedEndDate}`;
    } else {
        dateText = `<i class="bi bi-calendar me-1"></i>Tarih belirtilmemiş`;
    }
    
    // HTML içeriği olarak ayarla ve stil ekle
    dateElement.innerHTML = dateText;
    dateElement.style.fontSize = '0.85rem';
    dateElement.style.color = '#495057';
    dateElement.style.marginTop = '8px';
    dateElement.style.display = 'flex';
    dateElement.style.alignItems = 'center';
    
    // Görev durumuna göre kartın üst kenarına renk ekle
    const statusColors = {
        'Yapılacak': '#6c757d', // Gri
        'Devam Ediyor': '#0d6efd', // Mavi
        'Test Edilecek': '#ffc107', // Sarı
        'Tamamlandı': '#198754'  // Yeşil
    };
    
    const statusColor = statusColors[task.status] || statusColors['Yapılacak'];
    
    // Modern görünüm için stil düzenlemeleri
    taskCard.style.borderTop = `3px solid ${statusColor}`;
    taskCard.style.borderRadius = '8px';
    taskCard.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
    taskCard.style.transition = 'transform 0.2s, box-shadow 0.2s';
    
    // Hover efekti için event listener ekle
    taskCard.addEventListener('mouseenter', () => {
        taskCard.style.transform = 'translateY(-3px)';
        taskCard.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.1)';
    });
    
    taskCard.addEventListener('mouseleave', () => {
        taskCard.style.transform = 'translateY(0)';
        taskCard.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
    });
    
    // Görev detaylarını görüntülemek için tıklama olayı ekle
    taskCard.addEventListener('click', (e) => {
        if (!taskCard.classList.contains('dragging')) {
            const id = taskCard.getAttribute('data-task-id');
            const freshTask = tasks.find(t => (t.id || t._id) == id);
            showTaskDetails(freshTask || task);
        }
    });
    
    // Sürükle-bırak için olaylar ekle
    taskCard.addEventListener('dragstart', handleDragStart);
    taskCard.addEventListener('dragend', handleDragEnd);
    return taskCard;
}

// Görev silme fonksiyonu
async function deleteTask(taskId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`${API_URL.projects}/${currentProject.id}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('API yanıt detayı:', errorData);
            throw new Error('API yanıtı hatası: ' + response.status);
        }

        // Görevi tasks dizisinden kaldır
        tasks = tasks.filter(t => (t.id || t._id) !== taskId);

        // Görevleri yeniden render et
        renderTasks();

        // Başarı mesajı göster
        showAlert('Görev başarıyla silindi', 'success');

    } catch (error) {
        console.error('Görev silinirken hata:', error);
        showAlert('Bu görevi silme yetkiniz yok','warning');
    }
}

// Görev detaylarını göster
function showTaskDetails(task) {
    // Başlık
    document.getElementById('detailTaskTitle').textContent = task.title || 'Başlıksız Görev';
    
    // Açıklama
    document.getElementById('detailTaskDescription').textContent = task.description || 'Açıklama yok';
    
    // Tarihleri formatlayarak göster
    const startDateElem = document.getElementById('detailTaskStartDate');
    const endDateElem = document.getElementById('detailTaskEndDate');
    
    // Tüm olası tarih alanlarını kontrol et
    let startDate = null;
    let endDate = null;
    
    // Başlangıç tarihi için tüm olası alanları kontrol et
    if (task.startDate) startDate = task.startDate;
    else if (task.createdAt) startDate = task.createdAt;
    
    // Bitiş tarihi için tüm olası alanları kontrol et
    if (task.endDate) endDate = task.endDate;
    else if (task.dueDate) endDate = task.dueDate;
    
    // Tarihleri formatla ve göster
    startDateElem.textContent = formatDateTR(startDate) || '-';
    endDateElem.textContent = formatDateTR(endDate) || '-';
    
    // Atanan kişi bilgisini göster
    let assignee = '';
    if (typeof task.assignee === 'string' && task.assignee.trim() !== '') {
        assignee = task.assignee;
    } else if (task.assignee && task.assignee.name) {
        assignee = task.assignee.name;
    } else if (task.assignedTo) {
        if (typeof task.assignedTo === 'string' && task.assignedTo.trim() !== '') {
            assignee = task.assignedTo;
        } else if (task.assignedTo && task.assignedTo.name) {
            assignee = task.assignedTo.name;
        } else if (task.assignedTo && task.assignedTo.email) {
            assignee = task.assignedTo.email;
        }
    }
    
    if (!assignee || assignee.trim() === '') {
        assignee = 'Atanmamış';
    }
    
    document.getElementById('detailTaskAssignee').textContent = assignee;
    
    // Durum bilgisini Türkçe olarak göster
    let status = task.status || 'Yapılacak';
    
    // Eğer İngilizce durum kodu ise Türkçe karşılığını göster
    const statusMap = {
        'notStarted': 'Yapılacak',
        'inProgress': 'Devam Ediyor',
        'test': 'Test Edilecek',
        'done': 'Tamamlandı'
    };
    
    if (statusMap[status.toLowerCase()]) {
        status = statusMap[status.toLowerCase()];
    }
    
    const statusElem = document.getElementById('detailTaskStatus');
    statusElem.textContent = status;
    
    // Durum rengini ayarla
    const statusColors = {
        'Yapılacak': 'secondary',
        'Devam Ediyor': 'primary',
        'Test Edilecek': 'warning',
        'Tamamlandı': 'success'
    };
    
    // Önceki renk sınıflarını kaldır
    statusElem.classList.remove('text-secondary', 'text-primary', 'text-warning', 'text-success');
    
    // Yeni renk sınıfını ekle
    const colorClass = statusColors[status] || 'secondary';
    statusElem.classList.add(`text-${colorClass}`);
    
    // Düzenleme butonunu gizle
    const editButton = document.querySelector('#taskDetailModal .btn-primary');
    if (editButton) {
        editButton.style.display = 'none';
    }
    
    // Modal'ı göster
    const modal = new bootstrap.Modal(document.getElementById('taskDetailModal'));
    modal.show();
}

// Yeni görev kaydet
async function saveTask() {
    try {
        // Form verilerini al
        const taskTitle = document.getElementById('taskTitle').value.trim();
        const taskDescription = document.getElementById('taskDescription').value.trim();
        const taskStartDate = document.getElementById('taskStartDate').value;
        const taskEndDate = document.getElementById('taskEndDate').value;
        const taskAssignee = document.getElementById('taskAssignee').value;
        
        // Validasyon
        if (taskTitle === '') {
            showAlert('Lütfen görev başlığını giriniz.', 'warning');
            return;
        }
        
        // Tarih validasyonu
        if (taskStartDate && taskEndDate && new Date(taskStartDate) > new Date(taskEndDate)) {
            showAlert('Başlangıç tarihi bitiş tarihinden sonra olamaz.', 'warning');
            return;
        }
        
        // Atanan kişi kontrolü
        let assigneeId = taskAssignee;
        
        // Eğer atanan kişi seçilmemişse veya geçersizse
        if (!assigneeId || assigneeId === '') {
            console.log('Atanan kişi seçilmedi, proje sahibi kullanılıyor');
            // Proje sahibini kullan (eğer varsa)
            if (currentProject && currentProject.owner) {
                assigneeId = currentProject.owner;
            } else {
                // Atanan kişi alanını boş bırak
                assigneeId = '';
            }
        }
        
        // Yeni görev objesi oluştur - id alanını kaldırıyoruz, MongoDB kendi ObjectId'sini oluşturacak
        const newTask = {
            title: taskTitle,
            description: taskDescription,
            startDate: taskStartDate,
            endDate: taskEndDate,
            assignedTo: assigneeId, // assignee yerine assignedTo kullan
            status: 'Yapılacak' // Varsayılan durum: Yapılacak
        };
        
        // İç kullanım için geçici bir id oluştur (API'ye gönderilmeyecek)
        const tempTaskId = `task-${Date.now()}`;
        
        // Yükleniyor göstergesi göster
        showLoadingOverlay('Görev kaydediliyor');
        
        // Görevi API'ye kaydet
        try {
            console.log('Görev kaydediliyor:', newTask);
            console.log('Proje ID:', currentProject.id);
            
            // API URL'ini kontrol et
            console.log('API URL:', API_URL.tasks);
            
            // Varsayılan olarak localStorage'dan token al
            let token = localStorage.getItem('token');
            console.log('Token:', token ? 'Token mevcut' : 'Token bulunamadı');
            
            // Eğer token yoksa, basit bir test token'i kullan
            if (!token) {
                console.warn('Token bulunamadı, test token kullanılıyor');
                token = 'test-token';
            }
            
            // Görevi API'ye gönder - projeler altındaki görevler endpoint'ini kullan
            const response = await fetch(`${API_URL.projects}/${currentProject.id}/tasks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newTask) // Sadece görev verilerini gönder
            });
            
            // Yanıtı kontrol et
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API yanıtı:', errorText);
                throw new Error(`Görev kaydedilirken bir hata oluştu: ${response.status} ${response.statusText}`);
            }
            
            // Yanıtı JSON olarak parse et
            const savedTask = await response.json();
            console.log('Kaydedilen görev:', savedTask);
            
            // Kaydedilen görevi listeye ekle
            if (savedTask.task) {
                // API yanıtında task alanı varsa
                const taskData = savedTask.task;
                const formattedTask = {
                    id: taskData._id || taskData.id || tempTaskId,
                    title: taskData.title || newTask.title,
                    description: taskData.description || newTask.description,
                    startDate: taskData.startDate || newTask.startDate,
                    endDate: taskData.endDate || newTask.endDate,
                    assignee: taskData.assignedTo || assigneeId,
                    status: taskData.status || 'Yapılacak'
                };
                tasks.push(formattedTask);
                console.log('API yanıtındaki görev listeye eklendi:', formattedTask);
            } else if (savedTask._id || savedTask.id) {
                // API doğrudan görev nesnesini döndürüyorsa
                const formattedTask = {
                    id: savedTask._id || savedTask.id || tempTaskId,
                    title: savedTask.title || newTask.title,
                    description: savedTask.description || newTask.description,
                    startDate: savedTask.startDate || newTask.startDate,
                    endDate: savedTask.endDate || newTask.endDate,
                    assignee: savedTask.assignedTo || assigneeId,
                    status: savedTask.status || 'Yapılacak'
                };
                tasks.push(formattedTask);
                console.log('Formatlanmış görev listeye eklendi:', formattedTask);
            } else {
                // Yedek olarak orijinal görevi ekle
                const backupTask = {
                    id: tempTaskId,
                    ...newTask
                };
                tasks.push(backupTask);
                console.log('Orijinal görev listeye eklendi:', backupTask);
            }
            
            // Görevleri yeniden render et
            renderTasks();
            console.log('Görevler yeniden render edildi');
            
            // Başarı mesajı göster
            showAlert('Görev başarıyla oluşturuldu!', 'success');
            
            // Modal'ı güvenli şekilde kapat
            closeModal('addTaskModal', false); // Sayfayı yenileme
            
            // Formu temizle
            document.getElementById('addTaskForm').reset();
            
            // 2 saniye bekledikten sonra sayfayı yenile
            setTimeout(() => {
                console.log('Sayfa yenileniyor...');
                window.location.reload();
            }, 2000);
            
        } catch (apiError) {
            console.error('API çağrısı hatası:', apiError);
            showAlert(`Görev API'ye kaydedilemedi: ${apiError.message}. Görev geçici olarak kaydedildi.`, 'warning');
            
            // Hata durumunda görevi geçici olarak listeye ekle
            tasks.push(newTask);
            console.log('Hata durumunda görev geçici olarak eklendi:', newTask);
            
            // Görevleri yeniden render et
            renderTasks();
            
            // Modal'ı güvenli şekilde kapat
            closeModal('addTaskModal', false); // Sayfayı yenileme
            
            // Yükleniyor göstergesini kaldır
            document.querySelector('.global-loading-overlay')?.remove();
        }
        

    } catch (error) {
        console.error('Görev kaydedilirken hata oluştu:', error);
        showAlert('Görev kaydedilirken bir hata oluştu.', 'danger');
        
        // Yükleniyor göstergesini kaldır
        document.querySelector('.global-loading-overlay')?.remove();
    }
}

// Yükleniyor göstergesi göster
function showLoadingOverlay(message) {
    // Modern pulse animasyonu için CSS ekle
    const styleId = 'loading-overlay-style';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            @keyframes pulse-animation {
                0% { box-shadow: 0 0 0 0 rgba(13, 110, 253, 0.7); transform: scale(0.95); }
                70% { box-shadow: 0 0 0 15px rgba(13, 110, 253, 0); transform: scale(1); }
                100% { box-shadow: 0 0 0 0 rgba(13, 110, 253, 0); transform: scale(0.95); }
            }
            .loading-pulse {
                animation: pulse-animation 1.5s infinite;
            }
            .loading-dots span {
                display: inline-block;
                animation: loading-dots 1.4s infinite;
            }
            .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
            .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
            @keyframes loading-dots {
                0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
                40% { transform: scale(1); opacity: 1; }
            }
            .global-loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background-color: rgba(255, 255, 255, 0.85);
                backdrop-filter: blur(5px);
                z-index: 9999;
                display: flex;
                justify-content: center;
                align-items: center;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Varsa eski overlay'i kaldır
    const existingOverlay = document.querySelector('.global-loading-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Sayfanın tamamını kaplayan overlay oluştur
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'global-loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="text-center p-4" style="background-color: white; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.08);">
            <div class="d-flex justify-content-center mb-3">
                <div class="rounded-circle bg-primary d-flex align-items-center justify-content-center loading-pulse" 
                     style="width: 60px; height: 60px;">
                    <i class="bi bi-check2-all text-white" style="font-size: 24px;"></i>
                </div>
            </div>
            <h5 class="mb-2">${message}</h5>
            <div class="loading-dots">
                <span class="mx-1 fs-4">.</span>
                <span class="mx-1 fs-4">.</span>
                <span class="mx-1 fs-4">.</span>
            </div>
        </div>
    `;
    
    // Body'ye ekle
    document.body.appendChild(loadingOverlay);
    
    return loadingOverlay;
}

// Görev atama seçeneklerini güncelle
async function updateTaskAssigneeOptions() {
    try {
        console.log('updateTaskAssigneeOptions çağrıldı');
        
        // Ekip üyeleri listesini al
        let teamMembers = [];
        
        // Backend 'team' alanını kullanıyor, frontend bazen 'teamMembers' kullanıyor
        if (currentProject && currentProject.team && Array.isArray(currentProject.team)) {
            teamMembers = currentProject.team;
            console.log('currentProject.team kullanılıyor:', teamMembers);
        } else if (currentProject && currentProject.teamMembers && Array.isArray(currentProject.teamMembers)) {
            teamMembers = currentProject.teamMembers;
            console.log('currentProject.teamMembers kullanılıyor:', teamMembers);
        } else {
            console.warn('Projede ekip üyesi bulunamadı veya geçerli bir formatta değil');
            teamMembers = [];
        }
        
        // Tüm görev atama seçim kutularını bul
        const assigneeSelects = document.querySelectorAll('.task-assignee');
        console.log(`${assigneeSelects.length} adet görev atama seçim kutusu bulundu`);
        
        if (assigneeSelects.length === 0) {
            console.warn('Görev atama seçim kutusu bulunamadı');
            return;
        }
        
        // Ekip üyelerinin bilgilerini işle
        const processedTeamMembers = [];
        
        // Eğer ekip üyeleri sadece ID'lerden oluşuyorsa, kullanıcı bilgilerini getir
        if (teamMembers.length > 0 && typeof teamMembers[0] === 'string') {
            console.log('Ekip üyeleri ID listesi, kullanıcı bilgilerini getiriyoruz');
            
            // Test amaçlı sabit kullanıcı verileri (API çağrısı başarısız olursa kullanılacak)
            const mockUsers = [
                { id: '1', name: 'Hussein Sadek' },
                { id: '2', name: 'Ahmet Yılmaz' },
                { id: '3', name: 'Ayşe Demir' },
                { id: '4', name: 'Mehmet Kaya' },
                { id: '5', name: 'Zeynep Çelik' }
            ];
            
            // Her bir ID için kullanıcı bilgilerini ekle
            for (const memberId of teamMembers) {
                // Önce mock verilerinde ara
                const mockUser = mockUsers.find(user => user.id === memberId);
                if (mockUser) {
                    processedTeamMembers.push({
                        id: mockUser.id,
                        name: mockUser.name
                    });
                    console.log(`Kullanıcı bulundu (mock): ${mockUser.name}`);
                    continue;
                }
                
                // Mock verilerde yoksa ID'yi doğrudan kullan
                processedTeamMembers.push({
                    id: memberId,
                    name: `Üye ${memberId}`
                });
                console.log(`Kullanıcı bulunamadı, ID kullanılıyor: ${memberId}`);
            }
        } else {
            // Ekip üyeleri zaten obje listesi ise
            for (const member of teamMembers) {
                if (typeof member === 'object' && member !== null) {
                    // ID ve isim bilgilerini al
                    const id = member.id || member._id || '';
                    let name = '';
                    
                    // İsim bilgisini çeşitli alanlardan almaya çalış
                    if (member.name) name = member.name;
                    else if (member.fullName) name = member.fullName;
                    else if (member.email) name = member.email;
                    else if (member.username) name = member.username;
                    else name = `Üye ${id}`;
                    
                    processedTeamMembers.push({
                        id: id,
                        name: name
                    });
                    console.log(`İşlenen üye: ${name}`);
                } else if (typeof member === 'string') {
                    // Eğer üye string ise, doğrudan kullan
                    processedTeamMembers.push({
                        id: member,
                        name: member
                    });
                    console.log(`İşlenen üye (string): ${member}`);
                }
            }
        }
        
        console.log('Tüm işlenen ekip üyeleri:', processedTeamMembers);
        
        // Her bir görev atama seçim kutusunu güncelle
        assigneeSelects.forEach(select => {
            // Mevcut seçimi koru
            const currentValue = select.value;
            
            // Seçim kutusunu temizle
            select.innerHTML = '<option value="">Seçiniz</option>';
            
            // İşlenen ekip üyelerini ekle
            processedTeamMembers.forEach(member => {
                if (member.id && member.name) {
                    const option = document.createElement('option');
                    option.value = member.id;
                    option.textContent = member.name;
                    select.appendChild(option);
                }
            });
            
            // Eğer önceki bir seçim varsa, onu tekrar seç
            if (currentValue) {
                const option = select.querySelector(`option[value="${currentValue}"]`);
                if (option) option.selected = true;
            }
        });
        
        console.log('Görev atama seçenekleri başarıyla güncellendi');
    } catch (error) {
        console.error('Görev atama seçeneklerini güncellerken hata:', error);
    }
}

// Sürükle-bırak işlemleri için ayarlar
function setupDragAndDrop() {
    console.log('setupDragAndDrop çağrıldı');
    
    // Önce tüm olay dinleyicilerini kaldır (tekrar eklemeyi önlemek için)
    const draggables = document.querySelectorAll('.task-card');
    const containers = document.querySelectorAll('.kanban-column-content');
    
    // Eski olay dinleyicilerini kaldır
    draggables.forEach(draggable => {
        draggable.removeEventListener('dragstart', handleDragStart);
        draggable.removeEventListener('dragend', handleDragEnd);
    });
    
    containers.forEach(container => {
        container.removeEventListener('dragover', handleDragOver);
        container.removeEventListener('dragenter', handleDragEnter);
        container.removeEventListener('dragleave', handleDragLeave);
        container.removeEventListener('drop', handleDrop);
    });
    
    // Yeni olay dinleyicilerini ekle
    draggables.forEach(draggable => {
        draggable.setAttribute('draggable', 'true');
        draggable.addEventListener('dragstart', handleDragStart);
        draggable.addEventListener('dragend', handleDragEnd);
    });
    
    containers.forEach(container => {
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('dragenter', handleDragEnter);
        container.addEventListener('dragleave', handleDragLeave);
        container.addEventListener('drop', handleDrop);
    });
    
    console.log(`Sürüklenebilir öğe sayısı: ${draggables.length}, Konteyner sayısı: ${containers.length}`);
}

// Sürükleme başladığında
function handleDragStart(e) {
    this.classList.add('dragging');
    e.dataTransfer.setData('text/plain', this.getAttribute('data-task-id'));
    e.dataTransfer.effectAllowed = 'move';
}

// Sürükleme bittiğinde
function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.kanban-column-content').forEach(column => {
        column.classList.remove('drag-over');
    });
}

// Sürüklenen öğe bir sütunun üzerine geldiğinde
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

// Sürüklenen öğe bir sütuna girdiğinde
function handleDragEnter(e) {
    this.classList.add('drag-over');
}

// Sürüklenen öğe bir sütundan çıktığında
function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

// Sürüklenen öğe bir sütuna bırakıldığında
async function handleDrop(e) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const newStatus = e.target.closest('.kanban-column-content').getAttribute('data-status');
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        // Durum değerlerini backend'e uygun şekilde dönüştür
        let statusValue;
        switch(newStatus) {
            case 'notStarted':
                statusValue = 'Yapılacak';
                break;
            case 'inProgress':
                statusValue = 'Devam Etmekte';
                break;
            case 'test':
                statusValue = 'Test Edilecek';
                break;
            case 'done':
                statusValue = 'Tamamlandı';
                break;
            default:
                statusValue = 'Yapılacak';
        }

        // Görev verilerini hazırla
        const taskToUpdate = tasks.find(t => (t.id || t._id) === taskId);
        if (!taskToUpdate) {
            throw new Error('Görev bulunamadı');
        }

        // Sadece durum değişikliğini gönder
        const updatedTaskData = {
            status: statusValue
        };

        console.log('Güncellenecek görev verisi:', updatedTaskData);

        const response = await fetch(`${API_URL.projects}/${currentProject.id}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedTaskData)
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('API yanıt detayı:', errorData);
            throw new Error('API yanıtı hatası: ' + response.status);
        }

        const updatedTask = await response.json();
        console.log('Görev güncellendi:', updatedTask);

        // Görevler dizisini güncelle
        const taskIndex = tasks.findIndex(t => (t.id || t._id) === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex] = { ...tasks[taskIndex], ...updatedTask };
        }

        // Görev kartını yeni sütuna taşı
        const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskCard) {
            e.target.closest('.kanban-column-content').appendChild(taskCard);
        }

        // Görevleri yeniden render et
        renderTasks();

        // Başarı mesajı göster
        showAlert('Görev durumu başarıyla güncellendi', 'success');

    } catch (error) {
        console.error('Görev durumu güncellenirken hata:', error);
        showAlert('Bu görevi güncelleme yetkiniz yok', 'warning');
        
        // Hata durumunda görevleri orijinal durumlarına geri döndür
        renderTasks();
    }
}

// Durum bilgisini Türkçe olarak göstermek için kullanılan map
const statusMap = {
    'notStarted': 'Yapılacak',
    'inProgress': 'Devam Ediyor',
    'test': 'Test Edilecek',
    'done': 'Tamamlandı'
};

// Status eşleştirme tablosu (Türkçe -> İngilizce Kanban sütun id'leri)
const statusMapping = {
    // Türkçe status değerleri (backend'den gelen)
    'yapılacak': 'notStarted',
    'yapilacak': 'notStarted',
    'devam ediyor': 'inProgress',
    'devamediyor': 'inProgress',
    'devam etmekte': 'inProgress',
    'devametmekte': 'inProgress',
    'test edilecek': 'test',
    'testedilecek': 'test',
    'tamamlandı': 'done',
    'tamamlandi': 'done',
    // İngilizce status değerleri (frontend'de kullanılan)
    'notstarted': 'notStarted',
    'inprogress': 'inProgress',
    'test': 'test',
    'done': 'done'
};

// Proje düzenleme modalını aç
function openEditProjectModal() {
    // Mevcut proje bilgilerini forma doldur
    document.getElementById('projectName').value = currentProject.name;
    document.getElementById('projectDescriptionInput').value = currentProject.description;
    
    // Başlangıç ve bitiş tarihlerini forma doldur
    if (currentProject.startDate) {
        document.getElementById('projectStartDateInput').value = formatDateForInput(currentProject.startDate);
    } else {
        document.getElementById('projectStartDateInput').value = '';
    }
    
    if (currentProject.endDate) {
        document.getElementById('projectEndDateInput').value = formatDateForInput(currentProject.endDate);
    } else {
        document.getElementById('projectEndDateInput').value = '';
    }
    
    // Ekip üyeleri listesini temizle
    const editTeamMembersList = document.getElementById('editTeamMembersList');
    editTeamMembersList.innerHTML = '';
    
    // Mevcut ekip üyelerini forma ekle
    // Hem teamMembers hem de team alanını kontrol et
    const teamMembers = currentProject.teamMembers || currentProject.team || [];
    console.log('Düzenleme modalında gösterilecek ekip üyeleri:', teamMembers);
    
    if (teamMembers.length > 0) {
        // Eğer ekip üyeleri ID listesi ise (backend'den gelen)
        if (typeof teamMembers[0] === 'string') {
            // Her bir ID için kullanıcı bilgilerini getir
            teamMembers.forEach(async (memberId) => {
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`${API_URL.users}/${memberId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (response.ok) {
                        const user = await response.json();
                        // Kullanıcıyı düzenleme listesine ekle
                        addTeamMemberToEditList({
                            id: user._id || user.id,
                            name: user.name || user.email || user.username
                        });
                    }
                } catch (error) {
                    console.error(`Kullanıcı bilgisi alınırken hata: ${memberId}`, error);
                }
            });
        } else {
            // Ekip üyeleri zaten obje ise
            teamMembers.forEach(member => {
                if (member) {
                    // API'den gelen kullanıcı verilerinde id yoksa _id kullan
                    const memberId = member._id || member.id;
                    if (memberId) {
                        addTeamMemberToEditList({
                            id: memberId,
                            name: member.name || member.email || member.username
                        });
                    }
                }
            });
        }
    }
    
    // Ekip üyesi arama alanına autocomplete ekle
    const editTeamMemberInput = document.getElementById('editTeamMemberInput');
    const editTeamMemberSuggestions = document.getElementById('editTeamMemberSuggestions');
    
    // Önceki event listener'ları temizle
    const newEditTeamMemberInput = editTeamMemberInput.cloneNode(true);
    editTeamMemberInput.parentNode.replaceChild(newEditTeamMemberInput, editTeamMemberInput);
    
    // Yeni event listener'lar ekle
    setupTeamMemberAutocomplete(newEditTeamMemberInput, editTeamMemberSuggestions, 'editTeamMembersList');
}

// Tarih formatını input için düzenle (YYYY-MM-DD)
function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// Düzenleme modunda ekip üyesini listeye ekle
function addTeamMemberToEditList(member) {
    if (!member || !member.id) return;
    
    const membersList = document.getElementById('editTeamMembersList');
    
    // Zaten eklenmiş mi kontrol et
    if (document.querySelector(`[data-member-id="${member.id}"]`)) {
        return; // Zaten eklenmişse tekrar ekleme
    }
    
    const memberBadge = document.createElement('div');
    memberBadge.className = 'badge bg-primary d-flex align-items-center p-2 user-select-none';
    memberBadge.dataset.memberId = member.id;
    memberBadge.innerHTML = `
        <span>${member.name || member.email || member.username}</span>
        <button type="button" class="btn-close btn-close-white ms-2" aria-label="Kaldır"></button>
    `;
    
    // Silme butonu için event listener
    const removeButton = memberBadge.querySelector('.btn-close');
    removeButton.addEventListener('click', () => memberBadge.remove());
    
    membersList.appendChild(memberBadge);
}

// Projeyi kaydet
async function saveProject() {
    // Form verilerini al
    const projectName = document.getElementById('projectName').value.trim();
    const projectDescription = document.getElementById('projectDescriptionInput').value.trim();
    const projectStartDate = document.getElementById('projectStartDateInput').value;
    const projectEndDate = document.getElementById('projectEndDateInput').value;
    
    // Ekip üyelerini al
    const teamMembers = [];
    document.querySelectorAll('#editTeamMembersList [data-member-id]').forEach(badge => {
        const memberId = badge.dataset.memberId;
        const memberName = badge.querySelector('span').textContent;
        if (memberId) {
            teamMembers.push({
                id: memberId,
                name: memberName
            });
        }
    });
    
    // Validasyon
    if (projectName === '') {
        showAlert('Lütfen proje adını giriniz.', 'warning');
        return;
    }
    
    // Tarih validasyonu
    if (projectStartDate && projectEndDate && new Date(projectStartDate) > new Date(projectEndDate)) {
        showAlert('Başlangıç tarihi bitiş tarihinden sonra olamaz.', 'warning');
        return;
    }
    
    // Güncellenmiş proje objesi oluştur
    const updatedProject = {
        title: projectName,                    // 'name' yerine 'title' kullan
        description: projectDescription,
        startDate: projectStartDate || null,
        endDate: projectEndDate || null,
        team: teamMembers.map(member => member.id)  // Sadece ID'leri gönder, 'teamMembers' yerine 'team' kullan
    };
    
    try {
        console.log('Güncellenecek proje:', updatedProject);
        
        // API'ye proje güncellemesi gönder
        const response = await fetch(`${API_URL.projects}/${currentProject.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedProject)
        });
        
        if (!response.ok) {
            throw new Error('Proje güncellenirken bir hata oluştu');
        }
        
        const updatedProjectData = await response.json();
        console.log('Güncellenen proje verileri:', updatedProjectData);
        
        // Backend'den gelen veriyi frontend formatına dönüştür
        // Doğrudan atama yapmak yerine, veri yapısını dönüştür
        currentProject = {
            id: updatedProjectData._id || updatedProjectData.id || currentProject.id,
            name: updatedProjectData.title || updatedProjectData.name || projectName,
            description: updatedProjectData.description || projectDescription,
            startDate: updatedProjectData.startDate || projectStartDate,
            endDate: updatedProjectData.endDate || projectEndDate,
            owner: updatedProjectData.owner || currentProject.owner,
            // Ekip üyeleri için hem team hem de teamMembers alanını kontrol et
            // Eğer backend sadece ID listesi döndüyse, mevcut ekip üyesi nesnelerini koru
            teamMembers: teamMembers
        };
        
        console.log('Güncellenmiş currentProject:', currentProject);
        
        // Proje detaylarını yeniden render et
        renderProjectDetails();
        
        // Görev atama seçeneklerini güncelle (ekip üyeleri değişmiş olabilir)
        updateTaskAssigneeOptions();
        
        // Modalı güvenli şekilde kapat
        closeModal('editProjectModal');
        
        // Başarı mesajı göster
        showAlert('Proje başarıyla güncellendi', 'success');
        
    } catch (error) {
        console.error('Proje güncelleme hatası:', error);
        showAlert('Proje güncellenirken bir hata oluştu: ' + error.message, 'danger');
    }
}

// Üye ekleme modalını aç
async function openAddTeamMemberModal() {
    console.log('openAddTeamMemberModal fonksiyonu çağrıldı');
    
    // Modalı aç
    const addTeamMemberModal = new bootstrap.Modal(document.getElementById('addTeamMemberModal'));
    addTeamMemberModal.show();
    
    // Seçilen ekip üyeleri listesini göster
    const teamMembersList = document.getElementById('teamMembersList');
    if (!teamMembersList) {
        console.error('teamMembersList elementi bulunamadı');
        return;
    }
    
    // Mevcut ekip üyelerini göster
    teamMembersList.innerHTML = '';
    console.log('Ekip üyeleri listesi hazırlanıyor');
    
    // Mevcut ekip üyelerini al ve görüntüle
    if (currentProject && (currentProject.team || currentProject.teamMembers)) {
        const teamMembers = currentProject.team || currentProject.teamMembers || [];
        console.log('Mevcut ekip üyeleri:', teamMembers);
        
        // Eğer ekip üyeleri ID listesi ise, kullanıcı bilgilerini getir
        if (teamMembers.length > 0 && typeof teamMembers[0] !== 'object') {
            // API'den kullanıcı bilgilerini getir
            try {
                const token = localStorage.getItem('token');
                // Her bir ekip üyesini görüntüle
                teamMembers.forEach(async (memberId) => {
                    try {
                        const response = await fetch(`${API_URL.users}/${memberId}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        
                        if (response.ok) {
                            const user = await response.json();
                            // Kullanıcıyı badge listesine ekle
                            addTeamMemberToBadgeList({
                                id: user._id || user.id,
                                name: user.name || user.email || user.username
                            }, 'teamMembersList');
                        }
                    } catch (error) {
                        console.error(`Kullanıcı bilgisi alınırken hata: ${memberId}`, error);
                        // Hata durumunda sadece ID ile ekle
                        addTeamMemberToBadgeList({
                            id: memberId,
                            name: `Kullanıcı #${memberId.substring(0, 6)}`
                        }, 'teamMembersList');
                    }
                });
            } catch (error) {
                console.error('Ekip üyeleri yüklenirken hata:', error);
            }
        } else if (teamMembers.length > 0) {
            // Ekip üyeleri zaten obje ise, doğrudan görüntüle
            teamMembers.forEach(member => {
                addTeamMemberToBadgeList({
                    id: member._id || member.id,
                    name: member.name || member.email || member.username
                }, 'teamMembersList');
            });
        }
    }
    
    // Arama sonuçlarını temizle
    const userSearchResults = document.getElementById('userSearchResults');
    if (userSearchResults) {
        userSearchResults.innerHTML = '';
    }
    
    // Arama alanını temizle
    const teamMemberInput = document.getElementById('teamMemberInput');
    if (teamMemberInput) {
        teamMemberInput.value = '';
    }
    
    // Arama butonuna tıklama olayı ekle
    const searchUsersBtn = document.getElementById('searchUsersBtn');
    if (searchUsersBtn) {
        // Önceki event listener'ları temizle
        const newSearchUsersBtn = searchUsersBtn.cloneNode(true);
        searchUsersBtn.parentNode.replaceChild(newSearchUsersBtn, searchUsersBtn);
        
        // Yeni event listener ekle
        newSearchUsersBtn.addEventListener('click', function() {
            console.log('Arama butonuna tıklandı');
            searchUsers();
        });
    }
    
    // Enter tuşuna basıldığında arama yap
    if (teamMemberInput) {
        // Önceki event listener'ları temizle
        const newTeamMemberInput = teamMemberInput.cloneNode(true);
        teamMemberInput.parentNode.replaceChild(newTeamMemberInput, teamMemberInput);
        
        // Yeni event listener ekle
        newTeamMemberInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                console.log('Enter tuşuna basıldı');
                searchUsers();
            }
        });
    }
    
    // Kaydet butonuna tıklama olayı ekle
    const saveTeamMembersBtn = document.getElementById('saveTeamMembersBtn');
    if (saveTeamMembersBtn) {
        // Önceki event listener'ları temizle
        const newSaveTeamMembersBtn = saveTeamMembersBtn.cloneNode(true);
        saveTeamMembersBtn.parentNode.replaceChild(newSaveTeamMembersBtn, saveTeamMembersBtn);
        
        // Yeni event listener ekle
        newSaveTeamMembersBtn.addEventListener('click', function() {
            console.log('Kaydet butonuna tıklandı');
            saveTeamMembers();
        });
    }
    
    // Hemen örnek kullanıcıları göster
    searchUsers();
}

// Ekip üyesini badge listesine ekle
function addTeamMemberToBadgeList(member, listId) {
    if (!member) {
        console.error('Geçersiz üye bilgisi:', member);
        return;
    }
    
    // API'den gelen kullanıcı verilerinde id yoksa _id kullan veya varsayılan değer ata
    if (!member.id && member._id) {
        member.id = member._id;
    } else if (!member.id) {
        // Eğer hiç ID yoksa, geçici bir ID oluştur
        member.id = 'temp_' + Date.now();
    }
    
    const membersList = document.getElementById(listId);
    if (!membersList) {
        console.error(`${listId} ID'li liste bulunamadı`);
        return;
    }
    
    console.log('Ekip üyesi ekleniyor:', member, 'listeye:', listId);
    
    // Zaten eklenmiş mi kontrol et
    const existingMember = membersList.querySelector(`[data-member-id="${member.id}"]`);
    if (existingMember) {
        console.log(`${member.name} zaten ekip üyeleri listesinde`);
        return;
    }
    
    // Yeni badge oluştur
    const badge = document.createElement('span');
    badge.className = 'badge bg-primary me-2 mb-2 p-2 d-flex align-items-center';
    badge.setAttribute('data-member-id', member.id);
    
    // Kullanıcı fotoğrafı için URL al
    const profileImage = member.image || member.profileImage || member.avatar || member.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(member.name) + '&background=random';
    
    // Fotoğraf için img elementi oluştur
    const userImage = document.createElement('img');
    userImage.src = profileImage;
    userImage.className = 'rounded-circle me-1';
    userImage.width = 24;
    userImage.height = 24;
    userImage.onerror = function() { this.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(member.name) + '&background=random'; };
    badge.appendChild(userImage);
    
    // İsim için span elementi oluştur
    const nameSpan = document.createElement('span');
    nameSpan.textContent = member.name;
    badge.appendChild(nameSpan);
    
    // Kaldır butonu oluştur
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'btn-close btn-close-white ms-2';
    removeButton.setAttribute('aria-label', 'Kaldır');
    removeButton.style.fontSize = '0.5rem';
    badge.appendChild(removeButton);
    
    // Badge'i listeye ekle
    membersList.appendChild(badge);
    
    // Kaldır butonuna tıklama olayı ekle
    removeButton.addEventListener('click', function() {
        badge.remove();
    });
    
    console.log(`${member.name} ekip üyeleri listesine eklendi`);
}

// Ekip üyelerini kaydet
async function saveTeamMembers() {
    console.log('saveTeamMembers fonksiyonu çağrıldı');
    
    if (!currentProject || !currentProject.id) {
        showAlert('Proje bilgisi bulunamadı', 'danger');
        return;
    }
    
    try {
        // Seçilen ekip üyelerini al
        const teamMembers = [];
        const teamMemberBadges = document.querySelectorAll('#teamMembersList [data-member-id]');
        
        console.log('Bulunan ekip üyesi badge sayısı:', teamMemberBadges.length);
        
        teamMemberBadges.forEach(badge => {
            const memberId = badge.dataset.memberId;
            const spanElement = badge.querySelector('span');
            
            // Span elementi kontrolü
            if (!spanElement) {
                console.warn('Badge içinde span elementi bulunamadı:', badge.innerHTML);
                return;
            }
            
            const memberName = spanElement.textContent;
            console.log('Ekip üyesi bulundu:', memberId, memberName);
            
            if (memberId) {
                teamMembers.push({
                    id: memberId,
                    name: memberName
                });
            }
        });
        
        console.log('Eklenecek ekip üyeleri:', teamMembers);
        
        // Validasyon
        if (teamMembers.length === 0) {
            showAlert('En az bir ekip üyesi eklemelisiniz.', 'warning');
            return;
        }
        
        // Mevcut projeyi güncelle - mevcut ve yeni ekip üyelerini birleştir
        // Backend 'team' alanını kullanıyor ve sadece ID'leri bekliyor
        // Geçersiz ID'leri filtrele (undefined veya null olanlar)
        const validTeamMemberIds = teamMembers
            .filter(member => member.id && member.id !== 'undefined')
            .map(member => member.id);
        
        // Mevcut ekip üyelerini al
        const existingTeamIds = currentProject.team || [];
        
        // Mevcut ve yeni ekip üyelerini birleştir (tekrar etmeyecek şekilde)
        const allTeamIds = [...new Set([...existingTeamIds, ...validTeamMemberIds])];
        
        console.log('Mevcut ekip üyeleri:', existingTeamIds);
        console.log('Yeni eklenen ekip üyeleri:', validTeamMemberIds);
        console.log('Birleştirilmiş ekip üyeleri:', allTeamIds);
            
        const updatedProject = {
            ...currentProject,
            team: allTeamIds
        };
        
        console.log('Güncellenecek proje:', updatedProject);
        
        // API'ye proje güncellemesi gönder
        const response = await fetch(`${API_URL.projects}/${currentProject.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedProject)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API yanıtı:', errorText);
            throw new Error('Ekip üyeleri güncellenirken bir hata oluştu');
        }
        
        const updatedProjectData = await response.json();
        console.log('Güncellenen proje verileri:', updatedProjectData);
        
        // Mevcut proje verisini güncelle
        currentProject = updatedProjectData;
        
        // Proje detaylarını yeniden render et
        renderProjectDetails();
        
        // Görev atama seçeneklerini güncelle (ekip üyeleri değişmiş olabilir)
        updateTaskAssigneeOptions();
        
        // Modalı güvenli şekilde kapat
        closeModal('addTeamMemberModal');
        
        // Başarı mesajı göster
        showAlert('Ekip üyeleri başarıyla güncellendi', 'success');
        
        // Modern loading göstergesini sayfanın ortasında göster
        // Modern pulse animasyonu için CSS ekle
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse-animation {
                0% { box-shadow: 0 0 0 0 rgba(13, 110, 253, 0.7); transform: scale(0.95); }
                70% { box-shadow: 0 0 0 15px rgba(13, 110, 253, 0); transform: scale(1); }
                100% { box-shadow: 0 0 0 0 rgba(13, 110, 253, 0); transform: scale(0.95); }
            }
            .loading-pulse {
                animation: pulse-animation 1.5s infinite;
            }
            .loading-dots span {
                display: inline-block;
                animation: loading-dots 1.4s infinite;
            }
            .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
            .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
            @keyframes loading-dots {
                0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
                40% { transform: scale(1); opacity: 1; }
            }
            .global-loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background-color: rgba(255, 255, 255, 0.85);
                backdrop-filter: blur(5px);
                z-index: 9999;
                display: flex;
                justify-content: center;
                align-items: center;
            }
        `;
        document.head.appendChild(style);
        
        // Sayfanın tamamını kaplayan overlay oluştur
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'global-loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="text-center p-4" style="background-color: white; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.08);">
                <div class="d-flex justify-content-center mb-3">
                    <div class="rounded-circle bg-primary d-flex align-items-center justify-content-center loading-pulse" 
                         style="width: 60px; height: 60px;">
                        <i class="bi bi-people-fill text-white" style="font-size: 24px;"></i>
                    </div>
                </div>
                <h5 class="mb-2">Ekip üyeleri güncelleniyor</h5>
                <div class="loading-dots">
                    <span class="mx-1 fs-4">.</span>
                    <span class="mx-1 fs-4">.</span>
                    <span class="mx-1 fs-4">.</span>
                </div>
            </div>
        `;
        
        // Body'ye ekle
        document.body.appendChild(loadingOverlay);
        
        // Başarı mesajını gösterdikten sonra sayfayı yenile
        setTimeout(() => {
            console.log('Sayfa yenileniyor...');
            window.location.reload();
        }, 1500); // 1.5 saniye sonra sayfayı yenile (kullanıcının başarı mesajını görmesi için)
        
    } catch (error) {
        console.error('Ekip üyeleri güncelleme hatası:', error);
        showAlert('Ekip üyeleri güncellenirken bir hata oluştu: ' + error.message, 'danger');
    }
}

// Ekip üyelerini görüntüleme fonksiyonu
async function updateTeamMembersDisplay(teamIds) {
    console.log('updateTeamMembersDisplay fonksiyonu çağrıldı:', teamIds);
    
    // Ekip üyeleri bölümünü bul
    const teamMembersSection = document.querySelector('.team-members-section');
    if (!teamMembersSection) {
        console.error('Ekip üyeleri bölümü bulunamadı');
        return;
    }
    
    // Ekip üyeleri listesini bul veya oluştur
    let teamMembersList = teamMembersSection.querySelector('.team-members-list');
    if (!teamMembersList) {
        teamMembersList = document.createElement('div');
        teamMembersList.className = 'team-members-list d-flex flex-wrap gap-2 mt-3';
        teamMembersSection.appendChild(teamMembersList);
    }
    
    // Listeyi temizle
    teamMembersList.innerHTML = '';
    
    // Ekip üyesi yoksa mesaj göster
    if (!teamIds || teamIds.length === 0) {
        teamMembersList.innerHTML = '<p class="text-muted">Henüz ekip üyesi eklenmemiş</p>';
        return;
    }
    
    // Her bir ekip üyesini görüntüle
    const token = localStorage.getItem('token');
    
    for (const memberId of teamIds) {
        try {
            // API'den kullanıcı bilgilerini getir
            const response = await fetch(`${API_URL.users}/${memberId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const user = await response.json();
                // Kullanıcı badge'ini oluştur
                const badge = document.createElement('span');
                badge.className = 'badge bg-primary me-2 mb-2 p-2';
                badge.setAttribute('data-member-id', user._id || user.id);
                
                // İsim için span elementi oluştur
                const nameSpan = document.createElement('span');
                nameSpan.textContent = user.name || user.email || user.username;
                badge.appendChild(nameSpan);
                
                teamMembersList.appendChild(badge);
            } else {
                console.error(`Kullanıcı bilgisi alınamadı: ${memberId}`);
                // Hata durumunda basit bir badge göster
                const badge = document.createElement('span');
                badge.className = 'badge bg-secondary me-2 mb-2 p-2';
                badge.textContent = `Kullanıcı #${memberId.substring(0, 6)}`;
                teamMembersList.appendChild(badge);
            }
        } catch (error) {
            console.error(`Kullanıcı bilgisi alınırken hata: ${memberId}`, error);
        }
    }
}

// Bildirim göster
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        // Alert container yoksa oluştur
        const container = document.createElement('div');
        container.id = 'alertContainer';
        container.className = 'position-fixed top-0 end-0 p-3';
        container.style.zIndex = '5000';
        document.body.appendChild(container);
    }
    
    const alertId = 'alert-' + Date.now();
    const alertHtml = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Kapat"></button>
        </div>
    `;
    
    document.getElementById('alertContainer').innerHTML += alertHtml;
    
    // 5 saniye sonra otomatik kapat
    setTimeout(() => {
        const alertElement = document.getElementById(alertId);
        if (alertElement) {
            const bsAlert = new bootstrap.Alert(alertElement);
            bsAlert.close();
        }
    }, 5000);
}

// Ekip üyesi otomatik tamamlama kurulumu
function setupTeamMemberAutocomplete(inputElement, suggestionsElement, targetListId) {
    if (!inputElement || !suggestionsElement) return;

    // Input değişikliğini dinle
    inputElement.addEventListener('input', function() {
        const query = this.value.trim();
        
        if (query.length < 2) {
            suggestionsElement.innerHTML = '';
            return;
        }

        // Örnek kullanıcı verileri (gerçek uygulamada API'den gelecek)
        const mockUsers = [
            { id: '1', name: 'Hussein Sadek', email: 'hussein@example.com', username: 'hsadek' },
            { id: '2', name: 'Ahmet Yılmaz', email: 'ahmet@example.com', username: 'ayilmaz' },
            { id: '3', name: 'Ayşe Demir', email: 'ayse@example.com', username: 'ademir' },
            { id: '4', name: 'Mehmet Kaya', email: 'mehmet@example.com', username: 'mkaya' },
            { id: '5', name: 'Zeynep Çelik', email: 'zeynep@example.com', username: 'zcelik' }
        ];

        // Kullanıcıları filtrele
        const filteredUsers = mockUsers.filter(user => {
            const searchTerms = query.toLowerCase();
            return (
                (user.name && user.name.toLowerCase().includes(searchTerms)) ||
                (user.email && user.email.toLowerCase().includes(searchTerms)) ||
                (user.username && user.username.toLowerCase().includes(searchTerms))
            );
        });

        // Sonuçları göster
        suggestionsElement.innerHTML = '';
        if (filteredUsers.length === 0) {
            suggestionsElement.innerHTML = '<li class="list-group-item text-center text-muted">Kullanıcı bulunamadı</li>';
            return;
        }

        filteredUsers.forEach(user => {
            const userItem = document.createElement('li');
            userItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            userItem.innerHTML = `
                <span>${user.name || user.email || user.username}</span>
                <button class="btn btn-sm btn-primary add-user-btn" data-user-id="${user.id}" data-user-name="${user.name || user.email || user.username}">Ekle</button>
            `;
            
            suggestionsElement.appendChild(userItem);
            
            // "Ekle" butonuna tıklama olayı ekle
            const addButton = userItem.querySelector('.add-user-btn');
            addButton.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                const userName = this.getAttribute('data-user-name');
                
                // Kullanıcıyı ekip üyeleri listesine ekle
                addTeamMemberToBadgeList({
                    id: userId,
                    name: userName
                }, targetListId);
                
                // Arama alanını temizle
                inputElement.value = '';
                
                // Arama sonuçlarını temizle
                suggestionsElement.innerHTML = '';
                
                // Kullanıcı eklendi bildirimini göster
                showAlert(`${userName} ekip üyesi olarak eklendi`, 'success');
            });
        });
    });

    // Input dışına tıklandığında sonuçları gizle
    document.addEventListener('click', function(e) {
        if (!inputElement.contains(e.target) && !suggestionsElement.contains(e.target)) {
            suggestionsElement.innerHTML = '';
        }
    });
}