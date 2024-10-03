import data from '../board-data.js';
import { createToast, triggerEvent } from "./utility";

export default class GraphyBoardSelector extends HTMLElement {
    #classData = {};

    #selectedBoards = [];
    #attachPoint = null;
    #allBoardsNode = null;
    #selectedBoardsNode = null;

    constructor() {
        super();
    }

    connectedCallback() {
        this.#attachPoint = this.attachShadow({ mode: 'open' });

        const stylesheet = Object.assign(document.createElement('link'), {
            href: new URL('./GraphyBoardSelector.css', import.meta.url),
            rel: 'stylesheet'
        });

        this.#selectedBoardsNode = document.createElement('ol');
        this.#selectedBoardsNode.classList.add('selected-boards');

        this.#allBoardsNode = document.createElement('ul');
        this.#allBoardsNode.classList.add('all-boards');

        this.#attachPoint.addEventListener('click', e => this.selectBoard(e.target));

        window.requestAnimationFrame(() => {
            this.#attachPoint.appendChild(stylesheet);
            this.#attachPoint.appendChild(this.#selectedBoardsNode);
            this.#attachPoint.appendChild(this.#allBoardsNode);
        });
    }

    render() {
        if (!this.isConnected) {
            return;
        }

        const selectedBoardsChildren = [];
        this.#selectedBoards.forEach(board => {
            const item = document.createElement('li');
            item.classList.add('board', 'selected');

            item.textContent = board.name;
            item.board = board;

            selectedBoardsChildren.push(item);
        });

        const allBoardsChildren = [];
        this.#classData.boards
            .filter(board => !this.#selectedBoards.includes(board))
            .forEach(board => {
                const item = document.createElement('li');
                item.classList.add('board');

                item.textContent = board.name;
                item.board = board;

                allBoardsChildren.push(item);
            });

        window.requestAnimationFrame(() => {
            this.#selectedBoardsNode.replaceChildren(...selectedBoardsChildren);
            this.#allBoardsNode.replaceChildren(...allBoardsChildren);
        });
    }

    selectClass(className) {
        this.#classData = data.classes[className];
        // the starter board must always be selected
        this.#selectedBoards = [this.#classData.boards.find(board => board.isStarter === true)];
        triggerEvent(this.#attachPoint, 'BoardsUpdated', { boards: this.#selectedBoards });
        this.render();
    }

    selectBoard(target) {
        if (!target.classList.contains('board')) {
            return;
        }

        if (target.classList.contains('selected')) {
            if (target.board.isStarter) {
                this.#attachPoint.dispatchEvent(createToast('error', `You cannot remove the starter board!`));
                return;
            }
            this.#selectedBoards = this.#selectedBoards.filter(board => board.id !== target.board.id);
        } else {
            if (this.#selectedBoards.length === 5) {
                this.#attachPoint.dispatchEvent(createToast('error', `Sorry, you've reached the maximum number of boards.`));
                return;
            }
            this.#selectedBoards.push(target.board);
        }
        this.render();

        triggerEvent(this.#attachPoint, 'BoardsUpdated', { boards: this.#selectedBoards });
    }
}
