/**
 * MODULES/THEME-MANAGER.JS
 * Multi-theme system with localStorage persistence
 */

const THEMES = ['dark', 'light', 'colorful'];
const STORAGE_KEY = 'tui-theme';
const DEFAULT_THEME = 'dark';

/**
 * Khởi tạo theme từ localStorage hoặc mặc định
 */
export function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    const theme = THEMES.includes(saved) ? saved : DEFAULT_THEME;
    applyTheme(theme);
    initToggleButton();
}

/**
 * Áp dụng theme và lưu vào localStorage
 */
export function applyTheme(theme) {
    if (!THEMES.includes(theme)) {
        console.warn(`Theme "${theme}" không hợp lệ. Sử dụng "${DEFAULT_THEME}".`);
        theme = DEFAULT_THEME;
    }

    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    updateToggleIcon(theme);
    console.log(`🎨 Theme: ${theme}`);
}

/**
 * Toggle giữa các theme
 */
export function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
    const currentIndex = THEMES.indexOf(current);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    applyTheme(THEMES[nextIndex]);
}

/**
 * Cập nhật icon của toggle button
 */
function updateToggleIcon(theme) {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    const icons = {
        dark: { icon: '[☀]', class: 'text-amber', next: 'Light' },
        light: { icon: '[🎨]', class: 'text-cyan', next: 'Colorful' },
        colorful: { icon: '[☾]', class: 'text-fuchsia', next: 'Dark' }
    };

    const config = icons[theme] || icons.dark;
    btn.innerHTML = `<span class="${config.class}">${config.icon}</span>`;
    btn.title = `Chuyển sang ${config.next}`;
}

/**
 * Gắn sự kiện cho toggle button
 */
function initToggleButton() {
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.addEventListener('click', toggleTheme);
    }
}
