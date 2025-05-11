// Modern Login Logic
const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('loginPassword');
const togglePasswordBtn = document.getElementById('togglePassword');
const togglePasswordIcon = document.getElementById('togglePasswordIcon');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');

// Şifre göster/gizle
if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', function() {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        togglePasswordIcon.className = type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
    });
}

// Giriş işlemi
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = passwordInput.value;

    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            
            // Tarayıcı geçmişini manipüle et
            // Giriş yaptıktan sonra geri tuşuna basınca login sayfasına dönmeyi engelle
            history.pushState(null, "", window.location.href);
            history.replaceState(null, "", 'index.html');
            
            window.location.href = 'index.html';
        } else {
            alert(data.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
        }
    } catch (err) {
        alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
});

// Şifremi unuttum linki artık forgot-password.html sayfasına yönlendiriyor. Ekstra event gerekmez.
