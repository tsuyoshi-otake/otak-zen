export class SpatialIndex {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.cells = new Map();
    }

    clear() {
        this.cells.clear();
    }

    insert(item) {
        const key = this.getKey(item.x, item.y);
        let cell = this.cells.get(key);

        if (!cell) {
            cell = [];
            this.cells.set(key, cell);
        }

        cell.push(item);
    }

    queryCircle(x, y, radius) {
        const results = [];
        const minCellX = this.getCellCoordinate(x - radius);
        const maxCellX = this.getCellCoordinate(x + radius);
        const minCellY = this.getCellCoordinate(y - radius);
        const maxCellY = this.getCellCoordinate(y + radius);
        const radiusSquared = radius * radius;

        for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
            for (let cellY = minCellY; cellY <= maxCellY; cellY++) {
                const cell = this.cells.get(`${cellX}:${cellY}`);
                if (!cell) {
                    continue;
                }

                for (const item of cell) {
                    const dx = item.x - x;
                    const dy = item.y - y;
                    if (dx * dx + dy * dy <= radiusSquared) {
                        results.push(item);
                    }
                }
            }
        }

        return results;
    }

    getCellCoordinate(value) {
        return Math.floor(value / this.cellSize);
    }

    getKey(x, y) {
        return `${this.getCellCoordinate(x)}:${this.getCellCoordinate(y)}`;
    }
}
