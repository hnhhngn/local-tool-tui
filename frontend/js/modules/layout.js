/**
 * MODULES/LAYOUT.JS
 * Free Grid Positioning & Resize
 * With Collision Detection & Boundaries
 * With Ghost Indicator
 */

let isEditMode = false;
let widgetLayout = {}; // { id: { col, row, w, h } }
let originalLayout = {}; // For Undo

// Drag State
let dragSrcEl = null;
let dragStartX = 0;
let dragStartY = 0;

// Resize State
let isResizing = false;
let currentResizeWidget = null;
let resizeStartX, resizeStartY;
let initialW, initialH;

// Ghost Element
let ghostEl = null;

export async function initLayout() {
    await loadLayout();
    initDragEvents();
    renderControls();
}

function renderControls() {
    const statusBar = document.querySelector('.status-bar');
    if (!statusBar || document.getElementById('layout-controls')) return;

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

    document.getElementById('btn-edit-layout').addEventListener('click', toggleEditMode);
    document.getElementById('btn-apply-layout').addEventListener('click', applyLayout);
    document.getElementById('btn-cancel-layout').addEventListener('click', cancelLayout);
}

function toggleEditMode() {
    isEditMode = true;
    originalLayout = JSON.parse(JSON.stringify(widgetLayout));
    initResizeHandles();
    updateUI();
}

async function applyLayout() {
    await saveLayout();
    isEditMode = false;
    updateUI();
}

function cancelLayout() {
    widgetLayout = JSON.parse(JSON.stringify(originalLayout));
    applyWidgetData();
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
        widgets.forEach(w => {
            w.classList.add('edit-mode-active');
            w.setAttribute('draggable', 'true');
        });
    } else {
        btnEdit.classList.remove('hidden');
        actions.classList.add('hidden');
        widgets.forEach(w => {
            w.classList.remove('edit-mode-active');
            w.setAttribute('draggable', 'false');
        });
    }
}

async function loadLayout() {
    try {
        const res = await fetch('/api/layout');
        if (!res.ok) return;

        const data = await res.json();
        const layoutData = data.layout;

        const widgets = document.querySelectorAll('.widget');

        if (layoutData) {
            widgetLayout = layoutData;
        } else {
            let col = 1, row = 1;
            widgets.forEach((w, index) => {
                widgetLayout[w.id] = { col, row, w: 6, h: 6 };
                col += 6;
                if (col > 7) { col = 1; row += 6; }
            });
        }

        applyWidgetData();

    } catch (e) {
        console.warn("Layout load failed:", e);
    }
}

function applyWidgetData() {
    Object.keys(widgetLayout).forEach(id => {
        const widget = document.getElementById(id);
        if (widget) {
            const { col, row, w, h } = widgetLayout[id];
            widget.style.gridColumnStart = col;
            widget.style.gridRowStart = row;
            widget.style.gridColumnEnd = `span ${w}`;
            widget.style.gridRowEnd = `span ${h}`;
        }
    });
}

function initResizeHandles() {
    const widgets = document.querySelectorAll('.widget');
    widgets.forEach(widget => {
        if (!widget.querySelector('.resize-handle')) {
            const handle = document.createElement('div');
            handle.classList.add('resize-handle');
            handle.addEventListener('mousedown', (e) => handleResizeStart(e, widget));
            widget.appendChild(handle);
        }
    });
}

// === GHOST ELEMENT HELPERS ===

function createGhost(width, height, col, row) {
    if (ghostEl) removeGhost();

    ghostEl = document.createElement('div');
    ghostEl.classList.add('ghost-widget');
    updateGhost(col, row, width, height);

    document.querySelector('.dashboard-grid').appendChild(ghostEl);
}

function updateGhost(col, row, w, h) {
    if (!ghostEl) return;
    ghostEl.style.gridColumnStart = col;
    ghostEl.style.gridRowStart = row;
    ghostEl.style.gridColumnEnd = `span ${w}`;
    ghostEl.style.gridRowEnd = `span ${h}`;
}

function removeGhost() {
    if (ghostEl) {
        ghostEl.remove();
        ghostEl = null;
    }
}


// === COLLISION LOGIC ===

function checkCollision(targetId, col, row, w, h) {
    const ids = Object.keys(widgetLayout);
    for (let id of ids) {
        if (id === targetId) continue;

        const other = widgetLayout[id];

        if (col < other.col + other.w &&
            col + w > other.col &&
            row < other.row + other.h &&
            row + h > other.row) {
            return true;
        }
    }
    return false;
}

function isValidPosition(targetId, col, row, w, h) {
    if (col < 1) return false;
    if (row < 1) return false;
    if (col + w > 13) return false;
    if (row + h > 13) return false;

    if (checkCollision(targetId, col, row, w, h)) return false;

    return true;
}

// === RESIZE LOGIC ===
function handleResizeStart(e, widget) {
    if (!isEditMode) return;
    e.stopPropagation();
    e.preventDefault();

    isResizing = true;
    currentResizeWidget = widget;

    resizeStartX = e.clientX;
    resizeStartY = e.clientY;

    const data = widgetLayout[widget.id];
    initialW = data.w;
    initialH = data.h;

    // Create ghost at current position
    createGhost(data.w, data.h, data.col, data.row);
    widget.style.opacity = '0.5'; // Visual feedback for original

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
}

