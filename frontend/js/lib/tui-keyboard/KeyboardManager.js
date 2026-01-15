/**
 * TUI-KEYBOARD / KeyboardManager.js
 * Core keyboard event handling - Generic & Reusable
 * With Custom Key Mapping support
 */

const STORAGE_KEY = 'tui-keyboard-mappings';

class KeyboardManager {
    constructor() {
        this.shortcuts = new Map();
        this.customMappings = new Map(); // User custom mappings
        this.contexts = new Set(['global', 'panel']);
        this.currentContext = 'global';
        this.listeners = new Map();
        this.enabled = true;
        this.inputTags = ['INPUT', 'TEXTAREA', 'SELECT'];
    }

    /**
     * Initialize keyboard manager
     * @param {Object} config - Configuration object
     */
    init(config = {}) {
        // Load custom mappings from localStorage
        this._loadCustomMappings();

        // Register default shortcuts
        if (config.shortcuts) {
            Object.entries(config.shortcuts).forEach(([key, action]) => {
                this.register(key, action);
            });
        }

        // Setup contexts
        if (config.contexts) {
            config.contexts.forEach(ctx => this.contexts.add(ctx));
        }

        if (config.defaultContext) {
            this.currentContext = config.defaultContext;
        }

        // Attach global listener
        document.addEventListener('keydown', this._handleKeyDown.bind(this));

        console.log('[TUIKeyboard] Initialized with custom mapping support');
        return this;
    }

    /**
     * Register a shortcut
     * @param {string} key - Key combo (e.g., 'Ctrl+Space', 'Escape', '1')
     * @param {string|Object} action - Action name or { action, params, context }
     */
    register(key, action) {
        const normalized = this._normalizeKey(key);
        const actionObj = typeof action === 'string'
            ? { action, params: {}, context: 'global' }
            : { context: 'global', params: {}, ...action };

        this.shortcuts.set(normalized, actionObj);
        return this;
    }

    /**
     * Unregister a shortcut
     */
    unregister(key) {
        this.shortcuts.delete(this._normalizeKey(key));
        return this;
    }

    /**
     * Map a custom key to an action
     * Allows users to override default key bindings
     * @param {string} newKey - New key combo
     * @param {string} action - Action name to trigger
     */
    mapKey(newKey, action) {
        const normalized = this._normalizeKey(newKey);
        this.customMappings.set(normalized, action);
        this._saveCustomMappings();
        console.log(`[TUIKeyboard] Mapped "${newKey}" to "${action}"`);
        return this;
    }

    /**
     * Remove a custom key mapping
     */
    unmapKey(key) {
        this.customMappings.delete(this._normalizeKey(key));
        this._saveCustomMappings();
        return this;
    }

    /**
     * Get all custom mappings
     */
    getCustomMappings() {
        const result = {};
        this.customMappings.forEach((action, key) => {
            result[this._displayKey(key)] = action;
        });
        return result;
    }

    /**
     * Clear all custom mappings
     */
    clearCustomMappings() {
        this.customMappings.clear();
        this._saveCustomMappings();
        return this;
    }

    /**
     * Subscribe to action events
     * @param {string} action - Action name (e.g., 'palette:open')
     * @param {Function} handler - Callback function
     */
    on(action, handler) {
        if (!this.listeners.has(action)) {
            this.listeners.set(action, new Set());
        }
        this.listeners.get(action).add(handler);
        return this;
    }

    /**
     * Unsubscribe from action events
     */
    off(action, handler) {
        if (this.listeners.has(action)) {
            this.listeners.get(action).delete(handler);
        }
        return this;
    }

    /**
     * Emit an action event
     */
    emit(action, params = {}) {
        if (this.listeners.has(action)) {
            this.listeners.get(action).forEach(handler => {
                try {
                    handler(params);
                } catch (e) {
                    console.error(`[TUIKeyboard] Error in handler for ${action}:`, e);
                }
            });
        }

        // Also dispatch DOM custom event
        document.dispatchEvent(new CustomEvent('tui-keyboard', {
            detail: { action, params }
        }));
    }

