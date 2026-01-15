/**
 * TUI-KEYBOARD / CommandPalette.js
 * Fuzzy search command interface - Generic & Reusable
 */

import { keyboardManager } from './KeyboardManager.js';

class CommandPalette {
    constructor() {
        this.commands = new Map();
        this.isOpen = false;
        this.selectedIndex = 0;
        this.filteredCommands = [];
        this.container = null;
        this.config = {
            containerSelector: '#tui-kb-palette',
            maxResults: 100,
            placeholder: 'Type a command...'
        };
    }

    /**
     * Initialize command palette
     */
    init(config = {}) {
        this.config = { ...this.config, ...config };

        // Find or create container
        this.container = document.querySelector(this.config.containerSelector);
        if (!this.container) {
            this.container = this._createContainer();
        }

        // Register default commands
        if (config.commands) {
            config.commands.forEach(cmd => this.register(cmd));
        }

        // Subscribe to keyboard events
        this._setupKeyboardHandlers();

        console.log('[TUIKeyboard/Palette] Initialized');
        return this;
    }

    /**
     * Register a command
     * @param {Object} command - { id, name, category?, shortcut?, handler }
     */
    register(command) {
        this.commands.set(command.id, {
            id: command.id,
            name: command.name,
            category: command.category || 'General',
            shortcut: command.shortcut || null,
            handler: command.handler || (() => { })
        });
        return this;
    }

    /**
     * Unregister a command
     */
    unregister(id) {
        this.commands.delete(id);
        return this;
    }

    /**
     * Open the palette
     */
    open() {
        if (this.isOpen) return this;

        this.isOpen = true;
        this.selectedIndex = 0;
        this.filteredCommands = Array.from(this.commands.values());

        this._render();
        this.container.classList.remove('hidden');

        // Focus input
        const input = this.container.querySelector('.tui-kb-palette-input');
        if (input) {
            input.value = '';
            input.focus();
        }

        keyboardManager.setContext('palette');
        keyboardManager.emit('palette:opened', {});

        return this;
    }

    /**
     * Close the palette
     */
    close() {
        if (!this.isOpen) return this;

        this.isOpen = false;
        this.container.classList.add('hidden');

        keyboardManager.setContext('global');
        keyboardManager.emit('palette:closed', {});

        return this;
    }

    /**
     * Toggle palette visibility
     */
    toggle() {
        return this.isOpen ? this.close() : this.open();
    }

    /**
     * Execute selected command
     */
    executeSelected() {
        if (this.filteredCommands.length === 0) return this;

        const cmd = this.filteredCommands[this.selectedIndex];
        if (cmd) {
            this.close();

            // Execute handler
            try {
                cmd.handler();
            } catch (e) {
                console.error(`[TUIKeyboard/Palette] Error executing ${cmd.id}:`, e);
            }

            // Emit event
            keyboardManager.emit('command:executed', {
                commandId: cmd.id,
                commandName: cmd.name
            });
        }

        return this;
    }

    // === PRIVATE METHODS ===

    _setupKeyboardHandlers() {
        keyboardManager.on('palette:open', () => this.open());
        keyboardManager.on('palette:close', () => this.close());
        keyboardManager.on('palette:toggle', () => this.toggle());

        // Escape closes palette
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
        this.container.innerHTML = `
      <div class="tui-kb-palette">
        <div class="tui-kb-palette-header">
          <input 
            type="text" 
            class="tui-kb-palette-input" 
            placeholder="${this.config.placeholder}"
            autocomplete="off"
          />
        </div>
        <div class="tui-kb-palette-body">
          <div class="tui-kb-scroll-indicator tui-kb-scroll-indicator--top hidden"></div>
          <div class="tui-kb-palette-results">
            ${this._renderResults()}
          </div>
          <div class="tui-kb-scroll-indicator tui-kb-scroll-indicator--bottom hidden"></div>
        </div>
      </div>
    `;

        // Attach input handler
        const input = this.container.querySelector('.tui-kb-palette-input');
        input.addEventListener('input', (e) => this._onInput(e.target.value));
        input.addEventListener('keydown', (e) => this._onKeyDown(e));

        // Attach scroll handler for indicators
        const results = this.container.querySelector('.tui-kb-palette-results');
        results.addEventListener('scroll', () => this._updateScrollIndicators());

        // Attach click handlers to results
        this.container.querySelectorAll('.tui-kb-palette-item').forEach((item, idx) => {
            item.addEventListener('click', () => {
                this.selectedIndex = idx;
                this.executeSelected();
            });
        });

        // Initial check for scroll indicators
        requestAnimationFrame(() => this._updateScrollIndicators());
    }

