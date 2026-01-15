/**
 * TUI-KEYBOARD
 * Generic keyboard navigation library for TUI-style applications
 * 
 * @example
 * import { TUIKeyboard } from './lib/tui-keyboard/index.js';
 * 
 * TUIKeyboard.init({
 *   panels: ['#panel1', '#panel2'],
 *   commands: [
 *     { id: 'action:do', name: 'Do Action', handler: () => {} }
 *   ]
 * });
 */

import { keyboardManager } from './KeyboardManager.js';
import { commandPalette } from './CommandPalette.js';
import { focusSystem } from './FocusSystem.js';
import { cheatSheet } from './CheatSheet.js';

// Default shortcuts configuration
const DEFAULT_SHORTCUTS = {
    // Global
    'Ctrl+Space': 'palette:open',
    '?': 'cheatsheet:toggle',
    'Escape': 'overlay:close',

    // Panel navigation (1-9)
    '1': { action: 'panel:focus:1', context: 'global' },
    '2': { action: 'panel:focus:2', context: 'global' },
    '3': { action: 'panel:focus:3', context: 'global' },
    '4': { action: 'panel:focus:4', context: 'global' },
    '5': { action: 'panel:focus:5', context: 'global' },
    '6': { action: 'panel:focus:6', context: 'global' },
    '7': { action: 'panel:focus:7', context: 'global' },
    '8': { action: 'panel:focus:8', context: 'global' },
    '9': { action: 'panel:focus:9', context: 'global' },
    'Tab': 'panel:next',
    'Shift+Tab': 'panel:prev',

    // List navigation (use normalized key names)
    'up': { action: 'item:prev', context: 'panel' },
    'down': { action: 'item:next', context: 'panel' },
    'left': { action: 'item:collapse', context: 'panel' },
    'right': { action: 'item:expand', context: 'panel' },
    'k': { action: 'item:prev', context: 'panel' },
    'j': { action: 'item:next', context: 'panel' },
    'h': { action: 'item:collapse', context: 'panel' },
    'l': { action: 'item:expand', context: 'panel' },
    'enter': { action: 'item:select', context: 'panel' },
    'space': { action: 'item:toggle', context: 'panel' }
};

/**
 * Main TUIKeyboard API
 */
export const TUIKeyboard = {
    /**
     * Initialize the keyboard system
     * @param {Object} config - Configuration object
     * @param {string[]} config.panels - Panel selectors
     * @param {Object[]} config.commands - Command definitions
     * @param {Object} config.shortcuts - Custom shortcut overrides
     * @param {Object} config.palette - Command palette config
     * @param {Object} config.cheatsheet - Cheatsheet config
     * @param {Object} config.focus - Focus system config
     */
    init(config = {}) {
        // Merge shortcuts
        const shortcuts = {
            ...DEFAULT_SHORTCUTS,
            ...(config.shortcuts || {})
        };

        // Initialize keyboard manager
        keyboardManager.init({
            shortcuts,
            contexts: ['global', 'panel', 'list', 'modal', 'palette']
        });

        // Initialize focus system
        focusSystem.init({
            panels: config.panels || [],
            ...(config.focus || {})
        });

        // Initialize command palette
        commandPalette.init({
            commands: config.commands || [],
            ...(config.palette || {})
        });

        // Initialize cheatsheet
        cheatSheet.init(config.cheatsheet || {});

        console.log('[TUIKeyboard] Ready');
        return this;
    },

    /**
     * Subscribe to events
     */
    on(action, handler) {
        keyboardManager.on(action, handler);
        return this;
    },

    /**
     * Unsubscribe from events
     */
    off(action, handler) {
        keyboardManager.off(action, handler);
        return this;
    },

    /**
     * Emit an event
     */
    emit(action, params) {
        keyboardManager.emit(action, params);
        return this;
    },

    /**
     * Register a shortcut
     */
    registerShortcut(key, action) {
        keyboardManager.register(key, action);
        return this;
    },

    /**
     * Register a command
     */
    registerCommand(command) {
        commandPalette.register(command);
        return this;
    },

    /**
     * Set current context
     */
    setContext(context) {
        keyboardManager.setContext(context);
        return this;
    },

    /**
     * Enable/disable keyboard handling
     */
    setEnabled(enabled) {
        keyboardManager.setEnabled(enabled);
        return this;
    },

    /**
     * Focus a panel by index
     */
    focusPanel(index) {
        focusSystem.focusPanel(index);
        return this;
    },

    /**
     * Open command palette
     */
    openPalette() {
        commandPalette.open();
        return this;
    },

    /**
     * Open cheatsheet
     */
    openCheatSheet() {
        cheatSheet.open();
        return this;
    },

    /**
     * Map a custom key to an action
     * Allows users to override default key bindings
     * @param {string} key - New key combo (e.g., 'Ctrl+P')
     * @param {string} action - Action name (e.g., 'palette:open')
     */
    mapKey(key, action) {
        keyboardManager.mapKey(key, action);
        return this;
    },

    /**
     * Remove a custom key mapping
     */
    unmapKey(key) {
        keyboardManager.unmapKey(key);
        return this;
    },

    /**
     * Get all custom key mappings
     */
    getCustomMappings() {
        return keyboardManager.getCustomMappings();
    },

    /**
     * Clear all custom key mappings
     */
    clearCustomMappings() {
        keyboardManager.clearCustomMappings();
        return this;
    },

    // Expose submodules for advanced usage
    keyboard: keyboardManager,
    palette: commandPalette,
    focus: focusSystem,
    cheatsheet: cheatSheet
};

// Also export submodules individually
export { keyboardManager, commandPalette, focusSystem, cheatSheet };
