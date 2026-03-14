// --- Customer Dashboard ---
async function loadCustomerDashboard() {
    showSection('customer-dashboard');
    const welcomeMsg = document.getElementById('welcome-msg');
    if (welcomeMsg) welcomeMsg.innerText = `Welcome, ${localStorage.getItem('coachingName') || localStorage.getItem('name')}`;
    const token = localStorage.getItem('token');
    try {
        const res = await axios.get(`${API_BASE}/customer/my-bills`, { headers: { Authorization: token } });
        const tbody = document.getElementById('customer-bills-list');
        const emptyState = document.getElementById('customer-bills-empty');
        if (tbody) {
            tbody.innerHTML = '';
            if (res.data.length === 0) {
                if (emptyState) emptyState.classList.remove('hidden');
            } else {
                if (emptyState) emptyState.classList.add('hidden');
                const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                res.data.forEach(b => {
                    const itemsSummary = (b.items && b.items.length)
                        ? b.items.map(i => `<span class="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full mr-1 mb-1">${i.description} (${i.pages}pg × ₹${i.pricePerPage})</span>`).join('')
                        : `<span class="text-gray-500">${b.description || '-'}</span>`;
                    tbody.innerHTML += `
                        <tr class="border-b border-gray-50">
                            <td class="p-3 text-sm">${itemsSummary}</td>
                            <td class="p-3 font-bold text-gray-900">₹${b.totalAmount.toLocaleString('en-IN')}</td>
                            <td class="p-3 text-sm text-gray-600">${monthNames[b.month - 1]} ${b.year}</td>
                            <td class="p-3 text-sm text-gray-400">${new Date(b.date).toLocaleDateString('en-IN')}</td>
                            <td class="p-3">
                                <button onclick="downloadCustomerBillPdf('${b._id}')" class="btn btn-ghost text-sm py-1 px-2" title="Download PDF">
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
        showToast('Failed to load bills', 'error');
    }
}

function downloadCustomerBillPdf(billId) {
    triggerPdfDownload(`${API_BASE}/customer/bill/${billId}/pdf`, billId);
}
