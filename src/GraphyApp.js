export default class GraphyApp extends HTMLElement {
    constructor() {
        super();
    }

    #className = null;
    #selected = {};

    #boardSelector = null;
    #paragonGrid = null;
    #toaster = null;

    #solverWorker = new Worker(new URL('./solver.js', import.meta.url), { type: 'module', name: 'solver' });

    connectedCallback() {
        this.#boardSelector = this.querySelector('graphy-board-selector');
        this.#paragonGrid = this.querySelector('graphy-paragon-grid');
        this.#toaster = this.querySelector('graphy-toaster');

        this.addEventListener('ClassSelected', e => this.selectClass(e.data.selectedClass));
        this.addEventListener('BoardsUpdated', e => this.updateBoards(e.data.boards));
        this.addEventListener('NodeSelected', e => this.pickNode(e.data.board, e.data.node));
        this.addEventListener('Solve', e => this.solve());
        this.#solverWorker.addEventListener('message', e => {
            this.#toaster.toast({ level: 'warning', message: `Solved in ${e.data.duration}ms` });
            this.#paragonGrid.solution = e.data.solution;
            this.#paragonGrid.selected = this.#selected;
        });

        this.addEventListener('toast', e => this.#toaster.toast(e.data.toast));
    }

    selectClass(className) {
        this.#className = className;
        this.#selected = {};
        this.#paragonGrid.selected = this.#selected;
        this.#boardSelector.selectClass(className);
    }

    updateBoards(boards) {
        this.#selected = {};
        boards.forEach(board => this.#selected[board.id] = []);
        this.#paragonGrid.boards = boards;
        this.#paragonGrid.selected = this.#selected;
    }

    pickNode(boardId, nodeId) {
        this.#selected[boardId].push(nodeId);
        this.#paragonGrid.selected = this.#selected;
    }

    solve() {
        this.#solverWorker.postMessage({
            className: this.#className,
            nodes: this.#selected,
            maxSteps: 328,
            maxAttempts: 250,
        });
    }
}