function handleResizeMove(e) {
    if (!isResizing || !currentResizeWidget) return;

    const mainGrid = document.querySelector('.dashboard-grid');
    const gridRect = mainGrid.getBoundingClientRect();
    const cellWidth = gridRect.width / 12;
    const cellHeight = gridRect.height / 12;

    const deltaX = e.clientX - resizeStartX;
    const deltaY = e.clientY - resizeStartY;

    const deltaCols = Math.round(deltaX / cellWidth);
    const deltaRows = Math.round(deltaY / cellHeight);

    let newW = initialW + deltaCols;
    let newH = initialH + deltaRows;

    if (newW < 2) newW = 2;
    if (newH < 2) newH = 2;

    const data = widgetLayout[currentResizeWidget.id];

    if (isValidPosition(currentResizeWidget.id, data.col, data.row, newW, newH)) {
        // Update Ghost instead of Widget directly
        updateGhost(data.col, data.row, newW, newH);

        // Store temp state
        currentResizeWidget.dataset.tempW = newW;
        currentResizeWidget.dataset.tempH = newH;
    }
}

function handleResizeEnd() {
    if (!isResizing) return;
    isResizing = false;

    if (currentResizeWidget) {
        if (currentResizeWidget.dataset.tempW) {
            const newW = parseInt(currentResizeWidget.dataset.tempW);
            const newH = parseInt(currentResizeWidget.dataset.tempH);

            widgetLayout[currentResizeWidget.id].w = newW;
            widgetLayout[currentResizeWidget.id].h = newH;

            // Apply new size to widget
            currentResizeWidget.style.gridColumnEnd = `span ${newW}`;
            currentResizeWidget.style.gridRowEnd = `span ${newH}`;

            delete currentResizeWidget.dataset.tempW;
            delete currentResizeWidget.dataset.tempH;
        }
        currentResizeWidget.style.opacity = '';
        currentResizeWidget = null;
    }

    removeGhost();

    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
}

// === DRAG & DROP LOGIC ===
function initDragEvents() {
    const widgets = document.querySelectorAll('.widget');
    widgets.forEach(widget => {
        widget.addEventListener('dragstart', handleDragStart);
        widget.addEventListener('dragend', handleDragEnd);
    });

    const mainGrid = document.querySelector('.dashboard-grid');
    mainGrid.addEventListener('dragover', handleDragOver);
    mainGrid.addEventListener('drop', handleDrop);
}

function handleDragStart(e) {
    if (!isEditMode || isResizing) {
        e.preventDefault();
        return;
    }
    if (e.target.classList.contains('resize-handle')) {
        e.preventDefault();
        return;
    }

    dragSrcEl = this;
    // this.style.opacity = '0.4'; // Handled by dnd but we can be explicit
    setTimeout(() => this.style.opacity = '0.4', 0);

    const rect = this.getBoundingClientRect();
    dragStartX = e.clientX - rect.left;
    dragStartY = e.clientY - rect.top;

    const data = widgetLayout[this.id];
    createGhost(data.w, data.h, data.col, data.row);

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.id);

    // Hide default drag image if possible? 
    // e.dataTransfer.setDragImage(new Image(), 0, 0); // Optional
}

function handleDragOver(e) {
    if (!isEditMode || !dragSrcEl) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const mainGrid = document.querySelector('.dashboard-grid');
    const gridRect = mainGrid.getBoundingClientRect();

    const mouseX = e.clientX - gridRect.left - dragStartX;
    const mouseY = e.clientY - gridRect.top - dragStartY;

    const cellWidth = gridRect.width / 12;
    const cellHeight = gridRect.height / 12;

    let col = Math.floor(mouseX / cellWidth) + 1;
    let row = Math.floor(mouseY / cellHeight) + 1;

    // Clamp for calculation
    col = Math.max(1, Math.min(12, col));
    row = Math.max(1, Math.min(12, row));

    const data = widgetLayout[dragSrcEl.id];

    // Check validity
    if (isValidPosition(dragSrcEl.id, col, row, data.w, data.h)) {
        updateGhost(col, row, data.w, data.h);
        dragSrcEl.dataset.tempCol = col;
        dragSrcEl.dataset.tempRow = row;
    }
}

function handleDrop(e) {
    if (!isEditMode || !dragSrcEl) return;
    e.preventDefault();

    if (dragSrcEl.dataset.tempCol) {
        const col = parseInt(dragSrcEl.dataset.tempCol);
        const row = parseInt(dragSrcEl.dataset.tempRow);

        widgetLayout[dragSrcEl.id].col = col;
        widgetLayout[dragSrcEl.id].row = row;
        applyWidgetData();

        delete dragSrcEl.dataset.tempCol;
        delete dragSrcEl.dataset.tempRow;
    }

    removeGhost();
}

function handleDragEnd(e) {
    if (!isEditMode) return;
    this.style.opacity = '1';
    dragSrcEl = null;
    removeGhost();
}

async function saveLayout() {
    try {
        await fetch('/api/layout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                layout: widgetLayout
            })
        });
        console.log("Layout saved");
    } catch (e) {
        console.error("Failed to save layout", e);
    }
}
