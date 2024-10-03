import { triggerEvent } from "./utility";

export default class GraphyParagonGrid extends HTMLElement {
    constructor() {
        super();
    }

    #attachPoint = null;
    #boards = [];
    #boardNodes = null;
    #controls = null;
    #solveButton = null;
    #solution = null;
    #selected = null;

    connectedCallback() {
        this.#attachPoint = this.attachShadow({mode: 'open'});
        const stylesheet = Object.assign(document.createElement('link'), {
            href: new URL('./GraphyParagonGrid.css', import.meta.url),
            rel: 'stylesheet'
        });

        this.#controls = document.createElement('div');
        this.#controls.classList.add('controls', 'hidden');

        this.#solveButton = document.createElement('button');
        this.#solveButton.textContent = 'Solve!';
        this.#solveButton.addEventListener('click', e => {
            triggerEvent(this.#attachPoint, 'Solve');
            this.#solveButton.disabled = true;
        });
        const clearButton = document.createElement('button');
        clearButton.textContent = 'Clear Solution';
        clearButton.addEventListener('click', e => this.solution = this.selected = null);

        this.#controls.appendChild(this.#solveButton);
        this.#controls.appendChild(clearButton);

        this.#boardNodes = document.createElement('div');
        this.#boardNodes.classList.add('boards');

        window.requestAnimationFrame(() => {
            this.#attachPoint.appendChild(stylesheet);
            this.#attachPoint.appendChild(this.#controls);
            this.#attachPoint.appendChild(this.#boardNodes);
            this.render();
        });
    }

    render() {
        if (!this.isConnected) {
            return;
        }

        const renderedBoards = [];

        this.#boards.forEach(board => {
            const boardNode = document.createElement('graphy-paragon-board');
            boardNode.board = board;
            if (this.#solution?.hasOwnProperty(board.id)) {
                boardNode.highlightPath = this.#solution[board.id];
            }
            if (this.#selected?.hasOwnProperty(board.id)) {
                boardNode.selected = this.#selected[board.id];
            }
            renderedBoards.push(boardNode);
        });
        if (renderedBoards.length > 0) {
            this.#controls.classList.remove('hidden');
        } else if(!this.#controls.classList.contains('hidden')) {
            this.#controls.classList.add('hidden');
        }

        window.requestAnimationFrame(() => {
            this.#boardNodes.replaceChildren(...renderedBoards);
        });
    }

    set boards(boards) {
        this.#boards = boards;
        this.render();
    }

    set selected(nodes) {
        this.#selected = nodes;
    }

    set solution(solution) {
        this.#solution = solution;
        this.#solveButton.disabled = false;
        this.render();
    }
}
