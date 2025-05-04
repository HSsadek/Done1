// Proje Detay Sayfası JavaScript Kodu

// API URL'leri (Backend entegrasyonu için)
// Mobil erişim için IP adresini kullanır.
const API_URL = {
    projects: 'http://localhost:5000/api/projects',
    tasks: 'http://localhost:5000/api/tasks',
    profile: 'http://localhost:5000/api/profile',
    activities: 'http://localhost:5000/api/activities'
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
    // Yeni görev ekleme butonu
    document.getElementById('saveTaskBtn').addEventListener('click', saveTask);
    
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

// Proje detayları yüklendiğinde select'leri doldur
function afterProjectLoaded() {
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

    // Proje düzenleme butonu
    document.getElementById('editProjectButton').addEventListener('click', openEditProjectModal);
    
    // Proje kaydetme butonu
    document.getElementById('saveProjectBtn').addEventListener('click', saveProject);
    
    // Ekip üyesi ekleme butonu
    document.getElementById('addTeamMemberBtn').addEventListener('click', addTeamMemberField);
    
    // Sürükle-bırak işlemleri için event listener'lar
    setupDragAndDrop();
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
        // DEBUG: API'den gelen görevleri konsola yazdır
        console.log('API\'den gelen görevler:', data.tasks);
        // API'den gelen veriyi currentProject formatına dönüştür
        currentProject = {
            id: data._id || data.id,
            name: data.title || data.name,
            description: data.description,
            startDate: data.startDate,
            endDate: data.endDate,
            owner: data.owner || null,
            teamMembers: data.teamMembers || data.team || [],
            tasks: Array.isArray(data.tasks) ? data.tasks.map(task => ({
                ...task,
                assignee: task.assignedTo ? task.assignedTo.name : '',
                startDate: task.startDate || task.createdAt || '',
                endDate: task.endDate || ''
            })) : []
        };

        // Proje detaylarını görüntüle
        renderProjectDetails();
        // Görevleri görüntüle
        tasks = currentProject.tasks;
        renderTasks();
        // Ekip üyelerini görev atama seçeneğine ekle
        updateTaskAssigneeOptions();
        afterProjectLoaded();
    } catch (error) {
        console.error('Proje detayları yüklenirken hata oluştu:', error);
        showAlert('Proje detayları yüklenirken bir hata oluştu.', 'danger');
    }
}

