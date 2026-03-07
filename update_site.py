import os
import re

html_path = 'c:/xampp/htdocs/kuccp/index.html'
css_path = 'c:/xampp/htdocs/kuccp/style.css'
js_path = 'c:/xampp/htdocs/kuccp/script.js'

# --- HTML ---
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

if 'font-awesome' not in html:
    html = html.replace('<!-- CSS -->', '<!-- FontAwesome -->\n    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\n    <!-- CSS -->')

replacements = {
    '🎓': '<i class="fa-solid fa-building-columns"></i>',
    '🚀': '<i class="fa-solid fa-paper-plane"></i>',
    '💬 Chat on WhatsApp': '<i class="fa-brands fa-whatsapp"></i> Chat on WhatsApp',
    '💬': '<i class="fa-brands fa-whatsapp"></i>',
    '📍': '<i class="fa-solid fa-location-dot"></i>',
    '🔒': '<i class="fa-solid fa-lock"></i>',
    '💰': '<i class="fa-solid fa-money-bill-wave"></i>',
    '📝': '<i class="fa-solid fa-file-signature"></i>',
    '⚙️': '<i class="fa-solid fa-clipboard-check"></i>',
    '✅': '<i class="fa-solid fa-check-double"></i>',
    '🏫': '<i class="fa-solid fa-building-columns"></i>',
    '💳': '<i class="fa-solid fa-credit-card"></i>',
    '📄': '<i class="fa-solid fa-file-lines"></i>',
    '🎯': '<i class="fa-solid fa-bullseye"></i>',
    '⭐': '<i class="fa-solid fa-star"></i>',
    '🛡️': '<i class="fa-solid fa-shield-halved"></i>',
    '🔐': '<i class="fa-solid fa-lock"></i>',
    '🚫': '<i class="fa-solid fa-ban"></i>',
    '🔄': '<i class="fa-solid fa-rotate-left"></i>',
    '🔗': '<i class="fa-solid fa-link"></i>',
    '🎵': '<i class="fa-brands fa-tiktok"></i>',
    '📱': '<i class="fa-solid fa-mobile-screen"></i>',
    '🎉': '<i class="fa-solid fa-circle-check"></i>',
    '📎': '<i class="fa-solid fa-paperclip"></i>',
    '☀️': '<i class="fa-solid fa-sun"></i>',
    '<span id="theme-icon">🌙</span>': '<span id="theme-icon"><i class="fa-solid fa-moon"></i></span>',
    '<span class="check-icon">✓</span>': '<span class="check-icon"><i class="fa-solid fa-check"></i></span>',
    '▾': '<i class="fa-solid fa-caret-down"></i>',
}
for k, v in replacements.items():
    html = html.replace(k, v)

html = re.sub(r'<canvas id="particles-canvas"></canvas>', '', html)
html = re.sub(r'<div class="hero-gradient-orb orb-1"></div>', '', html)
html = re.sub(r'<div class="hero-gradient-orb orb-2"></div>', '', html)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

# --- CSS ---
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

css = css.replace("family=Inter:wght@300;400;500;600;700;800;900", "family=Roboto:wght@300;400;500;700&family=Merriweather:wght@400;700")

vars_light_pattern = r':root\s*\{.*?(?=\s*/\* ---- Dark Mode Variables ---- \*/)'
vars_light_replacement = """:root {
    --primary: #ffffff;
    --secondary: #2c3e50;
    --accent: #2980b9;
    --cta: #27ae60;
    --cta-hover: #219653;
    --light-bg: #f8f9fa;
    --card-bg: #ffffff;
    --body-bg: #fdfdfd;
    --nav-bg: #ffffff;
    --success: #27ae60;
    --warning: #f39c12;
    --error: #e74c3c;
    --info: #3498db;
    --text-primary: #333333;
    --text-secondary: #555555;
    --text-light: #ffffff;
    --border-color: #cccccc;
    --glass-bg: #ffffff;
    --glass-border: #cccccc;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
    --shadow-md: 0 2px 4px rgba(0,0,0,0.05);
    --shadow-lg: 0 4px 8px rgba(0,0,0,0.05);
    --shadow-xl: 0 8px 16px rgba(0,0,0,0.05);
    --radius-sm: 4px;
    --radius-md: 4px;
    --radius-lg: 4px;
    --transition-fast: 150ms ease-in-out;
    --transition-base: 300ms ease-in-out;
    --transition-slow: 500ms ease-in-out;
    --font-main: 'Roboto', sans-serif;
    --font-heading: 'Merriweather', serif;
}"""
css = re.sub(vars_light_pattern, vars_light_replacement, css, flags=re.DOTALL)

