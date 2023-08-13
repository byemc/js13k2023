
import { WIDTH, HEIGHT, GAME_TITLE } from "./config.js";
import { Canvas } from "./canvas.js";
import { TextRenderer } from "./text.js";
import { Room, Object } from "./objects.js";
import { isKeyDown } from "./keyboard.js";

let assets = {
    images: {
        splash: "../img/splash1.webp",
        splash2: "../img/splash2.webp",
        font: "../img/hampsterfont.webp"
    }
}

let currentFrame = 0;
let targetFrames = 60;

let lastFrameTime = performance.now();
let startFrameTime = lastFrameTime;

let rooms = [];
let canvas = new Canvas("c", WIDTH, HEIGHT);
let text;
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
            text.throwPanic(e);
        }
    }
}

class DebugEntity extends Object {
    constructor() {
        super();
        this.x = 0;
        this.y = 0;
    }

    draw() {
        canvas.context.fillStyle = "red";
        canvas.context.fillRect(this.x, this.y, 10, 10);
    }
}

// Create all the game rooms

let loadingRoom = new Room("loading");
loadingRoom.updateStatus = (status) => {
    console.log(status);
    canvas.fill("#222034");
    canvas.drawImage(splash, canvas.width / 2 - splash.width / 2, canvas.height / 2 - splash.height / 2);
    text.render(status, 0, 0);
}

let debugRoom = new Room("debug");
debugRoom.draw = () => {
    canvas.fill("#222034");
    canvas
    for (let i = 0; i < debugRoom.objects.length; i++) {
        debugRoom.objects[i].draw();
    }
}
debugRoom.drawGUI = () => {
    text.render("Welcome to the Debug Room,\nwe've got fun and games", 0, canvas.height-14);
    text.render("Current Frame:" + currentFrame + `(~${Math.floor((currentFrame/targetFrames)*100)/100}sec)`, 0, canvas.height-21);
}
let testObject = new DebugEntity(0, 0);
debugRoom.objects.push(testObject);

rooms.push(loadingRoom);
rooms.push(debugRoom);

let roomIndex = 0;
let currentRoom = rooms[roomIndex];

let main = () => { // main game loop
    requestAnimationFrame(main);

    let now = performance.now();
    let delta = now - lastFrameTime;

    if (delta < 1000 / targetFrames) return;

    currentFrame++;
    
    currentRoom.draw();
    currentRoom.drawGUI();

    lastFrameTime = now;

    text.render("FPS:" + Math.round(1000 / delta), 0, 0);
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
    currentRoom.updateStatus("Loading complete!");

    canvas.fill("#222034");
    canvas.drawImage(splash, canvas.width / 2 - splash.width / 2, canvas.height / 2 - splash.height / 2);
    setTimeout(() => {
        currentRoom = rooms[1];
        main();
    }, 1000);
}

window.onload = () => {
    try {
        document.title = GAME_TITLE;
        init();
    } catch (e) {
        text.throwPanic(e);
    }
}
