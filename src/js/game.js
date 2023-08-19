
import { WIDTH, HEIGHT, GAME_TITLE } from "./config.js";
import { Canvas } from "./canvas.js";
import { TextRenderer } from "./text.js";
import { Room, Object } from "./objects.js";
import { isKeyUp, whichKeyDown } from "./keyboard.js";
import { getParameter } from "./utils.js";

let assets = {
    images: {
        splash: "../img/splash1.webp",
        font: "../img/hampsterfont.webp",
        selector: "../img/selector.webp",
    },
}

let running = 1;

let currentFrame = 0;
let targetFrames = 60;
let runAtMonitorRefreshRate = 0;

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
    currentRoom.init();
}

const loadingRoom = new Room("loading");
loadingRoom.updateStatus = (status) => {
    console.log(status);
    canvas.fill("#222034");
    canvas.drawImage(splash, canvas.width / 2 - splash.width / 2, canvas.height / 2 - splash.height / 2);
    text.render(status, 0, 0);
}

const debugRoom = new Room("debug");  
debugRoom.index = 0;
debugRoom.submenu = "main";
debugRoom.roomList = [];
debugRoom.options = {
    "main": [
        {"label": "Change Room", "action": _ => {debugRoom.submenu = "changeRoom"; debugRoom.index = 0;}},
        {"label": "Change Target FPS", "action": _ => {debugRoom.submenu = "changeTargetFPS"; debugRoom.index = 0;}},
        {"label": "Unlock refresh rate", "action": _ => {runAtMonitorRefreshRate = !runAtMonitorRefreshRate;}},
        {"label": "Exit", "action": _ => {changeRoom(searchForRoom("menu"))}},
    ],
    "changeRoom": [],
    "changeTargetFPS": [
        {"label": "60", "action": _ => {targetFrames = 60;}},
        {"label": "30", "action": _ => {targetFrames = 30;}},
    ],
};
debugRoom.init = () => {
    if (!debug) changeRoom(searchForRoom("menu"));
    for (let i = 0; i < rooms.length; i++) {
        debugRoom.roomList.push({"label": rooms[i].name, "action": _ => {changeRoom(i);}});
    }
    debugRoom.options.changeRoom = debugRoom.roomList;
}

debugRoom.keyDown = (key) => {
    if (pressedLastFrame.includes(key)) return;

    const keyActions = {
        ArrowUp: () => debugRoom.index--,
        ArrowDown: () => debugRoom.index++,
        Enter: () => debugRoom.options[debugRoom.submenu][debugRoom.index].action(),
        Escape: () => {debugRoom.submenu = "main"; debugRoom.index = 0;},
    };

    const action = keyActions[key];
    if (action) action();
    if (debugRoom.index >= debugRoom.options[debugRoom.submenu].length) debugRoom.index = 0;
    if (debugRoom.index < 0) debugRoom.index = debugRoom.options[debugRoom.submenu].length-1;
}

debugRoom.draw = () => {
    canvas.fill("black");

    canvas.drawRect(Math.sin(currentFrame /(canvas.width / 2)) * canvas.width - 32, canvas.height-64, 32, 32, "#222034");
}
debugRoom.drawGUI = () => {
    text.render("Debug Room", 0, 15);
    text.render(">", 0, 20+7*(debugRoom.index + 1));
    for (let i = 0; i < debugRoom.options[debugRoom.submenu].length; i++) {
        text.render(debugRoom.options[debugRoom.submenu][i].label, 8, 20+7*(i+1));
    }

    debugStatuses.push("Current Frame:"+currentFrame+`(~${Math.round((currentFrame/targetFrames)*100)/100} sec)`);
    debugStatuses.push(`CubePos:${Math.sin(currentFrame /(canvas.width / 2)) * canvas.width - 32}`)
}

const menuRoom = new Room("menu");
menuRoom.options = [
    {"label": "Start Game", "action": _ => {changeRoom(searchForRoom("game"))}},
];
if (debug) menuRoom.options.push({"label": "Debug Room", "action": _ => {changeRoom(searchForRoom("debug"))}});
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

