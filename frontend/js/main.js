/**
 * MAIN.JS - Entry Point
 * Local TUI Dev Tool
 */

import { fetchTasks, openAddTaskModal } from './modules/tasks.js';
import { fetchLinks, openAddLinkModal } from './modules/links.js';
import { fetchReminders, openAddReminderModal } from './modules/reminders.js';
import { fetchAutomation, openAddAutomationModal } from './modules/automation.js';
import { initLayout, toggleEditMode, applyLayout, cancelLayout } from './modules/layout.js';
import { initTheme, setTheme } from './modules/themeManager.js';
import { TUIKeyboard } from './lib/tui-keyboard/index.js';

console.log("🚀 Local TUI Dev Tool Started");
console.log("🎨 Theme: Jules Google (Hybrid)");

document.addEventListener('DOMContentLoaded', async () => {
    initTheme(); // Multi-theme system
    initWidgetButtons();
    initLayout(); // Drag & Drop
    initKeyboard(); // Keyboard navigation

    // Load Tasks
    try {
        await fetchTasks();
        console.log("✓ Tasks loaded");
    } catch (e) {
        console.error("Failed to load tasks:", e);
        document.getElementById('tasks-content').innerHTML = `<div class="text-rose">// Error: ${e.message}</div>`;
    }

    // Load Links
    try {
        await fetchLinks();
        console.log("✓ Links loaded");
    } catch (e) {
        console.error("Failed to load links:", e);
        document.getElementById('links-content').innerHTML = `<div class="text-rose">// Error: ${e.message}</div>`;
    }

    // Load Reminders
    try {
        await fetchReminders();
        console.log("✓ Reminders loaded");
    } catch (e) {
        console.error("Failed to load reminders:", e);
        document.getElementById('reminders-content').innerHTML = `<div class="text-rose">// Error: ${e.message}</div>`;
    }

    // Load Automation
    try {
        await fetchAutomation();
        console.log("✓ Automation loaded");
    } catch (e) {
        console.error("Failed to load automation:", e);
        document.getElementById('automation-content').innerHTML = `<div class="text-rose">// Error: ${e.message}</div>`;
    }
});

function initWidgetButtons() {
    // Tasks Widget [+] button
    const tasksWidget = document.getElementById('widget-tasks');
    if (tasksWidget) {
        const addBtn = tasksWidget.querySelector('.btn-icon');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                openAddTaskModal();
            });
        }
    }

    // Links Widget [+] button
    const linksWidget = document.getElementById('widget-links');
    if (linksWidget) {
        const addBtn = linksWidget.querySelector('.btn-icon');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                openAddLinkModal('grp-1');
            });
        }
    }

    // Reminders Widget [+] button
    const remindersWidget = document.getElementById('widget-reminders');
    if (remindersWidget) {
        const addBtn = remindersWidget.querySelector('.btn-icon');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                openAddReminderModal();
            });
        }
    }

    // Automation Widget [+] button
    const automationWidget = document.getElementById('widget-automation');
    if (automationWidget) {
        const addBtn = automationWidget.querySelector('.btn-icon');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                openAddAutomationModal();
            });
        }
    }
}

/**
 * Initialize TUIKeyboard
 * App-specific configuration and event handlers
 */
function initKeyboard() {
    TUIKeyboard.init({
        // Register panels for focus navigation
        panels: [
            '#widget-tasks',
            '#widget-links',
            '#widget-reminders',
            '#widget-automation'
        ],

        // Register commands for Command Palette (VS Code style: Category: Action)
        commands: [
            // Task commands
            { id: 'task:new', name: 'Task: New', category: 'Task', handler: openAddTaskModal },

            // Link commands
            { id: 'link:new', name: 'Link: New', category: 'Link', handler: () => openAddLinkModal('grp-1') },

            // Reminder commands
            { id: 'reminder:new', name: 'Reminder: New', category: 'Reminder', handler: openAddReminderModal },

            // Automation commands
            { id: 'automation:new', name: 'Automation: New', category: 'Automation', handler: openAddAutomationModal },

            // Layout commands
            { id: 'layout:edit', name: 'Layout: Edit Mode', category: 'Layout', handler: toggleEditMode },
            { id: 'layout:apply', name: 'Layout: Apply Changes', category: 'Layout', handler: applyLayout },
            { id: 'layout:cancel', name: 'Layout: Cancel Changes', category: 'Layout', handler: cancelLayout },

            // Theme commands
            { id: 'theme:dark', name: 'Theme: Dark', category: 'Theme', handler: () => setTheme('dark') },
            { id: 'theme:light', name: 'Theme: Light', category: 'Theme', handler: () => setTheme('light') },
            { id: 'theme:colorful', name: 'Theme: Colorful', category: 'Theme', handler: () => setTheme('colorful') },

            // Navigation commands
            { id: 'goto:tasks', name: 'Go to: Tasks', category: 'Navigation', shortcut: '1', handler: () => TUIKeyboard.focusPanel(0) },
            { id: 'goto:links', name: 'Go to: Links', category: 'Navigation', shortcut: '2', handler: () => TUIKeyboard.focusPanel(1) },
            { id: 'goto:reminders', name: 'Go to: Reminders', category: 'Navigation', shortcut: '3', handler: () => TUIKeyboard.focusPanel(2) },
            { id: 'goto:automation', name: 'Go to: Automation', category: 'Navigation', shortcut: '4', handler: () => TUIKeyboard.focusPanel(3) },

            // Help/Settings commands
            { id: 'help:shortcuts', name: 'Help: Keyboard Shortcuts', category: 'Help', shortcut: '?', handler: () => TUIKeyboard.openCheatSheet() },
        ],

        // Focus system config
        focus: {
            panelSelector: '.widget-panel',
            listSelector: '.editor-body',
            itemSelector: '.tui-tree-node, .link-item, .reminder-item, .automation-item',
            focusClass: 'tui-kb-focused',
            selectedClass: 'tui-kb-selected'
        }
    });

    // Listen for item selection events
    TUIKeyboard.on('item:selected', ({ item, itemId }) => {
        // Trigger click on the item to open it
        if (item) {
            const clickable = item.querySelector('[data-action="select"]') || item;
            clickable.click();
        }
    });

    // Listen for item toggle events (expand/collapse)
    TUIKeyboard.on('item:toggled', ({ item, itemId }) => {
        if (item) {
            const toggle = item.querySelector('[data-action="toggle"]');
            if (toggle) toggle.click();
        }
    });

    console.log("⌨️ TUIKeyboard initialized");
}
