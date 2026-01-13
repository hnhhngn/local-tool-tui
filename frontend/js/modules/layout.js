/**
 * MODULES/LAYOUT.JS
 * Drag & Drop Dashboard Widgets with Edit Mode
 */

let dragSrcEl = null;
let isEditMode = false;
let originalOrder = []; // Stores IDs for Cancel action

export async function initLayout() {
    await loadLayout();
    initDragEvents();
    renderControls();
}

function renderControls() {
    // Inject controls into Header
    const statusBar = document.querySelector('.status-bar');
    if (!statusBar) return;

    // Check if exists
    if (document.getElementById('layout-controls')) return;

    const container = document.createElement('span');
    container.id = 'layout-controls';
    container.className = 'ml-4';
    container.innerHTML = `
        <span class="separator">|</span>
        <span id="btn-edit-layout" class="text-keyword cursor-pointer hover:text-white">[EDIT LAYOUT]</span>
        <span id="edit-actions" class="hidden">
            <span id="btn-apply-layout" class="text-emerald cursor-pointer hover:text-white mr-2">[APPLY]</span>
            <span id="btn-cancel-layout" class="text-rose cursor-pointer hover:text-white">[CANCEL]</span>
        </span>
    `;
    statusBar.appendChild(container);

    // Bind Events
    document.getElementById('btn-edit-layout').addEventListener('click', toggleEditMode);
    document.getElementById('btn-apply-layout').addEventListener('click', applyLayout);
    document.getElementById('btn-cancel-layout').addEventListener('click', cancelLayout);
}

function toggleEditMode() {
    isEditMode = true;

    // Save current order
    const mainGrid = document.querySelector('.dashboard-grid');
    originalOrder = Array.from(mainGrid.children).map(w => w.id);

    updateUI();
}

async function applyLayout() {
    await saveLayout();
    isEditMode = false;
    updateUI();
}

function cancelLayout() {
    // Revert Order
    const mainGrid = document.querySelector('.dashboard-grid');
    const widgets = Array.from(mainGrid.children);

    originalOrder.forEach(id => {
        const widget = widgets.find(w => w.id === id);
        if (widget) mainGrid.appendChild(widget);
    });

    isEditMode = false;
    updateUI();
}

function updateUI() {
    const btnEdit = document.getElementById('btn-edit-layout');
    const actions = document.getElementById('edit-actions');
    const widgets = document.querySelectorAll('.widget');

    if (isEditMode) {
        btnEdit.classList.add('hidden');
        actions.classList.remove('hidden');
        widgets.forEach(w => w.classList.add('edit-mode-active'));
    } else {
        btnEdit.classList.remove('hidden');
        actions.classList.add('hidden');
        widgets.forEach(w => w.classList.remove('edit-mode-active'));
    }
}

async function loadLayout() {
    try {
        const res = await fetch('/api/layout');
        if (!res.ok) return;

        const data = await res.json();
        const order = data.order;
        if (!order || !Array.isArray(order)) return;

        const mainGrid = document.querySelector('.dashboard-grid');
        if (!mainGrid) return;

        const widgets = Array.from(mainGrid.children);

        order.forEach(id => {
            const widget = widgets.find(w => w.id === id);
            if (widget) {
                mainGrid.appendChild(widget);
            }
        });

    } catch (e) {
        console.warn("Layout load failed:", e);
    }
}

function initDragEvents() {
    const widgets = document.querySelectorAll('.widget');

    widgets.forEach(widget => {
        widget.setAttribute('draggable', 'true');

        widget.addEventListener('dragstart', handleDragStart);
        widget.addEventListener('dragover', handleDragOver);
        widget.addEventListener('dragenter', handleDragEnter);
        widget.addEventListener('dragleave', handleDragLeave);
        widget.addEventListener('drop', handleDrop);
        widget.addEventListener('dragend', handleDragEnd);
    });
}

function handleDragStart(e) {
    if (!isEditMode) {
        e.preventDefault();
        return;
    }
    this.style.opacity = '0.4';
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
    if (!isEditMode) return;
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    if (!isEditMode) return;
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    if (!isEditMode) return;
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    if (!isEditMode) return;
    if (e.stopPropagation) e.stopPropagation();

    if (dragSrcEl !== this) {
        const parent = this.parentNode;
        const all = Array.from(parent.children);
        const srcIndex = all.indexOf(dragSrcEl);
        const targetIndex = all.indexOf(this);

        if (srcIndex < targetIndex) {
            parent.insertBefore(dragSrcEl, this.nextSibling);
        } else {
            parent.insertBefore(dragSrcEl, this);
        }

        // Note: We do NOT saveLayout here anymore. Only on [APPLY].
    }
    return false;
}

function handleDragEnd(e) {
    if (!isEditMode) return;
    this.style.opacity = '1';

    document.querySelectorAll('.widget').forEach(w => {
        w.classList.remove('drag-over');
    });
}

async function saveLayout() {
    const mainGrid = document.querySelector('.dashboard-grid');
    const ids = Array.from(mainGrid.children).map(w => w.id);

    try {
        await fetch('/api/layout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: ids })
        });
        console.log("Layout saved");
    } catch (e) {
        console.error("Failed to save layout", e);
    }
}
