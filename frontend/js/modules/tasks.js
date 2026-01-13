/**
 * MODULES/TASKS.JS
 * Task Management Logic
 */
import { TreeView } from '../components/tree.js';

let treeView;
let taskData = [];

export async function fetchTasks() {
    const res = await fetch('/api/tasks');
    const data = await res.json();
    taskData = data.tasks || [];
    render();
    return data;
}

function render() {
    if (!treeView) {
        treeView = new TreeView('tasks-content', {
            onToggle: handleToggle,
            onSelect: handleSelect
        });
    }
    treeView.render(taskData);
}

function handleToggle(id) {
    const node = findNode(taskData, id);
    if (node) {
        node.expanded = node.expanded === false ? true : false;
        render(); // Re-render tree
        saveState(); // Optional: Save collapse state to server
    }
}

function handleSelect(id) {
    const node = findNode(taskData, id);
    if (node) {
        openTaskModal(node);
    }
}

function findNode(nodes, id) {
    for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
            const found = findNode(node.children, id);
            if (found) return found;
        }
    }
    return null;
}

async function saveState() {
    await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: taskData })
    });
}

/* === MODAL LOGIC === */
import { Modal } from '../components/modal.js';

function openTaskModal(task) {
    const html = `
        <!-- LEFT COL: FORM -->
        <div class="col-left">
            <div class="mb-4">
                <label class="block text-dim uppercase text-xs mb-1">Task Name</label>
                <input type="text" id="task-name" class="input text-lg" value="${task.name}">
            </div>
            
            <div class="mb-4 grid grid-cols-2 gap-2">
                <div>
                    <label class="block text-dim uppercase text-xs mb-1">Status</label>
                    <select id="task-status" class="input">
                        <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>Todo</option>
                        <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                        <option value="done" ${task.status === 'done' ? 'selected' : ''}>Done</option>
                    </select>
                </div>
                <div>
                    <label class="block text-dim uppercase text-xs mb-1">Priority</label>
                    <select id="task-priority" class="input">
                        <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
                        <option value="normal" ${task.priority === 'normal' ? 'selected' : ''}>Normal</option>
                        <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
                        <option value="critical" ${task.priority === 'critical' ? 'selected' : ''}>Critical</option>
                    </select>
                </div>
            </div>

            <div class="mb-4">
                <label class="block text-dim uppercase text-xs mb-1">Progress (%)</label>
                <input type="number" id="task-progress" class="input" value="${task.progress || 0}" min="0" max="100">
            </div>

            <div class="mt-8 flex gap-2">
                <button id="btn-save" class="btn text-emerald">[SAVE]</button>
                <button id="btn-delete" class="btn text-rose">[DELETE]</button>
            </div>
        </div>

        <!-- RIGHT COL: LISTS -->
        <div class="col-right">
            <!-- SUB TASKS -->
            <div class="mb-6">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-cyan uppercase">[Sub-Tasks]</span>
                    <button class="btn-icon" id="btn-add-sub">[+]</button>
                </div>
                <div id="sub-list" class="space-y-1">
                    ${(task.children || []).map(c => `
                        <div class="flex justify-between p-1 bg-black/20">
                            <span>${c.name}</span>
                            <span class="text-xs badge badge-${c.status === 'done' ? 'success' : 'warning'}">${c.status}</span>
                        </div>
                    `).join('')}
                    ${(!task.children || task.children.length === 0) ? '<span class="text-dim text-xs">No sub-tasks</span>' : ''}
                </div>
            </div>

            <!-- QA -->
            <div class="mb-6">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-amber uppercase">[QA Check]</span>
                    <button class="btn-icon" id="btn-add-qa">[+]</button>
                </div>
                <ul id="qa-list" class="list-disc pl-4 text-sm">
                    ${(task.qa || []).map(q => `<li>${q.text}</li>`).join('')}
                    ${(!task.qa || task.qa.length === 0) ? '<span class="text-dim text-xs">No QA items</span>' : ''}
                </ul>
            </div>
        </div>
    `;

    Modal.show(html, `EDIT: ${task.id}`);

    // Bind Events
    document.getElementById('btn-save').addEventListener('click', () => {
        task.name = document.getElementById('task-name').value;
        task.status = document.getElementById('task-status').value;
        task.priority = document.getElementById('task-priority').value;
        task.progress = parseInt(document.getElementById('task-progress').value) || 0;

        saveState();
        render(); // Update Tree
        Modal.hide();
    });

    document.getElementById('btn-delete').addEventListener('click', () => {
        if (confirm('Delete task?')) {
            // Delete logic (nav parent and remove)
            // For now simple alert
            alert('Delete not implemented for root tasks yet');
        }
    });

    // Add Sub-task
    document.getElementById('btn-add-sub').addEventListener('click', () => {
        const name = prompt("Enter sub-task name:");
        if (name) {
            if (!task.children) task.children = [];
            task.children.push({
                id: `t-${Date.now()}`,
                name: name,
                status: 'todo',
                priority: 'normal',
                children: []
            });
            Modal.hide();
            openTaskModal(task); // Re-open to refresh list (lazy way)
        }
    });

    // Add QA
    document.getElementById('btn-add-qa').addEventListener('click', () => {
        const text = prompt("Enter QA requirement:");
        if (text) {
            if (!task.qa) task.qa = [];
            task.qa.push({ text: text, done: false });
            Modal.hide();
            openTaskModal(task); // Refresh
        }
    });
}

