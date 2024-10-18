// Manhattan distance makes the most sense for paragon boards, since you can't cut across points
export function distance(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
};

function clamp(min, calc, max) {
    return Math.min(max, Math.max(calc, min));
}

export function numberSort(calc) {
    return clamp(-1, calc, 1);
};

class Node {
    #parent = null;
    #g = null;
    #h = null;
    #node = null;
    #map = null;

    constructor(node, parent, map) {
        this.#map = map;
        this.#node = node;
        this.#parent = parent;
        this.#calculateG();
    }

    #calculateG() {
        this.#g = this.#parent ? this.#parent.g + this.distanceTo(this.#parent) : 0;
    }

    get adjacentNodes() {
        const w = this.#map.width;
        /**
         * for paragon nodes, diagnonal movement is NOT allowed, so the adjacent nodes are (as node ids):
         *       X       | x * w + y - 1 |        X
         * ---------------------------------------------
         * x - 1 * w + y |       X       | x + 1 * w + y
         * ---------------------------------------------
         *       X       | x * w + y + 1 |        X
         */

        const adjacentNodes = [
            ((this.x    ) * w + (this.y - 1)),
            ((this.x - 1) * w + (this.y    )),
            ((this.x + 1) * w + (this.y    )),
            ((this.x    ) * w + (this.y + 1)),
        ];
        return adjacentNodes
            // map the ids to entries
            .map(id => this.#map.entries[id])
            // remove the missing entries
            .filter(entry => entry !== null && entry !== undefined)
            // turn the entries into nodes
            .map(entry => new Node(entry, this, this.#map));
    }

    distanceTo(node) {
        return distance(this, node);
    }

    get path() {
        const result = [];
        let path = this;
        while (path.parent !== null) {
            result.unshift(path.node);
            path = path.parent;
        }
        return result;
    }

    get parent() {
        return this.#parent;
    }

    set parent(value) {
        this.#parent = value;
        this.#calculateG();
    }

    get node() { return this.#node; }

    get x() { return this.#node.x; }
    get y() { return this.#node.y; }

    get f() { return this.#g + this.#h; }
    get g() { return this.#g; }

    get h() { return this.#h; }
    set h(value) { this.#h = value; }
}

export function findPath(map, start, goal, maxAttempts, estimator) {
    let open = [new Node(start, null, map)];
    let closed = [];
    let attempts = 0;

    while (open.length > 0) {
        const point = open.pop();
        if (point.node === goal) {
            return point.path;
        }
        closed.push(point);
        const adjacents = point.adjacentNodes;
        adjacents.forEach(adjacent => {
            if (closed.find(x => x.node === adjacent.node) !== undefined) {
                return;
            }

            adjacent.h = estimator(adjacent.node, goal);

            const openPoint = open.find(x => x.node === adjacent.node);
            if (openPoint !== undefined) {
                if (adjacent.g > openPoint.g) {
                    return;
                }
            }
            open.push(adjacent);
        });

        open.sort((a, b) => numberSort((b.f - a.f)));

        attempts++;
        if (attempts > maxAttempts) {
            throw new Error('Exceeded number of attempts to find a path');
        }
    }

    // path not found!
    return null;
};
