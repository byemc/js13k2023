
import { WIDTH, HEIGHT, GAME_TITLE } from "./config.js";
import { Canvas } from "./canvas.js";
import { TextRenderer } from "./text.js";
import { Room, GameObject, Camera } from "./objects.js";
import {
    pi,
    getParameter,
    getDirectionBetweenTwoPoints,
    degreesToRadians,
    randomInt,
    calculateDistanceBetweenTwoPoints, findDuplicateIds, pathfind
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
let mainCamera = new Camera();
mainCamera.scale = 1;
let canvas = new Canvas("c", WIDTH, HEIGHT, mainCamera);
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
    mainCamera.x = 0;
    mainCamera.y = 0;
    mainCamera.scale = 1;
    mainCamera.rotation = 0;
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

debugRoom.step = () => {
    mainCamera.x = Math.sin(currentFrame /(canvas.width / 2)) * canvas.width - 32;
}

debugRoom.draw = () => {
    canvas.drawLine(0,0,0,canvas.height);
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
        if (speed === 0) this.speed = 0.5;
        this.stepspeed = randomInt(Math.floor(500/this.speed), Math.floor(1000/this.speed));
        this.target = target;
        this.moved = 0;
    }


    step() {
        let { stepspeed, x, y, target, id, moved } = this;
        if (!(currentFrame % stepspeed)) {
            this.direction = getDirectionBetweenTwoPoints(x, y, target.x, target.y);
            this.x += 2 * Math.cos(this.direction);
            this.y += 2 * Math.sin(this.direction);
        }

        const dist = calculateDistanceBetweenTwoPoints(x, y, target.x, target.y);
        if (dist < 5) {
            console.debug(`${id} is going bye-bye!`);
            currentRoom.remove(id);
        }
        debugStatuses.push(`${id}:${dist}px`)

    }

    draw() {
        // const displayDirection = this.direction + (pi / 2); // should move PI0.5 clockwise
        const displayDirection = 0;
        canvas.sliceImage(this.sprite, this.x-2.5, this.y-4, 5, 8, (5*this.boatbody), 0, 5, 8, displayDirection); //body
        canvas.sliceImage(this.sprite, this.x-2.5, this.y-4, 5, 8, (5*this.boatsail), 8, 5, 8, displayDirection); //sail

        if (debug) canvas.drawLine(this.x, this.y, this.target.x, this.target.y);
    }

    // onclick(pos) {
    //     this.target = pos;
    // }
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
gameRoom.init = _ => {
    mainCamera.scale = 1;
}
gameRoom.wave = getParameter("wave");
if (!gameRoom.wave) gameRoom.wave = 0;

const validTargets = [
    {x: 92, y: 97},
]

gameRoom.wavePendingStart = 0;
gameRoom.boatCount = 0;
gameRoom.boatSpeed = 0;

gameRoom.boatAvoid = [
    {x: 106, y: 84, w: 83, h: 67},
];

console.log(typeof(gameRoom.remove))

gameRoom.startWave = _ => {
    let { wave, boatCount, boatSpeed } = gameRoom;
    gameRoom.wavePendingStart = 0;
    boatCount = Math.floor(1 + (wave * 4));
    boatSpeed = 6 + (wave * 1.1);

    for (let i = 0; i <= boatCount; i++) {
        const randomDirection = degreesToRadians(Math.random()*360);
        const boatX = canvas.width/2 + (randomInt(150, 250) * Math.cos(randomDirection));
        const boatY = canvas.height/2 + (randomInt(150, 250) * Math.sin(randomDirection));
        const boatTarget = validTargets[Math.floor(Math.random()*validTargets.length)];
        console.debug(`Boat ${i}: ${boatX}, ${boatY}`)
        gameRoom.objects.push(new Boat(boatX, boatY, assets.images.boats, boatSpeed, i*100, boatTarget));

    }
}



gameRoom.background = "#305182"
gameRoom.draw = () => {
    canvas.drawImage(assets.images.island, (canvas.width/2 - assets.images.island.width/2), (canvas.height/2 - assets.images.island.height/2));
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

const testRoom = new Room("tiles", 512, 512);
testRoom.tileSize=8;
testRoom.tileWidth = testRoom.width / testRoom.tileSize;
testRoom.tileHeight = testRoom.height / testRoom.tileSize;
testRoom.currentTile = {x:0,y:0};
testRoom.lastClickedTile = {x:-10,y:0};
testRoom.pathfinded = [];
testRoom.step = _ => {
    testRoom.currentTile.x = Math.floor(lastMousePos.x/testRoom.tileSize);
    testRoom.currentTile.y = Math.floor(lastMousePos.y/testRoom.tileSize);

    testRoom.pathfinded = pathfind(testRoom.lastClickedTile.x, testRoom.lastClickedTile.y, testRoom.currentTile.x, testRoom.currentTile.y);

    debugStatuses.push(`Dimension:${testRoom.tileWidth},${testRoom.tileHeight}`);
    debugStatuses.push(`Camera scale:${mainCamera.scale}`);
    debugStatuses.push(`Last Clicked Tile:${testRoom.lastClickedTile.x},${testRoom.lastClickedTile.y}`);
    debugStatuses.push(`Current Tile:${testRoom.currentTile.x},${testRoom.currentTile.y}`);
    debugStatuses.push(`Difference:${testRoom.currentTile.x-testRoom.lastClickedTile.x},${testRoom.currentTile.y-testRoom.lastClickedTile.y}`)
    debugStatuses.push(`Pathfind direction:${testRoom.pathfinded}`);
}
testRoom.onclick = (pos) => {
    testRoom.lastClickedTile.x = Math.floor(pos.x/testRoom.tileSize);
    testRoom.lastClickedTile.y = Math.floor(pos.y/testRoom.tileSize);
}
testRoom.draw = _ => {
    for (let x = 0; x < testRoom.width; x+=testRoom.tileSize) {
        for (let y = 0; y < testRoom.height; y+=testRoom.tileSize) {
            canvas.strokeRect(x, y, testRoom.tileSize, testRoom.tileSize, "#222034");
        }
    }
    // draw the tile grid.
    for (let x = 0; x < testRoom.width; x+=testRoom.tileSize) {
        for (let y = 0; y < testRoom.height; y+=testRoom.tileSize) {
            canvas.strokeRect(x, y, testRoom.tileSize, testRoom.tileSize, "#222034");
        }
    }
    canvas.strokeRect(testRoom.lastClickedTile.x*testRoom.tileSize, testRoom.lastClickedTile.y*testRoom.tileSize, testRoom.tileSize, testRoom.tileSize, "red");
    canvas.strokeRect(testRoom.currentTile.x*testRoom.tileSize, testRoom.currentTile.y*testRoom.tileSize, testRoom.tileSize, testRoom.tileSize, "#b24d0d");

    for (let path of testRoom.pathfinded) {
        console.log(path);
        let destinationTile = {x: path.x, y: path.y};
        switch (path.direction) {
            case 1:
                destinationTile.y--;
                break;
            case 2:
                destinationTile.x++;
                break;
            case 3:
                destinationTile.y++;
                break;
            case 4:
                destinationTile.x--;
                break;
        }
        canvas.drawLine((path.x*8)-4, (path.y*8)-4, (destinationTile.x*8)-4, (destinationTile.y*8)-4, "white");
    }
}
testRoom.keyDown = (key) => {
    if (pressedLastFrame[key]) return;
    
    const keyActions = {
        ArrowUp: () => mainCamera.scale = ((mainCamera.scale*10)+1)/10,
        ArrowDown: () => mainCamera.scale = ((mainCamera.scale*10)-1)/10,
    }

    const action = keyActions[key];
    if (action) action();
}

rooms.push(loadingRoom, menuRoom, debugRoom, gameRoom, endRoom, testRoom);


currentRoom = rooms[roomIndex];

let lastMousePos = {x:0,y:0}

const sendMouseToCurrentRoom = evt => {
    const tempMousePos = getMousePos(canvas.canvas, evt);
    const mousePos = {x:tempMousePos.x/mainCamera.scale,y:tempMousePos.y/mainCamera.scale};
    currentRoom.onclick(mousePos);
}
canvas.canvas.addEventListener('mousedown', evt=>sendMouseToCurrentRoom(evt), false);
canvas.canvas.addEventListener('mousemove', evt => {
    const mousePos = getMousePos(canvas.canvas, evt);
    lastMousePos={x:mousePos.x/mainCamera.scale,y:mousePos.y/mainCamera.scale}
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
    let fpsColor = "#0d7200";
    if (fps < 30) {
        fpsColor = "#8a0000";
        debugStatuses.push("FPS is severly low. Please contact Bye.");
    } else if (fps <= 45) {
        fpsColor = "#b24d0d";
        debugStatuses.push("FPS is low. Please contact Bye.");
    }

    canvas.drawRect(0,0,20,5, fpsColor, 1);
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
    let errors = [];
    const imagesToLoad = Object.keys(assets.images).length;
    let imagesLoaded = 0;
    for (let image in assets.images) {
        let img = new Image();
        img.src = imgPrefix + assets.images[image];
        img.onerror = (err) => {
            errors.push(err);
            console.error(err);

        }
        img.onload = () => {
            currentRoom.updateStatus("Loaded "+ image);
            assets.images[image] = img;
            imagesLoaded++;
        }
    }


    let waitingForLoadingToFinish = setInterval(() => {
        if (imagesLoaded === imagesToLoad) {
            clearInterval(waitingForLoadingToFinish);
            let splashTime;
            getParameter("skipsplash") ? splashTime = 0 : splashTime = 1000;
            setTimeout(() => {
                console.log(assets.images);
                (getParameter("room") ? changeRoom(searchForRoom(getParameter("room"))) : changeRoom(searchForRoom("menu")));
                currentRoom.init();
                main();
            }, splashTime);
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
