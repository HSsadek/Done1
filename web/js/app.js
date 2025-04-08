// Ana Sayfa (Dashboard) JavaScript Kodu

// API URL'leri (Backend entegrasyonu için)
const API_URL = {
    projects: '/api/projects',
    tasks: '/api/tasks'
};

// DOM yüklendikten sonra çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', () => {
    // Projeleri yükle
    loadProjects();
    
    // Event listener'ları ekle
    setupEventListeners();
});

// Event listener'ları ayarla
function setupEventListeners() {
    // Yeni proje ekleme butonu
    document.getElementById('saveProjectBtn').addEventListener('click', saveProject);
    
    // Ekip üyesi ekleme butonu
    document.getElementById('addTeamMember').addEventListener('click', addTeamMember);
    
    // Yeni görev ekleme butonu
    document.getElementById('addTaskBtn').addEventListener('click', addTaskForm);
    
    // Proje güncelleme butonu
    document.getElementById('updateProjectBtn').addEventListener('click', updateProject);
    
    // Düzenleme modalı için ekip üyesi ekleme butonu
    document.getElementById('editAddTeamMember').addEventListener('click', editAddTeamMember);
}

// Projeleri yükle (API'den veri çekme simülasyonu)
async function loadProjects() {
    try {
        // Gerçek uygulamada burada API çağrısı yapılacak
        // const response = await fetch(API_URL.projects);
        // const projects = await response.json();
        
        // Şimdilik örnek veri kullanıyoruz
        const projects = [
            {
                id: 'project1',
                name: 'Web Sitesi Yenileme',
                description: 'Şirket web sitesinin yeniden tasarlanması ve geliştirilmesi',
                teamMembers: ['Ahmet Yılmaz', 'Ayşe Demir', 'Mehmet Kaya'],
                taskCount: 5,
                completedTaskCount: 1
            },
            {
                id: 'project2',
                name: 'Mobil Uygulama Geliştirme',
                description: 'Şirket için iOS ve Android mobil uygulaması geliştirme',
                teamMembers: ['Zeynep Şahin', 'Ali Yıldız'],
                taskCount: 8,
                completedTaskCount: 3
            },
            {
                id: 'project3',
                name: 'Veritabanı Optimizasyonu',
                description: 'Mevcut veritabanı yapısının optimize edilmesi',
                teamMembers: ['Mehmet Kaya', 'Ahmet Yılmaz'],
                taskCount: 3,
                completedTaskCount: 0
            }
        ];
        
        renderProjects(projects);
    } catch (error) {
        console.error('Projeler yüklenirken hata oluştu:', error);
        showAlert('Projeler yüklenirken bir hata oluştu.', 'danger');
    }
}

