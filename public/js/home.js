// --- Services / Demos ---
const SERVICE_ICONS = ['fa-keyboard', 'fa-file-alt', 'fa-copy'];
const SERVICE_COLORS = [
    ['bg-blue-50', 'text-blue-600'],
    ['bg-green-50', 'text-green-600'],
    ['bg-purple-50', 'text-purple-600']
];

async function fetchDemos() {
    try {
        const res = await axios.get(`${API_BASE}/customer/demos`);
        const demoList = document.getElementById('demo-list');
        if (!demoList) return;
        demoList.innerHTML = '';

        const data = res.data.length ? res.data : [
            { title: "Handwriting to PDF", description: "Convert messy handwritten notes into clean, formatted digital documents. Perfect for coaching notes and manuscripts.", price: 10, pdfUrl: "#" },
            { title: "Exam Question Paper", description: "Professionally designed question papers with proper numbering, section breaks, and mark distribution.", price: 15, pdfUrl: "#" },
            { title: "Notes & Study Material", description: "Subject-wise notes organized professionally with headings, bullet points, and clean typography.", price: 8, pdfUrl: "#" }
        ];

        data.forEach((d, i) => {
            const [bgColor, txtColor] = SERVICE_COLORS[i % SERVICE_COLORS.length];
            const icon = SERVICE_ICONS[i % SERVICE_ICONS.length];
            demoList.innerHTML += `
                <div class="bg-white p-7 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                    <div class="service-icon ${bgColor} ${txtColor} group-hover:scale-110 transition-transform">
                        <i class="fas ${icon}"></i>
                    </div>
                    <h4 class="font-bold text-lg text-gray-900 mb-2">${d.title}</h4>
                    <p class="text-gray-500 text-sm mb-5 leading-relaxed">${d.description}</p>
                    <div class="flex items-center justify-between pt-4 border-t border-gray-50">
                        <div>
                            <span class="text-2xl font-bold text-gray-900">₹${d.price}</span>
                            <span class="text-sm text-gray-400">/page</span>
                        </div>
                        <a href="#register" class="text-sm text-blue-600 font-semibold hover:underline flex items-center gap-1">
                            Get Started <i class="fas fa-arrow-right text-xs"></i>
                        </a>
                    </div>
                </div>
            `;
        });
    } catch (err) { console.error(err); }
}

// --- Testimonial Slider ---
function initSlider() {
    const slides = document.querySelectorAll('.slide');
    if (!slides.length) return;

    let currentSlide = 0;
    const totalSlides = slides.length;
    const dotsContainer = document.getElementById('slider-dots');

    if (dotsContainer) {
        dotsContainer.innerHTML = '';
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('button');
            dot.className = 'w-2 h-2 rounded-full transition-all duration-300 ' + (i === 0 ? 'bg-blue-600 w-6' : 'bg-gray-300');
            dot.onclick = () => { currentSlide = i; showSlide(i); };
            dotsContainer.appendChild(dot);
        }
    }

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.add('hidden');
            if (i === index) slide.classList.remove('hidden');
        });
        if (dotsContainer) {
            dotsContainer.querySelectorAll('button').forEach((dot, i) => {
                dot.className = 'w-2 h-2 rounded-full transition-all duration-300 ' + (i === index ? 'bg-blue-600 w-6' : 'bg-gray-300');
            });
        }
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        showSlide(currentSlide);
    }

    showSlide(currentSlide);
    setInterval(nextSlide, 5000);
}
