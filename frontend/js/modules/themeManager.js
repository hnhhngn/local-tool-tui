/**
 * MODULES/THEME-MANAGER.JS
 * Multi-theme system with dropdown selector
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
    initDropdown();
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
    updateThemeUI(theme);
    console.log(`🎨 Theme: ${theme}`);
}

/**
 * Cập nhật UI dropdown
 */
function updateThemeUI(theme) {
    // Cập nhật tên theme trong trigger button
    const nameEl = document.getElementById('theme-name');
    if (nameEl) {
        nameEl.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
    }

    // Cập nhật active state trong menu
    const menu = document.getElementById('theme-menu');
    if (menu) {
        menu.querySelectorAll('li').forEach(li => {
            li.classList.toggle('active', li.dataset.theme === theme);
        });
    }
}

/**
 * Khởi tạo dropdown events
 */
function initDropdown() {
    const trigger = document.getElementById('theme-trigger');
    const menu = document.getElementById('theme-menu');

    if (!trigger || !menu) return;

    // Toggle menu khi click trigger
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('hidden');
    });

    // Chọn theme khi click menu item
    menu.querySelectorAll('li').forEach(li => {
        li.addEventListener('click', () => {
            applyTheme(li.dataset.theme);
            menu.classList.add('hidden');
        });
    });

    // Đóng menu khi click bên ngoài
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.theme-dropdown')) {
            menu.classList.add('hidden');
        }
    });
}
