// Autocomplete ekip üyesi seçimi için vanilla JS
let allUsers = [];

async function searchUsers(query) {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/api/auth/search?query=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return [];
    return await response.json();
}

function setupUserAutocomplete(inputElem) {
    inputElem.setAttribute('autocomplete', 'off');
    let container = inputElem.parentNode.querySelector('.autocomplete-suggestions');
    if (!container) {
        container = document.createElement('div');
        container.className = 'autocomplete-suggestions';
        container.style.position = 'absolute';
        container.style.zIndex = 99999;
        container.style.width = '100%';
        inputElem.parentNode.appendChild(container);
    }

    inputElem.addEventListener('input', async function() {
        const val = this.value.trim();
        container.innerHTML = '';
        if (!val) return;
        const users = await searchUsers(val);
        console.log('Backend yanıtı:', users);
        if (users && Array.isArray(users) && users.length > 0) {
            users.slice(0, 8).forEach(user => {
                const item = document.createElement('div');
                item.className = 'autocomplete-suggestion d-flex align-items-center gap-2';
                item.innerHTML = `
                    ${user.profilePhoto ? `<img src="${user.profilePhoto}" alt="${user.name}" class="rounded-circle" class="profile-photo">` : `<i class="bi bi-person-circle fs-4 text-primary"></i>`}
                    <div class="flex-grow-1" class="user-info">
                        <div class="fw-semibold">${user.name ? user.name : ''}</div>
                    </div>
                `;
                item.style.cursor = 'pointer';
                item.addEventListener('mousedown', function() {
                    // Kullanıcı ID'sini ve adını özel bir event ile gönder
                    const selectEvent = new CustomEvent('userSelected', {
                        detail: {
                            id: user._id,
                            name: user.name || user.email
                        }
                    });
                    inputElem.value = user.name || user.email;
                    container.innerHTML = '';
                    inputElem.dispatchEvent(selectEvent);
                });
                container.appendChild(item);
            });
        }
    });
    document.addEventListener('click', function(e) {
        if (!container.contains(e.target) && e.target !== inputElem) {
            container.innerHTML = '';
        }
    });
}

// Proje modalı açıldığında çağır:
document.addEventListener('DOMContentLoaded', async () => {
    document.querySelectorAll('.team-member-input').forEach(setupUserAutocomplete);
});

// Yeni ekip üyesi input'u eklenince de çağır:
function onNewTeamMemberInput(inputElem) {
    setupUserAutocomplete(inputElem);
}
