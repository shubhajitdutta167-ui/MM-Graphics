// --- Partial Loader ---
async function loadPartial(url, container) {
    const res = await fetch(url);
    const html = await res.text();
    container.insertAdjacentHTML('beforeend', html);
}

// --- Bootstrap ---
async function initApp() {
    const mainEl = document.getElementById('main-content');

    // Load partials in order
    const navTarget = document.getElementById('nav-slot');
    const footerTarget = document.getElementById('footer-slot');

    await Promise.all([
        loadPartial('/partials/navbar.html', navTarget),
        loadPartial('/partials/home.html', mainEl),
        loadPartial('/partials/about.html', mainEl),
        loadPartial('/partials/login.html', mainEl),
        loadPartial('/partials/register.html', mainEl),
        loadPartial('/partials/services.html', mainEl),
        loadPartial('/partials/admin-dashboard.html', mainEl),
        loadPartial('/partials/customer-dashboard.html', mainEl),
        loadPartial('/partials/privacy.html', mainEl),
        loadPartial('/partials/terms.html', mainEl),
        loadPartial('/partials/footer.html', footerTarget),
    ]);

    // Init everything after DOM is populated
    checkAuth();
    fetchDemos();
    initSlider();
    handleRouting();
    window.addEventListener('hashchange', handleRouting);
}

// --- Service Worker Registration ---
function registerSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then((reg) => {
            // Check for SW updates periodically
            setInterval(() => reg.update(), 60 * 60 * 1000); // every hour
        }).catch((err) => {
            console.warn('SW registration failed:', err);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    registerSW();
});
