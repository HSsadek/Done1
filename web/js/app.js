// Ana Sayfa (Dashboard) JavaScript Kodu

// Kullanıcı giriş kontrolü: Token yoksa login sayfasına yönlendir (bfcache dahil)
function checkAuth() {
    if (!localStorage.getItem('token')) {
        window.location.replace('login.html');
    }
}
document.addEventListener('DOMContentLoaded', checkAuth);
window.addEventListener('pageshow', checkAuth);


// API URL'leri (Backend entegrasyonu için)
// Mobil erişim için IP adresini kullanır.
const API_URL = {
    projects: 'http://localhost:5000/api/projects',
    tasks: 'http://localhost:5000/api/tasks'
};

// DOM yüklendikten sonra çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', () => {
    // Autocomplete seçiminden sonra kullanıcıyı ekibe ekle
    const teamMemberInput = document.getElementById('teamMemberInput');
    const teamMembersList = document.getElementById('teamMembersList');
    let selectedTeamMembers = [];

    if (teamMemberInput) {
        teamMemberInput.addEventListener('change', function() {
            const username = this.value.trim();
            if (username && !selectedTeamMembers.includes(username)) {
                selectedTeamMembers.push(username);
                const tag = document.createElement('div');
                tag.className = 'team-member-tag badge bg-primary text-white d-flex align-items-center';
                tag.setAttribute('data-member', username);
                tag.innerHTML = `${username} <span class="ms-2" style="cursor:pointer;" title="Kaldır">&times;</span>`;
                tag.querySelector('span').onclick = function() {
                    selectedTeamMembers = selectedTeamMembers.filter(u => u !== username);
                    tag.remove();
                    updateTaskAssigneeOptions();
                };
                teamMembersList.appendChild(tag);
                this.value = '';
                updateTaskAssigneeOptions();
            }
        });
    }

    // Proje kaydederken etiketlerden ekip üyelerini topla
    const saveProjectBtn = document.getElementById('saveProjectBtn');
    if (saveProjectBtn) {
        saveProjectBtn.addEventListener('click', function() {
            const teamMemberTags = document.querySelectorAll('#teamMembersList .team-member-tag');
            const teamMembers = Array.from(teamMemberTags).map(tag => tag.getAttribute('data-member'));
            // ...burada mevcut proje kaydetme kodunda teamMembers dizisini kullanmalısın
        });
    }

    // Projeleri yükle
    loadProjects();
    
    // Event listener'ları ekle
    setupEventListeners();
});