    _renderResults() {
        if (this.filteredCommands.length === 0) {
            return '<div class="tui-kb-palette-empty">No commands found</div>';
        }

        return this.filteredCommands
            .slice(0, this.config.maxResults)
            .map((cmd, idx) => `
        <div class="tui-kb-palette-item ${idx === this.selectedIndex ? 'tui-kb-selected' : ''}" data-id="${cmd.id}">
          <span class="tui-kb-palette-category">${cmd.category}</span>
          <span class="tui-kb-palette-name">${cmd.name}</span>
          ${cmd.shortcut ? `<span class="tui-kb-palette-shortcut">${cmd.shortcut}</span>` : ''}
        </div>
      `)
            .join('');
    }

    _onInput(query) {
        const q = query.toLowerCase().trim();

        if (q === '') {
            this.filteredCommands = Array.from(this.commands.values());
        } else {
            // Simple fuzzy matching
            this.filteredCommands = Array.from(this.commands.values())
                .filter(cmd => {
                    const name = cmd.name.toLowerCase();
                    const category = cmd.category.toLowerCase();
                    return name.includes(q) || category.includes(q);
                })
                .sort((a, b) => {
                    // Prioritize matches at start
                    const aStarts = a.name.toLowerCase().startsWith(q);
                    const bStarts = b.name.toLowerCase().startsWith(q);
                    if (aStarts && !bStarts) return -1;
                    if (!aStarts && bStarts) return 1;
                    return 0;
                });
        }

        this.selectedIndex = 0;
        this._updateResults();
    }

    _onKeyDown(e) {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(
                    this.selectedIndex + 1,
                    Math.min(this.filteredCommands.length, this.config.maxResults) - 1
                );
                this._updateResults();
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                this._updateResults();
                break;

            case 'Enter':
                e.preventDefault();
                this.executeSelected();
                break;

            case 'Escape':
                e.preventDefault();
                this.close();
                break;
        }
    }

    _updateResults() {
        const results = this.container.querySelector('.tui-kb-palette-results');
        if (results) {
            results.innerHTML = this._renderResults();

            // Re-attach click handlers
            const items = this.container.querySelectorAll('.tui-kb-palette-item');
            items.forEach((item, idx) => {
                item.addEventListener('click', () => {
                    this.selectedIndex = idx;
                    this.executeSelected();
                });
            });

            // Ensure selected item is visible
            const selectedItem = items[this.selectedIndex];
            if (selectedItem) {
                selectedItem.scrollIntoView({ block: 'nearest' });
            }

            // Update scroll indicators after content change
            requestAnimationFrame(() => this._updateScrollIndicators());
        }
    }

    _updateScrollIndicators() {
        const results = this.container.querySelector('.tui-kb-palette-results');
        const topIndicator = this.container.querySelector('.tui-kb-scroll-indicator--top');
        const bottomIndicator = this.container.querySelector('.tui-kb-scroll-indicator--bottom');

        if (!results || !topIndicator || !bottomIndicator) return;

        const { scrollTop, scrollHeight, clientHeight } = results;
        const canScrollUp = scrollTop > 0;
        const canScrollDown = scrollTop + clientHeight < scrollHeight - 1; // -1 for rounding

        // Toggle top indicator
        if (canScrollUp) {
            topIndicator.classList.remove('hidden');
        } else {
            topIndicator.classList.add('hidden');
        }

        // Toggle bottom indicator
        if (canScrollDown) {
            bottomIndicator.classList.remove('hidden');
        } else {
            bottomIndicator.classList.add('hidden');
        }
    }
}

// Singleton instance
export const commandPalette = new CommandPalette();
