// random shit

const params = new URLSearchParams(location.search);

export const pi = Math.PI;
export const getParameter = key => key ? params.get(key) : 0;
export const hash = _ => window.location.hash;
export const setHash = string => window.location.hash = string;
export const degreesToRadians = degrees => degrees * pi / 180;

export const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const findDuplicateIds = (objectsArray) => {
    const idOccurrences = {}; // Object to store ID occurrences

    // Iterate through the array and count occurrences of each ID
    objectsArray.forEach(obj => {
        const id = obj.id;
        idOccurrences[id] = (idOccurrences[id] || 0) + 1;
    });

    // Filter out IDs with occurrences greater than 1
    return Object.keys(idOccurrences).filter(id => idOccurrences[id] > 1);
}

export const getDirectionBetweenTwoPoints = (x1, y1, x2, y2) => {
    const dX = x2 - x1;
    const dY = y2 - y1;
    return Math.atan2(dY, dX)
}

export const calculateDirectionBetweenTwoTiles = (start = {x:0, y:0}, end = {x:0, y:0}) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    return Math.sqrt(dx * dx + dy * dy);
}
export const calculateDistanceBetweenTwoPoints = (x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

const findBestDirection = (start, end) => {
    const originalStart = { x: start.x, y: start.y }; // Save the original start position

    start.y++;
    const distTileBelow = calculateDirectionBetweenTwoTiles(start, end);
    start.x++; start.y--;
    const distTileRight = calculateDirectionBetweenTwoTiles(start, end);
    start.x--; start.y--;
    const distTileAbove = calculateDirectionBetweenTwoTiles(start, end);
    start.x--; start.y++;
    const distTileLeft = calculateDirectionBetweenTwoTiles(start, end);

    // Reset the start position to the original
    start.x = originalStart.x;
    start.y = originalStart.y;

    const distances = [distTileAbove, distTileRight, distTileBelow, distTileLeft];
    const smallestDistance = Math.min(...distances);
    return distances.indexOf(smallestDistance) + 1;
}

export const pathfind = (x1, y1, x2, y2, reloop = false) => {
    // Check if currentTile is equal to end
    if (x1 === x2 && y1 === y2) {
        return [{ x: x1, y: y1 }];
    }

    const start = { x: x1, y: y1 };
    const end = { x: x2, y: y2 };
    let currentTile = start;

    const foundDirections = [];

    // Loop until currentTile is equal to end
    while (currentTile.x !== end.x || currentTile.y !== end.y) {
        const direction = findBestDirection(currentTile, end);

        // Update currentTile based on direction
        switch (direction) {
            case 1:
                currentTile.y--;
                break;
            case 2:
                currentTile.x++;
                break;
            case 3:
                currentTile.y++;
                break;
            case 4:
                currentTile.x--;
                break;
        }

        // Add currentTile to foundDirections
        foundDirections.push({ x: currentTile.x, y: currentTile.y, direction: direction });
    }

    return foundDirections;
};

export const levelDatatoCostMap = (levelData=[], avoid=["land"]) => {
    let costMap = []
    for (let tile of levelData) {
        if (avoid.includes(tile.type)) costMap.push({x: tile.x, y: tile.y, cost: 100});
    }
    return costMap;
}