// Proje detaylarını ekrana render et
function renderProjectDetails() {
    document.getElementById('projectTitle').textContent = currentProject.name;
    document.getElementById('projectDescription').textContent = currentProject.description;
    document.title = `${currentProject.name} - Proje Yönetim Sistemi`;

    // Başlangıç ve bitiş tarihlerini göster
    let dateRow = document.getElementById('projectDatesRow');
    if (!dateRow) {
        dateRow = document.createElement('div');
        dateRow.className = 'row mb-2';
        dateRow.id = 'projectDatesRow';
        const descElem = document.getElementById('projectDescription');
        descElem.parentNode.insertBefore(dateRow, descElem.nextSibling);
    }
    dateRow.innerHTML = `
        <div class="col-auto">
            <span class="badge bg-light text-dark border me-1"><i class="bi bi-calendar-event"></i> Başlangıç: ${currentProject.startDate ? new Date(currentProject.startDate).toLocaleDateString('tr-TR') : '-'}</span>
        </div>
        <div class="col-auto">
            <span class="badge bg-light text-dark border"><i class="bi bi-calendar-check"></i> Bitiş: ${currentProject.endDate ? new Date(currentProject.endDate).toLocaleDateString('tr-TR') : '-'}</span>
        </div>
    `;

    // Proje sahibi ve ekip üyelerini göster
    let teamRow = document.getElementById('projectTeamRow');
    if (!teamRow) {
        teamRow = document.createElement('div');
        teamRow.className = 'row mb-2';
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
                    return `<div class='col'><div class="card h-100 shadow-sm team-card"><div class="card-body d-flex flex-column align-items-center justify-content-center"><span class='rounded-circle bg-secondary text-white d-inline-flex align-items-center justify-content-center mb-2' style='width:48px;height:48px;font-size:20px;font-weight:bold;'>${member[0].toUpperCase()}</span><h6 class="mb-0">${member}</h6></div></div></div>`;
                }
                if (typeof member === 'object' && member !== null) {
                    let profileImg = '';
                    if (member.profileImage) {
                        profileImg = `<img src='${member.profileImage}' class='rounded-circle mb-2' alt='${member.name || member.email || ''}' style='width:48px;height:48px;object-fit:cover;border:2px solid #fff;background:#eee;box-shadow:0 1px 6px #0001;'>`;
                    } else {
                        let initials = '';
                        if (member.name) {
                            initials = member.name.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase();
                        } else if (member.email) {
                            initials = member.email[0].toUpperCase();
                        } else {
                            initials = '?';
                        }
                        profileImg = `<span class='rounded-circle bg-secondary text-white d-inline-flex align-items-center justify-content-center mb-2' style='width:48px;height:48px;font-size:20px;font-weight:bold;'>${initials}</span>`;
                    }
                    let name = member.name ? `<h6 class="mb-0">${member.name}</h6>` : '';
                    let email = member.email ? `<div class='text-muted' style='font-size:13px;'>${member.email}</div>` : '';
                    let role = member.role ? `<span class='badge bg-info mt-2'>${member.role}</span>` : '';
                    return `<div class='col'><div class="card h-100 shadow-sm team-card team-card-hover"><div class="card-body d-flex flex-column align-items-center justify-content-center">${profileImg}${name}${email}${role}</div></div></div>`;
                }
                return '';
            }).join('') + `</div>`;
    } else {
        teamListHTML = '<span class="text-muted">Yok</span>';
    }
    teamRow.innerHTML = `<div class="col-12">${ownerBadge}<strong>Ekip Üyeleri:</strong>${teamListHTML}</div>`;
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
    // Tüm sütunları temizle
    document.querySelectorAll('.kanban-column-content').forEach(column => {
        column.innerHTML = '';
    });
    // Görevleri durumlarına göre ilgili sütunlara ekle
    tasks.forEach(task => {
        let status = (task.status || 'notStarted').toString().toLowerCase().trim();
        if (status === 'yapılacak' || status === 'yapilacak') status = 'notStarted';
        status = status
            .replace(/\s+/g, '')
            .replace(/[İIı]/g, 'i')
            .replace(/^inprogress$/i, 'inProgress')
            .replace(/^notstarted$/i, 'notStarted')
            .replace(/^done$/i, 'done')
            .replace(/^test$/i, 'test');
        const column = document.querySelector(`.kanban-column-content[data-status="${status}"]`);
        if (column) {
            const taskCard = createTaskCard(task);
            column.appendChild(taskCard);
        }
    });
}
    // Tüm sütunları temizle
    document.querySelectorAll('.kanban-column-content').forEach(column => {
        column.innerHTML = '';
    });
    
    // Görevleri durumlarına göre ilgili sütunlara ekle
    tasks.forEach(task => {
        // Status'u normalize et
        let status = (task.status || 'notStarted').toString().toLowerCase().trim();
        // Türkçe -> İngilizce eşleştirme
        if (status === 'yapılacak' || status === 'yapilacak') status = 'notStarted';
        else if (status === 'devam ediyor' || status === 'devamediyor') status = 'inProgress';
        else if (status === 'test edilecek' || status === 'testedilecek') status = 'test';
        else if (status === 'tamamlandı' || status === 'tamamlandi') status = 'done';
        // İngilizce anahtarlar için normalization
        status = status
            .replace(/\s+/g, '')
            .replace(/[İIı]/g, 'i')
            .replace(/^inprogress$/i, 'inProgress')
            .replace(/^notstarted$/i, 'notStarted')
            .replace(/^done$/i, 'done')
            .replace(/^test$/i, 'test');
        const column = document.querySelector(`.kanban-column-content[data-status="${status}"]`);
        if (column) {
            const taskCard = createTaskCard(task);
            column.appendChild(taskCard);
        }
    });

// Yardımcı fonksiyon: Her türlü (string, Date objesi, null, undefined, geçersiz) tarihi düzgün formatlar
function formatDateTR(date) {
    if (!date) return null;
    let d = date;
    if (typeof d === 'string' || typeof d === 'number') {
        d = new Date(d);
    }
    if (d instanceof Date && !isNaN(d)) {
        return d.toLocaleDateString('tr-TR');
    }
    return null;
}

