// Profil Sayfası JavaScript Kodu

// API URL'leri (Backend entegrasyonu için)
const API_URL = {
    profile: 'http://localhost:5000/api/auth/profile',
    projects: 'http://localhost:5000/api/projects'
};

// DOM yüklendikten sonra çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', () => {
    // Kullanıcı bilgilerini yükle
    loadUserProfile();
    
    // Event listener'ları ekle
    setupEventListeners();
});

// Event listener'ları ayarla
function setupEventListeners() {
    // Profil düzenleme butonu
    document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
    
    // Profil resmi değiştirme (modal)
    document.getElementById('profileImageInput').addEventListener('change', handleProfileImageChange);
    
    // Ayarlar sekmesindeki profil resmi değiştirme
    document.getElementById('settingsProfileImageInput').addEventListener('change', handleSettingsProfileImageChange);
    
    // Ayarlar sekmesi kaydetme butonu
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
    
    // Sekme değişikliğinde animasyon ekle
    const tabEls = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabEls.forEach(tabEl => {
        tabEl.addEventListener('shown.bs.tab', event => {
            const targetPane = document.querySelector(event.target.getAttribute('data-bs-target'));
            targetPane.classList.add('animate__animated', 'animate__fadeIn');
            setTimeout(() => {
                targetPane.classList.remove('animate__animated', 'animate__fadeIn');
            }, 500);
        });
    });
    // Çıkış yap butonu
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Tüm localStorage'ı temizle
            localStorage.clear();
            
            // Tarayıcı geçmişini temizle
            // Geçmişi manipüle ederek geri tuşunu etkisiz hale getir
            history.pushState(null, "", window.location.href);
            history.pushState(null, "", window.location.href);
            history.replaceState(null, "", 'login.html');
            
            // Login sayfasına yönlendir ve sayfayı tam olarak yenile
            window.location.replace('login.html');
            setTimeout(() => { window.location.reload(true); }, 100);
        });
    }
}

// Kullanıcı profilini yükle (gerçek API)
async function loadUserProfile() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch(API_URL.profile, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Profil getirilemedi');
        const userData = await response.json();
        renderUserProfile(userData);
    } catch (error) {
        console.error('Kullanıcı bilgileri yüklenirken hata oluştu:', error);
        showAlert('Kullanıcı bilgileri yüklenirken bir hata oluştu.', 'danger');
    }
}

// Kullanıcı profilini ekrana render et
function renderUserProfile(userData) {
    // Profil bilgilerini güncelle
    document.getElementById('userName').textContent = userData.name;
    document.getElementById('userEmail').textContent = userData.email;
    document.getElementById('profileImage').src = userData.profileImage;
    
    // Düzenleme formunu doldur
    document.getElementById('editName').value = userData.name;
    document.getElementById('editEmail').value = userData.email;
    document.getElementById('editProfileImage').src = userData.profileImage;
    
    // Ayarlar sekmesi formunu doldur
    document.getElementById('settingsName').value = userData.name;
    document.getElementById('settingsEmail').value = userData.email;
    document.getElementById('settingsProfileImage').src = userData.profileImage;
}

// Kullanıcının projelerini yükle (gerçek API)
async function loadUserProjects() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(API_URL.projects, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Projeler yüklenemedi');
        }

        const projects = await response.json();
        const userId = await getUserIdFromProfile(token);

        // Kullanıcının sahibi olduğu veya ekipte olduğu projeleri filtrele
        const userProjects = projects.filter(p => 
            p.owner && p.owner._id === userId || 
            (p.team && p.team.some(t => t._id === userId))
        );

        // Projeleri dönüştür ve durumlarını kontrol et
        const formattedProjects = userProjects.map(p => {
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

        // Aktif projeleri render et
        const activeProjects = formattedProjects.filter(p => !p.isCompleted);
        renderProjects(activeProjects, 'userProjects');

    } catch (error) {
        console.error('Projeler yüklenirken hata:', error);
        showAlert('Projeler yüklenirken bir hata oluştu', 'danger');
    }
}

