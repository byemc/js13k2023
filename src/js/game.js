
import { WIDTH, HEIGHT, GAME_TITLE } from "./config.js";
import { Canvas } from "./canvas.js";
import { TextRenderer } from "./text.js";
import { Room, Object } from "./objects.js";
import { whichKeyDown } from "./keyboard.js";
import { convertTileToScreen } from "./utils.js";

console.debug(convertTileToScreen(1, 1));

let assets = {
    images: {
        splash: "../img/splash1.webp",
        font: "../img/hampsterfont.webp",
        tiles: "../img/t.webp"
    },
    spritesheets: {
        player: [
            {x: 0}, // looking up
            {x: 16}, // looking right
            {x: 32}, // looking down
            {x: 48} // looking left
        ]
    },
    tilesets: {
        castle: [
            {x: 0, y: 0}, // ???
            {x: 16, y: 0}, // floor
        ]
    }

}

let running = 1;

let currentFrame = 0;
let targetFrames = 60;

let lastFrameTime = performance.now();

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
    } throw new Error("Room not found:"+name);
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
let menuOptions = [
    {"label": "Start Game", "action": _ => {changeRoom(searchForRoom("game"))}},
    {"label": "Debug Room", "action": _ => changeRoom(searchForRoom("debug"))},
    {"label": "Reload", "action": _ => {running = 0; location.reload();}}
];
let menuIndex = 0;

menuRoom.draw = () => {
    canvas.fill("black");
}
menuRoom.drawGUI = () => {
    text.render(GAME_TITLE, 8, 7*4);
    for (let i = 0; i < menuOptions.length; i++) {
        if (i == menuIndex) {
            text.render(">", 8, 7*(i+5));
        }
        text.render(menuOptions[i].label, 16, 7*(i+5));
    }
}
menuRoom.keyDown = (key) => {
    if (pressedLastFrame.includes(key)) return;
    switch (key) {
        case "ArrowUp":
            menuIndex--;
            break;
        case "ArrowDown":
            menuIndex++;
            break;
        case "Enter":
            menuOptions[menuIndex].action();
            break;
    }
    if (menuIndex >= menuOptions.length) menuIndex = 0;
    if (menuIndex < 0) menuIndex = menuOptions.length-1;
}

let currentLevelData = {
    tiles: [
        {id: 1, x: 1, y: 1}, // floor at tile coords 1, 1
        {id:123, x: 2, y: 2},
    ]
}

const gameRoom = new Room("game"); 
gameRoom.draw = () => {
    canvas.fill("black");
    for (let i = 0; i < currentLevelData.tiles.length; i++) {
        let tile = currentLevelData.tiles[i];
        if (tile.id > currentLevelData.length) tile.id = 0;
        let tileLocation = convertTileToScreen(tile.x, tile.y);
        canvas.sliceImage(assets.images.tiles, tileLocation.x, tileLocation.y, 16, 16, tile.id*16, 0, 16, 16);
    }

    
}

rooms.push(loadingRoom);
rooms.push(menuRoom);
rooms.push(gameRoom);
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

    currentRoom.draw();
    currentRoom.drawGUI();

    let currentKeys = whichKeyDown();
    for (let i = 0; i < currentKeys.length; i++) {
        debugStatuses.push(currentKeys[i]);
        currentRoom.keyDown(currentKeys[i]);
    }
    
    pressedLastFrame = currentKeys;    
    
    text.render("FPS:" + Math.round(1000 / delta), 0, 0);
    text.render(currentRoom.name, canvas.width-8*(currentRoom.name.length), 0);

    if (currentFrame <= 60*5) {
        debugStatuses.push("Debug mode.");
        debugStatuses.push("Dimensions:"+canvas.width+"x"+canvas.height);
        debugStatuses.push("Have fun!");
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
    console.log(assets.images);
    console.log("Images loaded.")
    currentRoom.updateStatus("Loading complete!");

    canvas.fill("#222034");
    canvas.drawImage(splash, canvas.width / 2 - splash.width / 2, canvas.height / 2 - splash.height / 2);
    setTimeout(() => {
        currentRoom = rooms[1];
        main();
    }, 1000);
}

window.onload = () => {
    document.title = GAME_TITLE;
    init();
}
