import data from '../board-data.js';
import { distance, numberSort, findPath } from './a-star.js';

addEventListener('message', event => {
    const request = event.data;

    // find all the boards applicable to the solution (the unique set of board ids from the selected nodes)
    const eligibleBoardIds = Object.keys(request.nodes).map(id => Number(id));
    const boards = data.classes[request.className].boards.filter(board => eligibleBoardIds.includes(board.id));
    performance.mark('start');
    // for each board in the solution
    const solutions = boards.map((board, index) => {
        const lastBoard = index === (boards.length - 1);
        performance.mark('board-start', { detail: board.name });
        let nodes = request.nodes[board.id].map(n => board.entries[n]);

        if (nodes.length === 0) {
            // nothing to solve for this board!
            return { board: board.id, result: [] };
        }

        performance.mark('determine-start-node');

        let start = null;
        // is this the starter board?
        if (board.isStarter) {
            // use the start node as the starting point
            start = board.entries[board.starterId];
            // also, always path to the gate node on the starter board (even if it's the last board)
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
        performance.mark('determine-start-node-finished');

        performance.mark('find-paths');

        let result = [];
        let totalNodes = 0;

        // ensure the node list starts sorted by distance from the start, this ensures we pick the closest node as
        // the first to path to
        nodes.sort((a, b) => numberSort((distance(start, a) - distance(start, b))));

        let current = nodes.shift();
        while (nodes.length > 0) {
            console.log('Finding a path from', start, 'to', current, 'on board', board);
            // run A* with each selected node as the destination and the next closest node to any point on the path
            // (or the start/gate node) as the starting point
            performance.mark('find-path', { detail: { board: board.id, start: start.id, goal: current.id }});
            const path = findPath(board, start, current, request.maxAttempts);
            performance.mark('find-path-finished', { detail: { board: board.id, start: start.id, goal: current.id } });

            if (path !== null) {
                if ((totalNodes + path.length) > request.maxSteps) {
                    throw new Error(`No viable path in less than ${request.maxSteps} steps`);
                }
                console.log('Solved path', path);
                result.push({start: start.id, end: current.id, path});
            }

            nodes = nodes.filter(n => n !== current);
            // find the starting point by finding the next closest node to any node on the current path
            let closestDistance = Number.MAX_VALUE;
            for (const node of nodes) {
                for (const point of path) {
                    if (point === current) {
                        continue;
                    }

                    const dist = distance(node, point);
                    if (dist < closestDistance) {
                        start = point;
                        current = node;
                        closestDistance = dist;
                    }
                }
            }
        }

        performance.mark('find-paths-finished');
        performance.mark('board-finished');

        return { board: board.id, result };
    });

    performance.mark('finish');

    const measure = performance.measure('total-time-spent', 'start', 'finish');
    // return the solution to each board as a whole result

    console.log('Finished solutions looks like', solutions);
    const duration = measure.duration;
    const solution = solutions.reduce((result, current) => {
        result[current.board] = current.result.reduce(
            (result, current) => result.concat(current.path),
            []
        ).map(n => n.id);
        return result;
    }, {});

    postMessage({ duration, solution, });
});