// Token ile kullanıcı id'sini getir
async function getUserIdFromProfile(token) {
    const response = await fetch(API_URL.profile, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return null;
    const user = await response.json();
    return user._id;
}

// Projeleri render et
function renderProjects(projects, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (projects.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="py-5">
                    <i class="bi bi-folder-x display-1 text-muted"></i>
                    <h3 class="mt-3 text-muted">Henüz hiç proje yok</h3>
                    <p class="text-muted">Yeni bir proje oluşturmak için ana sayfaya gidin.</p>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = projects.map(project => `
        <div class="col-md-4 mb-4">
            <div class="card project-card shadow-lg border-0 rounded-4 position-relative project-modern-card" style="cursor:pointer; transition: box-shadow .2s;">
                <div class="card-body pb-4 d-flex flex-column">
                    <div class="d-flex align-items-center mb-2">
                        <div class="flex-grow-1">
                            <h5 class="card-title fw-bold mb-1 text-primary" style="display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden;">
                                <i class="bi bi-folder2-open me-2"></i>${project.name}
                            </h5>
                        </div>
                        ${project.isCompleted ? 
                            '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Tamamlandı</span>' : 
                            ''}
                    </div>
                    <p class="card-text mb-2 text-secondary" style="display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; flex: 1;">
                        ${project.description}
                    </p>
                    <div class="d-flex align-items-center mb-3">
                        <span class="me-2 small text-muted"><i class="bi bi-people"></i> Ekip:</span>
                        <div class="team-members-avatars d-flex align-items-center">
                            ${project.teamMembers.slice(0,5).map(member => {
                                if (member.profileImage) {
                                    return `<img src="${member.profileImage}" class="rounded-circle me-1 border" alt="${member.name}" title="${member.name}" style="width:32px;height:32px;object-fit:cover;">`;
                                } else {
                                    const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase();
                                    return `<span class="rounded-circle bg-primary text-white d-inline-flex justify-content-center align-items-center me-1 border" title="${member.name}" style="width:32px;height:32px;font-size:1rem;">${initials}</span>`;
                                }
                            }).join('')}
                            ${project.teamMembers.length > 5 ? 
                                `<span class="badge bg-secondary ms-1">+${project.teamMembers.length-5}</span>` : 
                                ''}
                        </div>
                        <span class="ms-2 small text-muted">${project.teamMembers.length} üye</span>
                    </div>
                    <div class="progress mb-2" style="height: 8px;">
                        <div class="progress-bar bg-success" role="progressbar" 
                            style="width: ${project.taskCount > 0 ? (project.completedTaskCount / project.taskCount * 100) : 0}%" 
                            aria-valuenow="${project.taskCount > 0 ? (project.completedTaskCount / project.taskCount * 100) : 0}" 
                            aria-valuemin="0" 
                            aria-valuemax="100">
                        </div>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-auto">
                        <span class="text-muted small">
                            <i class="bi bi-check-circle-fill"></i> ${project.completedTaskCount}/${project.taskCount} görev tamamlandı
                        </span>
                        <a href="project.html?id=${project.id}" class="btn btn-outline-primary btn-sm px-3" onclick="event.stopPropagation();">
                            <i class="bi bi-kanban me-1"></i> Görev Panosu
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // Kartlara tıklama olayı ekle
    container.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', () => {
            const projectId = card.querySelector('a').href.split('id=')[1];
            window.location.href = `project.html?id=${projectId}`;
        });
    });
}

// Kullanıcının aktivitelerini yükle (API'den veri çekme simülasyonu)
async function loadUserActivities() {
    try {
        // Gerçek uygulamada burada API çağrısı yapılacak
        // const response = await fetch(`${API_URL.activities}?userId=user1`);
        // const activities = await response.json();
        
        // Şimdilik örnek veri kullanıyoruz
        const activities = [
            {
                id: 'activity1',
                type: 'task_completed',
                project: 'Web Sitesi Yenileme',
                task: 'Ana Sayfa Tasarımı',
                date: '2023-06-15T10:30:00'
            },
            {
                id: 'activity2',
                type: 'project_created',
                project: 'Mobil Uygulama Geliştirme',
                date: '2023-06-10T14:45:00'
            },
            {
                id: 'activity3',
                type: 'task_assigned',
                project: 'Veritabanı Optimizasyonu',
                task: 'Sorgu Optimizasyonu',
                assignee: 'Mehmet Kaya',
                date: '2023-06-05T09:15:00'
            },
            {
                id: 'activity4',
                type: 'comment_added',
                project: 'Web Sitesi Yenileme',
                task: 'Responsive Tasarım',
                comment: 'Mobil görünümde header kısmında sorun var, kontrol edelim.',
                date: '2023-06-01T16:20:00'
            }
        ];
        
        renderUserActivities(activities);
    } catch (error) {
        console.error('Aktiviteler yüklenirken hata oluştu:', error);
        showAlert('Aktiviteler yüklenirken bir hata oluştu.', 'danger');
    }
}

// Kullanıcının aktivitelerini ekrana render et
function renderUserActivities(activities) {
    const activitiesContainer = document.getElementById('userActivities');
    activitiesContainer.innerHTML = '';
    
    if (activities.length === 0) {
        activitiesContainer.innerHTML = `
            <li class="list-group-item text-center py-4">
                <i class="bi bi-calendar-x text-muted display-4"></i>
                <p class="mt-3 text-muted">Henüz hiç aktivite yok</p>
            </li>
        `;
        return;
    }
    
    activities.forEach(activity => {
        const activityItem = createActivityItem(activity);
        activitiesContainer.appendChild(activityItem);
    });
}

// Aktivite öğesi oluştur
function createActivityItem(activity) {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    
    // Aktivite tarihini formatla
    const activityDate = new Date(activity.date);
    const formattedDate = activityDate.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Aktivite tipine göre içerik, ikon ve sınıf belirle
    let icon, content, activityClass;
    
    switch (activity.type) {
        case 'task_completed':
            icon = '<i class="bi bi-check-circle-fill"></i>';
            content = `<strong>${activity.project}</strong> projesinde <strong>${activity.task}</strong> görevini tamamladınız.`;
            activityClass = 'task-completed';
            break;
        case 'project_created':
            icon = '<i class="bi bi-folder-plus"></i>';
            content = `<strong>${activity.project}</strong> projesini oluşturdunuz.`;
            activityClass = 'project-created';
            break;
        case 'task_assigned':
            icon = '<i class="bi bi-person-check"></i>';
            content = `<strong>${activity.project}</strong> projesinde <strong>${activity.task}</strong> görevi size atandı.`;
            activityClass = 'task-assigned';
            break;
        case 'comment_added':
            icon = '<i class="bi bi-chat-left-text"></i>';
            content = `<strong>${activity.project}</strong> projesindeki <strong>${activity.task}</strong> görevine yorum eklediniz: "${activity.comment}"`;
            activityClass = 'comment-added';
            break;
        default:
            icon = '<i class="bi bi-activity"></i>';
            content = 'Bilinmeyen aktivite';
            activityClass = '';
    }
    
    li.innerHTML = `
        <div class="activity-item ${activityClass}">
            <div class="d-flex">
                <div class="activity-icon me-3">
                    ${icon}
                </div>
                <div class="activity-content">
                    <div>${content}</div>
                    <small class="text-muted">${formattedDate}</small>
                </div>
            </div>
        </div>
    `;
    
    return li;
}

// Ayarlar sekmesindeki bilgileri kaydet
async function saveSettings() {
    try {
        // Form verilerini al
        const name = document.getElementById('settingsName').value;
        const email = document.getElementById('settingsEmail').value;
        
        // settingsRole elementini kontrol et - eğer yoksa role değişkenini tanımlama
        let role = null;
        const roleElement = document.getElementById('settingsRole');
        if (roleElement) {
            role = roleElement.value;
        }
        
        const password = document.getElementById('settingsPassword').value;
        const passwordConfirm = document.getElementById('settingsPasswordConfirm').value;
        const profileImage = document.getElementById('settingsProfileImage').src;
        
        // Basit doğrulama
        if (!name || !email) {
            showAlert('Lütfen gerekli alanları doldurun.', 'warning');
            return;
        }
        
        if (password && password !== passwordConfirm) {
            showAlert('Şifreler eşleşmiyor.', 'warning');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            showAlert('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.', 'danger');
            return;
        }

        // Backend'e gönderilecek veri
        const updateData = {
            name,
            email,
            role,
            profileImage
        };

        if (password) {
            updateData.password = password;
        }

        // API çağrısı
        const response = await fetch(API_URL.profile, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            throw new Error('Profil güncellenirken bir hata oluştu');
        }

        const result = await response.json();
        
        // Profil bilgilerini güncelle
        document.getElementById('userName').textContent = name;
        document.getElementById('userEmail').textContent = email;
        
        // userRole elementini kontrol et
        const userRoleElement = document.getElementById('userRole');
        if (userRoleElement && role !== null) {
            userRoleElement.textContent = role;
        }
        
        document.getElementById('profileImage').src = profileImage;
        
        // Modal formunu da güncelle
        document.getElementById('editName').value = name;
        document.getElementById('editEmail').value = email;
        
        // editRole elementini kontrol et
        const editRoleElement = document.getElementById('editRole');
        if (editRoleElement && role !== null) {
            editRoleElement.value = role;
        }
        
        document.getElementById('editProfileImage').src = profileImage;
        
        showAlert('Profil bilgileriniz başarıyla güncellendi.', 'success');
    } catch (error) {
        console.error('Profil bilgileri kaydedilirken hata oluştu:', error);
        showAlert('Profil bilgileri kaydedilirken bir hata oluştu.', 'danger');
    }
}

// Profil bilgilerini kaydet
async function saveProfile() {
    // Form verilerini al
    const name = document.getElementById('editName').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const password = document.getElementById('editPassword').value;
    const passwordConfirm = document.getElementById('editPasswordConfirm').value;
    
    // Validasyon
    if (name === '' || email === '') {
        showAlert('Lütfen gerekli alanları doldurunuz.', 'warning');
        return;
    }
    
    // E-posta formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert('Lütfen geçerli bir e-posta adresi giriniz.', 'warning');
        return;
    }
    
    // Şifre kontrolü (eğer şifre değiştiriliyorsa)
    if (password !== '') {
        if (password.length < 6) {
            showAlert('Şifre en az 6 karakter olmalıdır.', 'warning');
            return;
        }
        
        if (password !== passwordConfirm) {
            showAlert('Şifreler eşleşmiyor.', 'warning');
            return;
        }
    }
    
    // Profil resmi al
    const profileImage = document.getElementById('editProfileImage').src;
    
    // Profil verilerini oluştur
    const profileData = {
        name: name,
        email: email,
        password: password !== '' ? password : undefined,
        profileImage: profileImage
    };
    
    try {
        // Gerçek uygulamada burada API çağrısı yapılacak
        // const response = await fetch(API_URL.profile, {
        //     method: 'PUT',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify(profileData)
        // });
        // const updatedProfile = await response.json();
        
        // Başarılı güncelleme sonrası
        showAlert('Profil bilgileriniz başarıyla güncellendi!', 'success');
        
        // Profil bilgilerini güncelle
        document.getElementById('userName').textContent = name;
        document.getElementById('userEmail').textContent = email;
        document.getElementById('userRole').textContent = role;
        document.getElementById('profileImage').src = profileImage;
        
        // Ayarlar sekmesindeki profil bilgilerini de güncelle
        document.getElementById('settingsName').value = name;
        document.getElementById('settingsEmail').value = email;
        document.getElementById('settingsRole').value = role;
        document.getElementById('settingsProfileImage').src = profileImage;
        
        // Modal'ı kapat
        const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
        modal.hide();
        
        // Profil bilgilerini yeniden yükle (API entegrasyonu aktif olduğunda kullanılacak)
        // loadUserProfile();
    } catch (error) {
        console.error('Profil güncellenirken hata oluştu:', error);
        showAlert('Profil güncellenirken bir hata oluştu.', 'danger');
    }
}

// Profil resmi değiştirme (modal için)
function handleProfileImageChange(event) {
    const file = event.target.files[0];
    if (file) {
        // Dosya tipini kontrol et
        if (!file.type.startsWith('image/')) {
            showAlert('Lütfen geçerli bir resim dosyası seçin.', 'warning');
            return;
        }
        
        // Dosya boyutunu kontrol et (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showAlert('Resim dosyası 2MB\'dan küçük olmalıdır.', 'warning');
            return;
        }
        
        // Resmi önizle
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('editProfileImage').src = e.target.result;
            // Başarılı yükleme bildirimi göster
            showAlert('Profil resmi başarıyla yüklendi. Değişiklikleri kaydetmek için "Kaydet" butonuna tıklayın.', 'info');
        };
        reader.readAsDataURL(file);
        
        // Gerçek uygulamada burada dosya yükleme işlemi yapılacak
        // Örnek: uploadProfileImage(file);
    }
}

// Ayarlar sekmesindeki profil resmi değiştirme
function handleSettingsProfileImageChange(event) {
    const file = event.target.files[0];
    if (file) {
        // Dosya tipini kontrol et
        if (!file.type.startsWith('image/')) {
            showAlert('Lütfen geçerli bir resim dosyası seçin.', 'warning');
            return;
        }
        
        // Dosya boyutunu kontrol et (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showAlert('Resim dosyası 2MB\'dan küçük olmalıdır.', 'warning');
            return;
        }
        
        // Resmi önizle
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('settingsProfileImage').src = e.target.result;
            // Başarılı yükleme bildirimi göster
            showAlert('Profil resmi başarıyla yüklendi. Değişiklikleri kaydetmek için "Değişiklikleri Kaydet" butonuna tıklayın.', 'info');
        };
        reader.readAsDataURL(file);
        
        // Gerçek uygulamada burada dosya yükleme işlemi yapılacak
        // Örnek: uploadProfileImage(file);
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