// The following rooms should be removed before submitting.
const testing_graphing = new Room("testing_graphing");
testing_graphing.yScale = 10;
testing_graphing.a = 0;
testing_graphing.b = 0;
testing_graphing.c = (canvas.height/4)*testing_graphing.yScale;

testing_graphing.keyDown = (key) => {
    if (pressedLastFrame.includes(key)) return;

    const keyActions = {
        ArrowUp: () => testing_graphing.a += 0.25,
        ArrowDown: () => testing_graphing.a -= 0.25,
        ArrowLeft: () => testing_graphing.b -= 0.25,
        ArrowRight: () => testing_graphing.b += 0.25,
        KeyA: () => testing_graphing.c -= 0.25,
        KeyD: () => testing_graphing.c += 0.25,
    };

    const action = keyActions[key];
    if (action) action();
}

testing_graphing.draw = () => {
    // draws a quadratic graph
    // y = ax^2 + bx + c
    canvas.fill("black");
    canvas.drawLine(0, canvas.height/2, canvas.width, canvas.height/2, "white");
    canvas.drawLine(canvas.width/2, 0, canvas.width/2, canvas.height, "white");
    for (let i = 0; i < canvas.width; i++) {
        let x = i - canvas.width/2;
        let y = (testing_graphing.a * (x**2) + testing_graphing.b * x + testing_graphing.c) / testing_graphing.yScale;
        canvas.drawRect(i, canvas.height/2 - y, 1, 1, "white");
    }
}

testing_graphing.drawGUI = () => {
    text.render(`y = ${testing_graphing.a}x^2 + ${testing_graphing.b}x + ${testing_graphing.c}`, 0, 0);
}

rooms.push(loadingRoom);
rooms.push(menuRoom);
rooms.push(debugRoom);

// REMOVE THESE
rooms.push(testing_graphing);

currentRoom = rooms[roomIndex];



let main = () => { // main game loop
    if (!running) return;
    requestAnimationFrame(main);

    let now = performance.now();
    let delta = now - lastFrameTime;
    if (!runAtMonitorRefreshRate && delta < 1000 / targetFrames) return;

    currentFrame++;
    debugStatuses = [];

    currentRoom.step();

    currentRoom.draw();
    currentRoom.drawGUI();

    let currentKeys = whichKeyDown();
    for (let i = 0; i < currentKeys.length; i++) {
        if (isKeyUp(currentKeys[i]) && pressedLastFrame.includes(currentKeys[i])) continue;
        if (debug) debugStatuses.push(currentKeys[i]);
        currentRoom.keyDown(currentKeys[i]);
    }
    
    pressedLastFrame = currentKeys;    

    if (debug) {
        text.render(`${Math.round(1000 / delta)}/${targetFrames}FPS`, 0, 0);
        text.render(currentRoom.name, canvas.width-(text.charWidth*(currentRoom.name.length)), 0);

        debugStatuses.push("Debug mode");
        if (currentFrame <= 60*5) {
            debugStatuses.push("Dimensions:"+canvas.width+"x"+canvas.height);
            debugStatuses.push("Have fun!");
        }
    }

    for (let i = 0; i < debugStatuses.length; i++) {
        // console.debug(debugStatuses[i]);
        if (typeof(debugStatuses[i]) == "string") text.render(debugStatuses[i], 0, canvas.height-text.charHeight*(debugStatuses.length-i));
        if (typeof(debugStatuses[i]) == "object") {text.render(debugStatuses[i].msg, 0, canvas.height-text.charHeight*(debugStatuses.length-i)); debugStatuses[i].ttl--;}

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
        (getParameter("room") ? changeRoom(searchForRoom(getParameter("room"))) : changeRoom(searchForRoom("menu")));
        main();
    }, 1000);
}

window.onload = () => {
    document.title = GAME_TITLE;
    init();
}
