// --- Auth ---
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    setButtonLoading('login-btn', true);
    try {
        const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.role);
        localStorage.setItem('name', res.data.name);
        localStorage.setItem('coachingName', res.data.coachingName);
        checkAuth();
        showToast('Login successful!', 'success');
        goToDashboard();
    } catch (err) {
        showToast('Login failed: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
        setButtonLoading('login-btn', false);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const coachingName = document.getElementById('reg-coaching').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const phone = document.getElementById('reg-phone').value;
    setButtonLoading('register-btn', true);
    try {
        await axios.post(`${API_BASE}/auth/register`, { name, email, password, coachingName, phone });
        showToast('Registration successful! Please login.', 'success');
        window.location.hash = 'login';
    } catch (err) {
        showToast('Registration failed: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
        setButtonLoading('register-btn', false);
    }
}

function checkAuth() {
    const token = localStorage.getItem('token');
    const ids = [
        'nav-login', 'nav-register', 'nav-dashboard', 'nav-logout',
        'mobile-login', 'mobile-register', 'mobile-dashboard', 'mobile-logout'
    ];
    const els = {};
    ids.forEach(id => { els[id] = document.getElementById(id); });

    const show = (el) => el && el.classList.remove('hidden');
    const hide = (el) => el && el.classList.add('hidden');

    if (token) {
        hide(els['nav-login']); hide(els['nav-register']); show(els['nav-dashboard']); show(els['nav-logout']);
        hide(els['mobile-login']); hide(els['mobile-register']); show(els['mobile-dashboard']); show(els['mobile-logout']);
    } else {
        show(els['nav-login']); show(els['nav-register']); hide(els['nav-dashboard']); hide(els['nav-logout']);
        show(els['mobile-login']); show(els['mobile-register']); hide(els['mobile-dashboard']); hide(els['mobile-logout']);
    }
}

function logout() {
    localStorage.clear();
    checkAuth();
    showToast('Logged out successfully', 'info');
    showSection('home');
    window.location.hash = '';
}

function goToDashboard() {
    const role = localStorage.getItem('role');
    if (role === 'admin') {
        window.location.hash = 'admin';
        loadAdminDashboard();
    } else {
        window.location.hash = 'dashboard';
        loadCustomerDashboard();
    }
}
