/**
 * MAIN.JS - Entry Point
 * Local TUI Dev Tool
 */

import { fetchTasks, openAddTaskModal } from './modules/tasks.js';
import { fetchLinks, openAddLinkModal } from './modules/links.js';
import { fetchReminders, openAddReminderModal } from './modules/reminders.js';
import { fetchAutomation, openAddAutomationModal } from './modules/automation.js';
import { initLayout } from './modules/layout.js';
import { initTheme } from './modules/themeManager.js';

console.log("🚀 Local TUI Dev Tool Started");
console.log("🎨 Theme: Jules Google (Hybrid)");

document.addEventListener('DOMContentLoaded', async () => {
    initTheme(); // Multi-theme system
    initWidgetButtons();
    initLayout(); // Drag & Drop

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