// Görev kartı oluştur
function createTaskCard(task) {
    const template = document.getElementById('taskCardTemplate');
    const taskCard = document.importNode(template.content, true).querySelector('.task-card');
    // Görev bilgilerini karta ekle
    taskCard.setAttribute('data-task-id', task.id || task._id || '');
    taskCard.querySelector('.task-card-title').textContent = task.title || '';
    taskCard.querySelector('.task-card-description').textContent = task.description || 'Açıklama yok';
    // Atanan kişi robust göster
    let assignee = (typeof task.assignee === 'string') ? task.assignee : (task.assignee && task.assignee.name) ? task.assignee.name : '';
    if (!assignee) assignee = 'Atanmamış';
    taskCard.querySelector('.task-card-assignee').textContent = assignee;
    // Tarihleri robust göster
    let start = task.startDate || task.createdAt || '';
    let end = task.endDate || '';
    const startText = start ? formatDateTR(start) : null;
    const endText = end ? formatDateTR(end) : null;
        }
    });
    // Sürükle-bırak için olaylar ekle
    taskCard.addEventListener('dragstart', handleDragStart);
    taskCard.addEventListener('dragend', handleDragEnd);
    return taskCard;
    let dateText = '';
    if (startText && endText) {
        dateText = `Başlangıç: ${startText} | Bitiş: ${endText}`;
    } else if (startText) {
        dateText = `Başlangıç: ${startText}`;
    } else if (endText) {
        dateText = `Bitiş: ${endText}`;
    } else {
        dateText = 'Tarih yok';
    }
    taskCard.querySelector('.task-card-date').textContent = dateText;
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
    document.getElementById('detailTaskTitle').textContent = task.title;
    document.getElementById('detailTaskDescription').textContent = task.description || 'Açıklama yok';
    // Tarihleri formatlayarak göster
    const startDateElem = document.getElementById('detailTaskStartDate');
    const endDateElem = document.getElementById('detailTaskEndDate');
    
    startDateElem.textContent = task.startDate ? new Date(task.startDate).toLocaleDateString('tr-TR') : '-';
    endDateElem.textContent = task.endDate ? new Date(task.endDate).toLocaleDateString('tr-TR') : '-';
    
    document.getElementById('detailTaskAssignee').textContent = task.assignee || 'Atanmamış';
    
    // Durum bilgisini Türkçe olarak göster
    const statusMap = {
        'notStarted': 'Başlamadı',
        'inProgress': 'Devam Ediyor',
        'test': 'Test',
        'done': 'Tamamlandı'
    };
    document.getElementById('detailTaskStatus').textContent = statusMap[task.status] || task.status;
    
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

// Ekip üyelerini görev atama seçeneğine ekle
function updateTaskAssigneeOptions() {
    const taskAssignee = document.getElementById('taskAssignee');
    taskAssignee.innerHTML = '<option value="">Seçiniz</option>';
    
    if (currentProject && currentProject.teamMembers) {
        currentProject.teamMembers.forEach(member => {
            const option = document.createElement('option');
            option.value = member;
            option.textContent = member;
            taskAssignee.appendChild(option);
        });
    }
}

// Sürükle-bırak işlemleri için ayarlar
function setupDragAndDrop() {
    const columns = document.querySelectorAll('.kanban-column-content');
    
    columns.forEach(column => {
        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('dragenter', handleDragEnter);
        column.addEventListener('dragleave', handleDragLeave);
        column.addEventListener('drop', handleDrop);
    });
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
    const newStatus = this.getAttribute('data-status');
    
    // Görevi bul
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;
    
    // Görevin durumunu güncelle
    const updatedTask = { ...tasks[taskIndex], status: newStatus };
    
    try {
        // Gerçek uygulamada burada API çağrısı yapılacak
        // const response = await fetch(`${API_URL.tasks}/${taskId}`, {
        //     method: 'PUT',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify(updatedTask)
        // });
        // const result = await response.json();
        
        // Şimdilik görevi doğrudan güncelliyoruz
        tasks[taskIndex] = updatedTask;
        
        // Görevleri yeniden render et
        renderTasks();
        
        showAlert(`Görev durumu "${statusMap[newStatus] || newStatus}" olarak güncellendi.`, 'success');
    } catch (error) {
        console.error('Görev durumu güncellenirken hata oluştu:', error);
        showAlert('Görev durumu güncellenirken bir hata oluştu.', 'danger');
    }
}

