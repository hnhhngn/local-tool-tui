/**
 * COMPONENTS/TREE.JS
 * Recursive Tree View Renderer for TUI
 */

export class TreeView {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.onToggle = options.onToggle || (() => { });
        this.onSelect = options.onSelect || (() => { });
    }

    render(nodes) {
        if (!this.container) return;
        this.container.innerHTML = this.buildTreeHtml(nodes, 0);
        this.attachEvents();
    }

    buildTreeHtml(nodes, level) {
        if (!nodes || nodes.length === 0) return '';

        let html = '<ul class="tui-tree-list" style="list-style: none; padding-left: ' + (level * 20) + 'px">';

        nodes.forEach(node => {
            const hasChildren = node.children && node.children.length > 0;
            const isExpanded = node.expanded !== false; // Default to expanded
            const icon = hasChildren ? (isExpanded ? '[-]' : '[+]') : '[*]';
            const progress = this.renderProgressBar(node.progress || 0, node.status);

            // Priority Color
            let priorityClass = '';
            if (node.priority === 'high') priorityClass = 'text-rose';
            else if (node.priority === 'low') priorityClass = 'text-dim';
            else if (node.priority === 'critical') priorityClass = 'text-warning';

            html += `
                <li class="tui-tree-node" data-id="${node.id}">
                    <div class="node-row hover:bg-hover cursor-pointer p-1 flex items-center">
                        <span class="node-toggle mr-2 text-cyan font-bold" data-action="toggle">${icon}</span>
                        <span class="node-name mr-2 ${priorityClass}" data-action="select">${node.name}</span>
                        <span class="node-progress text-xs text-dim">${progress}</span>
                    </div>
                    ${isExpanded && hasChildren ? this.buildTreeHtml(node.children, level + 1) : ''}
                </li>
            `;
        });

        html += '</ul>';
        return html;
    }

    renderProgressBar(percent, status) {
        if (status === 'done') return '<span class="text-emerald">[DONE]</span>';

        // 5 blocks: [#####]
        const filled = Math.round((percent / 100) * 5);
        const empty = 5 - filled;
        const bar = '#'.repeat(filled) + '-'.repeat(empty);

        // Color based on completion
        let colorClass = 'text-dim';
        if (filled > 3) colorClass = 'text-info';
        if (filled === 5) colorClass = 'text-emerald';

        return `<span class="${colorClass}">[${bar}]</span>`;
    }

    attachEvents() {
        // Remove old listeners to prevent duplicates (simple approach)
        // In a real app we might use AbortController or named functions
        const newContainer = this.container.cloneNode(true);
        this.container.parentNode.replaceChild(newContainer, this.container);
        this.container = newContainer;

        this.container.addEventListener('click', (e) => {
            const row = e.target.closest('.node-row');
            if (!row) return;

            const li = row.closest('.tui-tree-node');
            const id = li.dataset.id;
            const action = e.target.dataset.action || 'select';

            if (action === 'toggle') {
                this.onToggle(id);
            } else {
                this.onSelect(id);
            }
        });
    }
}
