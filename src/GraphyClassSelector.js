import data from '../board-data.js';
import { triggerEvent } from './utility.js';

export default class GraphyClassSelector extends HTMLElement {
    constructor() {
        super();
    }

    #attachPoint = null;
    #classes = null;

    connectedCallback() {
        this.#attachPoint = this.attachShadow({ mode: 'open' });
        this.render();
    }

    render() {
        this.#classes = document.createElement('ul');
        this.#classes.classList.add('class-list');

        const stylesheet = Object.assign(document.createElement('link'), {
            href: new URL('./GraphyClassSelector.css', import.meta.url),
            rel: 'stylesheet'
        });

        Object.keys(data.classes).forEach(name => {
            const item = document.createElement('li');
            item.textContent = name;
            item.classList.add('class-name');
            this.#classes.appendChild(item);
        });

        this.#classes.addEventListener('click', e => this.selectClass(e));
        window.requestAnimationFrame(() => {
            this.#attachPoint.appendChild(stylesheet);
            this.#attachPoint.appendChild(this.#classes);
        });
    }

    selectClass(e) {
        Array.prototype.forEach.call(this.#classes.children, child => child.classList.remove('selected'));
        e.target.classList.add('selected');

        triggerEvent(this.#attachPoint, 'ClassSelected', { selectedClass: e.target.textContent });
    }
}