// Durum bilgisini Türkçe olarak göstermek için kullanılan map
const statusMap = {
    'notStarted': 'Başlamadı',
    'inProgress': 'Devam Ediyor',
    'test': 'Test',
    'done': 'Tamamlandı'
};

// Proje düzenleme modalını aç
function openEditProjectModal() {
    // Mevcut proje bilgilerini forma doldur
    document.getElementById('projectName').value = currentProject.name;
    document.getElementById('projectDescriptionInput').value = currentProject.description;
    
    // Ekip üyeleri konteynerini temizle
    const teamMembersContainer = document.getElementById('teamMembersContainer');
    teamMembersContainer.innerHTML = '';
    
    // Mevcut ekip üyelerini forma ekle
    if (currentProject.teamMembers && currentProject.teamMembers.length > 0) {
        currentProject.teamMembers.forEach(member => {
            addTeamMemberField(member);
        });
    } else {
        // Eğer ekip üyesi yoksa, boş bir alan ekle
        addTeamMemberField();
    }
}

// Ekip üyesi alanı ekle
function addTeamMemberField(memberName = '') {
    const template = document.getElementById('teamMemberTemplate');
    const teamMemberItem = document.importNode(template.content, true).querySelector('.team-member-item');
    
    // Ekip üyesi adını ayarla
    const input = teamMemberItem.querySelector('.team-member-input');
    input.value = memberName;
    // Autocomplete aktif et
    if (typeof onNewTeamMemberInput === 'function') {
        onNewTeamMemberInput(input);
    }
    // Silme butonuna event listener ekle
    const removeButton = teamMemberItem.querySelector('.remove-team-member');
    removeButton.addEventListener('click', function() {
        teamMemberItem.remove();
    });
    
    // Ekip üyeleri konteynerine ekle
    document.getElementById('teamMembersContainer').appendChild(teamMemberItem);
}

// Projeyi kaydet
async function saveProject() {
    // Form verilerini al
    const projectName = document.getElementById('projectName').value.trim();
    const projectDescription = document.getElementById('projectDescriptionInput').value.trim();
    
    // Ekip üyelerini al
    const teamMembers = [];
    document.querySelectorAll('.team-member-input').forEach(input => {
        const memberName = input.value.trim();
        if (memberName) {
            teamMembers.push(memberName);
        }
    });
    
    // Validasyon
    if (projectName === '') {
        showAlert('Lütfen proje adını giriniz.', 'warning');
        return;
    }
    
    // Güncellenmiş proje objesi oluştur
    const updatedProject = {
        ...currentProject,
        name: projectName,
        description: projectDescription,
        teamMembers: teamMembers
    };
    
    try {
        // Gerçek uygulamada burada API çağrısı yapılacak
        // const response = await fetch(`${API_URL.projects}/${currentProject.id}`, {
        //     method: 'PUT',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify(updatedProject)
        // });
        // const result = await response.json();
        
        // Şimdilik projeyi doğrudan güncelliyoruz
        currentProject = updatedProject;
        
        // Proje detaylarını yeniden render et
        renderProjectDetails();
        
        // Görev atama seçeneklerini güncelle
        updateTaskAssigneeOptions();
        
        // Modal'ı kapat
        const modal = bootstrap.Modal.getInstance(document.getElementById('editProjectModal'));
        modal.hide();
        
        showAlert('Proje başarıyla güncellendi!', 'success');
    } catch (error) {
        console.error('Proje güncellenirken hata oluştu:', error);
        showAlert('Proje güncellenirken bir hata oluştu.', 'danger');
    }
}

// Bildirim göster
function showAlert(message, type = 'info') {
    // Bootstrap alert oluştur
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.style.zIndex = '9999';
    
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // 5 saniye sonra otomatik kapat
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertDiv);
        bsAlert.close();
    }, 5000);
}