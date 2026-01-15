/**
 * TUI-KEYBOARD / CheatSheet.js
 * Shortcuts reference modal with Custom Key Mapping
 */

import { keyboardManager } from './KeyboardManager.js';

class CheatSheet {
    constructor() {
        this.isOpen = false;
        this.container = null;
        this.capturedKey = null;
        this.config = {
            containerSelector: '#tui-kb-cheatsheet',
            title: 'Keyboard Shortcuts'
        };
    }

    /**
     * Initialize cheatsheet
     */
    init(config = {}) {
        this.config = { ...this.config, ...config };

        // Find or create container
        this.container = document.querySelector(this.config.containerSelector);
        if (!this.container) {
            this.container = this._createContainer();
        }

        // Subscribe to keyboard events
        this._setupKeyboardHandlers();

        console.log('[TUIKeyboard/CheatSheet] Initialized');
        return this;
    }

    /**
     * Open cheatsheet
     */
    open() {
        if (this.isOpen) return this;

        this.isOpen = true;
        this.capturedKey = null;
        this._render();
        this.container.classList.remove('hidden');

        keyboardManager.emit('cheatsheet:opened', {});
        return this;
    }

    /**
     * Close cheatsheet
     */
    close() {
        if (!this.isOpen) return this;

        this.isOpen = false;
        this.container.classList.add('hidden');

        keyboardManager.emit('cheatsheet:closed', {});
        return this;
    }

    /**
     * Toggle cheatsheet
     */
    toggle() {
        return this.isOpen ? this.close() : this.open();
    }

    // === PRIVATE METHODS ===

    _setupKeyboardHandlers() {
        keyboardManager.on('cheatsheet:toggle', () => this.toggle());
        keyboardManager.on('cheatsheet:open', () => this.open());
        keyboardManager.on('cheatsheet:close', () => this.close());

        // Escape closes cheatsheet
        keyboardManager.on('overlay:close', () => {
            if (this.isOpen) {
                this.close();
            }
        });
    }

    _createContainer() {
        const container = document.createElement('div');
        container.id = this.config.containerSelector.replace('#', '');
        container.className = 'tui-kb-overlay hidden';
        document.body.appendChild(container);
        return container;
    }

    _render() {
        const shortcuts = keyboardManager.getShortcuts();

        // Group by context
        const grouped = {};
        shortcuts.forEach(s => {
            const ctx = s.context || 'global';
            if (!grouped[ctx]) grouped[ctx] = [];
            grouped[ctx].push(s);
        });

        const groupOrder = ['global', 'panel', 'list', 'modal', 'palette'];
        const sortedContexts = Object.keys(grouped).sort((a, b) => {
            const ai = groupOrder.indexOf(a);
            const bi = groupOrder.indexOf(b);
            if (ai === -1 && bi === -1) return a.localeCompare(b);
            if (ai === -1) return 1;
            if (bi === -1) return -1;
            return ai - bi;
        });

        this.container.innerHTML = `
      <div class="tui-kb-cheatsheet">
        <div class="tui-kb-cheatsheet-header">
          <span class="tui-kb-cheatsheet-title">${this.config.title}</span>
          <button class="tui-kb-cheatsheet-close">[×]</button>
        </div>
        <div class="tui-kb-cheatsheet-body">
          ${sortedContexts.map(ctx => `
            <div class="tui-kb-cheatsheet-group">
              <div class="tui-kb-cheatsheet-group-title">${this._formatContext(ctx)}</div>
              <div class="tui-kb-cheatsheet-items">
                ${grouped[ctx].map(s => `
                  <div class="tui-kb-cheatsheet-item" data-action="${s.action}">
                    <span class="tui-kb-key">${s.key}</span>
                    <span class="tui-kb-action">${this._formatAction(s.action)}</span>
                    <button class="tui-kb-remap-btn" data-action="${s.action}" title="Remap this shortcut">[⌨]</button>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
          
          <!-- Custom Mappings Section -->
          <div class="tui-kb-cheatsheet-group tui-kb-custom-section">
            <div class="tui-kb-cheatsheet-group-title">Custom Mappings</div>
            <div class="tui-kb-cheatsheet-items">
              <!-- Add new mapping form (on top) -->
              <div class="tui-kb-custom-add">
                <input 
                  id="tui-kb-key-input" 
                  class="tui-kb-key-capture" 
                  placeholder="[Click & press key]" 
                  readonly 
                />
                <span class="tui-kb-arrow">→</span>
                <select id="tui-kb-action-select" class="tui-kb-action-select">
                  <option value="">-- Action --</option>
                  ${this._getAvailableActions().map(a =>
            `<option value="${a}">${a}</option>`
        ).join('')}
                </select>
                <button id="tui-kb-add-btn" class="tui-kb-add-btn">[+]</button>
              </div>
              
              ${this._renderCustomMappings()}
            </div>
          </div>
        </div>
      </div>
    `;

        this._attachEvents();
    }

    _renderCustomMappings() {
        const mappings = keyboardManager.getCustomMappings();
        const entries = Object.entries(mappings);

        if (entries.length === 0) {
            return '<div class="tui-kb-custom-empty">// No custom mappings</div>';
        }

        return entries.map(([key, action]) => `
          <div class="tui-kb-cheatsheet-item tui-kb-custom-item" data-key="${key}">
            <span class="tui-kb-key">${key}</span>
            <span class="tui-kb-action">${action}</span>
            <button class="tui-kb-remove-btn" data-key="${key}">[×]</button>
          </div>
        `).join('');
    }

    _getAvailableActions() {
        return [
            'palette:open',
            'cheatsheet:toggle',
            'panel:focus:1',
            'panel:focus:2',
            'panel:focus:3',
            'panel:focus:4',
            'panel:next',
            'panel:prev',
            'item:prev',
            'item:next',
            'item:select',
            'item:toggle',
            'item:expand',
            'item:collapse',
            'overlay:close'
        ];
    }

    _attachEvents() {
        // Close button
        this.container.querySelector('.tui-kb-cheatsheet-close')
            .addEventListener('click', () => this.close());

        // Click outside to close
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.close();
            }
        });

