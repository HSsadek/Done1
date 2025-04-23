// Kayıt Ol formu işlemleri

document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    const msgDiv = document.getElementById('registerMsg');
    msgDiv.textContent = '';

    if (password !== passwordConfirm) {
        msgDiv.className = 'alert alert-danger';
        msgDiv.textContent = 'Şifreler eşleşmiyor.';
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();
        if (response.ok) {
            msgDiv.className = 'alert alert-success';
            msgDiv.textContent = 'Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...';
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
