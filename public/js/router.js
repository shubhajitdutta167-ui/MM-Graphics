// --- Hash-based Routing ---
// Pages accessible regardless of auth state
const PUBLIC_ROUTES = {
    'about': 'about-section',
    'services': 'services-section',
    'privacy': 'privacy-section',
    'terms': 'terms-section',
};

function handleRouting() {
    const hash = window.location.hash.replace('#', '');
    const loggedIn = localStorage.getItem('token');

    // Public pages accessible to everyone
    if (PUBLIC_ROUTES[hash]) {
        showSection(PUBLIC_ROUTES[hash]);
        return;
    }

    if (loggedIn) {
        if (hash === 'admin' && localStorage.getItem('role') === 'admin') {
            loadAdminDashboard();
        } else if (hash === 'dashboard') {
            loadCustomerDashboard();
        } else if (hash === 'login' || hash === 'register') {
            goToDashboard();
        } else if (hash === '') {
            showSection('home');
        } else {
            goToDashboard();
        }
    } else {
        switch(hash) {
            case 'login':
                showSection('login-section');
                break;
            case 'register':
                showSection('register-section');
                break;
            default:
                showSection('home');
        }
    }
}