// Event listener'ları ayarla
function setupEventListeners() {
    // Yeni proje ekleme butonu
    const saveProjectBtn = document.getElementById('saveProjectBtn');
    if (saveProjectBtn) saveProjectBtn.addEventListener('click', saveProject);

    // Ekip üyesi arama ve seçim (autocomplete)
    const teamMemberInput = document.getElementById('teamMemberInput');
    const suggestionsBox = document.getElementById('teamMemberSuggestions');
    const teamMembersList = document.getElementById('teamMembersList');
    let debounceTimer, lastQuery = '';

    if (teamMemberInput) {
    teamMemberInput.addEventListener('input', function() {
        const query = this.value.trim();
        if (query.length < 2) {
            suggestionsBox.style.display = 'none';
            suggestionsBox.innerHTML = '';
            return;
        }
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            if (query === lastQuery) return;
            lastQuery = query;
            try {
                const res = await fetch(`${API_URL.profile.replace('/profile','/auth/search')}?search=${encodeURIComponent(query)}`);
                if (!res.ok) throw new Error('Kullanıcılar alınamadı');
                let users = await res.json();
                users = users.sort((a, b) => a.name.localeCompare(b.name));
                // Her aramada önce eski hata mesajını temizle
                const prevError = suggestionsBox.querySelector('.text-danger');
                if (prevError) prevError.remove();
                if (users.length === 0) {
                    suggestionsBox.innerHTML = '<li class="list-group-item">Kullanıcı bulunamadı</li>';
                    suggestionsBox.style.display = 'block';
                } else {
                    suggestionsBox.innerHTML = users.map(u => `<li class="list-group-item list-group-item-action" data-email="${u.email}" data-name="${u.name}">${u.name}</li>`).join('');
                    suggestionsBox.style.display = 'block';
                }
            } catch (err) {
                suggestionsBox.innerHTML = '<li class="list-group-item text-danger">Hata: Kullanıcılar alınamadı</li>';
                suggestionsBox.style.display = 'block';
            }
        }, 300);
    });
}

    if (suggestionsBox) suggestionsBox.addEventListener('mousedown', function(e) {
        if (e.target.tagName === 'LI' && e.target.hasAttribute('data-email')) {
            const name = e.target.getAttribute('data-name');
            const email = e.target.getAttribute('data-email');
            addTeamMemberTag(name, email);
            teamMemberInput.value = '';
            suggestionsBox.style.display = 'none';
            suggestionsBox.innerHTML = '';
            // Hata mesajı varsa temizle
            const errorMsg = suggestionsBox.querySelector('.text-danger');
            if (errorMsg) errorMsg.remove();
        }
    });

    document.addEventListener('click', function(e) {
        if (!suggestionsBox.contains(e.target) && e.target !== teamMemberInput) {
            suggestionsBox.style.display = 'none';
        }
    });

    // Önceki "Ekle" butonu desteği (manuel ekleme için)
    const addTeamMemberBtn = document.getElementById('addTeamMember');
    if (addTeamMemberBtn) addTeamMemberBtn.addEventListener('click', function() {
        const value = teamMemberInput.value.trim();
        if (value) addTeamMemberTag(value, value);
        teamMemberInput.value = '';
        suggestionsBox.style.display = 'none';
    });
    
    // Yeni görev ekleme butonu
    const addTaskBtn = document.getElementById('addTaskBtn');
    if (addTaskBtn) addTaskBtn.addEventListener('click', addTaskForm);
    
    // Proje güncelleme butonu
    const updateProjectBtn = document.getElementById('updateProjectBtn');
    if (updateProjectBtn) updateProjectBtn.addEventListener('click', updateProject);
    
    // Düzenleme modalı için ekip üyesi ekleme butonu
    const editAddTeamMemberBtn = document.getElementById('editAddTeamMember');
    if (editAddTeamMemberBtn) editAddTeamMemberBtn.addEventListener('click', editAddTeamMember);
}

// Projeleri yükle (sadece giriş yapan kullanıcıya ait gerçek projeler)
async function loadProjects() {
    console.log('loadProjects() çağrıldı');
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('Token yok, kullanıcı giriş yapmamış.');
            return;
        }
        const response = await fetch(API_URL.projects, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Projeler getirilemedi');
        const allProjects = await response.json();
        console.log('APIden dönen tüm projeler:', allProjects);
        // Kullanıcının sahibi olduğu veya ekipte olduğu projeleri filtrele
        const userId = await getUserIdFromProfile(token);
        console.log('Kullanıcı ID:', userId);
        console.log('allProjects', allProjects);
        console.log('userId', userId);
        const userProjects = allProjects.filter(p => p.owner && p.owner._id === userId || (p.team && p.team.some(t => t._id === userId)));
// Proje kartına uygun şekilde dönüştür (profile.js ile aynı)
const projects = userProjects.map(p => ({
    id: p._id,
    name: p.title,
    description: p.description,
    taskCount: p.tasks ? p.tasks.length : 0,
    completedTaskCount: p.tasks ? p.tasks.filter(task => task.status === 'Tamamlandı').length : 0
}));
renderProjects(projects);
    } catch (error) {
        console.error('Projeler yüklenirken hata oluştu:', error);
        showAlert('Projeler yüklenirken bir hata oluştu.', 'danger');
    }
}

