// --- Admin Dashboard ---
async function loadAdminDashboard() {
    showSection('admin-dashboard');
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: token } };

    const dateEl = document.getElementById('admin-date');
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString('en-IN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    try {
        const [stats, customers, bills] = await Promise.all([
            axios.get(`${API_BASE}/admin/stats`, config),
            axios.get(`${API_BASE}/admin/customers`, config),
            axios.get(`${API_BASE}/admin/bills`, config)
        ]);

        const daily = document.getElementById('stat-daily');
        const monthly = document.getElementById('stat-monthly');
        const yearly = document.getElementById('stat-yearly');
        if (daily) daily.innerText = `₹${stats.data.dailyTotal.toLocaleString('en-IN')}`;
        if (monthly) monthly.innerText = `₹${stats.data.monthlyTotal.toLocaleString('en-IN')}`;
        if (yearly) yearly.innerText = `₹${stats.data.yearlyTotal.toLocaleString('en-IN')}`;

        const select = document.getElementById('bill-customer');
        if (select) {
            select.innerHTML = '<option value="">Select Customer</option>';
            customers.data.forEach(c => {
                select.innerHTML += `<option value="${c._id}" data-name="${c.coachingName}">${c.coachingName} (${c.name})</option>`;
            });
        }

        // Populate drive links table
        const driveBody = document.getElementById('admin-drive-links-list');
        const driveEmpty = document.getElementById('admin-drive-links-empty');
        if (driveBody) {
            driveBody.innerHTML = '';
            if (customers.data.length === 0) {
                if (driveEmpty) driveEmpty.classList.remove('hidden');
            } else {
                if (driveEmpty) driveEmpty.classList.add('hidden');
                customers.data.forEach(c => {
                    driveBody.innerHTML += `
                        <tr class="border-b border-gray-50">
                            <td class="p-3 font-medium text-gray-900">${c.coachingName}<br><span class="text-xs text-gray-400">${c.name}</span></td>
                            <td class="p-3">
                                <input type="url" id="drive-link-${c._id}" value="${c.driveLink || ''}" placeholder="https://drive.google.com/..." class="form-input text-sm w-full">
                            </td>
                            <td class="p-3">
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" id="drive-show-${c._id}" ${c.driveShowLink ? 'checked' : ''} class="w-4 h-4 accent-blue-600">
                                    <span class="text-sm text-gray-600">Visible</span>
                                </label>
                            </td>
                            <td class="p-3">
                                <button onclick="saveDriveLink('${c._id}')" class="btn btn-primary text-sm py-1 px-3">Save</button>
                            </td>
                        </tr>
                    `;
                });
            }
        }

        resetBillForm();

        const tbody = document.getElementById('admin-bills-list');
        const emptyState = document.getElementById('admin-bills-empty');
        if (tbody) {
            tbody.innerHTML = '';
            if (bills.data.length === 0) {
                if (emptyState) emptyState.classList.remove('hidden');
            } else {
                if (emptyState) emptyState.classList.add('hidden');
                const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                bills.data.forEach(b => {
                    const itemsSummary = (b.items && b.items.length)
                        ? b.items.map(i => `<span class="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full mr-1 mb-1">${i.description} (${i.pages}pg)</span>`).join('')
                        : `<span class="text-gray-500">${b.description || '-'}</span>`;
                    tbody.innerHTML += `
                        <tr class="border-b border-gray-50">
                            <td class="p-3 font-medium text-gray-900">${b.coachingName}</td>
                            <td class="p-3 text-sm">${itemsSummary}</td>
                            <td class="p-3 font-bold text-gray-900">₹${b.totalAmount.toLocaleString('en-IN')}</td>
                            <td class="p-3 text-sm text-gray-600">${monthNames[b.month - 1]} ${b.year}</td>
                            <td class="p-3 text-sm text-gray-400">${new Date(b.date).toLocaleDateString('en-IN')}</td>
                            <td class="p-3">
                                <button onclick="downloadBillPdf('${b._id}')" class="btn btn-ghost text-sm py-1 px-2" title="Download PDF">
                                    <i class="fas fa-file-pdf text-red-500"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                });
            }
        }
    } catch (err) {
        console.error(err);
        showToast('Failed to load dashboard', 'error');
    }
}

// --- Dynamic Bill Item Rows ---
let billItemCounter = 0;

function addBillItemRow() {
    const container = document.getElementById('bill-items-container');
    if (!container) return;
    const id = billItemCounter++;
    const row = document.createElement('div');
    row.className = 'grid grid-cols-12 gap-3 mb-3 items-center bill-item-row';
    row.dataset.id = id;
    row.innerHTML = `
        <input type="text" placeholder="Job Description" class="bill-item-desc form-input col-span-12 md:col-span-5" required>
        <input type="number" placeholder="Pages" class="bill-item-pages form-input col-span-4 md:col-span-2" min="0" step="any" required oninput="updateRowAmount(this)">
        <input type="number" placeholder="Price/Page" class="bill-item-price form-input col-span-4 md:col-span-2" min="0" step="any" required oninput="updateRowAmount(this)">
        <span class="bill-item-amount col-span-3 md:col-span-2 text-right font-semibold text-gray-700 text-sm">₹0</span>
        <button type="button" onclick="removeBillItemRow(${id})" class="col-span-1 text-gray-300 hover:text-red-500 transition-colors text-center" title="Remove row">
            <i class="fas fa-times-circle text-lg"></i>
        </button>
    `;
    container.appendChild(row);
    const descInput = row.querySelector('.bill-item-desc');
    if (descInput) descInput.focus();
    updateGrandTotal();
}

function removeBillItemRow(id) {
    const container = document.getElementById('bill-items-container');
    const rows = container.querySelectorAll('.bill-item-row');
    if (rows.length <= 1) {
        showToast('At least one item is required', 'info');
        return;
    }
    const row = container.querySelector(`.bill-item-row[data-id="${id}"]`);
    if (row) row.remove();
    updateGrandTotal();
}

function updateRowAmount(input) {
    const row = input.closest('.bill-item-row');
    const pages = parseFloat(row.querySelector('.bill-item-pages').value) || 0;
    const price = parseFloat(row.querySelector('.bill-item-price').value) || 0;
    const amount = pages * price;
    row.querySelector('.bill-item-amount').textContent = `₹${amount.toLocaleString('en-IN')}`;
    updateGrandTotal();
}

function updateGrandTotal() {
    const rows = document.querySelectorAll('.bill-item-row');
    let total = 0;
    rows.forEach(row => {
        const pages = parseFloat(row.querySelector('.bill-item-pages').value) || 0;
        const price = parseFloat(row.querySelector('.bill-item-price').value) || 0;
        total += pages * price;
    });
    const el = document.getElementById('bill-grand-total');
    if (el) el.textContent = `₹${total.toLocaleString('en-IN')}`;
}

function collectBillItems() {
    const rows = document.querySelectorAll('.bill-item-row');
    const items = [];
    rows.forEach(row => {
        const description = row.querySelector('.bill-item-desc').value.trim();
        const pages = parseFloat(row.querySelector('.bill-item-pages').value) || 0;
        const pricePerPage = parseFloat(row.querySelector('.bill-item-price').value) || 0;
        if (description && pages > 0 && pricePerPage > 0) {
            items.push({ description, pages, pricePerPage, amount: pages * pricePerPage });
        }
    });
    return items;
}

async function handleCreateBill(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const customerEl = document.getElementById('bill-customer');
    const customerId = customerEl.value;
    const coachingName = customerEl.options[customerEl.selectedIndex].dataset.name;
    const month = document.getElementById('bill-month').value;
    const year = document.getElementById('bill-year').value;
    const items = collectBillItems();

    if (items.length === 0) {
        showToast('Please add at least one valid item with description, pages, and price.', 'error');
        return;
    }

    setButtonLoading('create-bill-btn', true);
    try {
        const res = await axios.post(`${API_BASE}/admin/bill`,
            { customerId, coachingName, items, month, year },
            { headers: { Authorization: token } }
        );
        showToast('Bill generated successfully!', 'success');
        downloadBillPdf(res.data._id);
        loadAdminDashboard();
        resetBillForm();
    } catch (err) {
        showToast('Failed to create bill: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
        setButtonLoading('create-bill-btn', false);
    }
}

function resetBillForm() {
    const form = document.getElementById('bill-form');
    if (form) form.reset();
    const container = document.getElementById('bill-items-container');
    if (container) container.innerHTML = '';
    billItemCounter = 0;
    addBillItemRow();
    const el = document.getElementById('bill-grand-total');
    if (el) el.textContent = '₹0';
    const yearInput = document.getElementById('bill-year');
    if (yearInput) yearInput.value = new Date().getFullYear();
}

function downloadBillPdf(billId) {
    triggerPdfDownload(`${API_BASE}/admin/bill/${billId}/pdf`, billId);
}

async function saveDriveLink(customerId) {
    const token = localStorage.getItem('token');
    const driveLink = document.getElementById(`drive-link-${customerId}`).value.trim();
    const driveShowLink = document.getElementById(`drive-show-${customerId}`).checked;
    try {
        await axios.patch(`${API_BASE}/admin/customer/${customerId}/drive-link`,
            { driveLink, driveShowLink },
            { headers: { Authorization: token } }
        );
        showToast('Drive link saved!', 'success');
    } catch (err) {
        showToast('Failed to save: ' + (err.response?.data?.error || err.message), 'error');
    }
}
