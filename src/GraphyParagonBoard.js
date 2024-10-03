import { triggerEvent } from "./utility";

export default class GraphyParagonBoard extends HTMLElement {
    constructor() {
        super();
    }

    #attachPoint = null;
    #board = null;
    #path = null;
    #selected = [];

    get board() {
        return this.#board;
    }

    set board(board) {
        if (board && board.name !== undefined && board.width !== undefined && board.entries !== undefined) {
            this.#board = board;
            this.render();
        }
    }

    set selected(nodes) {
        this.#selected = nodes;
        this.render();
    }

    set highlightPath(path) {
        this.#path = path;
        this.render();
    }

    connectedCallback() {
        this.#attachPoint = this.attachShadow({mode: 'open'});

        const stylesheet = Object.assign(document.createElement('link'), {
            href: new URL('./GraphyParagonBoard.css', import.meta.url),
            rel: 'stylesheet'
        });

        window.requestAnimationFrame(() => {
            this.#attachPoint.appendChild(stylesheet);
        });

        this.render();
    }

    render() {
        if (!this.isConnected) {
            return;
        }

        const board = document.createElement('div');
        board.style.setProperty('--board-width', this.#board.width);
        board.classList.add('paragon-board');
        board.dataset.tooltip = this.#board.name;

        this.#board.entries.forEach(entry => {
            const node = document.createElement('div');

            node.classList.add('paragon-node');
            if (entry !== null) {
                node.classList.add(...[entry.type, entry.rarity].filter(x => Boolean(x)));
                if (entry.isStart) {
                    node.classList.add('starter');
                }
                if (entry.isGate) {
                    node.classList.add('gate');
                }
                if (entry.isGlyphSocket) {
                    node.classList.add('socket');
                }
                if (this.#path?.includes(entry.id)) {
                    node.classList.add('highlight');
                }
                if (this.#selected?.includes(String(entry.id))) {
                    node.classList.add('selected');
                }
                node.dataset.tooltip = entry.name;
                node.dataset.id = entry.id;
                node.dataset.xy = `(${entry.x}, ${entry.y})`;
            } else {
                node.classList.add('empty');
            }

            board.appendChild(node);
        });

        board.addEventListener('click', e => {
            if (!e.target.classList.contains('paragon-node') || e.target.classList.contains('empty')) {
                return;
            }

            e.target.classList.toggle('selected');

            if (e.target.classList.contains('selected')) {
                triggerEvent(this.#attachPoint, 'NodeSelected', {board: this.#board.id, node: e.target.dataset.id});
            }
        });

        window.requestAnimationFrame(() => {
            this.#attachPoint.replaceChildren(this.#attachPoint.children[0], board);
        });
    }
}
