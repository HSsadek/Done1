// Proje Detay Sayfası JavaScript Kodu

// API URL'leri (Backend entegrasyonu için)
const API_URL = {
    projects: '/api/projects',
    tasks: '/api/tasks'
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
    document.getElementById('editTaskBtn').addEventListener('click', () => {
        // Görev düzenleme işlemleri burada yapılacak
        // Şimdilik sadece modal'ı kapatıyoruz
        const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
        modal.hide();
    });
    
    // Proje düzenleme butonu
    document.getElementById('editProjectButton').addEventListener('click', openEditProjectModal);
    
    // Proje kaydetme butonu
    document.getElementById('saveProjectBtn').addEventListener('click', saveProject);
    
    // Ekip üyesi ekleme butonu
    document.getElementById('addTeamMemberBtn').addEventListener('click', addTeamMemberField);
    
    // Sürükle-bırak işlemleri için event listener'lar
    setupDragAndDrop();
}

// Proje detaylarını yükle (API'den veri çekme simülasyonu)
async function loadProjectDetails(projectId) {
    try {
        // Gerçek uygulamada burada API çağrısı yapılacak
        // const response = await fetch(`${API_URL.projects}/${projectId}`);
        // currentProject = await response.json();
        
        // Şimdilik örnek veri kullanıyoruz
        currentProject = {
            id: projectId,
            name: 'Web Sitesi Yenileme',
            description: 'Şirket web sitesinin yeniden tasarlanması ve geliştirilmesi',
            teamMembers: ['Ahmet Yılmaz', 'Ayşe Demir', 'Mehmet Kaya'],
            tasks: [
                {
                    id: 'task1',
                    title: 'Tasarım Taslakları',
                    description: 'Ana sayfa ve iç sayfalar için tasarım taslakları hazırlanacak',
                    startDate: '2023-06-01',
                    endDate: '2023-06-15',
                    assignee: 'Ahmet Yılmaz',
                    status: 'done'
                },
                {
                    id: 'task2',
                    title: 'Frontend Geliştirme',
                    description: 'HTML, CSS ve JavaScript ile frontend geliştirme',
                    startDate: '2023-06-16',
                    endDate: '2023-07-15',
                    assignee: 'Ayşe Demir',
                    status: 'inProgress'
                },
                {
                    id: 'task3',
                    title: 'Backend Entegrasyonu',
                    description: 'API entegrasyonu ve backend bağlantıları',
                    startDate: '2023-07-01',
                    endDate: '2023-07-30',
                    assignee: 'Mehmet Kaya',
                    status: 'notStarted'
                },
                {
                    id: 'task4',
                    title: 'Testler',
                    description: 'Fonksiyonel ve kullanıcı testleri',
                    startDate: '2023-08-01',
                    endDate: '2023-08-15',
                    assignee: 'Ayşe Demir',
                    status: 'notStarted'
                },
                {
                    id: 'task5',
                    title: 'İçerik Girişi',
                    description: 'Web sitesi içeriklerinin girilmesi',
                    startDate: '2023-07-15',
                    endDate: '2023-08-15',
                    assignee: 'Ahmet Yılmaz',
                    status: 'test'
                }
            ]
        };
        
        // Proje detaylarını görüntüle
        renderProjectDetails();
        
        // Görevleri görüntüle
        tasks = currentProject.tasks;
        renderTasks();
        
        // Ekip üyelerini görev atama seçeneğine ekle
        updateTaskAssigneeOptions();
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
}

// Görevleri ekrana render et
function renderTasks() {
    // Tüm sütunları temizle
    document.querySelectorAll('.kanban-column-content').forEach(column => {
        column.innerHTML = '';
    });
    
    // Görevleri durumlarına göre ilgili sütunlara ekle
    tasks.forEach(task => {
        const column = document.querySelector(`.kanban-column-content[data-status="${task.status}"]`);
        if (column) {
            const taskCard = createTaskCard(task);
            column.appendChild(taskCard);
        }
    });
}

// Görev kartı oluştur
function createTaskCard(task) {
    const template = document.getElementById('taskCardTemplate');
    const taskCard = document.importNode(template.content, true).querySelector('.task-card');
    
    // Görev bilgilerini karta ekle
    taskCard.setAttribute('data-task-id', task.id);
    taskCard.querySelector('.task-card-title').textContent = task.title;
    taskCard.querySelector('.task-card-description').textContent = task.description || 'Açıklama yok';
    taskCard.querySelector('.task-card-assignee').textContent = task.assignee || 'Atanmamış';
    
    // Tarih bilgisini formatlayarak ekle
    let dateText = '';
    if (task.endDate) {
        const endDate = new Date(task.endDate);
        dateText = `Bitiş: ${endDate.toLocaleDateString('tr-TR')}`;
    }
    taskCard.querySelector('.task-card-date').textContent = dateText;
    
    // Görev detaylarını görüntülemek için tıklama olayı ekle
    taskCard.addEventListener('click', (e) => {
        // Sürükleme sırasında tıklama olayını engelle
        if (!taskCard.classList.contains('dragging')) {
            showTaskDetails(task);
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