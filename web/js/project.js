// Proje Detay Sayfası JavaScript Kodu

// API URL'leri (Backend entegrasyonu için)
// Mobil erişim için IP adresini kullanır.
const API_URL = {
    projects: 'http://localhost:5000/api/projects',
    tasks: 'http://localhost:5000/api/tasks',
    profile: 'http://localhost:5000/api/profile',
    activities: 'http://localhost:5000/api/activities',
    users: 'http://localhost:5000/api/users'
};

// Proje ve görev verileri
let currentProject = null;
let tasks = [];

// DOM yüklendikten sonra çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', () => {
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
    document.getElementById('addTaskBtn').addEventListener('click', function() {
        // Görev ekleme modalını aç
        const addTaskModal = new bootstrap.Modal(document.getElementById('addTaskModal'));
        addTaskModal.show();
        
        // Görev atama seçeneklerini güncelle
        updateTaskAssigneeOptions();
    });
    
    // Görev kaydetme butonuna tıklandığında
    document.getElementById('saveTaskBtn').addEventListener('click', function() {
        saveTask();
    });
    
    // Üye ekleme butonuna tıklandığında
    document.getElementById('addTeamMemberButton').addEventListener('click', function() {
        // Üye ekleme modalını açmadan önce mevcut üyeleri göster
        openAddTeamMemberModal();
    });
    
    // Ekip üyelerini kaydetme butonuna tıklandığında
    document.getElementById('saveTeamMembersBtn').addEventListener('click', function() {
        saveTeamMembers();
    });
    
    // Sürükle-bırak işlemleri için event listener'lar
    setupDragAndDrop();
    
    // Görev düzenleme butonu
    // Görev ekleme panelinde ekip üyesi select'ini doldur
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

// loadProjectDetails çağrısında sonra afterProjectLoaded fonksiyonunu çağır
// Bunu loadProjectDetails fonksiyonunun en sonunda ekleyeceğiz

// Görev düzenleme paneli açılırken ekip üyesi select'ini doldur

    // Seçili görevin ID'sini detay modalinden al
    const taskTitle = document.getElementById('detailTaskTitle').textContent;
    const task = tasks.find(t => t.title === taskTitle);
    if (!task) return;
    // Formu doldur
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDescription').value = task.description || '';
    document.getElementById('editTaskStartDate').value = task.startDate ? task.startDate.substring(0,10) : '';
    document.getElementById('editTaskEndDate').value = task.endDate ? task.endDate.substring(0,10) : '';
    // Ekip üyelerini select olarak doldur
const assigneeSelect = document.getElementById('editTaskAssignee');
assigneeSelect.innerHTML = '<option value="">Atanmamış</option>';
(currentProject.teamMembers || []).forEach(member => {
    const option = document.createElement('option');
    option.value = member;
    option.textContent = member;
    assigneeSelect.appendChild(option);
});
assigneeSelect.value = task.assignee || '';

    document.getElementById('editTaskStatus').value = task.status || 'notStarted';
    // Detay modalını kapat, düzenleme modalını aç
    const detailModal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
    detailModal.hide();
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
            editModal.hide();
        });
    }
    
    // Ekip üyesi ekleme butonu
    document.getElementById('addTeamMemberBtn').addEventListener('click', addTeamMemberField);
    
    // Ekip üyesi otomatik tamamlama kurulumu
    const teamMemberInput = document.getElementById('teamMemberInput');
    const teamMemberSuggestions = document.getElementById('teamMemberSuggestions');
    setupTeamMemberAutocomplete(teamMemberInput, teamMemberSuggestions, 'teamMemberList');
}

