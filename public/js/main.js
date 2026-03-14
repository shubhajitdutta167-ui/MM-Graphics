const API_BASE = '/api';
let currentUser = null;

function showSection(id) {
    // First, hide all sections and remove 'active' class from all nav buttons
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('#main-nav button').forEach(btn => btn.classList.remove('bg-blue-700', 'text-white'));

    // Then, show the requested section
    const section = document.getElementById(id);
    if (section) {
        section.classList.remove('hidden');
    }

    // Finally, highlight the active nav button
    const activeBtn = document.querySelector(`button[onclick*="showSection('${id}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('bg-blue-700', 'text-white');
    }
}


async function fetchDemos() {
    try {
        // For now, if no demos in DB, show mock
        const res = await axios.get(`${API_BASE}/customer/demos`);
        const demoList = document.getElementById('demo-list');
        if (!demoList) return;
        demoList.innerHTML = '';
        
        const data = res.data.length ? res.data : [
            { title: "Sample Handwritten to PDF", description: "Clear and formatted PDF from handwriting.", price: 10, pdfUrl: "#" },
            { title: "Exam Question Paper", description: "Well-structured question paper design.", price: 15, pdfUrl: "#" },
            { title: "Notes Collection", description: "Subject-wise notes organized professionally.", price: 8, pdfUrl: "#" }
        ];

        data.forEach(d => {
            demoList.innerHTML += `
                <div class="bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300">
                    <h4 class="font-bold text-xl text-gray-800">${d.title}</h4>
                    <p class="text-gray-600 my-3">${d.description}</p>
                    <p class="text-blue-600 font-bold text-lg mb-4">₹${d.price} / per page</p>
                    <a href="${d.pdfUrl}" class="text-sm bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors duration-300">View Sample</a>
                </div>
            `;
        });
    } catch (err) { console.error(err); }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.role);
        localStorage.setItem('name', res.data.name);
        localStorage.setItem('coachingName', res.data.coachingName);
        checkAuth();
        goToDashboard();
    } catch (err) { alert('Login Failed: ' + (err.response?.data?.message || err.message)); }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const coachingName = document.getElementById('reg-coaching').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const phone = document.getElementById('reg-phone').value;
    try {
        await axios.post(`${API_BASE}/auth/register`, { name, email, password, coachingName, phone });
        alert('Registration Successful! Please login.');
        showSection('login-section');
    } catch (err) { alert('Registration Failed'); }
}

function checkAuth() {
    const token = localStorage.getItem('token');
    const navLogin = document.getElementById('nav-login');
    const navRegister = document.getElementById('nav-register');
    const navDashboard = document.getElementById('nav-dashboard');
    const navLogout = document.getElementById('nav-logout');

    if (token) {
        if (navLogin) navLogin.classList.add('hidden');
        if (navRegister) navRegister.classList.add('hidden');
        if (navDashboard) navDashboard.classList.remove('hidden');
        if (navLogout) navLogout.classList.remove('hidden');
    } else {
        if (navLogin) navLogin.classList.remove('hidden');
        if (navRegister) navRegister.classList.remove('hidden');
        if (navDashboard) navDashboard.classList.add('hidden');
        if (navLogout) navLogout.classList.add('hidden');
    }
}

function logout() {
    localStorage.clear();
    checkAuth();
    showSection('home');
    window.location.hash = ''; // Clear hash
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

async function loadAdminDashboard() {
    showSection('admin-dashboard');
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: token } };

    try {
        const [stats, customers, bills] = await Promise.all([
            axios.get(`${API_BASE}/admin/stats`, config),
            axios.get(`${API_BASE}/admin/customers`, config),
            axios.get(`${API_BASE}/admin/bills`, config)
        ]);

        const daily = document.getElementById('stat-daily');
        const monthly = document.getElementById('stat-monthly');
        const yearly = document.getElementById('stat-yearly');
        if (daily) daily.innerText = `₹${stats.data.dailyTotal}`;
        if (monthly) monthly.innerText = `₹${stats.data.monthlyTotal}`;
        if (yearly) yearly.innerText = `₹${stats.data.yearlyTotal}`;

        const select = document.getElementById('bill-customer');
        if (select) {
            select.innerHTML = '<option value="">Select Customer</option>';
            customers.data.forEach(c => {
                select.innerHTML += `<option value="${c._id}" data-name="${c.coachingName}">${c.coachingName} (${c.name})</option>`;
            });
        }

        const tbody = document.getElementById('admin-bills-list');
        if (tbody) {
            tbody.innerHTML = '';
            bills.data.forEach(b => {
                tbody.innerHTML += `
                    <tr class="border-b">
                        <td class="p-2">${b.coachingName}</td>
                        <td class="p-2">${b.description}</td>
                        <td class="p-2">${b.pages}</td>
                        <td class="p-2 font-bold">₹${b.totalAmount}</td>
                        <td class="p-2">${b.month}/${b.year}</td>
                        <td class="p-2 text-sm text-gray-500">${new Date(b.date).toLocaleDateString()}</td>
                    </tr>
                `;
            });
        }
    } catch (err) { console.error(err); }
}

async function handleCreateBill(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const customerEl = document.getElementById('bill-customer');
    const customerId = customerEl.value;
    const coachingName = customerEl.options[customerEl.selectedIndex].dataset.name;
    const description = document.getElementById('bill-desc').value;
    const pages = document.getElementById('bill-pages').value;
    const pricePerPage = document.getElementById('bill-price').value;
    const month = document.getElementById('bill-month').value;
    const year = document.getElementById('bill-year').value;

    try {
        await axios.post(`${API_BASE}/admin/bill`, 
            { customerId, coachingName, description, pages, pricePerPage, month, year },
            { headers: { Authorization: token } }
        );
        alert('Bill Generated Successfully');
        loadAdminDashboard();
        e.target.reset(); // Reset form
    } catch (err) { alert('Failed to create bill'); }
}

async function loadCustomerDashboard() {
    showSection('customer-dashboard');
    const welcomeMsg = document.getElementById('welcome-msg');
    if (welcomeMsg) welcomeMsg.innerText = `Welcome, ${localStorage.getItem('coachingName')}`;
    const token = localStorage.getItem('token');
    try {
        const res = await axios.get(`${API_BASE}/customer/my-bills`, { headers: { Authorization: token } });
        const tbody = document.getElementById('customer-bills-list');
        if (tbody) {
            tbody.innerHTML = '';
            res.data.forEach(b => {
                tbody.innerHTML += `
                    <tr class="border-b">
                        <td class="p-2">${b.description}</td>
                        <td class="p-2">${b.pages}</td>
                        <td class="p-2">${b.pricePerPage}</td>
                        <td class="p-2 font-bold">₹${b.totalAmount}</td>
                        <td class="p-2">${b.month}/${b.year}</td>
                        <td class="p-2 text-sm text-gray-500">${new Date(b.date).toLocaleDateString()}</td>
                    </tr>
                `;
            });
        }
    } catch (err) { console.error(err); }
}

// Simple hash-based routing
function handleRouting() {
    const hash = window.location.hash.replace('#', '');
    const loggedIn = localStorage.getItem('token');

    if (loggedIn) {
        if (hash === 'admin' && localStorage.getItem('role') === 'admin') {
            loadAdminDashboard();
        } else if (hash === 'dashboard') {
            loadCustomerDashboard();
        } else if (hash === 'about') {
            showSection('about-section');
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
            case 'about':
                showSection('about-section');
                break;
            default:
                showSection('home');
        }
    }
}

// Testimonial Slider
function initSlider() {
    const slides = document.querySelectorAll('.slide');
    if (!slides.length) return;
    
    let currentSlide = 0;
    const totalSlides = slides.length;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.add('hidden');
            if (i === index) {
                slide.classList.remove('hidden');
            }
        });
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        showSlide(currentSlide);
    }

    showSlide(currentSlide);
    setInterval(nextSlide, 5000); // Change slide every 5 seconds
}


// Init on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    fetchDemos();
    initSlider();

    // Handle routing on initial load and hash changes
    handleRouting();
    window.addEventListener('hashchange', handleRouting);
});
