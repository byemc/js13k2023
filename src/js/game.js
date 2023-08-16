
import { WIDTH, HEIGHT, GAME_TITLE, SCALE } from "./config.js";
import { Canvas } from "./canvas.js";
import { TextRenderer } from "./text.js";
import { Room, Object } from "./objects.js";
import { whichKeyDown } from "./keyboard.js";
import { convertTileToScreen, getParameter, hash } from "./utils.js";

let assets = {
    images: {
        splash: "../img/splash1.webp",
        font: "../img/hampsterfont.webp",
        tiles: "../img/t.webp",
        selector: "../img/selector.webp",
    },
    spritesheets: {
        player: [
            {x: 0}, // looking up
            {x: 16}, // looking right
            {x: 32}, // looking down
            {x: 48} // looking left
        ]
    }
}

const tileTypes = {
    1: 1, // floor
    2: 2, // wall
}

let running = 1;

let currentFrame = 0;
let targetFrames = 60;

let lastFrameTime = performance.now();

let debug = getParameter("debug") || 0;

let rooms = [];
let debugStatuses = [];
let canvas = new Canvas("c", WIDTH, HEIGHT);
let text;

let pressedLastFrame = [];
canvas.fill("#222034");

let splash = new Image();
splash.src = assets.images.splash;
splash.onload = () => {
    canvas.drawImage(splash, canvas.width / 2 - splash.width / 2, canvas.height / 2 - splash.height / 2);
    let font = new Image();
    font.src = assets.images.font;
    font.onload = () => {
        console.log("font loaded")
        text = new TextRenderer(canvas, font);
        window.onerror = (e) => {
            running = 0;
            text.throwPanic(e);
        }
    }
}

// Entity class is here becuase otherwise every entity would need the canvas passed into it
class Entity extends Object {
    constructor(x=0, y=0, spritesheet=null, sprite=null) {
        super();
        this.x = x;
        this.y = y;
        this.sprite = sprite;
        this.spritesheet = spritesheet;
    }

    draw() {
        canvas.drawImage(this.sprite, this.x, this.y);
    }
}

// Create all the game rooms
let roomIndex = 0;
let currentRoom = rooms[roomIndex];

let searchForRoom = (name) => {
    // returns the room's index in the rooms array
    for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].name == name) return i;
    } throw new Error("Room not found:"+name+". Are you sure it's pushed?");
}

const changeRoom = (index) => {
    currentRoom = rooms[index];
    roomIndex = index;
}

const loadingRoom = new Room("loading");
loadingRoom.updateStatus = (status) => {
    console.log(status);
    canvas.fill("#222034");
    canvas.drawImage(splash, canvas.width / 2 - splash.width / 2, canvas.height / 2 - splash.height / 2);
    text.render(status, 0, 0);
}

const debugRoom = new Room("debug");
debugRoom.draw = () => {
    canvas.fill("black");
}
debugRoom.drawGUI = () => {
    debugStatuses.push("Current Frame:"+currentFrame+`(~${Math.round((currentFrame/targetFrames)*100)/100} sec)`);
}
debugRoom.keyDown = (key) => {
    if (key == "Escape") changeRoom(searchForRoom("menu"));
}

const menuRoom = new Room("menu");
menuRoom.options = [
    {"label": "Start Game", "action": _ => {changeRoom(searchForRoom("game"))}},
];
menuRoom.index = 0;

menuRoom.draw = () => {
    canvas.fill("black");
}
menuRoom.drawGUI = () => {
    text.render(GAME_TITLE, 8, 7*4);
    for (let i = 0; i < menuRoom.options.length; i++) {
        if (i == menuRoom.index) {
            text.render(">", 8, 7*(i+5));
        }
        text.render(menuRoom.options[i].label, 16, 7*(i+5));
    }
}
menuRoom.keyDown = (key) => {
    if (pressedLastFrame.includes(key)) return;

    const keyActions = {
        ArrowUp: () => menuRoom.index--,
        ArrowDown: () => menuRoom.index++,
        Enter: () => menuRoom.options[menuRoom.index].action(),
    };

    const action = keyActions[key];
    if (action) action();
    if (menuRoom.index >= menuRoom.options.length) menuRoom.index = 0;
    if (menuRoom.index < 0) menuRoom.index = menuRoom.options.length-1;
}

const getTileType = (x, y, data) => {
    for (let i = 0; i < data.tiles.length; i++) {
        let tile = data.tiles[i];
        if (tile.x == x && tile.y == y) return tileTypes[tile.id];
    }
    return 0;
}
    

const renderTiles = (data) => {
    for (let i = 0; i < data.tiles.length; i++) {
        let tile = data.tiles[i];
        let tileLocation = convertTileToScreen(tile.x, tile.y);
        let tId = tile.id;

        if (tile.id == 2) {
            tId = 3;
            // connect walls to each other.
            // check the tile above, below, left, and right of this one. if it is also id 2, then set the corresponding variable to 1
            getTileType(tile.x, tile.y-1, data) == 2 ? tId += 1 : tId += 0;
            getTileType(tile.x, tile.y+1, data) == 2 ? tId += 2 : tId += 0;
            getTileType(tile.x-1, tile.y, data) == 2 ? tId += 4 : tId += 0;
            getTileType(tile.x+1, tile.y, data) == 2 ? tId += 8 : tId += 0;
        }

        canvas.sliceImage(assets.images.tiles, tileLocation.x, tileLocation.y, SCALE, SCALE, tId*16, 0, 16, 16);
    }
}