vars_dark_pattern = r'\[data-theme="dark"\]\s*\{.*?(?=\s*/\* ---- Reset & Base ---- \*/)'
vars_dark_replacement = """[data-theme="dark"] {
    --primary: #2c3e50;
    --secondary: #ecf0f1;
    --light-bg: #1e2a36;
    --card-bg: #2c3e50;
    --body-bg: #151e27;
    --nav-bg: #1a252f;
    --text-primary: #ecf0f1;
    --text-secondary: #bdc3c7;
    --border-color: #34495e;
    --glass-bg: #2c3e50;
    --glass-border: #34495e;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.2);
    --shadow-md: 0 2px 4px rgba(0,0,0,0.2);
    --shadow-lg: 0 4px 8px rgba(0,0,0,0.2);
    --shadow-xl: 0 8px 16px rgba(0,0,0,0.2);
}"""
css = re.sub(vars_dark_pattern, vars_dark_replacement, css, flags=re.DOTALL)

css = re.sub(r'(h1,\s*h2,\s*h3,\s*h4,\s*h5,\s*h6\s*\{)', r'\1\n    font-family: var(--font-heading);', css)

hero_bg_pattern = r'\.hero\s*\{\s*position:\s*relative;\s*padding:\s*6rem\s*0\s*4rem;\s*overflow:\s*hidden;\s*background:\s*linear-gradient.*?;'
css = re.sub(hero_bg_pattern, r'.hero {\n    position: relative;\n    padding: 6rem 0 4rem;\n    overflow: hidden;\n    background: var(--light-bg);', css, flags=re.DOTALL)

hero_dark_bg_pattern = r'\[data-theme="dark"\]\s*\.hero\s*\{\s*background:\s*linear-gradient.*?;'
css = re.sub(hero_dark_bg_pattern, r'[data-theme="dark"] .hero {\n    background: var(--light-bg);', css, flags=re.DOTALL)

css = css.replace("background: linear-gradient(135deg, var(--cta), #FF9A40);", "background: var(--cta);")
css = css.replace("background: linear-gradient(135deg, var(--accent), #00E6C8);", "background: var(--accent);")
css = css.replace("background: linear-gradient(135deg, #25D366, #128C7E);", "background: #25D366;")
css = css.replace("background: linear-gradient(90deg, var(--accent), var(--cta));", "background: var(--border-color);")
css = css.replace("background: linear-gradient(170deg, rgba(255, 122, 0, 0.06) 0%, rgba(0, 194, 168, 0.04) 100%);", "background: var(--light-bg);")
css = css.replace("background: linear-gradient(170deg, rgba(255, 122, 0, 0.1) 0%, rgba(0, 194, 168, 0.06) 100%);", "background: var(--light-bg);")
css = css.replace("background: linear-gradient(90deg, var(--cta), #FF9A40);", "background: var(--cta);")

css = re.sub(r'box-shadow:\s*0\s*4px\s*14px\s*rgba\(.*?\);', '', css)
css = re.sub(r'box-shadow:\s*0\s*6px\s*20px\s*rgba\(.*?\);', '', css)

css = re.sub(r'backdrop-filter:\s*blur.*?;', '', css)
css = re.sub(r'-webkit-backdrop-filter:\s*blur.*?;', '', css)

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css)

# --- JS ---
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

js = js.replace("themeIcon.textContent = '☀️';", "themeIcon.innerHTML = '<i class=\"fa-solid fa-sun\"></i>';")
js = js.replace("themeIcon.textContent = '🌙';", "themeIcon.innerHTML = '<i class=\"fa-solid fa-moon\"></i>';")
js = js.replace("textEl.textContent = `✓ ${fileInput.files[0].name}`;", "textEl.innerHTML = `<i class=\"fa-solid fa-check\"></i> ${fileInput.files[0].name}`;")

particles_regex = r'// =====================\s*// 11. PARTICLES BACKGROUND\s*// =====================.*?// =====================\s*// 12. BACK TO TOP'
js = re.sub(particles_regex, '// =====================\n    // 12. BACK TO TOP', js, flags=re.DOTALL)

shake_regex = r'// Add shake animation.*?document\.head\.appendChild\(shakeStyle\);'
js = re.sub(shake_regex, '', js, flags=re.DOTALL)

js = js.replace("step.style.animation = 'shake 0.4s ease';", "")

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)

print("Updates completed successfully.")
