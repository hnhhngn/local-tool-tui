/**
 * TUI-KEYBOARD / FocusSystem.js
 * Panel focus & list navigation - Generic & Reusable
 */

import { keyboardManager } from './KeyboardManager.js';

class FocusSystem {
    constructor() {
        this.panels = [];
        this.currentPanelIndex = -1;
        this.currentItemIndex = -1;
        this.config = {
            panelSelector: '.tui-kb-panel',
            listSelector: '.tui-kb-list',
            itemSelector: '.tui-kb-item',
            focusClass: 'tui-kb-focused',
            selectedClass: 'tui-kb-selected',
            scrollBehavior: 'smooth'
        };
    }

    /**
     * Initialize focus system
     */
    init(config = {}) {
        this.config = { ...this.config, ...config };

        // Register panels
        if (config.panels) {
            this.setPanels(config.panels);
        }

        // Subscribe to keyboard events
        this._setupKeyboardHandlers();

        console.log('[TUIKeyboard/Focus] Initialized');
        return this;
    }

    /**
     * Set panels (can be selectors or elements)
     */
    setPanels(panels) {
        this.panels = panels.map(p => {
            if (typeof p === 'string') {
                return document.querySelector(p);
            }
            return p;
        }).filter(Boolean);

        return this;
    }

    /**
     * Focus a panel by index
     */
    focusPanel(index) {
        // Remove focus from current
        if (this.currentPanelIndex >= 0 && this.panels[this.currentPanelIndex]) {
            this.panels[this.currentPanelIndex].classList.remove(this.config.focusClass);
        }

        // Set new focus
        if (index >= 0 && index < this.panels.length) {
            this.currentPanelIndex = index;
            const panel = this.panels[index];
            panel.classList.add(this.config.focusClass);

            // Switch to panel context for navigation shortcuts
            keyboardManager.setContext('panel');

            // Reset item selection
            this.currentItemIndex = -1;
            this._selectFirstItem();

            // Emit event
            keyboardManager.emit('panel:focused', {
                index,
                panel,
                panelId: panel.id
            });
        }

        return this;
    }

    /**
     * Focus next panel
     */
    focusNextPanel() {
        const next = (this.currentPanelIndex + 1) % this.panels.length;
        this.focusPanel(next);
        return this;
    }

    /**
     * Focus previous panel
     */
    focusPrevPanel() {
        const prev = this.currentPanelIndex <= 0
            ? this.panels.length - 1
            : this.currentPanelIndex - 1;
        this.focusPanel(prev);
        return this;
    }

    /**
     * Blur current panel
     */
    blur() {
        if (this.currentPanelIndex >= 0 && this.panels[this.currentPanelIndex]) {
            this.panels[this.currentPanelIndex].classList.remove(this.config.focusClass);
            this._clearItemSelection();
        }
        this.currentPanelIndex = -1;
        this.currentItemIndex = -1;

        // Return to global context
        keyboardManager.setContext('global');

        keyboardManager.emit('panel:blurred', {});
        return this;
    }

    /**
     * Get current focused panel
     */
    getCurrentPanel() {
        if (this.currentPanelIndex >= 0) {
            return this.panels[this.currentPanelIndex];
        }
        return null;
    }

    /**
     * Select item by index in current panel
     */
    selectItem(index) {
        const panel = this.getCurrentPanel();
        if (!panel) return this;

        const items = this._getItems(panel);
        if (items.length === 0) return this;

        // Clear previous selection
        this._clearItemSelection();

        // Clamp index
        if (index < 0) index = 0;
        if (index >= items.length) index = items.length - 1;

        this.currentItemIndex = index;
        const item = items[index];
        item.classList.add(this.config.selectedClass);

        // Scroll into view
        item.scrollIntoView({
            behavior: this.config.scrollBehavior,
            block: 'nearest'
        });

        // Emit event
        keyboardManager.emit('item:changed', {
            index,
            item,
            itemId: item.dataset.id || null,
            panelIndex: this.currentPanelIndex
        });

        return this;
    }

    /**
     * Select next item
     */
    selectNextItem() {
        this.selectItem(this.currentItemIndex + 1);
        return this;
    }

    /**
     * Select previous item
     */
    selectPrevItem() {
        this.selectItem(this.currentItemIndex - 1);
        return this;
    }

    /**
     * Get current selected item
     */
    getCurrentItem() {
        const panel = this.getCurrentPanel();
        if (!panel) return null;

        const items = this._getItems(panel);
        if (this.currentItemIndex >= 0 && this.currentItemIndex < items.length) {
            return items[this.currentItemIndex];
        }
        return null;
    }

    // === PRIVATE METHODS ===

    _setupKeyboardHandlers() {
        // Panel focus by number
        for (let i = 1; i <= 9; i++) {
            keyboardManager.on(`panel:focus:${i}`, () => {
                this.focusPanel(i - 1);
            });
        }

        // Panel navigation
        keyboardManager.on('panel:next', () => this.focusNextPanel());
        keyboardManager.on('panel:prev', () => this.focusPrevPanel());
        keyboardManager.on('panel:blur', () => this.blur());

        // Item navigation
        keyboardManager.on('item:next', () => this.selectNextItem());
        keyboardManager.on('item:prev', () => this.selectPrevItem());

        // Item actions
        keyboardManager.on('item:select', () => {
            const item = this.getCurrentItem();
            if (item) {
                keyboardManager.emit('item:selected', {
                    item,
                    itemId: item.dataset.id || null,
                    panelIndex: this.currentPanelIndex
                });
            }
        });

        keyboardManager.on('item:toggle', () => {
            const item = this.getCurrentItem();
            if (item) {
                keyboardManager.emit('item:toggled', {
                    item,
                    itemId: item.dataset.id || null,
                    panelIndex: this.currentPanelIndex
                });
            }
        });

        keyboardManager.on('item:expand', () => {
            const item = this.getCurrentItem();
            if (item) {
                keyboardManager.emit('item:expanded', {
                    item,
                    itemId: item.dataset.id || null
                });
            }
        });

        keyboardManager.on('item:collapse', () => {
            const item = this.getCurrentItem();
            if (item) {
                keyboardManager.emit('item:collapsed', {
                    item,
                    itemId: item.dataset.id || null
                });
            }
        });

        // Escape to blur
        keyboardManager.on('overlay:close', () => {
            this.blur();
        });
    }

    _getItems(panel) {
        const list = panel.querySelector(this.config.listSelector) || panel;
        return Array.from(list.querySelectorAll(this.config.itemSelector));
    }

    _selectFirstItem() {
        const panel = this.getCurrentPanel();
        if (!panel) return;

        const items = this._getItems(panel);
        if (items.length > 0) {
            this.selectItem(0);
        }
    }

    _clearItemSelection() {
        const panel = this.getCurrentPanel();
        if (!panel) return;

        const items = this._getItems(panel);
        items.forEach(item => item.classList.remove(this.config.selectedClass));
    }
}

// Singleton instance
export const focusSystem = new FocusSystem();