// Kullanıcı arama fonksiyonu
function searchUsers() {
    console.log('searchUsers fonksiyonu çağrıldı');
    
    const searchInput = document.getElementById('teamMemberInput');
    const searchResultsList = document.getElementById('userSearchResults');
    
    if (!searchInput || !searchResultsList) {
        console.error('Arama bileşenleri bulunamadı');
        return;
    }
    
    // Yükleniyor mesajı göster
    searchResultsList.innerHTML = '<li class="list-group-item text-center"><div class="spinner-border spinner-border-sm" role="status"></div> Kullanıcılar yükleniyor...</li>';
    
    // Örnek kullanıcı verileri - Daha fazla kullanıcı ekledim
    const mockUsers = [
        { id: '1', name: 'Hussein Sadek', email: 'hussein@example.com', username: 'hsadek' },
        { id: '2', name: 'Ahmet Yılmaz', email: 'ahmet@example.com', username: 'ayilmaz' },
        { id: '3', name: 'Ayşe Demir', email: 'ayse@example.com', username: 'ademir' },
        { id: '4', name: 'Mehmet Kaya', email: 'mehmet@example.com', username: 'mkaya' },
        { id: '5', name: 'Zeynep Çelik', email: 'zeynep@example.com', username: 'zcelik' },
        { id: '6', name: 'Ali Veli', email: 'ali@example.com', username: 'aveli' },
        { id: '7', name: 'Fatma Yaz', email: 'fatma@example.com', username: 'fyaz' },
        { id: '8', name: 'Can Demir', email: 'can@example.com', username: 'cdemir' },
        { id: '9', name: 'Deniz Yıldız', email: 'deniz@example.com', username: 'dyildiz' },
        { id: '10', name: 'Emre Kara', email: 'emre@example.com', username: 'ekara' },
        { id: '11', name: 'Burak Çetin', email: 'burak@example.com', username: 'bcetin' },
        { id: '12', name: 'Selin Arslan', email: 'selin@example.com', username: 'sarslan' },
        { id: '13', name: 'Murat Öz', email: 'murat@example.com', username: 'moz' },
        { id: '14', name: 'Gökhan Taş', email: 'gokhan@example.com', username: 'gtas' },
        { id: '15', name: 'Elif Yılmaz', email: 'elif@example.com', username: 'eyilmaz' }
    ];
    
    // Arama sorgusu
    const query = searchInput.value.trim();
    
    // Kullanıcıları filtrele
    let filteredUsers = mockUsers;
    if (query.length >= 2) {
        filteredUsers = mockUsers.filter(user => {
            const searchTerms = query.toLowerCase();
            return (
                (user.name && user.name.toLowerCase().includes(searchTerms)) ||
                (user.email && user.email.toLowerCase().includes(searchTerms)) ||
                (user.username && user.username.toLowerCase().includes(searchTerms))
            );
        });
    }
    
    // Kısa bir gecikme ekle (yükleme efekti için)
    setTimeout(() => {
        // Arama sonuçlarını temizle
        searchResultsList.innerHTML = '';
        
        console.log('Bulunan kullanıcılar:', filteredUsers);
        
        // Sonuçları göster
        if (filteredUsers.length === 0) {
            searchResultsList.innerHTML = '<li class="list-group-item text-center text-muted">Kullanıcı bulunamadı</li>';
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
    }, 300); // 300ms gecikme ile yükleme efekti oluştur
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
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Kimlik doğrulama hatası!');
        const response = await fetch(`${API_URL.projects}/${projectId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Proje detayları getirilemedi!');
        const data = await response.json();
        
        // DEBUG: API'den gelen verileri konsola yazdır
        console.log('API\'den gelen proje verileri:', data);
        
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

        // Görevleri işle
        if (Array.isArray(data.tasks)) {
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
        } else {
            tasks = [];
        }

        // Proje detaylarını görüntüle
        renderProjectDetails();
        
        // Görevleri görüntüle
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

// Proje detaylarını ekrana render et
function renderProjectDetails() {
    if (!currentProject) return;
    
    // Proje başlığı ve açıklamasını güncelle
    document.getElementById('projectTitle').textContent = currentProject.name;
    document.getElementById('projectDescription').textContent = currentProject.description || 'Açıklama yok';
    document.title = `${currentProject.name} - Proje Yönetim Sistemi`;
    
    // İstatistik bilgilerini göster
    updateProjectStats();
    
    // Başlangıç ve bitiş tarihlerini göster
    updateProjectDates();
    
    // Proje sahibi ve ekip üyelerini göster
    updateProjectTeam();
}    
    // İlerleme yüzdesini hesapla
    const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    
    statsRow.innerHTML = `
        <div class="col-12 mb-3">
            <div class="progress" style="height: 10px;">
                <div class="progress-bar" role="progressbar" style="width: ${progress}%;" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            <div class="d-flex justify-content-between mt-2">
                <small>Tamamlanma: ${progress}%</small>
                <small>Görev Sayısı: ${stats.total}</small>
            </div>
        </div>
        <div class="col-md-3 mb-2">
            <div class="card h-100 border-secondary">
                <div class="card-body text-center">
                    <h5 class="card-title">${stats.todo}</h5>
                    <p class="card-text">Yapılacak</p>
                </div>
            </div>
        </div>
        <div class="col-md-3 mb-2">
            <div class="card h-100 border-primary">
                <div class="card-body text-center">
                    <h5 class="card-title">${stats.inProgress}</h5>
                    <p class="card-text">Devam Ediyor</p>
                </div>
            </div>
        </div>
        <div class="col-md-3 mb-2">
            <div class="card h-100 border-warning">
                <div class="card-body text-center">
                    <h5 class="card-title">${stats.testing}</h5>
                    <p class="card-text">Test Edilecek</p>
                </div>
            </div>
        </div>
        <div class="col-md-3 mb-2">
            <div class="card h-100 border-success">
                <div class="card-body text-center">
                    <h5 class="card-title">${stats.completed}</h5>
                    <p class="card-text">Tamamlandı</p>
                </div>
            </div>
        </div>
    `;

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
    
    // Görev istatistiklerini al
    const stats = currentProject.taskStats || {
        total: tasks ? tasks.length : 0,
        completed: tasks ? tasks.filter(t => t.status === 'Tamamlandı').length : 0,
        inProgress: tasks ? tasks.filter(t => t.status === 'Devam Ediyor').length : 0,
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
        ownerBadge = `<span class='badge bg-warning text-dark me-2'><i class="bi bi-person-badge"></i> Proje Sahibi: ${currentProject.owner.name || currentProject.owner.email || 'Sahip'}</span>`;
    } else if (currentProject.owner) {
        ownerBadge = `<span class='badge bg-warning text-dark me-2'><i class="bi bi-person-badge"></i> Proje Sahibi: ${currentProject.owner}</span>`;
    }
    
    // Modern ekip üyesi kartları (grid)
    let teamListHTML = '';
    if (currentProject.teamMembers && currentProject.teamMembers.length > 0) {
        teamListHTML = `<div class="row row-cols-1 row-cols-sm-2 row-cols-md-4 g-3 mt-2">` +
            currentProject.teamMembers.map(member => {
                if (typeof member === 'string') {
                    return `<div class='col'><div class="card h-100 shadow-sm team-card team-card-hover"><div class="card-body d-flex flex-column align-items-center justify-content-center"><span class='rounded-circle bg-secondary text-white d-inline-flex align-items-center justify-content-center mb-2' style='width:48px;height:48px;font-size:20px;font-weight:bold;'>${member[0].toUpperCase()}</span><h6 class="mb-0">${member}</h6></div></div></div>`;
                } else {
                    const memberName = member.name || member.email || 'Kullanıcı';
                    return `<div class='col'><div class="card h-100 shadow-sm team-card team-card-hover"><div class="card-body d-flex flex-column align-items-center justify-content-center"><span class='rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-2' style='width:48px;height:48px;font-size:20px;font-weight:bold;'>${memberName[0].toUpperCase()}</span><h6 class="mb-0">${memberName}</h6></div></div></div>`;
                }
            }).join('') + `</div>`;
    } else {
        teamListHTML = `<p class="text-muted mt-2">Henüz ekip üyesi eklenmemiş.</p>`;
    }
    
    teamRow.innerHTML = `
        <div class="col-12">
            <div class="d-flex align-items-center">
                ${ownerBadge}
                <button class="btn btn-sm btn-outline-primary" id="addTeamMemberButton" data-bs-toggle="modal" data-bs-target="#addTeamMemberModal">
                    <i class="bi bi-person-plus"></i> Üye Ekle
                </button>
            </div>
            ${teamListHTML}
        </div>
    `;
    
    // Ekstra stil (hover vurgusu)
    const style = document.createElement('style');
    style.innerHTML = `
    .team-card-hover:hover {box-shadow:0 4px 24px #007bff33;border:1.5px solid #0d6efd;transform:translateY(-3px) scale(1.03);transition:all .2s;}
    .team-card {transition:all .2s;}
    `;
    document.head.appendChild(style);
}

// Görevleri ekrana render et
function renderTasks() {
    console.log('renderTasks çağrıldı, görev sayısı:', tasks.length);
    console.log('Mevcut görevler:', tasks);
    
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
    
    // Modal'ı göster
    const modal = new bootstrap.Modal(document.getElementById('taskDetailModal'));
    modal.show();
}

// Yeni görev kaydet
async function saveTask() {
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
    
    // Yeni görev objesi oluştur
    const newTask = {
        id: `task-${Date.now()}`,
        title: taskTitle,
        description: taskDescription,
        startDate: taskStartDate,
        endDate: taskEndDate,
        assignee: taskAssignee,
        status: 'notStarted' // Yeni görevler her zaman 'Not Started' durumunda başlar
    };
    
    try {
        // Gerçek uygulamada burada API çağrısı yapılacak
        // const response = await fetch(API_URL.tasks, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify({
        //         projectId: currentProject.id,
        //         task: newTask
        //     })
        // });
        // const savedTask = await response.json();
        
        // Şimdilik görevi doğrudan listeye ekliyoruz
        tasks.push(newTask);
        
        // Görevleri yeniden render et
        renderTasks();
        
        // Modal'ı kapat
        const modal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
        modal.hide();
        
        // Formu temizle
        document.getElementById('addTaskForm').reset();
        
        showAlert('Görev başarıyla oluşturuldu!', 'success');
    } catch (error) {
        console.error('Görev kaydedilirken hata oluştu:', error);
        showAlert('Görev kaydedilirken bir hata oluştu.', 'danger');
    }
}

// Görev atama seçeneklerini güncelle
function updateTaskAssigneeOptions() {
    const team = currentProject.teamMembers || [];
    const assigneeSelects = document.querySelectorAll('.task-assignee');
    
    assigneeSelects.forEach(select => {
        // Mevcut seçimi koru
        const currentValue = select.value;
        
        // Select'i temizle
        select.innerHTML = '<option value="">Seçiniz</option>';
        
        // Ekip üyelerini ekle
        team.forEach(member => {
            const option = document.createElement('option');
            
            // Farklı API format uyumluluğu
            if (typeof member === 'object' && member !== null) {
                option.value = member._id || '';
                option.textContent = member.name || member.email || '';
                option.setAttribute('data-id', member._id || '');
            } else {
                option.value = member;
                option.textContent = member;
                option.setAttribute('data-id', member);
            }
            
            select.appendChild(option);
        });
        
        // Eğer önceki bir seçim varsa, onu tekrar seç
        if (currentValue) {
            // Önce value ile eşleşmeyi dene
            const optionByValue = select.querySelector(`option[value="${currentValue}"]`);
            if (optionByValue) {
                optionByValue.selected = true;
            } else {
                // Text içeriği ile eşleşmeyi dene
                Array.from(select.options).forEach(option => {
                    if (option.textContent === currentValue) {
                        option.selected = true;
                    }
                });
            }
        }
    });
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
    this.classList.remove('drag-over');
    
    const taskId = e.dataTransfer.getData('text/plain');
    const newColumnStatus = this.getAttribute('data-status');
    
    // Görevi bul
    const taskIndex = tasks.findIndex(task => task.id === taskId || task._id === taskId);
    if (taskIndex === -1) {
        console.error('Görev bulunamadı:', taskId);
        return;
    }
    
    // Kolon ID'sinden Türkçe durum değerini belirle
    const statusMapReverse = {
        'notStarted': 'Yapılacak',
        'inProgress': 'Devam Etmekte',
        'test': 'Test Edilecek',
        'done': 'Tamamlandı'
    };
    
    // Frontend için Türkçe durum değerini al
    const newTurkishStatus = statusMapReverse[newColumnStatus] || 'Yapılacak';
    
    // Mevcut görev durumunu kontrol et - eğer aynıysa işlem yapma
    if (tasks[taskIndex].status === newTurkishStatus) {
        return; // Durum değişmemişse işlem yapma
    }
    
    // Önce UI'da görevi güncelle (hızlı geri bildirim için)
    const originalTask = { ...tasks[taskIndex] }; // Orijinal görevi yedekle
    tasks[taskIndex].status = newTurkishStatus;
    
    // Görevleri yeniden render et
    renderTasks();
    
    try {
        // API çağrısı için token kontrolü
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Oturum bilgisi bulunamadı!');
        }
        
        // API çağrısını yap - doğru endpoint'i kullan
        // Backend'de görev güncelleme endpoint'i: /api/projects/:projectId/tasks/:taskId
        
        // Görev ve görev verilerini konsola yazdır (hata ayıklama için)
        console.log('Güncellenecek görev ID:', taskId);
        console.log('Tüm görevler:', tasks);
        
        // Önce görevin ait olduğu proje ID'sini bul
        const task = tasks.find(t => t.id === taskId || t._id === taskId);
        console.log('Bulunan görev:', task);
        
        // Önce görev kartından proje ID'sini almayı dene
        const taskElement = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
        let projectId = null;
        
        if (taskElement) {
            // Görev kartından proje ID'sini al
            projectId = taskElement.getAttribute('data-project-id');
            console.log('Görev kartından alınan proje ID:', projectId);
        }
        
        // Eğer görev kartından proje ID'si bulunamadıysa, mevcut proje ID'sini kullan
        if (!projectId) {
            const urlParams = new URLSearchParams(window.location.search);
            projectId = urlParams.get('id') || (currentProject ? currentProject.id : null);
            console.log('URL veya currentProject\'den alınan proje ID:', projectId);
        }
        
        if (!projectId) {
            throw new Error('Proje ID bulunamadı!');
        }
        
        // Doğru endpoint'i oluştur
        const endpoint = `${API_URL.projects}/${projectId}/tasks/${taskId}`;
        console.log('Görev güncelleme endpoint:', endpoint);
        
        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status: newTurkishStatus // Backend'e Türkçe durum değerini gönder
            })
        });
        
        if (!response.ok) {
            throw new Error(`API yanıtı hatası: ${response.status}`);
        }
        
        // API yanıtını al ve işle
        const result = await response.json();
        console.log('Görev durumu güncellendi:', result);
        
        // Güncellenmiş görevi API'dan al
        const updatedTask = result;
        
        // Görev nesnesini güncelle
        if (updatedTask) {
            // API'dan gelen görev bilgilerini tasks dizisindeki görev ile birleştir
            Object.assign(tasks[taskIndex], {
                status: newTurkishStatus,
                // Diğer alanları da güncelle
                title: updatedTask.title || tasks[taskIndex].title,
                description: updatedTask.description || tasks[taskIndex].description,
                // Atanan kişi bilgisini güncelle
                assignee: updatedTask.assignedTo ? 
                    (typeof updatedTask.assignedTo === 'string' ? updatedTask.assignedTo : 
                     updatedTask.assignedTo.name || updatedTask.assignedTo.email || '') : 
                    tasks[taskIndex].assignee
            });
        }
        
        // Görevleri yeniden render et
        renderTasks();
        
        // Başarı mesajı göster
        showAlert(`Görev durumu "${newTurkishStatus}" olarak güncellendi.`, 'success');
    } catch (error) {
        console.error('Görev durumu güncellenirken hata oluştu:', error);
        
        // Hata durumunda orijinal görevi geri yükle
        tasks[taskIndex] = originalTask;
        
        // Görevleri yeniden render et
        renderTasks();
        
        // Hata mesajı göster
        showAlert('Görev durumu güncellenirken bir hata oluştu: ' + error.message, 'danger');
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
    if (currentProject.teamMembers && currentProject.teamMembers.length > 0) {
        currentProject.teamMembers.forEach(member => {
            if (member && member.id) {
                addTeamMemberToEditList(member);
            }
        });
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
        ...currentProject,
        name: projectName,
        description: projectDescription,
        startDate: projectStartDate || null,
        endDate: projectEndDate || null,
        teamMembers: teamMembers
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
        
        // Mevcut proje verisini güncelle
        currentProject = updatedProjectData;
        
        // Proje detaylarını yeniden render et
        renderProjectDetails();
        
        // Görev atama seçeneklerini güncelle (ekip üyeleri değişmiş olabilir)
        updateTaskAssigneeOptions();
        
        // Modalı kapat
        const editProjectModal = bootstrap.Modal.getInstance(document.getElementById('editProjectModal'));
        editProjectModal.hide();
        
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
    
    teamMembersList.innerHTML = '';
    console.log('Ekip üyeleri listesi temizlendi');
    
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
    if (!member || !member.id) {
        console.error('Geçersiz üye bilgisi:', member);
        return;
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
    badge.className = 'badge bg-primary me-2 mb-2 p-2';
    badge.setAttribute('data-member-id', member.id);
    badge.innerHTML = `
        ${member.name}
        <button type="button" class="btn-close btn-close-white ms-2" aria-label="Kaldır" style="font-size: 0.5rem;"></button>
    `;
    
    // Badge'i listeye ekle
    membersList.appendChild(badge);
    
    // Kaldır butonuna tıklama olayı ekle
    const removeButton = badge.querySelector('.btn-close');
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
            const memberName = badge.querySelector('span').textContent;
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
        
        // Mevcut projeyi güncelle - doğrudan yeni ekip üyelerini kullan
        // Bu şekilde seçtiğimiz üyeler direkt olarak projeye eklenir
        const updatedProject = {
            ...currentProject,
            teamMembers: teamMembers
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
        
        // Modalı kapat
        const addTeamMemberModal = bootstrap.Modal.getInstance(document.getElementById('addTeamMemberModal'));
        addTeamMemberModal.hide();
        
        // Başarı mesajı göster
        showAlert('Ekip üyeleri başarıyla güncellendi', 'success');
        
    } catch (error) {
        console.error('Ekip üyeleri güncelleme hatası:', error);
        showAlert('Ekip üyeleri güncellenirken bir hata oluştu: ' + error.message, 'danger');
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