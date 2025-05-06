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
    document.getElementById('projectTitle').textContent = currentProject.name;
    document.getElementById('projectDescription').textContent = currentProject.description || 'Açıklama bulunmuyor';
    document.title = `${currentProject.name} - Proje Yönetim Sistemi`;

    // İstatistik bilgilerini göster
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
        total: currentProject.tasks ? currentProject.tasks.length : 0,
        completed: currentProject.tasks ? currentProject.tasks.filter(t => t.status === 'Tamamlandı').length : 0,
        inProgress: currentProject.tasks ? currentProject.tasks.filter(t => t.status === 'Devam Ediyor').length : 0,
        todo: currentProject.tasks ? currentProject.tasks.filter(t => t.status === 'Yapılacak').length : 0,
        testing: currentProject.tasks ? currentProject.tasks.filter(t => t.status === 'Test Edilecek').length : 0
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

    // Başlangıç ve bitiş tarihlerini göster
    let dateRow = document.getElementById('projectDatesRow');
    if (!dateRow) {
        dateRow = document.createElement('div');
        dateRow.className = 'row mb-2';
        dateRow.id = 'projectDatesRow';
        statsRow.parentNode.insertBefore(dateRow, statsRow.nextSibling);
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
    
    // Açıklama - max 3 satır göster
    const descElement = taskCard.querySelector('.task-card-description');
    descElement.textContent = task.description || 'Açıklama yok';
    descElement.style.display = '-webkit-box';
    descElement.style.webkitLineClamp = '3';
    descElement.style.webkitBoxOrient = 'vertical';
    descElement.style.overflow = 'hidden';
    descElement.style.textOverflow = 'ellipsis';
    descElement.style.flex = '1';
    
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
    assigneeElement.textContent = assignee;
    
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
        dateText = `<i class="bi bi-calendar-event"></i> ${formattedStartDate} - ${formattedEndDate}`;
    } else if (formattedStartDate) {
        dateText = `<i class="bi bi-calendar-event"></i> Başlangıç: ${formattedStartDate}`;
    } else if (formattedEndDate) {
        dateText = `<i class="bi bi-calendar-check"></i> Bitiş: ${formattedEndDate}`;
    } else {
        dateText = `<i class="bi bi-calendar"></i> Tarih belirtilmemiş`;
    }
    
    // HTML içeriği olarak ayarla
    dateElement.innerHTML = dateText;
    
    // Görev durumuna göre kartın üst kenarına renk ekle
    const statusColors = {
        'Yapılacak': '#6c757d', // Gri
        'Devam Ediyor': '#0d6efd', // Mavi
        'Test Edilecek': '#ffc107', // Sarı
        'Tamamlandı': '#198754'  // Yeşil
    };
    
    const statusColor = statusColors[task.status] || statusColors['Yapılacak'];
    taskCard.style.borderTop = `3px solid ${statusColor}`;
    
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