        // Key capture input
        const keyInput = this.container.querySelector('#tui-kb-key-input');
        if (keyInput) {
            keyInput.addEventListener('keydown', (e) => this._captureKey(e, keyInput));
            keyInput.addEventListener('focus', () => {
                keyInput.value = '';
                this.capturedKey = null;
            });
        }

        // Add button
        const addBtn = this.container.querySelector('#tui-kb-add-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this._addMapping());
        }

        // Remove buttons
        this.container.querySelectorAll('.tui-kb-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const key = e.target.dataset.key;
                if (key) {
                    keyboardManager.unmapKey(key);
                    this._render(); // Re-render
                }
            });
        });

        // Remap buttons (for existing shortcuts)
        this.container.querySelectorAll('.tui-kb-remap-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                if (action) {
                    this._startRemap(action, e.target);
                }
            });
        });
    }

    _startRemap(action, buttonEl) {
        // Find the parent item and replace key span with input
        const item = buttonEl.closest('.tui-kb-cheatsheet-item');
        const keySpan = item.querySelector('.tui-kb-key');

        // Create capture input
        const input = document.createElement('input');
        input.className = 'tui-kb-key-capture tui-kb-remap-input';
        input.placeholder = '[Press key]';
        input.readOnly = true;
        input.dataset.action = action;

        // Replace key span with input
        keySpan.style.display = 'none';
        keySpan.after(input);
        input.focus();

        // Capture key
        input.addEventListener('keydown', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const parts = [];
            if (e.ctrlKey) parts.push('Ctrl');
            if (e.altKey) parts.push('Alt');
            if (e.shiftKey) parts.push('Shift');
            if (e.metaKey) parts.push('Meta');

            let key = e.key;
            if (key === ' ') key = 'Space';
            else if (key === 'ArrowUp') key = 'Up';
            else if (key === 'ArrowDown') key = 'Down';
            else if (key === 'ArrowLeft') key = 'Left';
            else if (key === 'ArrowRight') key = 'Right';
            else if (key.length === 1) key = key.toUpperCase();

            if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
                parts.push(key);
            }

            if (parts.length > 0) {
                const newKey = parts.join('+');
                keyboardManager.mapKey(newKey, action);
                this._render(); // Re-render to show updated mapping
            }
        });

        // Cancel on blur
        input.addEventListener('blur', () => {
            input.remove();
            keySpan.style.display = '';
        });
    }

    _captureKey(e, input) {
        e.preventDefault();
        e.stopPropagation();

        // Build key combo
        const parts = [];
        if (e.ctrlKey) parts.push('Ctrl');
        if (e.altKey) parts.push('Alt');
        if (e.shiftKey) parts.push('Shift');
        if (e.metaKey) parts.push('Meta');

        // Normalize key name
        let key = e.key;
        if (key === ' ') key = 'Space';
        else if (key === 'ArrowUp') key = 'Up';
        else if (key === 'ArrowDown') key = 'Down';
        else if (key === 'ArrowLeft') key = 'Left';
        else if (key === 'ArrowRight') key = 'Right';
        else if (key.length === 1) key = key.toUpperCase();

        // Don't add modifier-only keys
        if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
            parts.push(key);
        }

        if (parts.length > 0) {
            this.capturedKey = parts.join('+');
            input.value = this.capturedKey;
        }
    }

    _addMapping() {
        const actionSelect = this.container.querySelector('#tui-kb-action-select');
        const action = actionSelect?.value;

        if (!this.capturedKey) {
            return;
        }

        if (!action) {
            return;
        }

        keyboardManager.mapKey(this.capturedKey, action);
        this.capturedKey = null;
        this._render(); // Re-render to show new mapping
    }

    _formatContext(ctx) {
        const names = {
            'global': 'Global',
            'panel': 'Panel Navigation',
            'list': 'List Navigation',
            'modal': 'Modal',
            'palette': 'Command Palette'
        };
        return names[ctx] || ctx.charAt(0).toUpperCase() + ctx.slice(1);
    }

    _formatAction(action) {
        return action
            .replace(/:(\d+)$/, ' $1')
            .replace(/:/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
    }
}

// Singleton instance
export const cheatSheet = new CheatSheet();

