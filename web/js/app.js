// Ana Sayfa (Dashboard) JavaScript Kodu

// Loading timer ve ID'si
let loadingTimer = null;
let loadingDelay = 100; // Milisaniye cinsinden gecikme süresi

// Loading animasyonunu göster
function showLoading(message = 'Projeler yükleniyor...') {
    // Önce varsa önceki timer'ı temizle
    clearTimeout(loadingTimer);
    
    // Loading animasyonunu sadece belirli bir gecikme sonrasında göster
    loadingTimer = setTimeout(() => {
        // Eğer zaten bir loading container varsa, tekrar oluşturma
        if (document.querySelector('.loading-container')) {
            return;
        }
        
        // Loading container oluştur
        const loadingContainer = document.createElement('div');
        loadingContainer.className = 'loading-container';
        
        // Spinner oluştur
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        
        // Mesaj oluştur
        const loadingText = document.createElement('div');
        loadingText.className = 'loading-text';
        loadingText.textContent = message;
        
        // Elementleri container'a ekle
        loadingContainer.appendChild(spinner);
        loadingContainer.appendChild(loadingText);
        
        // Container'ı body'e ekle
        document.body.appendChild(loadingContainer);
    }, loadingDelay);
}

// Loading animasyonunu gizle
function hideLoading() {
    // Önce zamanlayıcıyı temizle (eğer hala gösterilmediyse göstermeyi iptal et)
    clearTimeout(loadingTimer);
    loadingTimer = null;
    
    // Eğer loading container varsa kaldır
    const loadingContainer = document.querySelector('.loading-container');
    if (loadingContainer) {
        // Önce opacity'yi 0 yap (fade-out efekti için)
        loadingContainer.style.opacity = '0';
        
        // Animasyon tamamlandıktan sonra elementi kaldır
        setTimeout(() => {
            loadingContainer.remove();
        }, 10); // Hızlı bir şekilde kaldır
    }
}

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
        // Kullanıcı seçildiğinde özel event'i dinle
        teamMemberInput.addEventListener('userSelected', function(e) {
            const userId = e.detail.id;
            const username = e.detail.name;
            
            if (username && userId && !selectedTeamMembers.some(member => member.id === userId)) {
                // Kullanıcı ID ve adını birlikte sakla
                selectedTeamMembers.push({id: userId, name: username});
                
                const tag = document.createElement('div');
                tag.className = 'team-member-tag badge bg-primary text-white d-flex align-items-center';
                tag.setAttribute('data-member', username);
                tag.setAttribute('data-id', userId); // Kullanıcı ID'sini sakla
                tag.innerHTML = `${username} <span class="ms-2" style="cursor:pointer;" title="Kaldır">&times;</span>`;
                
                tag.querySelector('span').onclick = function() {
                    selectedTeamMembers = selectedTeamMembers.filter(member => member.id !== userId);
                    tag.remove();
                    updateTaskAssigneeOptions();
                };
                
                teamMembersList.appendChild(tag);
                this.value = '';
                updateTaskAssigneeOptions();
            }
        });
        
        // Eski change event listener'ını da koru (manuel ekleme için)
        teamMemberInput.addEventListener('change', function() {
            const username = this.value.trim();
            if (username && !selectedTeamMembers.some(member => member.name === username)) {
                // Manuel eklenen üyelerde ID olmayabilir, sadece isim sakla
                selectedTeamMembers.push({name: username});
                
                const tag = document.createElement('div');
                tag.className = 'team-member-tag badge bg-primary text-white d-flex align-items-center';
                tag.setAttribute('data-member', username);
                tag.innerHTML = `${username} <span class="ms-2" style="cursor:pointer;" title="Kaldır">&times;</span>`;
                
                tag.querySelector('span').onclick = function() {
                    selectedTeamMembers = selectedTeamMembers.filter(member => member.name !== username);
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
    // Tamamlanan projeler linki
    const completedProjectsLink = document.getElementById('completedProjectsLink');
    if (completedProjectsLink) {
        completedProjectsLink.addEventListener('click', function(e) {
            e.preventDefault();
            toggleCompletedProjects();
        });
    }

    // Arama çubuğu
    const projectSearch = document.getElementById('projectSearch');
    if (projectSearch) {
        projectSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            const projectCards = document.querySelectorAll('.project-card');
            let visibleCount = 0;
            
            projectCards.forEach(card => {
                try {
                    // Güvenli bir şekilde elementleri al
                    const titleElement = card.querySelector('.card-title');
                    const descriptionElement = card.querySelector('.card-text');
                    const taskCountElement = card.querySelector('.text-muted small');
                    const teamMembersElements = card.querySelectorAll('.team-members-avatars img, .team-members-avatars span');
                    
                    // Elementlerin varlığını kontrol et ve değerlerini al
                    const projectName = titleElement ? titleElement.textContent.toLowerCase() : '';
                    const projectDescription = descriptionElement ? descriptionElement.textContent.toLowerCase() : '';
                    const taskCount = taskCountElement ? taskCountElement.textContent.toLowerCase() : '';
                    
                    // Ekip üyelerinin isimlerini topla
                    const teamMembers = Array.from(teamMembersElements)
                        .map(member => {
                            const title = member.getAttribute('title');
                            const alt = member.getAttribute('alt');
                            return (title || alt || '').toLowerCase();
                        })
                        .filter(name => name)
                        .join(' ');
                    
                    // Arama terimini boşluklara göre ayır
                    const searchTerms = searchTerm.split(' ').filter(term => term.length > 0);
                    
                    // Her bir arama terimi için kontrol yap
                    const matches = searchTerms.every(term => 
                        projectName.includes(term) || 
                        projectDescription.includes(term) || 
                        teamMembers.includes(term) ||
                        taskCount.includes(term)
                    );
                    
                    // Kartın görünürlüğünü ayarla
                    const cardContainer = card.closest('.col-md-4');
                    if (cardContainer) {
                        if (matches) {
                            cardContainer.style.display = '';
                            visibleCount++;
                        } else {
                            cardContainer.style.display = 'none';
                        }
                    }
                } catch (error) {
                    console.error('Kart işlenirken hata oluştu:', error);
                    const cardContainer = card.closest('.col-md-4');
                    if (cardContainer) {
                        cardContainer.style.display = 'none';
                    }
                }
            });
            
            // Sonuç bulunamadı mesajını göster/gizle
            const projectsList = document.getElementById('projectsList');
            if (projectsList) {
                const noResultsMessage = document.getElementById('noResultsMessage');
                if (visibleCount === 0 && searchTerm !== '') {
                    if (!noResultsMessage) {
                        const message = document.createElement('div');
                        message.id = 'noResultsMessage';
                        message.className = 'col-12 text-center py-5';
                        message.innerHTML = `
                            <div class="py-5">
                                <i class="bi bi-search display-1 text-muted"></i>
                                <h3 class="mt-3 text-muted">Sonuç bulunamadı</h3>
                                <p class="text-muted">Arama kriterlerinize uygun proje bulunamadı.</p>
                            </div>
                        `;
                        projectsList.appendChild(message);
                    }
                } else if (noResultsMessage) {
                    noResultsMessage.remove();
                }
            }
        });
    }

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

    // Görev durumu değiştirme olaylarını dinle
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('task-status-select')) {
            const taskId = e.target.getAttribute('data-task-id');
            const newStatus = e.target.value;
            if (taskId && newStatus) {
                updateTaskStatus(taskId, newStatus);
            }
        }
    });
}