// Projeleri ekrana render et
function renderProjects(projects) {
    const projectsList = document.getElementById('projectsList');
    projectsList.innerHTML = '';
    
    if (projects.length === 0) {
        projectsList.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="py-5">
                    <i class="bi bi-folder-x display-1 text-muted"></i>
                    <h3 class="mt-3 text-muted">Henüz hiç projeniz yok</h3>
                    <p class="text-muted">Yeni bir proje oluşturmak için "Yeni Proje Ekle" butonuna tıklayın.</p>
                </div>
            </div>
        `;
        return;
    }
    
    projects.forEach(project => {
        const projectCard = createProjectCard(project);
        projectsList.appendChild(projectCard);
    });
}

// Proje kartı oluştur
function createProjectCard(project) {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';
    
    // İlerleme yüzdesini hesapla
    const progress = project.taskCount > 0 ? Math.round((project.completedTaskCount / project.taskCount) * 100) : 0;
    
    col.innerHTML = `
        <div class="card project-card h-100">
            <div class="card-body">
                <h5 class="card-title">${project.name}</h5>
                <p class="card-text">${project.description}</p>
                <div class="progress mb-3" style="height: 10px;">
                    <div class="progress-bar" role="progressbar" style="width: ${progress}%" 
                        aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
                        ${progress}%
                    </div>
                </div>
                <p class="card-text text-muted small">
                    <i class="bi bi-check-circle-fill"></i> ${project.completedTaskCount}/${project.taskCount} görev tamamlandı
                </p>
                <div class="d-flex align-items-center mb-3">
                    <span class="me-2 small">Ekip:</span>
                    <div class="team-members-avatars">
                        ${project.teamMembers.map((member, index) => `
                            <span class="badge bg-primary me-1" title="${member}">
                                ${member.split(' ').map(n => n[0]).join('')}
                            </span>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <a href="project.html?id=${project.id}" class="btn btn-sm btn-primary">
                    <i class="bi bi-kanban me-1"></i> Görev Panosu
                </a>
                <button class="btn btn-sm btn-outline-secondary float-end edit-project-btn" data-project-id="${project.id}">
                    <i class="bi bi-pencil"></i>
                </button>
            </div>
        </div>
    `;
    
    // Düzenleme butonuna tıklama olayını ekle
    col.querySelector('.edit-project-btn').addEventListener('click', () => openEditProjectModal(project));
    
    return col;
}

// Yeni proje kaydet
async function saveProject() {
    // Form verilerini al
    const projectName = document.getElementById('projectName').value.trim();
    const projectDescription = document.getElementById('projectDescription').value.trim();
    
    // Ekip üyelerini al
    const teamMemberTags = document.querySelectorAll('#teamMembersList .team-member-tag');
    const teamMembers = Array.from(teamMemberTags).map(tag => tag.getAttribute('data-member'));
    
    // Görevleri al
    const taskItems = document.querySelectorAll('#tasksList .task-item');
    const tasks = Array.from(taskItems).map(item => {
        return {
            title: item.querySelector('.task-title').value,
            description: item.querySelector('.task-description').value,
            startDate: item.querySelector('.task-start-date').value,
            endDate: item.querySelector('.task-end-date').value,
            assignee: item.querySelector('.task-assignee').value,
            status: 'notStarted' // Yeni görevler her zaman 'Not Started' durumunda başlar
        };
    });
    
    // Validasyon
    if (projectName === '') {
        showAlert('Lütfen proje adını giriniz.', 'warning');
        return;
    }
    
    // Yeni proje objesi oluştur
    const newProject = {
        id: `project-${Date.now()}`,
        name: projectName,
        description: projectDescription,
        teamMembers: teamMembers,
        tasks: tasks,
        taskCount: tasks.length,
        completedTaskCount: 0
    };
    
    try {
        // Gerçek uygulamada burada API çağrısı yapılacak
        // const response = await fetch(API_URL.projects, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify(newProject)
        // });
        // const savedProject = await response.json();
        
        // Başarılı kayıt sonrası sayfayı yenile
        showAlert('Proje başarıyla oluşturuldu!', 'success');
        
        // Modal'ı kapat
        const modal = bootstrap.Modal.getInstance(document.getElementById('newProjectModal'));
        modal.hide();
        
        // Formu temizle
        document.getElementById('newProjectForm').reset();
        document.getElementById('teamMembersList').innerHTML = '';
        document.getElementById('tasksList').innerHTML = '';
        
        // Projeleri yeniden yükle
        loadProjects();
    } catch (error) {
        console.error('Proje kaydedilirken hata oluştu:', error);
        showAlert('Proje kaydedilirken bir hata oluştu.', 'danger');
    }
}

// Ekip üyesi ekle
function addTeamMember() {
    const memberInput = document.getElementById('teamMemberInput');
    const memberName = memberInput.value.trim();
    
    if (memberName === '') {
        showAlert('Lütfen ekip üyesi adını veya e-postasını giriniz.', 'warning');
        return;
    }
    
    // Ekip üyesi zaten eklenmiş mi kontrol et
    const existingMembers = document.querySelectorAll('#teamMembersList .team-member-tag');
    for (let i = 0; i < existingMembers.length; i++) {
        if (existingMembers[i].getAttribute('data-member') === memberName) {
            showAlert('Bu ekip üyesi zaten eklenmiş.', 'warning');
            memberInput.value = '';
            return;
        }
    }
    
    // Ekip üyesi etiketi oluştur
    const memberTag = document.createElement('div');
    memberTag.className = 'team-member-tag';
    memberTag.setAttribute('data-member', memberName);
    memberTag.innerHTML = `
        ${memberName}
        <span class="remove-member" onclick="removeTeamMember(this)">&times;</span>
    `;
    
    // Ekip üyesini listeye ekle
    document.getElementById('teamMembersList').appendChild(memberTag);
    
    // Görev atama seçeneklerini güncelle
    updateTaskAssigneeOptions();
    
    // Input'u temizle
    memberInput.value = '';
}

// Ekip üyesini kaldır
function removeTeamMember(element) {
    const memberTag = element.parentNode;
    memberTag.remove();
    
    // Görev atama seçeneklerini güncelle
    updateTaskAssigneeOptions();
}

// Görev atama seçeneklerini güncelle
function updateTaskAssigneeOptions() {
    const memberTags = document.querySelectorAll('#teamMembersList .team-member-tag');
    const members = Array.from(memberTags).map(tag => tag.getAttribute('data-member'));
    
    // Tüm görev atama seçeneklerini güncelle
    const taskAssignees = document.querySelectorAll('.task-assignee');
    taskAssignees.forEach(select => {
        // Mevcut seçili değeri koru
        const currentValue = select.value;
        
        // Seçenekleri temizle ve varsayılan seçeneği ekle
        select.innerHTML = '<option value="">Seçiniz</option>';
        
        // Ekip üyelerini seçeneklere ekle
        members.forEach(member => {
            const option = document.createElement('option');
            option.value = member;
            option.textContent = member;
            select.appendChild(option);
        });
        
        // Önceki seçili değeri geri yükle (eğer hala mevcut ekip üyelerinde varsa)
        if (currentValue && members.includes(currentValue)) {
            select.value = currentValue;
        }
    });
}

// Yeni görev formu ekle
function addTaskForm() {
    // Görev şablonunu kopyala
    const template = document.getElementById('taskTemplate');
    const taskItem = document.importNode(template.content, true);
    
    // Görev silme butonuna event listener ekle
    taskItem.querySelector('.remove-task').addEventListener('click', function() {
        this.closest('.task-item').remove();
    });
    
    // Görev atama seçeneklerini güncelle
    const taskAssignee = taskItem.querySelector('.task-assignee');
    const memberTags = document.querySelectorAll('#teamMembersList .team-member-tag');
    memberTags.forEach(tag => {
        const member = tag.getAttribute('data-member');
        const option = document.createElement('option');
        option.value = member;
        option.textContent = member;
        taskAssignee.appendChild(option);
    });
    
    // Görevi listeye ekle
    document.getElementById('tasksList').appendChild(taskItem);
}

// Proje düzenleme modalını aç
function openEditProjectModal(project) {
    // Modal form alanlarını doldur
    document.getElementById('editProjectId').value = project.id;
    document.getElementById('editProjectName').value = project.name;
    document.getElementById('editProjectDescription').value = project.description;
    
    // Ekip üyelerini temizle ve yeniden doldur
    const editTeamMembersList = document.getElementById('editTeamMembersList');
    editTeamMembersList.innerHTML = '';
    
    project.teamMembers.forEach(member => {
        const memberTag = document.createElement('div');
        memberTag.className = 'team-member-tag';
        memberTag.setAttribute('data-member', member);
        memberTag.innerHTML = `
            ${member}
            <span class="remove-member" onclick="removeEditTeamMember(this)">&times;</span>
        `;
        
        editTeamMembersList.appendChild(memberTag);
    });
    
    // Modalı aç
    const editProjectModal = new bootstrap.Modal(document.getElementById('editProjectModal'));
    editProjectModal.show();
}

// Düzenleme modalında ekip üyesi ekle
function editAddTeamMember() {
    const memberInput = document.getElementById('editTeamMemberInput');
    const memberName = memberInput.value.trim();
    
    if (memberName === '') {
        showAlert('Lütfen ekip üyesi adını veya e-postasını giriniz.', 'warning');
        return;
    }
    
    // Ekip üyesi zaten eklenmiş mi kontrol et
    const existingMembers = document.querySelectorAll('#editTeamMembersList .team-member-tag');
    for (let i = 0; i < existingMembers.length; i++) {
        if (existingMembers[i].getAttribute('data-member') === memberName) {
            showAlert('Bu ekip üyesi zaten eklenmiş.', 'warning');
            memberInput.value = '';
            return;
        }
    }
    
    // Ekip üyesi etiketi oluştur
    const memberTag = document.createElement('div');
    memberTag.className = 'team-member-tag';
    memberTag.setAttribute('data-member', memberName);
    memberTag.innerHTML = `
        ${memberName}
        <span class="remove-member" onclick="removeEditTeamMember(this)">&times;</span>
    `;
    
    // Ekip üyesini listeye ekle
    document.getElementById('editTeamMembersList').appendChild(memberTag);
    
    // Input'u temizle
    memberInput.value = '';
}

// Düzenleme modalında ekip üyesini kaldır
function removeEditTeamMember(element) {
    const memberTag = element.parentNode;
    memberTag.remove();
}

// Projeyi güncelle
async function updateProject() {
    // Form verilerini al
    const projectId = document.getElementById('editProjectId').value;
    const projectName = document.getElementById('editProjectName').value.trim();
    const projectDescription = document.getElementById('editProjectDescription').value.trim();
    
    // Ekip üyelerini al
    const teamMemberTags = document.querySelectorAll('#editTeamMembersList .team-member-tag');
    const teamMembers = Array.from(teamMemberTags).map(tag => tag.getAttribute('data-member'));
    
    // Validasyon
    if (projectName === '') {
        showAlert('Lütfen proje adını giriniz.', 'warning');
        return;
    }
    
    try {
        // Gerçek uygulamada burada API çağrısı yapılacak
        // const response = await fetch(`${API_URL.projects}/${projectId}`, {
        //     method: 'PUT',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify({
        //         name: projectName,
        //         description: projectDescription,
        //         teamMembers: teamMembers
        //     })
        // });
        // const updatedProject = await response.json();
        
        // Başarılı güncelleme sonrası
        showAlert('Proje başarıyla güncellendi!', 'success');
        
        // Modal'ı kapat
        const modal = bootstrap.Modal.getInstance(document.getElementById('editProjectModal'));
        modal.hide();
        
        // Projeleri yeniden yükle
        loadProjects();
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