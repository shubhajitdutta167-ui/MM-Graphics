const API_BASE = '/api';

// --- Toast Notification System ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// --- Mobile Menu ---
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.classList.toggle('open');
}

// --- Loading Button Helper ---
function setButtonLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const textEl = btn.querySelector('.btn-text');
    if (loading) {
        btn.disabled = true;
        btn._originalText = textEl ? textEl.innerHTML : btn.innerHTML;
        if (textEl) textEl.innerHTML = '<span class="spinner"></span> Please wait...';
        else btn.innerHTML = '<span class="spinner"></span>';
    } else {
        btn.disabled = false;
        if (textEl && btn._originalText) textEl.innerHTML = btn._originalText;
        else if (btn._originalText) btn.innerHTML = btn._originalText;
    }
}

// --- Section Navigation ---
function showSection(id) {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    const section = document.getElementById(id);
    if (section) section.classList.remove('hidden');

    // Highlight active nav
    document.querySelectorAll('.nav-link').forEach(btn => {
        btn.classList.remove('bg-blue-50', 'text-blue-600');
    });

    const navMap = {
        'home': 'home',
        'about-section': 'about',
        'services-section': 'services',
        'login-section': 'login',
        'admin-dashboard': 'dashboard',
        'customer-dashboard': 'dashboard',
        'privacy-section': 'privacy',
        'terms-section': 'terms'
    };
    const navKey = navMap[id];
    if (navKey) {
        const activeBtn = document.querySelector(`.nav-link[data-nav="${navKey}"]`);
        if (activeBtn) activeBtn.classList.add('bg-blue-50', 'text-blue-600');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- PDF Download Helper ---
function triggerPdfDownload(url, billId) {
    const token = localStorage.getItem('token');
    showToast('Downloading PDF...', 'info');
    axios.get(url, {
        headers: { Authorization: token },
        responseType: 'blob'
    }).then(res => {
        const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `bill-${billId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(blobUrl);
    }).catch(err => {
        console.error('PDF download failed', err);
        showToast('PDF download failed', 'error');
    });
}
