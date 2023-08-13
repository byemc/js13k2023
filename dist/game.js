(() => {
  // src/js/config.js
  var GAME_TITLE = "Untitled JS13K23 Game.";
  var WIDTH = 256;
  var HEIGHT = 256;

  // src/js/canvas.js
  var Canvas = class {
    constructor(id = "c", w = 128, h = 128) {
      this.canvas = document.getElementById(id);
      this.canvas.width = w;
      this.canvas.height = h;
      this.context = this.canvas.getContext("2d");
      this.context.imageSmoothingEnabled = false;
      this.context.textBaseline = "top";
      this.width = this.canvas.width;
      this.height = this.canvas.height;
    }
    fill(c = "black") {
      this.context.fillStyle = c;
      this.context.fillRect(0, 0, this.width, this.height);
    }
    drawImage(image, x, y, width = image.width, height = image.height) {
      console.debug("drawImage", image, x, y, width, height);
      this.context.drawImage(image, x, y, width, height);
    }
    sliceImage(image, sx, sy, sw, sh, dx, dy, dw = sw, dh = sh) {
      this.context.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
    }
    drawText(text2, x, y, c = "white", size = 16, font = "monospace") {
      this.context.fillStyle = c;
      this.context.font = `${size}px ${font}`;
      this.context.fillText(text2, x, y);
    }
    drawLine(x1, y1, x2, y2, c = "white", w = 1) {
      this.context.strokeStyle = c;
      this.context.lineWidth = w;
      this.context.beginPath();
      this.context.moveTo(x1, y1);
      this.context.lineTo(x2, y2);
      this.context.stroke();
    }
  };

  // src/js/text.js
  var TextRenderer = class {
    constructor(canvas2, fontimg) {
      this.fontimg = fontimg;
      this.fontWidth = 7;
      this.fontHeight = 7;
      this.fontChars = "abcdefghijklmnopqrstuvwxyz1234567890.,!?:;)(~";
      this.canvas = canvas2;
    }
    drawLetter(letter, x, y) {
      let index = this.fontChars.indexOf(letter.toLowerCase());
      if (index == -1) {
        return;
      }
      let sx = index * this.fontWidth;
      let sy = 0;
      let yOffset = 0;
      if (letter == ",") {
        yOffset = -1;
      }
      this.canvas.sliceImage(this.fontimg, sx, sy, this.fontWidth, this.fontHeight, x, y - yOffset, this.fontWidth, this.fontHeight);
    }
    render(text2, x, y) {
      let heightOffset = 0;
      let xOffset = 0;
      for (let i = 0; i < text2.length; i++) {
        if (text2[i] == "\n") {
          heightOffset++;
          xOffset = 0;
          continue;
        }
        this.drawLetter(text2[i], x + xOffset * this.fontWidth, y + heightOffset * this.fontHeight);
        xOffset++;
      }
    }
    throwPanic = (err) => {
      this.canvas.fill("#00000080");
      this.render(err, 0, 0);
      throw err;
    };
  };

  // src/js/objects.js
  var Object2 = class {
    draw() {
    }
    step() {
    }
  };
  var Room = class extends Object2 {
    constructor() {
      super();
      this.objects = [];
    }
    draw() {
      for (let i = 0; i < this.objects.length; i++) {
        this.objects[i].draw();
      }
    }
    drawGUI() {
    }
    step() {
      for (let i = 0; i < this.objects.length; i++) {
        this.objects[i].step();
      }
    }
  };

  // src/js/keyboard.js
  var KEYS = {};
  var _releaseKey = (code) => delete KEYS[code];
  addEventListener("keydown", (e) => {
    if (!e.repeat) {
      KEYS[e.code] = performance.now();
    }
  });
  addEventListener("keyup", (e) => _releaseKey(e.code));

  // src/js/game.js
  var assets = {
    images: {
      splash: "../img/splash1.webp",
      splash2: "../img/splash2.webp",
      font: "../img/hampsterfont.webp"
    }
  };
  var currentFrame = 0;
  var targetFrames = 60;
  var lastFrameTime = performance.now();
  var rooms = [];
  var canvas = new Canvas("c", WIDTH, HEIGHT);
  var text;
  canvas.fill("#222034");
  var splash = new Image();
  splash.src = assets.images.splash;
  splash.onload = () => {
    canvas.drawImage(splash, canvas.width / 2 - splash.width / 2, canvas.height / 2 - splash.height / 2);
    let font = new Image();
    font.src = assets.images.font;
    font.onload = () => {
      console.log("font loaded");
      text = new TextRenderer(canvas, font);
      window.onerror = (e) => {
        text.throwPanic(e);
      };
    };
  };
  var DebugEntity = class extends Object2 {
    constructor() {
      super();
      this.x = 0;
      this.y = 0;
    }
    draw() {
      canvas.context.fillStyle = "red";
      canvas.context.fillRect(this.x, this.y, 10, 10);
    }
  };
  var loadingRoom = new Room("loading");
  loadingRoom.updateStatus = (status) => {
    console.log(status);
    canvas.fill("#222034");
    canvas.drawImage(splash, canvas.width / 2 - splash.width / 2, canvas.height / 2 - splash.height / 2);
    text.render(status, 0, 0);
  };
  var debugRoom = new Room("debug");
  debugRoom.draw = () => {
    canvas.fill("#222034");
    canvas;
    for (let i = 0; i < debugRoom.objects.length; i++) {
      debugRoom.objects[i].draw();
    }
  };
  debugRoom.drawGUI = () => {
    text.render("Welcome to the Debug Room,\nwe've got fun and games", 0, canvas.height - 14);
    text.render("Current Frame:" + currentFrame + `(~${Math.floor(currentFrame / targetFrames * 100) / 100}sec)`, 0, canvas.height - 21);
  };
  var testObject = new DebugEntity(0, 0);
  debugRoom.objects.push(testObject);
  rooms.push(loadingRoom);
  rooms.push(debugRoom);
  var roomIndex = 0;
  var currentRoom = rooms[roomIndex];
  var main = () => {
    requestAnimationFrame(main);
    let now = performance.now();
    let delta = now - lastFrameTime;
    if (delta < 1e3 / targetFrames)
      return;
    currentFrame++;
    currentRoom.draw();
    currentRoom.drawGUI();
    lastFrameTime = now;
    text.render("FPS:" + Math.round(1e3 / delta), 0, 0);
  };
  var init = () => {
    currentRoom.updateStatus("Loading images...");
    for (let image in assets.images) {
      currentRoom.updateStatus("Loading image " + image);
      let img = new Image();
      img.src = assets.images[image];
      img.onload = () => {
        assets.images[image] = img;
      };
    }
    currentRoom.updateStatus("Loading complete!");
    canvas.fill("#222034");
    canvas.drawImage(splash, canvas.width / 2 - splash.width / 2, canvas.height / 2 - splash.height / 2);
    setTimeout(() => {
      currentRoom = rooms[1];
      main();
    }, 1e3);
  };
  window.onload = () => {
    try {
      document.title = GAME_TITLE;
      init();
    } catch (e) {
      text.throwPanic(e);
    }
  };
})();
//# sourceMappingURL=game.js.map
