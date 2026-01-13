/**
 * MODULES/AUTOMATION.JS
 * Automation & Scripts Logic
 */
import { Modal } from '../components/modal.js';

let automationData = [];

export async function fetchAutomation() {
    const res = await fetch('/api/automation');
    const data = await res.json();
    automationData = data.presets || [];
    render();
    return data;
}

function render() {
    const container = document.getElementById('automation-content');
    if (!container) return;

    if (automationData.length === 0) {
        container.innerHTML = '<span class="text-dim pl-2">// No automation presets</span>';
        return;
    }

    let html = '<div class="space-y-1 pl-2 pt-1">';
    automationData.forEach(preset => {
        html += `
            <div class="flex justify-between hover:bg-hover p-1 items-center group">
                <div class="flex gap-2 cursor-pointer grow" data-id="${preset.id}" data-action="edit-auto">
                    <span class="text-rose">>_</span>
                    <span>${preset.name}</span>
                    <span class="text-dim text-xs">(${preset.actions.length} steps)</span>
                </div>
                <button class="btn-xs text-emerald hover:text-white" data-id="${preset.id}" data-action="run-auto">[RUN]</button>
            </div>
        `;
    });
    html += '</div>';

    container.innerHTML = html;
    attachEvents();
}

function attachEvents() {
    const container = document.getElementById('automation-content');
    container.addEventListener('click', async (e) => {
        const editTarget = e.target.closest('[data-action="edit-auto"]');
        if (editTarget) {
            const id = editTarget.dataset.id;
            const preset = automationData.find(p => p.id === id);
            if (preset) openAutomationModal(preset);
            return;
        }

        const runTarget = e.target.closest('[data-action="run-auto"]');
        if (runTarget) {
            const id = runTarget.dataset.id;
            const preset = automationData.find(p => p.id === id);
            if (preset) await runPreset(preset);
        }
    });
}

async function runPreset(preset) {
    if (!confirm(`Run automation: ${preset.name}?`)) return;

    try {
        const res = await fetch('/api/automation/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: preset.id })
        });
        const result = await res.json();
        alert(`Result: ${result.status}`);
    } catch (e) {
        alert(`Error: ${e.message}`);
    }
}

async function saveState() {
    await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presets: automationData })
    });
}

function openAutomationModal(preset) {
    const isNew = !preset;
    preset = preset || {
        id: `auto-${Date.now()}`,
        name: '',
        actions: []
    };

    const actionListHtml = () => preset.actions.map((act, idx) => `
        <div class="flex gap-2 text-xs mb-1 bg-black/30 p-1">
            <span class="text-rose w-4">${idx + 1}.</span>
            <span class="text-cyan uppercase w-16">${act.type}</span>
            <span class="truncate flex-grow" title="${act.path}">${act.path}</span>
            <button class="text-rose hover:text-white" onclick="window.removeAutoAction(${idx})">[x]</button>
        </div>
    `).join('');

    // Global helper for inline onclick (simplified)
    window.tempPreset = preset;
    window.removeAutoAction = (idx) => {
        window.tempPreset.actions.splice(idx, 1);
        document.getElementById('auto-actions-list').innerHTML = actionListHtml();
    };

    const html = `
        <div class="col-left">
            <div class="mb-4">
                <label class="block text-dim uppercase text-xs mb-1">Preset Name</label>
                <input type="text" id="auto-name" class="input" value="${preset.name}" placeholder="Dev Setup...">
            </div>
            
            <div class="mb-4 border-t border-dashed border-dim pt-2">
                <label class="block text-dim uppercase text-xs mb-2">Add Action</label>
                <div class="grid grid-cols-3 gap-2 mb-2">
                    <select id="act-type" class="input col-span-1">
                        <option value="open-app">Open App</option>
                        <option value="open-folder">Open Folder</option>
                         <option value="shutdown">Shutdown</option>
                    </select>
                    <input type="text" id="act-path" class="input col-span-2" placeholder="Path...">
                </div>
                <button id="btn-add-action" class="btn w-full text-cyan mb-4">[+ Add Step]</button>
                
                <label class="block text-dim uppercase text-xs mb-1">Steps Queue</label>
                <div id="auto-actions-list" class="h-32 overflow-y-auto border border-dim p-1">
                    ${actionListHtml()}
                </div>
            </div>

            <div class="mt-4 flex gap-2">
                <button id="btn-save-auto" class="btn text-emerald">[SAVE]</button>
                ${!isNew ? '<button id="btn-del-auto" class="btn text-rose">[DELETE]</button>' : ''}
            </div>
        </div>
        <div class="col-right">
             <div class="text-dim text-sm">
                <p class="mb-2 text-rose">>_ Automation Console</p>
                <p>Warning: Scripts run with server privileges.</p>
            </div>
        </div>
    `;

    Modal.show(html, isNew ? 'NEW PRESET' : 'EDIT PRESET');

    document.getElementById('btn-add-action').addEventListener('click', () => {
        const type = document.getElementById('act-type').value;
        const path = document.getElementById('act-path').value;
        if (path || type === 'shutdown') {
            preset.actions.push({ type, path });
            document.getElementById('auto-actions-list').innerHTML = actionListHtml();
            document.getElementById('act-path').value = '';
        }
    });

    document.getElementById('btn-save-auto').addEventListener('click', () => {
        preset.name = document.getElementById('auto-name').value;
        if (isNew) automationData.push(preset);
        saveState();
        render();
        Modal.hide();
        delete window.tempPreset;
        delete window.removeAutoAction;
    });

    if (!isNew) {
        document.getElementById('btn-del-auto').addEventListener('click', () => {
            if (confirm('Delete preset?')) {
                automationData = automationData.filter(p => p.id !== preset.id);
                saveState();
                render();
                Modal.hide();
            }
        });
    }
}

export function openAddAutomationModal() {
    openAutomationModal(null);
}