/* === ADD NEW TASK MODAL === */
export function openAddTaskModal() {
    const html = `
        <!-- LEFT COL: FORM -->
        <div class="col-left">
            <div class="mb-4">
                <label class="block text-dim uppercase text-xs mb-1">Task Name</label>
                <input type="text" id="new-task-name" class="input text-lg" placeholder="Enter task name...">
            </div>
            
            <div class="mb-4 grid grid-cols-2 gap-2">
                <div>
                    <label class="block text-dim uppercase text-xs mb-1">Status</label>
                    <select id="new-task-status" class="input">
                        <option value="todo" selected>Todo</option>
                        <option value="in-progress">In Progress</option>
                        <option value="done">Done</option>
                    </select>
                </div>
                <div>
                    <label class="block text-dim uppercase text-xs mb-1">Priority</label>
                    <select id="new-task-priority" class="input">
                        <option value="low">Low</option>
                        <option value="normal" selected>Normal</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>
            </div>

            <div class="mb-4">
                <label class="block text-dim uppercase text-xs mb-1">Progress (%)</label>
                <input type="number" id="new-task-progress" class="input" value="0" min="0" max="100">
            </div>

            <div class="mt-8">
                <button id="btn-create-task" class="btn text-emerald">[CREATE]</button>
            </div>
        </div>

        <!-- RIGHT COL: INFO -->
        <div class="col-right">
            <div class="text-dim text-sm">
                <p class="mb-2 text-cyan">[*] Task sẽ được tạo ở cấp root.</p>
                <p class="mb-2">Sau khi tạo, bạn có thể click vào task để thêm sub-tasks, QA và Bugs.</p>
            </div>
        </div>
    `;

    Modal.show(html, 'NEW TASK');

    document.getElementById('btn-create-task').addEventListener('click', () => {
        const name = document.getElementById('new-task-name').value;
        const status = document.getElementById('new-task-status').value;
        const priority = document.getElementById('new-task-priority').value;
        const progress = parseInt(document.getElementById('new-task-progress').value) || 0;

        if (!name) {
            alert('Vui lòng nhập tên task!');
            return;
        }

        taskData.push({
            id: `t-${Date.now()}`,
            name: name,
            status: status,
            priority: priority,
            progress: progress,
            children: [],
            qa: [],
            bugs: [],
            expanded: true
        });

        saveState();
        render();
        Modal.hide();
    });
}