    /**
     * Set current context
     */
    setContext(context) {
        if (this.contexts.has(context)) {
            const prevContext = this.currentContext;
            this.currentContext = context;
            console.log(`[TUIKeyboard] Context: ${prevContext} -> ${context}`);
        }
        return this;
    }

    /**
     * Get current context
     */
    getContext() {
        return this.currentContext;
    }

    /**
     * Enable/disable keyboard handling
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        return this;
    }

    /**
     * Get all registered shortcuts (for cheatsheet)
     */
    getShortcuts() {
        const result = [];
        this.shortcuts.forEach((actionObj, key) => {
            result.push({
                key: this._displayKey(key),
                action: actionObj.action,
                context: actionObj.context
            });
        });
        return result;
    }

    // === PRIVATE METHODS ===

    _handleKeyDown(e) {
        // Skip if disabled
        if (!this.enabled) return;

        // Skip if in input field (except Escape)
        if (this.inputTags.includes(e.target.tagName)) {
            if (e.key !== 'Escape') return;
        }

        const keyCombo = this._getKeyCombo(e);

        // Check custom mappings first
        if (this.customMappings.has(keyCombo)) {
            e.preventDefault();
            e.stopPropagation();
            const action = this.customMappings.get(keyCombo);
            this.emit(action, {});
            return;
        }

        // Then check registered shortcuts
        const actionObj = this.shortcuts.get(keyCombo);

        if (actionObj) {
            // Check context - allow 'global' in any context, or matching context
            const contextMatch = actionObj.context === 'global' ||
                actionObj.context === this.currentContext;

            if (!contextMatch) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            this.emit(actionObj.action, actionObj.params);
        }
    }

    _getKeyCombo(e) {
        const parts = [];
        if (e.ctrlKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey && !this._isPrintableWithShift(e.key)) parts.push('shift');
        if (e.metaKey) parts.push('meta');

        // Normalize key
        let key = e.key.toLowerCase();
        if (key === ' ') key = 'space';
        if (key === 'arrowup') key = 'up';
        if (key === 'arrowdown') key = 'down';
        if (key === 'arrowleft') key = 'left';
        if (key === 'arrowright') key = 'right';

        parts.push(key);
        return parts.join('+');
    }

    _isPrintableWithShift(key) {
        // Characters that require shift to type (like ?, !, @, etc.)
        return /^[?!@#$%^&*()_+{}|:"<>~]$/.test(key);
    }

    _normalizeKey(key) {
        return key
            .toLowerCase()
            .replace(/\s+/g, '')
            .split('+')
            .sort((a, b) => {
                const order = ['ctrl', 'alt', 'shift', 'meta'];
                const ai = order.indexOf(a);
                const bi = order.indexOf(b);
                if (ai !== -1 && bi !== -1) return ai - bi;
                if (ai !== -1) return -1;
                if (bi !== -1) return 1;
                return 0;
            })
            .join('+');
    }

    _displayKey(normalized) {
        return normalized
            .split('+')
            .map(k => {
                if (k === 'ctrl') return 'Ctrl';
                if (k === 'alt') return 'Alt';
                if (k === 'shift') return 'Shift';
                if (k === 'meta') return '⌘';
                if (k === 'space') return 'Space';
                if (k === 'up') return '↑';
                if (k === 'down') return '↓';
                if (k === 'left') return '←';
                if (k === 'right') return '→';
                if (k === 'escape') return 'Esc';
                if (k === 'enter') return 'Enter';
                return k.toUpperCase();
            })
            .join(' + ');
    }

    _loadCustomMappings() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                Object.entries(data).forEach(([key, action]) => {
                    this.customMappings.set(key, action);
                });
                console.log('[TUIKeyboard] Loaded custom mappings');
            }
        } catch (e) {
            console.warn('[TUIKeyboard] Failed to load custom mappings:', e);
        }
    }

    _saveCustomMappings() {
        try {
            const data = {};
            this.customMappings.forEach((action, key) => {
                data[key] = action;
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('[TUIKeyboard] Failed to save custom mappings:', e);
        }
    }
}

// Singleton instance
export const keyboardManager = new KeyboardManager();