// Projeleri yükle (sadece giriş yapan kullanıcıya ait gerçek projeler)
async function loadProjects() {
    try {
        // API çağrısı başlamadan önce zaman damgası al
        const startTime = performance.now();
        
        // Loading animasyonunu göster (API'nin yanıt süresi kadar gecikme ile)
        showLoading('Projeler yükleniyor...');
        
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
        
        // API'den projeleri çek
        const response = await fetch(API_URL.projects, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Projeler yüklenirken bir hata oluştu!');
        }
        
        const projects = await response.json();
        
        // API çağrısı tamamlandıktan sonra geçen süreyi hesapla
        const apiResponseTime = performance.now() - startTime;
        
        // Loading animasyonunun gecikme süresini API yanıt süresine göre ayarla
        // Eğer API yanıtı çok hızlıysa, loading animasyonu hiç gösterilmeyecek
        loadingDelay = apiResponseTime;
        
        // Projeleri formatla
        const formattedProjects = projects.map(p => {
            const taskCount = p.tasks ? p.tasks.length : 0;
            const completedTaskCount = p.tasks ? p.tasks.filter(task => task.status === 'Tamamlandı').length : 0;
            const isCompleted = taskCount > 0 && taskCount === completedTaskCount;

            return {
                id: p._id,
                name: p.title,
                description: p.description,
                taskCount: taskCount,
                completedTaskCount: completedTaskCount,
                isCompleted: isCompleted,
                teamMembers: p.team ? p.team.map(member => ({
                    name: member.name,
                    email: member.email,
                    profileImage: member.profileImage
                })) : []
            };
        });

        // Sayfa URL'sine göre projeleri filtrele
        const currentPage = window.location.pathname;
        let filteredProjects = formattedProjects;

        if (currentPage.includes('completed-projects.html')) {
            // Sadece tamamlanan projeleri göster
            filteredProjects = formattedProjects.filter(project => project.isCompleted);
        } else if (currentPage.includes('index.html') || currentPage === '/') {
            // Ana sayfada sadece tamamlanmamış projeleri göster
            filteredProjects = formattedProjects.filter(project => !project.isCompleted);
        }

        renderProjects(filteredProjects);
        
        // Loading animasyonunu gizle
        hideLoading();
        
        return filteredProjects;
    } catch (error) {
        console.error('Projeler yüklenirken hata:', error);
        showAlert('Projeler yüklenirken bir hata oluştu: ' + error.message, 'danger');
        
        // Hata durumunda da loading animasyonunu gizle
        hideLoading();
        
        return [];
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
                ${project.isCompleted ? `
                <div class="progress mb-2" style="height: 8px;">
                    <div class="progress-bar bg-success" role="progressbar" style="width: 100%" 
                        aria-valuenow="100" aria-valuemin="0" aria-valuemax="100">
                    </div>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-auto">
                    <span class="text-muted small"><i class="bi bi-check-circle-fill"></i> Tüm görevler tamamlandı</span>
                    <a href="project.html?id=${project.id}" class="btn btn-outline-success btn-sm px-3" onclick="event.stopPropagation();">
                        <i class="bi bi-kanban me-1"></i> Görev Panosu
                    </a>
                </div>
                ` : `
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
                `}
            </div>
        </div>
    `;
    
    // Kartın tamamına tıklama olayını ekle
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
    // Kullanıcı _id'lerini topla
    const teamMemberTags = document.querySelectorAll('#teamMembersList .team-member-tag');
    const teamMembers = Array.from(teamMemberTags)
        .map(tag => tag.getAttribute('data-id'))
        .filter(Boolean); // Sadece id'si olanları al
    
    console.log('Ekip üyeleri ID\'leri:', teamMembers);
    
    // Görevleri al
    const taskItems = document.querySelectorAll('#tasksList .task-item');
    // Görevleri, backend'e uygun şekilde sadece frontend'de tutacağız. Görevler proje ile birlikte gönderilmeyecek.
    const tasks = Array.from(taskItems).map(item => {
        const assigneeSelect = item.querySelector('.task-assignee');
        const selectedOption = assigneeSelect.options[assigneeSelect.selectedIndex];
        let assignedTo = '';
        
        if (selectedOption && selectedOption.value) {
            // Seçili option'dan kullanıcı ID'sini al
            const id = selectedOption.getAttribute('data-id');
            
            // Eğer ID varsa kullan, yoksa ilgili tag'dan ID'yi bulmaya çalış
            if (id) {
                assignedTo = id;
                console.log('Görev ataması için kullanıcı ID bulundu:', id);
            } else {
                // Seçili kullanıcı adına göre team member tag'larından ID'yi bul
                const memberName = selectedOption.value;
                const memberTag = document.querySelector(`.team-member-tag[data-member="${memberName}"]`);
                
                if (memberTag) {
                    const tagId = memberTag.getAttribute('data-id');
                    if (tagId) {
                        assignedTo = tagId;
                        console.log('Tag\'dan kullanıcı ID bulundu:', tagId);
                    }
                }
            }
        }
        
        const taskData = {
            title: item.querySelector('.task-title').value,
            description: item.querySelector('.task-description').value,
            dueDate: item.querySelector('.task-end-date').value,
            assignedTo: assignedTo
        };
        
        console.log('Oluşturulan görev:', taskData);
        return taskData;
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
    // Takım üyelerinin ID'lerini doğru şekilde topla
    const teamMemberIds = [];
    // Değişken adı çakışmasını önlemek için farklı bir isim kullanıyoruz
    const allTeamMemberTags = document.querySelectorAll('#teamMembersList .team-member-tag');
    allTeamMemberTags.forEach(tag => {
        const memberId = tag.getAttribute('data-id');
        if (memberId) {
            teamMemberIds.push(memberId);
        }
    });
    
    console.log('Ekip üyeleri ID\'leri (gönderilecek):', teamMemberIds);
    
    const newProject = {
        title: projectName,
        description: projectDescription,
        startDate: projectStartDate,
        endDate: projectEndDate,
        team: teamMemberIds // Doğrudan ID dizisini gönder
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
            console.log('Oluşturulan proje:', createdProject);
            let taskAddedCount = 0;
            
            for (const task of tasks) {
                // Görev başlığı ve atanan kişi zorunlu (Task modeline göre)
                if (task.title && task.assignedTo) {
                    const taskData = {
                        title: task.title,
                        description: task.description || 'Görev açıklaması', // Boş bırakılamaz
                        // project zaten URL'de gönderildiği için body'de göndermiyoruz
                        status: 'Yapılacak', // Backend'deki enum değerlerine uygun olmalı
                        assignedTo: task.assignedTo // Zorunlu alan
                    };
                    
                    console.log('Görev atanan kişi ID:', task.assignedTo);
                    
                    // Eğer görev bitiş tarihi varsa ekle
                    if (task.dueDate) {
                        taskData.dueDate = task.dueDate;
                    }
                    
                    console.log('Gönderilecek görev verisi:', taskData);
                    
                    try {
                        // Görev oluşturma endpoint'ine projectId parametresini URL'de gönder
                        const taskResponse = await fetch(`${API_URL.projects}/${createdProject._id}/tasks`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify(taskData)
                        });
                        
                        if (taskResponse.ok) {
                            taskAddedCount++;
                            const savedTask = await taskResponse.json();
                            console.log('Kaydedilen görev:', savedTask);
                        } else {
                            console.error('Görev eklenirken hata:', await taskResponse.text());
                        }
                    } catch (taskError) {
                        console.error('Görev eklenirken hata oluştu:', taskError);
                    }
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
    
    // Tüm görev atama seçeneklerini güncelle
    const taskAssignees = document.querySelectorAll('.task-assignee');
    taskAssignees.forEach(select => {
        // Mevcut seçili değeri koru
        const currentValue = select.value;
        const currentId = select.getAttribute('data-selected-id');
        
        // Seçenekleri temizle ve varsayılan seçeneği ekle
        select.innerHTML = '<option value="">Seçiniz</option>';
        
        // Ekip üyelerini seçeneklere ekle
        memberTags.forEach(tag => {
            const member = tag.getAttribute('data-member');
            const memberId = tag.getAttribute('data-id');
            
            const option = document.createElement('option');
            option.value = member;
            option.textContent = member;
            
            // Kullanıcı ID'sini option'a ekle
            if (memberId) {
                option.setAttribute('data-id', memberId);
            }
            
            select.appendChild(option);
        });
        
        // Önceki seçili değeri geri yükle (eğer hala mevcut ekip üyelerinde varsa)
        if (currentValue) {
            // İsim ile eşleştirmeyi dene
            const options = select.querySelectorAll('option');
            for (let i = 0; i < options.length; i++) {
                if (options[i].value === currentValue) {
                    select.value = currentValue;
                    break;
                }
            }
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

// Tamamlanan projeleri göster/gizle
function toggleCompletedProjects() {
    const projectsList = document.getElementById('projectsList');
    const completedProjectsLink = document.getElementById('completedProjectsLink');
    const isShowingCompleted = completedProjectsLink.classList.contains('active');
    
    // Link durumunu güncelle
    completedProjectsLink.classList.toggle('active');
    
    // Projeleri filtrele
    const projectCards = projectsList.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        const cardContainer = card.closest('.col-md-4');
        const isCompleted = card.querySelector('.badge.bg-success') !== null;
        
        if (isShowingCompleted) {
            // Tüm projeleri göster
            cardContainer.style.display = '';
        } else {
            // Sadece tamamlanan projeleri göster
            cardContainer.style.display = isCompleted ? '' : 'none';
        }
    });
    
    // Başlığı güncelle
    const pageTitle = document.querySelector('.container.mt-4 h1');
    if (pageTitle) {
        pageTitle.textContent = isShowingCompleted ? 'Projelerim' : 'Tamamlanan Projeler';
    }
}

// Görev durumunu güncelle
async function updateTaskStatus(taskId, newStatus) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`${API_URL.tasks}/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            throw new Error('Görev durumu güncellenemedi');
        }

        // Görev başarıyla güncellendi
        const updatedTask = await response.json();
        console.log('Görev güncellendi:', updatedTask);

        // Projeleri yeniden yükle
        loadProjects();

        // Başarı mesajı göster
        showAlert('Görev durumu başarıyla güncellendi', 'success');
    } catch (error) {
        console.error('Görev durumu güncellenirken hata:', error);
        showAlert('Görev durumu güncellenirken bir hata oluştu', 'danger');
    }
}