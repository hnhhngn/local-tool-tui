/**
 * MODULES/LINKS.JS
 * Quick Access Management Logic
 */
import { Modal } from '../components/modal.js';

let linksData = [];

export async function fetchLinks() {
    const res = await fetch('/api/links');
    const data = await res.json();
    linksData = data.groups || [];
    render();
    return data;
}

function render() {
    const container = document.getElementById('links-content');
    if (!container) return;

    if (linksData.length === 0) {
        container.innerHTML = '<span class="text-dim">// No quick access items</span>';
        return;
    }

    let html = '';
    linksData.forEach(group => {
        const isExpanded = group.expanded !== false;
        const icon = isExpanded ? '[-]' : '[+]';

        html += `
            <div class="link-group mb-3" data-group-id="${group.id}">
                <div class="group-header flex items-center gap-2 cursor-pointer" data-action="toggle-group">
                    <span class="text-cyan">${icon}</span>
                    <span class="text-amber">${group.name}</span>
                    <span class="text-dim text-xs">(${group.items ? group.items.length : 0})</span>
                </div>
                ${isExpanded ? renderItems(group.items) : ''}
            </div>
        `;
    });

    container.innerHTML = html;
    attachEvents();
}

function renderItems(items) {
    if (!items || items.length === 0) return '<div class="pl-4 text-dim text-xs">Empty</div>';

    let html = '<div class="pl-4 mt-1">';
    items.forEach(item => {
        const typeIcon = getTypeIcon(item.type);
        html += `
            <div class="link-item flex items-center gap-2 p-1 cursor-pointer hover:bg-hover" 
                 data-item-id="${item.id}" data-action="open-link">
                <span class="text-dim">${typeIcon}</span>
                <span>${item.name}</span>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

function getTypeIcon(type) {
    switch (type) {
        case 'folder': return '[D]';
        case 'file': return '[F]';
        case 'url': return '[@]';
        case 'app': return '[>]';
        default: return '[*]';
    }
}

let eventsAttached = false;

function attachEvents() {
    if (eventsAttached) return;

    const container = document.getElementById('links-content');

    container.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;

        if (action === 'toggle-group') {
            const groupEl = target.closest('.link-group');
            const groupId = groupEl.dataset.groupId;
            toggleGroup(groupId);
        }

        if (action === 'open-link') {
            const itemId = target.dataset.itemId;
            openLink(itemId);
        }
    });

    eventsAttached = true;
}

function toggleGroup(groupId) {
    const group = linksData.find(g => g.id === groupId);
    if (group) {
        group.expanded = group.expanded === false ? true : false;
        render();
        saveState();
    }
}

function openLink(itemId) {
    // Find item across all groups
    let foundItem = null;
    for (const group of linksData) {
        if (group.items) {
            foundItem = group.items.find(i => i.id === itemId);
            if (foundItem) break;
        }
    }

    if (!foundItem) return;

    if (foundItem.type === 'url') {
        window.open(foundItem.url, '_blank');
    } else {
        // Call server to open file/folder/app
        fetch('/api/links/open', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: foundItem.path, type: foundItem.type })
        }).then(res => {
            if (!res.ok) alert('Failed to open');
        });
    }
}

async function saveState() {
    await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups: linksData })
    });
}

/* === MODAL LOGIC === */
export function openAddLinkModal(groupId) {
    const html = `
        <div class="col-left">
            <div class="mb-4">
                <label class="block text-dim uppercase text-xs mb-1">Link Name</label>
                <input type="text" id="link-name" class="input" placeholder="My Link">
            </div>
            <div class="mb-4">
                <label class="block text-dim uppercase text-xs mb-1">Type</label>
                <select id="link-type" class="input">
                    <option value="folder">Folder</option>
                    <option value="file">File</option>
                    <option value="url">URL</option>
                    <option value="app">Application</option>
                </select>
            </div>
            <div class="mb-4">
                <label class="block text-dim uppercase text-xs mb-1">Path / URL</label>
                <input type="text" id="link-path" class="input" placeholder="D:\\path\\to\\folder or https://...">
            </div>
            <div class="mt-8">
                <button id="btn-save-link" class="btn text-emerald">[ADD]</button>
            </div>
        </div>
        <div class="col-right">
            <div class="text-dim text-sm">
                <p class="mb-2"><span class="text-cyan">[D]</span> Folder - Opens in Explorer</p>
                <p class="mb-2"><span class="text-cyan">[F]</span> File - Opens with default app</p>
                <p class="mb-2"><span class="text-cyan">[@]</span> URL - Opens in browser</p>
                <p class="mb-2"><span class="text-cyan">[>]</span> App - Runs executable</p>
            </div>
        </div>
    `;

    Modal.show(html, 'ADD LINK');

    document.getElementById('btn-save-link').addEventListener('click', () => {
        const name = document.getElementById('link-name').value;
        const type = document.getElementById('link-type').value;
        const pathOrUrl = document.getElementById('link-path').value;

        if (!name || !pathOrUrl) {
            alert('Please fill all fields');
            return;
        }

        const group = linksData.find(g => g.id === groupId);
        if (group) {
            if (!group.items) group.items = [];
            group.items.push({
                id: `lnk-${Date.now()}`,
                name: name,
                type: type,
                [type === 'url' ? 'url' : 'path']: pathOrUrl
            });
            saveState();
            render();
            Modal.hide();
        }
    });
}
