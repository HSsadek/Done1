// Şifre sıfırlama formu işlemleri

document.addEventListener('DOMContentLoaded', function() {
    // URL'den token'ı al
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    document.getElementById('token').value = token || '';

    document.getElementById('resetPasswordForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('passwordConfirm').value;
        const msgDiv = document.getElementById('resetPasswordMsg');
        msgDiv.textContent = '';

        if (!password || password.length < 6) {
            msgDiv.className = 'alert alert-danger';
            msgDiv.textContent = 'Şifre en az 6 karakter olmalıdır.';
            return;
        }
        if (password !== passwordConfirm) {
            msgDiv.className = 'alert alert-danger';
            msgDiv.textContent = 'Şifreler eşleşmiyor!';
            return;
        }
        try {
            const response = await fetch('http://localhost:5000/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });
            const data = await response.json();
            if (response.ok) {
                msgDiv.className = 'alert alert-success';
                msgDiv.textContent = data.message || 'Şifreniz başarıyla güncellendi.';
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                msgDiv.className = 'alert alert-danger';
                msgDiv.textContent = data.message || 'Bir hata oluştu.';
            }
        } catch (err) {
            msgDiv.className = 'alert alert-danger';
            msgDiv.textContent = 'Bir hata oluştu. Lütfen tekrar deneyin.';
        }
    });
});
