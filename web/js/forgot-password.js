// Şifremi Unuttum formu işlemleri

document.getElementById('forgotPasswordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const msgDiv = document.getElementById('forgotPasswordMsg');
    msgDiv.textContent = '';
    try {
        const response = await fetch('http://localhost:5000/api/auth/reset-password-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await response.json();
        if (response.ok) {
            msgDiv.className = 'alert alert-success';
            msgDiv.textContent = data.message || 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.';
            setTimeout(() => {
                if (data.resetUrl) {
                    window.location.href = data.resetUrl;
                } else {
                    window.location.href = 'reset-password.html';
                }
            }, 2000);
        } else {
            if (response.status === 404 && data.message && data.message.includes('kayıtlı kullanıcı bulunamadı')) {
                msgDiv.className = 'alert alert-warning';
                msgDiv.textContent = 'Bu e-posta ile kayıtlı kullanıcı bulunamadı. Şifre sıfırlamak için önce kayıt olmanız gerekir.';
                return;
            }
            msgDiv.className = 'alert alert-danger';
            msgDiv.textContent = data.message || 'Bir hata oluştu.';
        }
    } catch (err) {
        msgDiv.className = 'alert alert-danger';
        msgDiv.textContent = 'Bir hata oluştu. Lütfen tekrar deneyin.';
    }
});
