// Auth Guard: Giriş yapılmadan erişilmemesi gereken sayfalarda otomatik yönlendirme
(function() {
    const publicPages = ['login.html', 'register.html', 'forgot-password.html', 'reset-password.html'];
    const page = window.location.pathname.split('/').pop();
    if (publicPages.includes(page)) {
        // Eğer kullanıcı giriş yaptıysa, bu sayfalara gitmeye çalışırsa ana sayfaya yönlendir
        if (localStorage.getItem('token')) {
            window.location.replace('index.html');
        }
    }
})();
