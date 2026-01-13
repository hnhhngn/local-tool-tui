/**
 * MODULES/REMINDERS.JS
 * Reminders Management Logic
 */
import { Modal } from '../components/modal.js';

let remindersData = [];

export async function fetchReminders() {
    const res = await fetch('/api/reminders');
    const data = await res.json();
    remindersData = data.reminders || [];
    render();
    return data;
}

function render() {
    const container = document.getElementById('reminders-content');
    if (!container) return;

    if (remindersData.length === 0) {
        container.innerHTML = '<span class="text-dim pl-2">// No reminders</span>';
        return;
    }

    let html = '<div class="space-y-1 pl-2 pt-1">';
    remindersData.forEach(rem => {
        const time = new Date(rem.datetime).toLocaleString('vi-VN', {
            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
        });

        const isRepeat = rem.repeat && rem.repeat.type !== 'none';
        const repeatIcon = isRepeat ? '<span class="text-cyan text-xs">[R]</span>' : '';
        const statusIcon = rem.status === 'done' ? '<span class="text-emerald">[x]</span>' : '<span class="text-rose">[*]</span>';

        html += `
            <div class="flex justify-between hover:bg-hover cursor-pointer p-1" data-id="${rem.id}" data-action="edit-rem">
                <div class="flex gap-2">
                    ${statusIcon}
                    <span>${rem.title}</span>
                </div>
                <div class="flex gap-2 items-center">
                    ${repeatIcon}
                    <span class="text-dim text-xs select-none">${time}</span>
                </div>
            </div>
        `;
    });
    html += '</div>';

    container.innerHTML = html;
    attachEvents();
}

function attachEvents() {
    const container = document.getElementById('reminders-content');
    container.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action="edit-rem"]');
        if (target) {
            const id = target.dataset.id;
            const rem = remindersData.find(r => r.id === id);
            if (rem) openReminderModal(rem);
        }
    });
}

async function saveState() {
    await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminders: remindersData })
    });
}

function openReminderModal(rem) {
    const isNew = !rem;
    rem = rem || {
        id: `rem-${Date.now()}`,
        title: '',
        datetime: new Date().toISOString().slice(0, 16),
        repeat: { type: 'none' },
        status: 'pending'
    };

    const html = `
        <div class="col-left">
            <div class="mb-4">
                <label class="block text-dim uppercase text-xs mb-1">Title</label>
                <input type="text" id="rem-title" class="input" value="${rem.title}" placeholder="Meeting...">
            </div>
            <div class="mb-4">
                <label class="block text-dim uppercase text-xs mb-1">Time</label>
                <input type="datetime-local" id="rem-time" class="input" value="${rem.datetime}">
            </div>
             <div class="mb-4">
                <label class="block text-dim uppercase text-xs mb-1">Repeat</label>
                <select id="rem-repeat" class="input">
                    <option value="none" ${rem.repeat.type === 'none' ? 'selected' : ''}>None</option>
                    <option value="daily" ${rem.repeat.type === 'daily' ? 'selected' : ''}>Daily</option>
                    <option value="weekly" ${rem.repeat.type === 'weekly' ? 'selected' : ''}>Weekly</option>
                </select>
            </div>
            <div class="mt-8 flex gap-2">
                <button id="btn-save-rem" class="btn text-emerald">[SAVE]</button>
                 ${!isNew ? '<button id="btn-del-rem" class="btn text-rose">[DELETE]</button>' : ''}
            </div>
        </div>
        <div class="col-right">
             <div class="text-dim text-sm">
                <p class="mb-2 text-cyan">[*] Repeat System</p>
                <p>Reminders will highlight when due. Repeat logic runs on server check or app load.</p>
            </div>
        </div>
    `;

    Modal.show(html, isNew ? 'NEW REMINDER' : 'EDIT REMINDER');

    document.getElementById('btn-save-rem').addEventListener('click', () => {
        rem.title = document.getElementById('rem-title').value;
        rem.datetime = document.getElementById('rem-time').value;
        rem.repeat.type = document.getElementById('rem-repeat').value;

        if (isNew) remindersData.push(rem);

        saveState();
        render();
        Modal.hide();
    });

    if (!isNew) {
        document.getElementById('btn-del-rem').addEventListener('click', () => {
            if (confirm('Delete reminder?')) {
                remindersData = remindersData.filter(r => r.id !== rem.id);
                saveState();
                render();
                Modal.hide();
            }
        });
    }
}

export function openAddReminderModal() {
    openReminderModal(null);
}
