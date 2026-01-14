/**
 * COMPONENTS/MODAL.JS
 * Generic Modal Controller
 */

export const Modal = {
    overlay: document.getElementById('modal-overlay'),

    show(html, title = 'DETAIL') {
        if (!this.overlay) return;

        this.overlay.innerHTML = `
            <div class="modal-box rounded-pixel-lg">
                <div class="modal-header-bar">
                    <span class="modal-title">[${title}]</span>
                    <button class="btn-icon text-rose" id="modal-close">[X]</button>
                </div>
                <div class="modal-body">
                    ${html}
                </div>
            </div>
        `;

        this.overlay.classList.remove('hidden');

        // Bind Close
        document.getElementById('modal-close').addEventListener('click', () => this.hide());

        // Close on ESC
        document.addEventListener('keydown', this.handleEsc);
    },

    hide() {
        if (!this.overlay) return;
        this.overlay.classList.add('hidden');
        this.overlay.innerHTML = '';
        document.removeEventListener('keydown', this.handleEsc);
    },

    handleEsc(e) {
        if (e.key === 'Escape') Modal.hide();
    }
};
