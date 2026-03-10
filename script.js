/* ============================
   CAINT Student Service — JS
   Fixed Form Submission + File Upload
   ============================ */

document.addEventListener('DOMContentLoaded', () => {

    const kenyaData = {
        "Baringo": ["Baringo Central", "Baringo North", "Baringo South", "Eldama Ravine", "Mogotio", "Tiaty"],
        "Bomet": ["Bomet Central", "Bomet East", "Chepalungu", "Konoin", "Sotik"],
        "Bungoma": ["Bumula", "Kabuchai", "Kanduyi", "Kimilili", "Mt Elgon", "Sirisia", "Tongaren", "Webuye East", "Webuye West"],
        "Busia": ["Butula", "Funyula", "Matayos", "Nambale", "Teso North", "Teso South"],
        "Elgeyo Marakwet": ["Keiyo North", "Keiyo South", "Marakwet East", "Marakwet West"],
        "Embu": ["Manyatta", "Mbeere North", "Mbeere South", "Runyenjes"],
        "Garissa": ["Dadaab", "Fafi", "Garissa Township", "Hulugho", "Ijara", "Lagdera", "Balambala"],
        "Homa Bay": ["Homa Bay Town", "Kabondo Kasipul", "Karachuonyo", "Kasipul", "Mbita", "Ndhiwa", "Rangwe", "Suba"],
        "Isiolo": ["Isiolo North", "Isiolo South", "Merti"],
        "Kajiado": ["Kajiado Central", "Kajiado East", "Kajiado North", "Kajiado West", "Loitokitok"],
        "Kakamega": ["Butere", "Khwisero", "Likuyani", "Lurambi", "Matungu", "Mumias East", "Mumias West", "Navakholo", "Shinyalu", "Ikolomani"],
        "Kericho": ["Ainamoi", "Belgut", "Bureti", "Kipkelion East", "Kipkelion West", "Sigowet/Soin"],
        "Kiambu": ["Gatundu North", "Gatundu South", "Githunguri", "Juja", "Kabete", "Kiambaa", "Kiambu Town", "Kikuyu", "Limuru", "Ruiru", "Thika Town", "Lari"],
        "Kilifi": ["Ganze", "Kaloleni", "Kilifi North", "Kilifi South", "Magarini", "Malindi", "Rabai"],
        "Kirinyaga": ["Kirinyaga Central", "Kirinyaga East", "Kirinyaga West", "Mwea East", "Mwea West"],
        "Kisii": ["Bobasi", "Bomachoge Borabu", "Bomachoge Chache", "Bonchari", "South Mugirango", "Kitutu Chache North", "Kitutu Chache South", "Nyaribari Chache", "Nyaribari Masaba"],
        "Kisumu": ["Kisumu Central", "Kisumu East", "Kisumu West", "Muhoroni", "Nyakach", "Nyando", "Seme"],
        "Kitui": ["Kitui Central", "Kitui East", "Kitui Rural", "Kitui South", "Kitui West", "Mwingi Central", "Mwingi North", "Mwingi West"],
        "Kwale": ["Kinango", "Lunga Lunga", "Matuga", "Msambweni"],
        "Laikipia": ["Laikipia East", "Laikipia North", "Laikipia West"],
        "Lamu": ["Lamu East", "Lamu West"],
        "Machakos": ["Kathiani", "Machakos Town", "Masinga", "Matungulu", "Mavoko", "Mwala", "Yatta"],
        "Makueni": ["Kaiti", "Kibwezi East", "Kibwezi West", "Kilome", "Makueni", "Mbooni"],
        "Mandera": ["Banissa", "Lafey", "Mandera East", "Mandera North", "Mandera South", "Mandera West"],
        "Marsabit": ["Laisamis", "Moyale", "North Horr", "Saku"],
        "Meru": ["Buuri", "Igembe Central", "Igembe North", "Igembe South", "Imenti Central", "Imenti North", "Imenti South", "Tigania East", "Tigania West"],
        "Migori": ["Awendo", "Kuria East", "Kuria West", "Nyatike", "Rongo", "Suna East", "Suna West", "Uriri"],
        "Murang'a": ["Gatanga", "Kandara", "Kangema", "Kigumo", "Kiharu", "Mathioya", "Maragua"],
        "Nairobi": ["Dagoretti North", "Dagoretti South", "Embakasi Central", "Embakasi East", "Embakasi North", "Embakasi South", "Embakasi West", "Kamukunji", "Kasarani", "Kibra", "Lang'ata", "Makadara", "Mathare", "Roysambu", "Ruaraka", "Starehe", "Westlands"],
        "Nakuru": ["Bahati", "Gilgil", "Kuresoi North", "Kuresoi South", "Molo", "Naivasha", "Nakuru Town East", "Nakuru Town West", "Njoro", "Rongai", "Subukia"],
        "Nandi": ["Aldai", "Chesumei", "Emgwen", "Mosop", "Nandi Hills", "Tindiret"],
        "Narok": ["Narok East", "Narok North", "Narok South", "Narok West", "Emurua Dikirr", "Kilgoris"],
        "Nyamira": ["Borabu", "North Mugirango", "West Mugirango"],
        "Nyandarua": ["Kinangop", "Kipipiri", "Ol Kalou", "Ol Joro Orok", "Ndaragwa"],
        "Nyeri": ["Kieni East", "Kieni West", "Mathira East", "Mathira West", "Mukurweini", "Nyeri Town", "Othaya", "Tetu"],
        "Samburu": ["Samburu East", "Samburu North", "Samburu West"],
        "Siaya": ["Alego Usonga", "Bondo", "Gem", "Rarieda", "Ugenya", "Ugunja"],
        "Taita Taveta": ["Mwatate", "Taveta", "Voi", "Wundanyi"],
        "Tana River": ["Bura", "Galole", "Garsen"],
        "Tharaka Nithi": ["Chuka", "Igambang'ombe", "Maara", "Tharaka North", "Tharaka South"],
        "Trans Nzoia": ["Cherangany", "Endebess", "Kiminini", "Kwanza", "Saboti"],
        "Turkana": ["Loima", "Turkana Central", "Turkana East", "Turkana North", "Turkana South", "Turkana West"],
        "Uasin Gishu": ["Ainabkoi", "Kapseret", "Kesses", "Moiben", "Soy", "Turbo"],
        "Vihiga": ["Emuhaya", "Hamisi", "Luanda", "Sabatia", "Vihiga"],
        "Wajir": ["Eldas", "Wajir East", "Wajir North", "Wajir South", "Wajir West", "Tarbaj"],
        "West Pokot": ["Kacheliba", "Kapenguria", "Sigor", "Pokot South"]
    };

    // Populate Sub-county dropdown
    const countySelect = document.getElementById('county');
    const subCountySelect = document.getElementById('subcounty');

    if (countySelect && subCountySelect) {
        countySelect.addEventListener('change', () => {
            const county = countySelect.value;
            subCountySelect.innerHTML = '<option value="">— Select Sub County —</option>';

            if (county && kenyaData[county]) {
                kenyaData[county].forEach(sub => {
                    const opt = document.createElement('option');
                    opt.value = sub;
                    opt.textContent = sub;
                    subCountySelect.appendChild(opt);
                });
                subCountySelect.disabled = false;
            } else {
                subCountySelect.innerHTML = '<option value="">— Select County First —</option>';
                subCountySelect.disabled = true;
            }
        });
    }

    // =====================
    // 1. DARK MODE TOGGLE
    // =====================
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const html = document.documentElement;

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
        const isOpen = navMenu.classList.toggle('open');
        menuBtn.textContent = isOpen ? '✕' : '☰';
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('open');
            menuBtn.textContent = '☰';
            document.body.style.overflow = '';
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
            if (window.scrollY >= top) currentSection = section.getAttribute('id');
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
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => revealObserver.observe(el));

    // =====================
    // 6. FAQ ACCORDION
    // =====================
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.parentElement;
            const wasActive = item.classList.contains('active');
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
            if (!wasActive) item.classList.add('active');
        });
    });

    // =====================
    // 7. DYNAMIC MULTI-STEP FORM
    // =====================
    const allSteps = Array.from(document.querySelectorAll('.form-step'));
    const progressWrapper = document.getElementById('progress-wrapper');
    const progressFill = document.getElementById('progress-fill');
    const progressLabels = Array.from(document.querySelectorAll('.progress-step-label'));
    const serviceError = document.getElementById('service-error');

    let activeSteps = [];
    let currentStepIndex = 0;
    let selectedService = '';

    // Service Cards
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('click', () => {
            serviceCards.forEach(c => {
                c.style.borderColor = '';
                c.classList.remove('selected');
            });
            card.style.borderColor = 'var(--accent)';
            card.classList.add('selected');
            selectedService = card.dataset.service;
            if (serviceError) serviceError.classList.remove('show');
        });
    });

    // Start App Button
    const btnStartApp = document.getElementById('btn-start-app');
    if (btnStartApp) {
        btnStartApp.addEventListener('click', () => {
            if (!selectedService) {
                if (serviceError) serviceError.classList.add('show');
                return;
            }
            buildActiveSteps();
            showStep(1);
        });
    }

    // Change Service (Back to start)
    document.querySelectorAll('.btn-change-service').forEach(btn => {
        btn.addEventListener('click', () => showStep(0));
    });

    function buildActiveSteps() {
        activeSteps = [];
        activeSteps.push(allSteps.find(s => s.dataset.stepId === 'service'));
        activeSteps.push(allSteps.find(s => s.dataset.stepId === 'personal'));

        if (['kuccps', 'full'].includes(selectedService)) {
            activeSteps.push(allSteps.find(s => s.dataset.stepId === 'kuccps'));
        }
        if (['helb', 'full'].includes(selectedService)) {
            activeSteps.push(allSteps.find(s => s.dataset.stepId === 'hef'));
            activeSteps.push(allSteps.find(s => s.dataset.stepId === 'guarantors'));
        }
        if (['kra', 'full'].includes(selectedService)) {
            activeSteps.push(allSteps.find(s => s.dataset.stepId === 'kra'));
        }
        activeSteps.push(allSteps.find(s => s.dataset.stepId === 'documents'));
        activeSteps.push(allSteps.find(s => s.dataset.stepId === 'review'));

        // Document field visibility
        document.querySelectorAll('[data-doc-req]').forEach(el => {
            const reqs = el.dataset.docReq.split(',');
            const fileInput = el.querySelector('input[type="file"]');
            const visible = reqs.some(r => r === selectedService || selectedService === 'full');

            // Special case for death certificate
            if (el.classList.contains('doc_death_cert_group')) {
                const maritalStatus = document.querySelector('select[name="parent_marital_status"]')?.value;
                const isOrphan = maritalStatus?.includes('Orphaned');
                el.style.display = (visible && isOrphan) ? 'block' : 'none';
                if (fileInput) {
                    if (visible && isOrphan) fileInput.setAttribute('required', 'required');
                    else fileInput.removeAttribute('required');
                }
            } else {
                el.style.display = visible ? 'block' : 'none';
                if (fileInput) {
                    if (visible && el.dataset.required === 'true') {
                        fileInput.setAttribute('required', 'required');
                    } else {
                        fileInput.removeAttribute('required');
                    }
                }
            }
        });

        // Progress labels
        const activeIds = activeSteps.map(s => s.dataset.stepId);
        progressLabels.forEach(label => {
            label.style.display = activeIds.includes(label.dataset.stepId) ? 'inline-block' : 'none';
        });
    }

    function showStep(index) {
        currentStepIndex = index;
        allSteps.forEach(step => step.classList.remove('active'));
        if (!activeSteps.length) activeSteps = allSteps;
        const targetStep = activeSteps[index];
        if (targetStep) targetStep.classList.add('active');

        if (targetStep && targetStep.dataset.stepId === 'service') {
            if (progressWrapper) progressWrapper.style.display = 'none';
        } else {
            if (progressWrapper) progressWrapper.style.display = 'block';
            const totalProgressSteps = activeSteps.length - 1;
            const progress = (index / totalProgressSteps) * 100;
            if (progressFill) progressFill.style.width = progress + '%';

            let visibleLabelIndex = -1;
            progressLabels.forEach(label => {
                if (label.style.display !== 'none') visibleLabelIndex++;
                label.classList.remove('active', 'completed');
                if (visibleLabelIndex === index - 1) label.classList.add('active');
                if (visibleLabelIndex < index - 1) label.classList.add('completed');
            });
        }
    }

    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.id === 'btn-start-app') return;
            if (validateStep(activeSteps[currentStepIndex])) {
                if (currentStepIndex < activeSteps.length - 1) {
                    showStep(currentStepIndex + 1);
                    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });

    document.querySelectorAll('.btn-prev').forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStepIndex > 0) {
                showStep(currentStepIndex - 1);
                document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // =====================
    // 8. FORM VALIDATION
    // =====================
    function validateStep(step) {
        if (!step) return true;
        const requiredFields = step.querySelectorAll('[required]');
        let valid = true;

        requiredFields.forEach(field => {
            const errorEl = field.parentElement.querySelector('.field-error');
            const isEmpty = field.type === 'file'
                ? (!field.files || !field.files.length)
                : !field.value.trim();

            if (isEmpty && field.offsetParent !== null) {
                field.classList.add('error-field');
                if (errorEl) errorEl.classList.add('show');
                valid = false;
            } else {
                field.classList.remove('error-field');
                if (errorEl) errorEl.classList.remove('show');
            }
        });

        // Consent check
        if (step.dataset.stepId === 'review') {
            const consent = document.getElementById('consent');
            if (consent && !consent.checked) {
                valid = false;
                const consentError = document.getElementById('consent-error');
                if (consentError) consentError.classList.add('show');
            } else {
                const consentError = document.getElementById('consent-error');
                if (consentError) consentError.classList.remove('show');
            }
        }

        // Phone validation
        const phoneField = step.querySelector('input[name="phone"]');
        if (phoneField && phoneField.value.trim() && phoneField.offsetParent !== null) {
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

        return valid;
    }

    // Real-time field validation
    document.querySelectorAll('.form-group input, .form-group select').forEach(field => {
        field.addEventListener('input', () => {
            if (field.classList.contains('error-field') && field.value.trim()) {
                field.classList.remove('error-field');
                const errorEl = field.parentElement.querySelector('.field-error');
                if (errorEl) errorEl.classList.remove('show');
            }
        });
    });

    // Toggle parent fields based on marital status
    window.toggleParentFields = function (status) {
        const parentDetails = document.getElementById('parent-details');
        const deathCertGroup = document.querySelector('.doc_death_cert_group');

        if (status === 'Orphaned - Both') {
            if (parentDetails) parentDetails.style.display = 'none';
        } else {
            if (parentDetails) parentDetails.style.display = 'block';
        }

        // Update document requirements immediately
        if (selectedService) buildActiveSteps();
    };

    // =====================
    // 9. GENERATE SUMMARY
    // =====================
    window.generateSummary = function () {
        const summaryDiv = document.getElementById('review-summary');
        const form = document.getElementById('application-form');
        const formData = new FormData(form);

        const formatKey = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        let html = '<div style="color:var(--text-primary);text-align:left;">';
        html += `<h4 style="color:var(--accent);border-bottom:2px solid var(--accent);padding-bottom:8px;margin-bottom:16px;font-family:var(--font-heading);">Application Summary — ${(selectedService || 'Service').toUpperCase()}</h4>`;

        formData.forEach((value, key) => {
            if (key === 'consent') return;
            if (value instanceof File) {
                if (value.name) {
                    value = `📎 ${value.name} (${(value.size / 1024).toFixed(1)} KB)`;
                } else {
                    return;
                }
            } else if (typeof value === 'string' && !value.trim()) {
                return;
            }
            html += `<div style="margin-bottom:8px;display:flex;border-bottom:1px solid var(--border-color);padding-bottom:6px;gap:1rem;">
                <strong style="min-width:200px;flex-shrink:0;color:var(--primary);font-size:0.88rem;">${formatKey(key)}:</strong>
                <span style="color:var(--text-secondary);font-size:0.88rem;">${value}</span>
            </div>`;
        });

        html += '</div>';
        summaryDiv.innerHTML = html;
    };

    // =====================
    // 10. FORM SUBMISSION (FIXED)
    // =====================
    /*
     * HOW THE SUBMISSION WORKS:
     * 1. Text fields go into a JSON object (payload)
     * 2. Files are converted to base64 strings and added to the same payload
     * 3. The payload is POSTed with Content-Type: text/plain;charset=UTF-8
     *    *** This is CRITICAL — the browser silently drops 'application/json'
     *    *** in no-cors mode, making the body arrive EMPTY at the Apps Script.
     *    *** 'text/plain' is CORS-safelisted and sends the body successfully.
     * 4. Apps Script parses e.postData.contents as JSON, uploads files to
     *    Google Drive, and writes all data plus Drive links to the Sheet.
     */
    const SHEET_URL = 'https://script.google.com/macros/s/AKfycbyo5Z4vK92qmuvWyr8ZpGTNBscTxJyog0YDBXbGO25z8v7bSuc5ZHENmcIl-McCTmnxrQ/exec';
    const MAX_FILE_BYTES = 3 * 1024 * 1024; // 3 MB per file

    const applicationForm = document.getElementById('application-form');

    applicationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateStep(activeSteps[currentStepIndex])) return;

        const submitBtn = document.getElementById('submit-btn');
        const originalText = submitBtn.innerHTML;
        const msgEl = document.getElementById('form-message');

        submitBtn.innerHTML = '<span class="loading-spinner"></span> Submitting…';
        submitBtn.disabled = true;
        msgEl.className = 'form-message';
        msgEl.style.display = 'none';

        try {
            // Collect text fields
            const formData = new FormData(applicationForm);
            const payload = { service: selectedService, timestamp: new Date().toISOString() };

            formData.forEach((value, key) => {
                if (!(value instanceof File)) {
                    payload[key] = value;
                }
            });

            // ── Validate + base64-encode all selected files ─────────────
            const fileInputs = applicationForm.querySelectorAll('input[type="file"]');
            const oversized = [];
            const filePromises = [];

            fileInputs.forEach(input => {
                if (input.files && input.files[0]) {
                    const file = input.files[0];
                    if (file.size > MAX_FILE_BYTES) {
                        oversized.push(`${input.name.replace('doc_', '').replace(/_/g, ' ')} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
                        return; // skip this file but continue
                    }
                    filePromises.push(
                        fileToBase64(file).then(base64 => {
                            payload[input.name + '_filename'] = file.name;
                            payload[input.name + '_mimetype'] = file.type || 'application/octet-stream';
                            payload[input.name + '_base64'] = base64;
                        })
                    );
                }
            });

            if (oversized.length > 0) {
                msgEl.style.cssText = 'display:block;background:rgba(245,158,11,0.1);color:#92400e;border:1.5px solid #f59e0b;padding:0.85rem 1.25rem;border-radius:10px;margin-bottom:1rem;font-size:0.88rem;';
                msgEl.textContent = `⚠️ Files too large (skipped): ${oversized.join(', ')}. Send these via WhatsApp after submitting.`;
                msgEl.style.display = 'block';
            }

            await Promise.all(filePromises);

            // ── POST to Google Apps Script ─────────────────────────────
            // MUST use 'text/plain;charset=UTF-8' — this is the only CORS-safelisted
            // Content-Type that sends an actual body through no-cors mode.
            // Using 'application/json' causes the browser to silently strip the
            // Content-Type header AND the body, so e.postData.contents is empty.
            await fetch(SHEET_URL, {
                method: 'POST',
                mode: 'no-cors',
                cache: 'no-cache',
                headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
                body: JSON.stringify(payload)
            });

            // no-cors means we can't read the response status,
            // but if no exception was thrown, the request was sent.

            // Show success screen
            document.getElementById('form-area').style.display = 'none';
            document.getElementById('success-screen').style.display = 'block';
            document.getElementById('success-screen').scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (error) {
            console.error('Submission error:', error);
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            msgEl.className = 'form-message error';
            msgEl.textContent = '⚠️ Something went wrong while submitting. Please try again or contact us on WhatsApp.';
            msgEl.style.display = 'block';
            msgEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });

    // Helper: Convert File to Base64
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Strip the data URL prefix ("data:image/jpeg;base64,")
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // =====================
    // 11. BACK TO TOP
    // =====================
    const backToTop = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
        backToTop.classList.toggle('visible', window.scrollY > 500);
    });
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // =====================
    // 12. SMOOTH SCROLL FOR CTA LINKS
    // =====================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const href = anchor.getAttribute('href');
            if (href === '#') return;
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // =====================
    // 13. PRICING CARD "APPLY NOW" → SCROLL TO FORM & AUTO-SELECT SERVICE
    // =====================
    document.querySelectorAll('.pricing-card .btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const svc = btn.getAttribute('data-svc');
            if (svc) {
                const normalizedSvc = svc.replace('-package', '');
                const matchCard = document.querySelector(`.service-card[data-service="${normalizedSvc}"]`);
                if (matchCard) {
                    serviceCards.forEach(c => {
                        c.style.borderColor = '';
                        c.classList.remove('selected');
                    });
                    matchCard.style.borderColor = 'var(--accent)';
                    matchCard.classList.add('selected');
                    selectedService = matchCard.dataset.service;
                    const errEl = document.getElementById('service-error');
                    if (errEl) errEl.classList.remove('show');
                }
            }
            document.getElementById('apply').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // =====================
    // 14. COPYRIGHT YEAR
    // =====================
    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Initialize — show the service selection step
    showStep(0);
});

/*
 * ============================================================
 * GOOGLE APPS SCRIPT BACKEND CODE
 * ============================================================
 * Paste the following code into Google Apps Script and deploy it as a Web App.
 *
 * Instructions:
 * 1. Go to https://script.google.com
 * 2. Click "New Project"
 * 3. Delete all existing code and paste the code below
 * 4. Update SPREADSHEET_ID and DRIVE_FOLDER_ID with your values
 * 5. Deploy > New Deployment > Web App
 *    - Execute as: Me
 *    - Who has access: Anyone (even anonymous)
 * 6. Copy the Web App URL and paste it into the SHEET_URL variable above
 *
 * ============================================================
 *
 * function doPost(e) {
 *   try {
 *     var SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';   // <-- Replace this
 *     var DRIVE_FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID'; // <-- Replace this
 *
 *     var data = JSON.parse(e.postData.contents);
 *     var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];
 *     var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
 *
 *     // Build headers if first time (row 1 is empty)
 *     var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
 *     var textKeys = Object.keys(data).filter(k => !k.endsWith('_base64') && !k.endsWith('_filename') && !k.endsWith('_mimetype'));
 *
 *     // Upload files and collect Drive links
 *     var fileLinks = {};
 *     Object.keys(data).forEach(function(key) {
 *       if (key.endsWith('_base64')) {
 *         var fieldName = key.replace('_base64', '');
 *         var filename  = data[fieldName + '_filename'] || fieldName + '.bin';
 *         var mimeType  = data[fieldName + '_mimetype'] || 'application/octet-stream';
 *         var bytes     = Utilities.base64Decode(data[key]);
 *         var blob      = Utilities.newBlob(bytes, mimeType, filename);
 *         var file      = folder.createFile(blob);
 *         file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
 *         fileLinks[fieldName + '_link'] = file.getUrl();
 *       }
 *     });
 *
 *     // Merge file links into textKeys
 *     Object.keys(fileLinks).forEach(function(k) { textKeys.push(k); data[k] = fileLinks[k]; });
 *
 *     // Ensure sheet has correct headers
 *     if (headers[0] === '' || headers.length === 0) {
 *       sheet.getRange(1, 1, 1, textKeys.length).setValues([textKeys]);
 *       sheet.getRange(1, 1, 1, textKeys.length).setFontWeight('bold');
 *     } else {
 *       // Add any new columns
 *       textKeys.forEach(function(key) {
 *         if (headers.indexOf(key) === -1) {
 *           headers.push(key);
 *           sheet.getRange(1, headers.length).setValue(key).setFontWeight('bold');
 *         }
 *       });
 *     }
 *
 *     // Refresh headers after potential updates
 *     var finalHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
 *
 *     // Build row matching headers
 *     var row = finalHeaders.map(function(header) { return data[header] || ''; });
 *     sheet.appendRow(row);
 *
 *     return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
 *       .setMimeType(ContentService.MimeType.JSON);
 *
 *   } catch(err) {
 *     return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   }
 * }
 *
 * function doGet(e) {
 *   return ContentService.createTextOutput('CAINT Student Service API is running.')
 *     .setMimeType(ContentService.MimeType.TEXT);
 * }
 *
 * ============================================================
 */
