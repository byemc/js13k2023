
import { WIDTH, HEIGHT, GAME_TITLE } from "./config.js";
import { Canvas } from "./canvas.js";
import { TextRenderer } from "./text.js";
import { Room, GameObject } from "./objects.js";
import {
    pi,
    getParameter,
    getDirectionBetweenTwoPoints,
    degreesToRadians,
    randomInt,
    calculateDistanceBetweenTwoPoints, findDuplicateIds
} from "./utils.js";
import { getMousePos } from "./inputs/mouse.js";
import { isKeyUp, whichKeyDown } from "./inputs/keyboard.js";


let imgPrefix = "../img/";

let assets = {
    images: {
        splash: "splash1.webp",
        font: "hampsterfont.webp",
        island: "island.webp",
        debug_ball: "ball.webp",
        boats: "boats.webp"
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
splash.src = imgPrefix + assets.images.splash;
splash.onload = () => {
    canvas.drawImage(splash, canvas.width / 2 - splash.width / 2, canvas.height / 2 - splash.height / 2);
    let font = new Image();
    font.src = imgPrefix + assets.images.font;
    font.onload = () => {
        console.log("font loaded")
        text = new TextRenderer(canvas, font);
        window.onerror = (e) => {
            running = 0;
            text.throwPanic(e);
        }
    }
}

// Entity class is here because otherwise every entity would need the canvas passed into it
class Entity extends GameObject {
    constructor(id, x=0, y=0, spritesheet=null, sprite=null) {
        super();
        this.x = x;
        this.y = y;
        this.sprite = sprite;
        this.direction = 0;
        this.id = id;
        this.hitbox = {x: 0, y: 0, w: 0, h: 0};
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
        if (rooms[i].name === name) return i;
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
        {"label": "Unlock refresh rate", "action": _ => {runAtMonitorRefreshRate = !runAtMonitorRefreshRate;}},
        {"label": "Exit", "action": _ => {changeRoom(searchForRoom("menu"))}},
    ],
    "changeRoom": [],
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
menuRoom.init = () => {debugStatuses.push({msg: "Dimensions:"+canvas.width+"x"+canvas.height, ttl:60*5})};
menuRoom.drawGUI = () => {
    text.render(GAME_TITLE, 8, 7*4);
    for (let i = 0; i < menuRoom.options.length; i++) {
        if (i === menuRoom.index) {
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

class Boat extends Entity {
    constructor(x, y, sprite, speed =1, id=randomInt(100, 10000), target={x:0,y:0}) {
        super(id, x, y);
        this.boatbody = randomInt(0,2);
        this.boatsail = randomInt(0,2);
        this.sprite = sprite;
        this.speed = speed;
        if (speed === 0) speed = 0.5;
        this.stepspeed = randomInt(Math.floor(500/speed), Math.floor(1500/speed));
        this.target = target;
    }


    step() {
        if (!(currentFrame % this.stepspeed)) {
            this.direction = getDirectionBetweenTwoPoints(this.x, this.y, this.target.x, this.target.y);
            this.x += 2 * Math.cos(this.direction);
            this.y += 2 * Math.sin(this.direction);
        }

        if (calculateDistanceBetweenTwoPoints(this.x, this.y, this.target.x, this.target.y) < 5) {
            console.debug(`${this.id} is going bye-bye!`);
            gameRoom.remove(this.id);
        }
    }

    draw() {
        const displayDirection = this.direction + (pi / 2); // should move PI0.5 clockwise
        canvas.sliceImage(this.sprite, this.x-2.5, this.y-4, 5, 8, (5*this.boatbody), 0, 5, 8, displayDirection); //body
        canvas.sliceImage(this.sprite, this.x-2.5, this.y-4, 5, 8, (5*this.boatsail), 8, 5, 8, displayDirection); //sail

        if (debug) text.render(`${this.id}`, this.x - 2, this.y - 2);
    }

    onclick(pos) {
        this.target = pos;
    }
}

const endRoom = new Room("end");
endRoom.background = "#3051820A"
endRoom.drawGUI = () => {
    const words = "You won! Well done.";
    text.render(words, (canvas.width/2)-((words.length*6)/2), 40);
}
endRoom.wonGame = () => {
    changeRoom(searchForRoom("end"));
}

const gameRoom = new Room("game");
gameRoom.wave = getParameter("wave");
if (!gameRoom.wave) gameRoom.wave = 0;

const validTargets = [
    {x: 92, y: 97},
]

gameRoom.wavePendingStart = 0;
gameRoom.boatCount = 0;
gameRoom.boatSpeed = 0;

gameRoom.boatAvoid = [
    {x: 35, y: 100, w: 32, h: 75}
];

console.log(typeof(gameRoom.remove))

gameRoom.startWave = _ => {
    let { wave, boatCount, boatSpeed } = gameRoom;
    gameRoom.wavePendingStart = 0;
    boatCount = Math.floor(1 + (wave * 4));
    boatSpeed = 3 + (wave * 1.1);

    for (let i = 0; i <= boatCount; i++) {
        const randomDirection = degreesToRadians(Math.random()*360);
        const boatX = canvas.width/2 + (randomInt(150, 250) * Math.cos(randomDirection));
        const boatY = canvas.height/2 + (randomInt(150, 250) * Math.sin(randomDirection));
        const boatTarget = validTargets[Math.floor(Math.random()*validTargets.length)];
        console.debug(`Boat ${i}: ${boatX}, ${boatY}`)
        gameRoom.objects.push(new Boat(boatX, boatY, assets.images.boats, boatSpeed, i*100, boatTarget));

    }
}

// gameRoom.init = _ => gameRoom.startWave();

gameRoom.background = "#305182"
gameRoom.draw = () => {
    canvas.drawImage(assets.images.island, (canvas.width/2 - assets.images.island.width/2)-canvas.cX, (canvas.height/2 - assets.images.island.height/2)-canvas.cY);
    for (const item of gameRoom.objects) {
        item.draw();
    }

    for (const hitbox of gameRoom.boatAvoid) {
        canvas.strokeRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h, "red");
    }
}
gameRoom.step = _ => {
    let numberOfBoats = 0;
    for (const item of gameRoom.objects) {
        if (item.constructor.name === "Boat") numberOfBoats++;
        item.step();
    }
    if (numberOfBoats === 0 && !gameRoom.wavePendingStart) {gameRoom.wave++; gameRoom.wavePendingStart=1; setTimeout(gameRoom.startWave, 3000)}
    if (gameRoom.wave >= 401) endRoom.wonGame();
}
gameRoom.drawGUI = () => {
    debugStatuses.push("Current wave:"+gameRoom.wave);
    debugStatuses.push("Current Frame:"+currentFrame+`(~${Math.round((currentFrame/targetFrames)*100)/100} sec)`);
}
gameRoom.onclick = (pos) => {
    for (const item of gameRoom.objects) {
        item.onclick(pos);
    }
}




rooms.push(loadingRoom, menuRoom, debugRoom, gameRoom, endRoom);


currentRoom = rooms[roomIndex];

let lastMousePos = {x:0,y:0}

const sendMouseToCurrentRoom = evt => {
    const mousePos = getMousePos(canvas.canvas, evt);
    currentRoom.onclick(mousePos);
}
canvas.canvas.addEventListener('mousedown', evt=>sendMouseToCurrentRoom(evt), false);
canvas.canvas.addEventListener('mousemove', evt => {
    const mousePos = getMousePos(canvas.canvas, evt);
    lastMousePos={x:mousePos.x,y:mousePos.y}
})


let main = () => { // main game loop
    if (!running) return;
    requestAnimationFrame(main);

    let now = performance.now();
    let delta = now - lastFrameTime;
    if (!runAtMonitorRefreshRate && delta < 1000 / targetFrames) return;

    currentFrame++;

    currentRoom.step();

    canvas.fill(currentRoom.background);

    currentRoom.draw();

    currentRoom.drawGUI();

    let currentKeys = whichKeyDown();
    for (let i = 0; i < currentKeys.length; i++) {
        if (isKeyUp(currentKeys[i]) && pressedLastFrame.includes(currentKeys[i])) continue;
        if (debug) debugStatuses.push(currentKeys[i]);
        currentRoom.keyDown(currentKeys[i]);
    }
    
    pressedLastFrame = currentKeys;

    const fps = Math.round(1000 / delta);
    let fpsColor;
    (fps > 50) ? fpsColor = "#0d7200" : "#b24d0d";
    (fps < 40) ? fpsColor = "#8a0000" : "#b24d0d";
    canvas.drawRect(0,0,20,5, fpsColor);
    text.render(`${fps}/${targetFrames}FPS`, 0, 0);
    if (debug) {
        text.render(currentRoom.name, canvas.width-(text.charWidth*(currentRoom.name.length)), 0);

        debugStatuses.push("Debug mode");
        if (findDuplicateIds(gameRoom.objects).length >= 1) debugStatuses.push(`WARN:Duplicate values found.${findDuplicateIds(gameRoom.objects).length}`);
        debugStatuses.push(`MousePos:${Math.round(lastMousePos.x)},${Math.round(lastMousePos.y)}`);
    }

    // console.debug(debugStatuses);
    let shitToSplice = [];
    for (let i = 0; i < debugStatuses.length; i++) {
        switch (typeof (debugStatuses[i])) {
            case "string":
                text.render(debugStatuses[i], 0, canvas.height - text.charHeight * (debugStatuses.length - i));
                shitToSplice.push(i);
                break;
            case "object":
                console.debug("OBJECT!!")
                text.render(debugStatuses[i].msg, 0, canvas.height-text.charHeight*(debugStatuses.length-i));
                debugStatuses[i].ttl--;
                if (debugStatuses[i].ttl < 0) shitToSplice.push(i);
                break;
        }
    }
    for (let index in shitToSplice) {
        debugStatuses.splice(index);
    }

    lastFrameTime = now;
    }

let init = () => {
    // begin loading all the assets.
    currentRoom.updateStatus("Loading images...");
    let errors = [];
    const imagesToLoad = Object.keys(assets.images).length;
    let imagesLoaded = 0;
    for (let image in assets.images) {
        currentRoom.updateStatus("Loading image " + image);
        let img = new Image();
        img.src = imgPrefix + assets.images[image];
        img.onerror = (err) => {
            errors.push(err);
            console.error(err);

        }
        img.onload = () => {
            console.log("Loaded "+ image);
            assets.images[image] = img;
            imagesLoaded++;
            errors.push("Loaded "+ image);
        }
    }
    currentRoom.updateStatus("Loading complete!");


    let waitingForLoadingToFinish = setInterval(() => {
        if (imagesLoaded === imagesToLoad) {
            clearInterval(waitingForLoadingToFinish);
            setTimeout(() => {
                console.log(assets.images);
                (getParameter("room") ? changeRoom(searchForRoom(getParameter("room"))) : changeRoom(searchForRoom("menu")));
                currentRoom.init();
                main();
            }, 1000);
        }
        if (errors.length > 0) {
            for (let i = 0; i < errors.length; i++) {
                text.render(errors[i], 0, 6*i+6);
            }
        }
    }, 100);
}


window.onload = () => {
    document.title = GAME_TITLE;
    init();
}