// Token ile kullanıcı id'sini getir
async function getUserIdFromProfile(token) {
    const response = await fetch('http://localhost:5000/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return null;
    const user = await response.json();
    return user._id;
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
    
    // Backend zaten sıralı gönderiyor, tekrar sıralama yok
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
        <div class="card project-card shadow-lg border-0 rounded-4 position-relative project-modern-card" style="cursor:pointer; transition: box-shadow .2s;">
            <div class="card-body pb-4 d-flex flex-column">
                <div class="d-flex align-items-center mb-2">
                    <div class="flex-grow-1">
                        <h5 class="card-title fw-bold mb-1 text-primary" style="display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden;"><i class="bi bi-folder2-open me-2"></i>${project.name}</h5>
                    </div>
                    <button class="btn btn-danger btn-sm delete-project-btn border-0 ms-2 position-absolute top-0 end-0 mt-2 me-2" data-project-id="${project.id}" onclick="event.stopPropagation();"><i class="bi bi-trash"></i></button>
                </div>
                <p class="card-text mb-2 text-secondary" style="display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; flex: 1;">${project.description}</p>
                <div class="d-flex align-items-center mb-3">
                    <span class="me-2 small text-muted"><i class="bi bi-people"></i> Ekip:</span>
                    <div class="team-members-avatars d-flex align-items-center">
                        ${(Array.isArray(project.teamMembers) ? project.teamMembers.slice(0,5) : []).map((member, index) => {
                            let img = '';
                            let name = '';
                            if (typeof member === 'object' && member !== null) {
                                img = member.profileImage || '';
                                name = member.name || member.email || '';
                            } else {
                                name = member;
                            }
                            if (img) {
                                return `<img src="${img}" class="rounded-circle me-1 border" alt="${name}" title="${name}" style="width:32px;height:32px;object-fit:cover;">`;
                            } else {
                                const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
                                return `<span class="rounded-circle bg-primary text-white d-inline-flex justify-content-center align-items-center me-1 border" title="${name}" style="width:32px;height:32px;font-size:1rem;">${initials}</span>`;
                            }
                        }).join('')}
                        ${(Array.isArray(project.teamMembers) && project.teamMembers.length > 5) ? `<span class="badge bg-secondary ms-1">+${project.teamMembers.length-5}</span>` : ''}
                    </div>
                    <span class="ms-2 small text-muted">${Array.isArray(project.teamMembers) ? project.teamMembers.length : 0} üye</span>
                </div>
                <div class="progress mb-2" style="height: 8px;">
                    <div class="progress-bar bg-success" role="progressbar" style="width: ${progress}%" 
                        aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
                    </div>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-auto">
                    <span class="text-muted small"><i class="bi bi-check-circle-fill"></i> ${project.completedTaskCount}/${project.taskCount} görev tamamlandı</span>
                    <a href="project.html?id=${project.id}" class="btn btn-outline-primary btn-sm px-3" onclick="event.stopPropagation();">
                        <i class="bi bi-kanban me-1"></i> Görev Panosu
                    </a>
                </div>
            </div>
        </div>
    `;
    
    // Kartın tamamına tıklanınca detay modalını aç
    col.querySelector('.card').addEventListener('click', function(e) {
        // Eğer tıklama edit butonundan geliyorsa detay açma
        if (e.target.closest('.edit-project-btn')) return;
        showProjectDetails(project);
    });

    // Silme butonuna tıklama olayını ekle
    col.querySelector('.delete-project-btn').addEventListener('click', () => {
        deleteProject(project.id, project.name);
    });
    // Hover efekti
    col.querySelector('.project-modern-card').addEventListener('mouseenter', function() {
        this.style.boxShadow = '0 0.5rem 1.5rem rgba(0,0,0,.15)';
    });
    col.querySelector('.project-modern-card').addEventListener('mouseleave', function() {
        this.style.boxShadow = '';
    });
    
    return col;
}

// Proje detaylarını modalda göster
function showProjectDetails(project) {
    // Modal içeriğini doldur
    document.getElementById('projectDetailTitle').textContent = project.name;
    document.getElementById('projectDetailDescription').textContent = project.description;
    document.getElementById('projectDetailTaskCount').textContent = project.taskCount;
    document.getElementById('projectDetailCompletedTaskCount').textContent = project.completedTaskCount;
    document.getElementById('projectDetailTeam').innerHTML = (Array.isArray(project.teamMembers) ? project.teamMembers : []).map(member => `<span class='badge bg-primary me-1'>${member}</span>`).join('');
    // Modalı aç
    const modal = new bootstrap.Modal(document.getElementById('projectDetailModal'));
    modal.show();
}

// Yeni proje kaydet
async function saveProject() {
    // Form verilerini al
    const projectName = document.getElementById('projectName').value.trim();
    const projectDescription = document.getElementById('projectDescription').value.trim();
    
    // Ekip üyelerini al
    // Sadece kullanıcı _id'lerini topla
    const teamMemberTags = document.querySelectorAll('#teamMembersList .team-member-tag');
    const teamMembers = Array.from(teamMemberTags)
        .map(tag => tag.getAttribute('data-id'))
        .filter(Boolean); // Sadece id'si olanları al
    
    // Görevleri al
    const taskItems = document.querySelectorAll('#tasksList .task-item');
    // Görevleri, backend'e uygun şekilde sadece frontend'de tutacağız. Görevler proje ile birlikte gönderilmeyecek.
    const tasks = Array.from(taskItems).map(item => {
        const assigneeSelect = item.querySelector('.task-assignee');
        const selectedOption = assigneeSelect.options[assigneeSelect.selectedIndex];
        let assignedTo = '';
        if (selectedOption) {
            const id = selectedOption.getAttribute('data-id');
            if (id) assignedTo = id;
        }
        return {
            title: item.querySelector('.task-title').value,
            description: item.querySelector('.task-description').value,
            dueDate: item.querySelector('.task-end-date').value,
            assignedTo: assignedTo
        };
    });
    
    // Validasyon
    if (projectName === '') {
        showAlert('Lütfen proje adını giriniz.', 'warning');
        return;
    }
    
    // Formdan tarihleri al
    const projectStartDate = document.getElementById('projectStartDate').value;
    const projectEndDate = document.getElementById('projectEndDate').value;

    // Backend ile uyumlu yeni proje objesi oluştur
    const newProject = {
        title: projectName,
        description: projectDescription,
        startDate: projectStartDate,
        endDate: projectEndDate,
        team: teamMembers.map(member => ({ _id: member }))
    };

    try {
        // Gerçek API'ye POST isteği gönder
        const token = localStorage.getItem('token');
        const response = await fetch(API_URL.projects, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newProject)
        });
        if (response.ok) {
            const createdProject = await response.json();
            // Proje oluşturulduktan sonra görevleri sırayla ekle
            for (const task of tasks) {
                if (task.title && task.assignedTo) {
                    await fetch(API_URL.tasks, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            title: task.title,
                            description: task.description,
                            assignedTo: task.assignedTo,
                            project: createdProject._id,
                            dueDate: task.dueDate
                        })
                    });
                }
            }
            showAlert('Proje ve görevler başarıyla oluşturuldu!', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('newProjectModal'));
            modal.hide();
            // Formu temizle
            document.getElementById('newProjectForm').reset();
            document.getElementById('teamMembersList').innerHTML = '';
            document.getElementById('tasksList').innerHTML = '';
            // Projeleri yeniden yükle
            loadProjects();
        } else {
            console.error('Proje kaydedilirken hata oluştu:', response);
            showAlert('Proje kaydedilirken bir hata oluştu.', 'danger');
        }
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
        updateTaskAssigneeOptions();
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

// Tüm görev atama select kutularını güncelle
function updateTaskAssigneeOptions() {
    const memberTags = document.querySelectorAll('#teamMembersList .team-member-tag');
    const members = Array.from(memberTags).map(tag => tag.getAttribute('data-member'));
    const taskAssignees = document.querySelectorAll('.task-assignee');
    taskAssignees.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Seçiniz</option>';
        members.forEach(member => {
            const option = document.createElement('option');
            option.value = member;
            option.textContent = member;
            select.appendChild(option);
        });
        if (currentValue && members.includes(currentValue)) {
            select.value = currentValue;
        }
    });
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

// Proje silme fonksiyonu
async function deleteProject(projectId, projectName) {
    // Kullanıcıdan onay al
    if (!confirm(`"${projectName}" projesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve projeye ait tüm görevler de silinecektir.`)) {
        return; // Kullanıcı iptal ettiyse işlemi durdur
    }
    
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Oturum bilgisi bulunamadı!');
        
        const response = await fetch(`${API_URL.projects}/${projectId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Proje silinirken bir hata oluştu!');
        }
        
        // Başarılı silme işlemi sonrası projeleri yeniden yükle
        showAlert(`"${projectName}" projesi başarıyla silindi.`, 'success');
        loadProjects(); // Proje listesini güncelle
    } catch (error) {
        console.error('Proje silinirken hata oluştu:', error);
        showAlert(`Proje silinirken bir hata oluştu: ${error.message}`, 'danger');
    }
}