const gameRoom = new Room("game"); 
gameRoom.data = { tiles: [ ] };
gameRoom.draw = () => {
    canvas.fill("black");

    renderTiles(gameRoom.data);
}

const levelEditor = new Room("editor");
levelEditor.currentTile = { x: 0, y: 0, id: 0 };
levelEditor.data = { tiles : [] };
levelEditor.step = _ => {

    // place the camera at the center of the current tile if it is outside the screen
    let tileLocation = convertTileToScreen(levelEditor.currentTile.x, levelEditor.currentTile.y);
    if (tileLocation.x < canvas.cX) canvas.cX = tileLocation.x;
    if (tileLocation.x >= canvas.cX+256) canvas.cX = tileLocation.x-canvas.width;
    if (tileLocation.y < canvas.cY) canvas.cY = tileLocation.y;
    if (tileLocation.y > canvas.cY+224) canvas.cY = tileLocation.y-canvas.height;


    debugStatuses.push("Current tile:"+levelEditor.currentTile.x+","+levelEditor.currentTile.y);
    debugStatuses.push("Current tile ID:"+levelEditor.currentTile.id);
    debugStatuses.push("Camera:"+canvas.cX+","+canvas.cY);
}
levelEditor.keyDown = (key) => {
    if (pressedLastFrame.includes(key)) return;

    const { currentTile, data } = levelEditor;
    const { x, y, id } = currentTile;

    const keyActions = {
        ArrowUp: () => currentTile.y--,
        ArrowDown: () => currentTile.y++,
        ArrowLeft: () => currentTile.x--,
        ArrowRight: () => currentTile.x++,
        PageUp: () => currentTile.id++,
        PageDown: () => currentTile.id--,
        KeyP: () => console.log(data),
        Enter: () => {
            data.tiles = data.tiles.filter(tile => tile.x !== x || tile.y !== y);
            data.tiles.push({ id, x, y });
        },
    };

    const action = keyActions[key];
    if (action) action();
};

levelEditor.draw = () => {
    canvas.fill("#010101");

    renderTiles(levelEditor.data);

    canvas.drawLine(-canvas.width*100, 0, canvas.width*100, 0, "white");
    canvas.drawLine(0, -canvas.height*100, 0, canvas.height*100, "white");
    text.render("(0,0)", 1-canvas.cX, 1-canvas.cY)

    let tileLocation = convertTileToScreen(levelEditor.currentTile.x, levelEditor.currentTile.y);
    canvas.ctx.globalAlpha = 0.5;
    canvas.sliceImage(assets.images.tiles, tileLocation.x, tileLocation.y, SCALE, SCALE, levelEditor.currentTile.id*16, 0, 16, 16);
    canvas.ctx.globalAlpha = 1;
    canvas.drawImage(assets.images.selector, tileLocation.x, tileLocation.y, SCALE, SCALE);
}

rooms.push(loadingRoom);
rooms.push(menuRoom);
rooms.push(gameRoom);
rooms.push(levelEditor);
rooms.push(debugRoom);

currentRoom = rooms[roomIndex];

let main = () => { // main game loop
    if (!running) return;
    requestAnimationFrame(main);
    let now = performance.now();
    let delta = now - lastFrameTime;

    if (delta < 1000 / targetFrames) return;

    currentFrame++;
    debugStatuses = [];

    currentRoom.step();

    currentRoom.draw();
    currentRoom.drawGUI();

    let currentKeys = whichKeyDown();
    for (let i = 0; i < currentKeys.length; i++) {
        if (debug) debugStatuses.push(currentKeys[i]);
        currentRoom.keyDown(currentKeys[i]);
    }
    
    pressedLastFrame = currentKeys;    

    if (debug) {
        text.render("FPS:" + Math.round(1000 / delta), 0, 0);
        text.render(currentRoom.name, canvas.width-8*(currentRoom.name.length), 0);

        debugStatuses.push("Debug mode");
        if (currentFrame <= 60*5) {
            debugStatuses.push("Dimensions:"+canvas.width+"x"+canvas.height);
            debugStatuses.push("Have fun!");
        }
    }

    for (let i = 0; i < debugStatuses.length; i++) {
        text.render(debugStatuses[i], 0, canvas.height-7*(debugStatuses.length-i));
    }

    lastFrameTime = now;
    }

let init = () => {
    // begin loading all the assets.
    currentRoom.updateStatus("Loading images...");
    for (let image in assets.images) {
        currentRoom.updateStatus("Loading image " + image);
        let img = new Image();
        img.src = assets.images[image];
        img.onload = () => {
            assets.images[image] = img;
        }
    }
    console.log("Images loaded.")
    currentRoom.updateStatus("Loading complete!");
    setTimeout(() => {
        
        main();
    }, 1000);
}

window.onload = () => {
    document.title = GAME_TITLE;
    init();
}
