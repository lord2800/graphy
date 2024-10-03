export default class GraphyToaster extends HTMLElement {
    constructor() {
        super();
    }

    #attachPoint = null;

    connectedCallback() {
        this.#attachPoint = this.attachShadow({ mode: 'open' });
        const stylesheet = Object.assign(document.createElement('link'), {
            href: new URL('./GraphyToaster.css', import.meta.url),
            rel: 'stylesheet'
        });

        window.requestAnimationFrame(() => {
            this.#attachPoint.appendChild(stylesheet);
        });
    }

    toast(toast) {
        console.log(`${toast.level}: ${toast.message}`);
        const dialog = this.createDialog(toast);

        window.requestAnimationFrame(() => {
            this.#attachPoint.appendChild(dialog);
            dialog.show();
            setTimeout(() => {
                dialog.close();
                setTimeout(() => {
                    window.requestAnimationFrame(() => this.#attachPoint.removeChild(dialog));
                }, 1000);
            }, 5000);
        });
    }

    createDialog(toast) {
        const dialog = document.createElement('dialog');
        dialog.classList.add('toast');

        const icon = document.createElement('span');
        icon.classList.add('icon', toast.level);
        icon.innerHTML = '&#9888;';

        const message = document.createElement('span');
        message.classList.add('message');
        message.textContent = toast.message;

        dialog.replaceChildren(icon, message);
        return dialog;
    }
}
