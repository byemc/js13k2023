// random shit

import { SCALE } from "./config";

const params = new URLSearchParams(location.search);

export const pi = Math.PI;
export const convertTileToScreen = (x, y) => ({x: x*SCALE, y: y*SCALE});
export const getParameter = key => key ? params.get(key) : 0;
export const hash = window.location.hash.split("?")[0].slice(1);

// The following code is responsible for building levels.
const lineToCoords=(x0,y0,x1,y1,id=2)=>{const c=[];let dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=(x0<x1)?1:-1,sy=(y0<y1)?1:-1,err=dx-dy;while(true){c.push({x:x0,y:y0,id:id});if(x0===x1&&y0===y1)break;const e2=2*err;if(e2>-dy){err-=dy;x0+=sx}if(e2<dx){err+=dx;y0+=sy}}return c};

const generateBox = (x, y, width, height, fillTileId=1) => {
    const box = [];
    
    for (let y = y; y < height; y++) {
        for (let x = x; x < width; x++) {
            box.push({ x, y, id: fillTileId });
        }
    }
    
    return box;
}

export const generateRoom = (x,y,width,height,lineId=2,fillId=1) => {
    let top = lineToCoords(x, y, x+width, y, lineId);
    let bottom = lineToCoords(x, y+height, x+width, y+height, lineId);
    let left = lineToCoords(x, y, x, y+height, lineId);
    let right = lineToCoords(x+width, y, x+width, y+height, lineId);

    let fill = generateBox(x+1, y+1, x+width-1, y+height-1, fillId);

    return [...top, ...bottom, ...left, ...right, ...fill];
}
