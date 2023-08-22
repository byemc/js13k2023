// random shit

const params = new URLSearchParams(location.search);

export const pi = Math.PI;
export const getParameter = key => key ? params.get(key) : 0;
export const hash = _ => window.location.hash;
export const setHash = string => window.location.hash = string;
export const degreesToRadians = degrees => degrees * pi / 180;

export const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const getDirectionBetweenTwoPoints = (x1, y1, x2, y2) => {
    const dX = x2 - x1;
    const dY = y2 - y1;
    return Math.atan2(dY, dX)
}

export const calculateDistanceBetweenTwoPoints = (x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}
 