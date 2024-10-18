import data from '../board-data.js';
import { distance, numberSort, findPath } from './a-star.js';

function estimate(point, goal) {
    // TODO much more robust estimation
    return distance(point, goal);
}

function sortNodesByDistanceToSet(aSet, bSet) {
    const results = [];
    for (const a of aSet) {
        for (const b of bSet) {
            results.push({ a, b, distance: distance(a, b) });
        }
    }
    return results.toSorted((a, b) => numberSort((a.distance - b.distance)));
}

function solveBoard(board, index, boards, request) {
    const lastBoard = index === (boards.length - 1);
    performance.mark('board start', { detail: board.name });
    let nodes = request.nodes[board.id].map(n => board.entries[n]);

    if (nodes.length === 0) {
        // nothing to solve for this board!
        return { board: board.id, result: [] };
    }

    performance.mark('determine start node');

    let start = null;
    if (board.isStarter) {
        start = board.entries[board.starterId];
        nodes.push(board.entries[board.gateIds[0]]);
    } else {
        // for each gate node, determine the closest node to the gate node
        const gates = board.gateIds
            .map(id => board.entries[id])
            .map(node => {
                return {
                    node,
                    distances: nodes
                        .map(n => ({ node: n.id, distance: distance(node, n) }))
                        .sort((a, b) => numberSort((b.distance - a.distance)))
                };
            })
            .sort((a, b) => numberSort((b.distances[0] - a.distances[0])));

        // use the closest gate as the starting point
        start = gates[0].node;
        if (!lastBoard) {
            // since this isn't the last board to path, also path to the next nearest gate node as the exit
            nodes.push(board.entries[gates[1].node.id]);
        }
    }

    performance.mark('determine start node finished');

    performance.mark('find all paths');

    let result = [];
    let totalNodes = 0;

    let totalPath = [start];

    while (nodes.length > 0) {
        const candidates = sortNodesByDistanceToSet(totalPath, nodes);
        let candidate = candidates.shift();
        start = candidate.a;
        goal = candidate.b;
        nodes = nodes.filter(node => node.id !== goal.id);


        performance.mark('find path', { detail: { board: board.id, start: start.id, goal: goal.id } });
        const path = findPath(board, start, goal, request.maxAttempts, estimate);
        performance.mark('find path finished', { detail: { board: board.id, start: start.id, goal: goal.id } });

        if (path !== null) {
            if ((totalNodes + path.length) > request.maxSteps) {
                throw new Error(`No viable path in less than ${request.maxSteps} steps`);
            }

            totalPath = totalPath.concat(...path);
            result.push({ start: start.id, end: goal.id, path: [start, ...path] });
        }
    }

    performance.mark('find all paths finished');
    performance.mark('board finished');

    return { board: board.id, result };
}

function handleMessage(event) {
    const request = event.data;

    const eligibleBoardIds = Object.keys(request.nodes).map(id => Number(id));
    const boards = data.classes[request.className].boards.filter(board => eligibleBoardIds.includes(board.id));

    try {
        performance.mark('start');
        const solutions = boards.map((board, index) => solveBoard(board, index, boards, request));
        performance.mark('finish');

        const measure = performance.measure('total time spent', 'start', 'finish');

        const duration = measure.duration;
        const solution = solutions.reduce((result, current) => {
            result[current.board] = current.result
                .reduce((result, current) => result.concat(current.path), [])
                .map(n => n.id);
            return result;
        }, {});

        postMessage({ duration, solution, });
    } catch (error) {
        postMessage({ error });
    }
}

addEventListener('message', handleMessage);
