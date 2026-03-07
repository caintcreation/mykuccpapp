/* ============================
   CAINT Student Service — JS
   ============================ */

document.addEventListener('DOMContentLoaded', () => {

    // =====================
    // 1. DARK MODE TOGGLE
    // =====================
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const html = document.documentElement;

    // Check saved preference
    const savedTheme = localStorage.getItem('caint-theme');
    if (savedTheme === 'dark') {
        html.setAttribute('data-theme', 'dark');
        themeIcon.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }

    themeToggle.addEventListener('click', () => {
        const isDark = html.getAttribute('data-theme') === 'dark';
        if (isDark) {
            html.removeAttribute('data-theme');
            themeIcon.innerHTML = '<i class="fa-solid fa-moon"></i>';
            localStorage.setItem('caint-theme', 'light');
        } else {
            html.setAttribute('data-theme', 'dark');
            themeIcon.innerHTML = '<i class="fa-solid fa-sun"></i>';
            localStorage.setItem('caint-theme', 'dark');
        }
    });

    // =====================
    // 2. STICKY HEADER SHADOW
    // =====================
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 30);
    });

    // =====================
    // 3. MOBILE MENU
    // =====================
    const menuBtn = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = navMenu.querySelectorAll('a');

    menuBtn.addEventListener('click', () => {
        navMenu.classList.toggle('open');
        menuBtn.textContent = navMenu.classList.contains('open') ? '✕' : '☰';
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('open');
            menuBtn.textContent = '☰';
        });
    });

    // =====================
    // 4. ACTIVE NAV LINK
    // =====================
    const sections = document.querySelectorAll('section[id]');
    const navAnchors = document.querySelectorAll('nav a[href^="#"]');

    function updateActiveNav() {
        let currentSection = '';
        sections.forEach(section => {
            const top = section.offsetTop - 120;
            if (window.scrollY >= top) {
                currentSection = section.getAttribute('id');
            }
        });
        navAnchors.forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === '#' + currentSection);
        });
    }
    window.addEventListener('scroll', updateActiveNav);

    // =====================
    // 5. SCROLL REVEAL
    // =====================
    const revealEls = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => revealObserver.observe(el));

    // =====================
    // 6. FAQ ACCORDION
    // =====================
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.parentElement;
            const wasActive = item.classList.contains('active');
            // Close all
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
            // Toggle current
            if (!wasActive) item.classList.add('active');
        });
    });

    // =====================
    // 7. MULTI-STEP FORM
    // =====================
    const formSteps = document.querySelectorAll('.form-step');
    const progressFill = document.getElementById('progress-fill');
    const progressLabels = document.querySelectorAll('.progress-step-label');
    let currentStep = 0;
    const totalSteps = formSteps.length;

    function showStep(index) {
        formSteps.forEach((step, i) => {
            step.classList.toggle('active', i === index);
        });

        // Update progress bar
        const progress = ((index + 1) / totalSteps) * 100;
        progressFill.style.width = progress + '%';

        // Update progress labels
        progressLabels.forEach((label, i) => {
            label.classList.remove('active', 'completed');
            if (i === index) label.classList.add('active');
            if (i < index) label.classList.add('completed');
        });

        currentStep = index;

        // Show/hide service-specific fields
        updateServiceFields();
    }

    // Navigation buttons
    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                if (currentStep < totalSteps - 1) {
                    showStep(currentStep + 1);
                    // Scroll form into view
                    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });

    document.querySelectorAll('.btn-prev').forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep > 0) {
                showStep(currentStep - 1);
                document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // =====================
    // 8. SERVICE SELECTOR
    // =====================
    const serviceOptions = document.querySelectorAll('.service-option');
    let selectedService = '';

    serviceOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            serviceOptions.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedService = opt.getAttribute('data-service');
            document.getElementById('selected-service').value = selectedService;
            updateServiceFields();
        });
    });

    function updateServiceFields() {
        const kuccpsFields = document.getElementById('kuccps-fields');
        const helbFields = document.getElementById('helb-fields');
        const kraFields = document.getElementById('kra-fields');

        if (kuccpsFields) kuccpsFields.style.display = 'none';
        if (helbFields) helbFields.style.display = 'none';
        if (kraFields) kraFields.style.display = 'none';

        if (selectedService === 'kuccps' || selectedService === 'full-package') {
            if (kuccpsFields) kuccpsFields.style.display = 'block';
        }
        if (selectedService === 'helb' || selectedService === 'full-package') {
            if (helbFields) helbFields.style.display = 'block';
        }
        if (selectedService === 'kra' || selectedService === 'full-package') {
            if (kraFields) kraFields.style.display = 'block';
        }
    }

    // =====================
    // 9. FORM VALIDATION
    // =====================
    function validateStep(stepIndex) {
        const step = formSteps[stepIndex];
        const requiredFields = step.querySelectorAll('[required]');
        let valid = true;

        requiredFields.forEach(field => {
            const errorEl = field.parentElement.querySelector('.field-error');
            if (!field.value.trim()) {
                field.classList.add('error-field');
                if (errorEl) errorEl.classList.add('show');
                valid = false;
            } else {
                field.classList.remove('error-field');
                if (errorEl) errorEl.classList.remove('show');
            }
        });

        // Step 0: must select a service
        if (stepIndex === 0 && !selectedService) {
            valid = false;
            const serviceError = document.getElementById('service-error');
            if (serviceError) serviceError.classList.add('show');
        }

        // Step 3: consent
        if (stepIndex === totalSteps - 1) {
            const consent = document.getElementById('consent');
            if (consent && !consent.checked) {
                valid = false;
                const consentError = document.getElementById('consent-error');
                if (consentError) consentError.classList.add('show');
            }
        }

        // Phone validation
        const phoneField = step.querySelector('input[type="tel"]');
        if (phoneField && phoneField.value.trim()) {
            const phonePattern = /^(?:\+254|0)\d{9}$/;
            if (!phonePattern.test(phoneField.value.replace(/\s/g, ''))) {
                phoneField.classList.add('error-field');
                const phoneError = phoneField.parentElement.querySelector('.field-error');
                if (phoneError) {
                    phoneError.textContent = 'Enter a valid Kenyan phone number (e.g. 0712345678)';
                    phoneError.classList.add('show');
                }
                valid = false;
            }
        }

        if (!valid) {
            // Shake animation
            step.style.animation = 'none';
            step.offsetHeight; // trigger reflow
            
        }

        return valid;
    }

    

    // Real-time field validation (micro-interactions)
    document.querySelectorAll('.form-group input, .form-group select').forEach(field => {
        field.addEventListener('input', () => {
            if (field.classList.contains('error-field') && field.value.trim()) {
                field.classList.remove('error-field');
                const errorEl = field.parentElement.querySelector('.field-error');
                if (errorEl) errorEl.classList.remove('show');
            }
        });
    });

    // =====================
    // 10. FORM SUBMISSION
    // =====================
    const applicationForm = document.getElementById('application-form');

    applicationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateStep(currentStep)) return;

        const submitBtn = document.getElementById('submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Submitting...';
        submitBtn.disabled = true;

        // Collect form data
        const formData = new FormData(applicationForm);
        const data = {};
        formData.forEach((value, key) => { data[key] = value; });
        data.service = selectedService;
        data.timestamp = new Date().toISOString();

        try {
            /* ==========================================
               🔧 AUTOMATION: Google Sheets Integration
               ========================================== */

            // 1. Paste your Google Apps Script Web App URL here
            const SHEET_URL = 'https://script.google.com/macros/s/AKfycbxzACczlUbyZSkXAlzdGfrjzVH1ZHM5qK1GGwN2Z8Hxa6siSTVr2DhXFaSyP2CDN7Rs6A/exec';

            if (SHEET_URL) {
                await fetch(SHEET_URL, {
                    method: 'POST',
                    mode: 'no-cors', // Essential for Google Apps Script
                    body: JSON.stringify(data),
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Simulated success delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Show success screen
            document.getElementById('form-area').style.display = 'none';
            document.getElementById('success-screen').style.display = 'block';

            // Send admin WhatsApp notification (Direct window open)
            const adminNum = '254756963430';
            const adminMsg = encodeURIComponent(`New ${selectedService} application from ${data.fullname} (${data.phone})`);
            window.open(`https://wa.me/${adminNum}?text=${adminMsg}`, '_blank');

        } catch (error) {
            console.error('Submission error:', error);
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            const msgEl = document.getElementById('form-message');
            msgEl.className = 'form-message error';
            msgEl.textContent = 'Something went wrong. Please try again or contact us via WhatsApp.';
            msgEl.style.display = 'block';
        }
    });

    // =====================
    // 12. BACK TO TOP
    // =====================
    const backToTop = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
        backToTop.classList.toggle('visible', window.scrollY > 500);
    });
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // =====================
    // 13. SMOOTH SCROLL FOR CTA
    // =====================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // =====================
    // 14. UPLOAD AREA HANDLING
    // =====================
    document.querySelectorAll('.upload-area').forEach(area => {
        const fileInput = area.querySelector('input[type="file"]');
        const textEl = area.querySelector('.upload-text');

        area.addEventListener('click', () => fileInput.click());

        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            area.style.borderColor = 'var(--accent)';
            area.style.background = 'rgba(0,194,168,0.08)';
        });

        area.addEventListener('dragleave', () => {
            area.style.borderColor = '';
            area.style.background = '';
        });

        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.style.borderColor = '';
            area.style.background = '';
            fileInput.files = e.dataTransfer.files;
            if (fileInput.files.length > 0) {
                textEl.innerHTML = `<i class="fa-solid fa-check"></i> ${fileInput.files[0].name}`;
                textEl.style.color = 'var(--success)';
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                textEl.innerHTML = `<i class="fa-solid fa-check"></i> ${fileInput.files[0].name}`;
                textEl.style.color = 'var(--success)';
            }
        });
    });

    // =====================
    // 15. PRICING CARD "APPLY NOW" → SCROLL TO FORM
    // =====================
    document.querySelectorAll('.pricing-card .btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const service = btn.getAttribute('data-svc');
            if (service) {
                // Auto-select the service
                const opt = document.querySelector(`.service-option[data-service="${service}"]`);
                if (opt) {
                    serviceOptions.forEach(o => o.classList.remove('selected'));
                    opt.classList.add('selected');
                    selectedService = service;
                    document.getElementById('selected-service').value = service;
                    updateServiceFields();
                }
            }
            document.getElementById('apply').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // =====================
    // 16. COPYRIGHT YEAR
    // =====================
    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Initialize
    showStep(0);
});
