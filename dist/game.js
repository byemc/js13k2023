(() => {
  // src/js/config.js
  var GAME_TITLE = "Untitled JS13K23 Game.";
  var WIDTH = 256;
  var HEIGHT = 240;
  var SCALE = 2 << 4;

  // src/js/utils.js
  var params = new URLSearchParams(location.search);
  var convertTileToScreen = (x, y) => ({x: x * SCALE, y: y * SCALE});
  var getParameter = (key) => key ? params.get(key) : 0;
  var hash = window.location.hash.split("?")[0].slice(1);

  // src/js/canvas.js
  var Canvas = class {
    constructor(id = "c", w = 128, h = 128) {
      this.canvas = document.getElementById(id);
      this.canvas.width = w;
      this.canvas.height = h;
      this.ctx = this.canvas.getContext("2d");
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.textBaseline = "top";
      this.width = this.canvas.width;
      this.height = this.canvas.height;
      this.cX = 0;
      this.cY = 0;
    }
    fill(c = "black") {
      this.ctx.fillStyle = c;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
    drawImage(image, x, y, width = image.width, height = image.height) {
      this.ctx.drawImage(image, x - this.cX, y - this.cY, width, height);
    }
    sliceImage(img, x, y, w, h, cropX, cropY, cropW, cropH, direction = 0) {
      this.ctx.save();
      this.ctx.translate(x + w / 2 - this.cX, y + h / 2 - this.cY);
      this.ctx.rotate(direction);
      this.ctx.drawImage(img, cropX, cropY, cropW, cropH, -w / 2, -h / 2, w, h);
      this.ctx.restore();
    }
    drawText(text2, x, y, c = "white", size = 16, font = "monospace") {
      this.ctx.fillStyle = c;
      this.ctx.font = `${size}px ${font}`;
      this.ctx.fillText(text2, x, y);
    }
    drawLine(x1, y1, x2, y2, c = "white", w = 1) {
      this.ctx.strokeStyle = c;
      this.ctx.lineWidth = w;
      this.ctx.beginPath();
      this.ctx.moveTo(x1 - this.cX, y1 - this.cY);
      this.ctx.lineTo(x2 - this.cX, y2 - this.cY);
      this.ctx.stroke();
    }
  };

  // src/js/text.js
  var TextRenderer = class {
    constructor(canvas2, fontimg) {
      this.fontimg = fontimg;
      this.fontWidth = 7;
      this.fontHeight = 7;
      this.fontChars = "abcdefghijklmnopqrstuvwxyz1234567890.,!?:;)(~>";
      this.canvas = canvas2;
    }
    drawLetter(letter, x, y, substituteOK = 1) {
      let {canvas: canvas2, fontWidth, fontHeight} = this;
      let index = this.fontChars.indexOf(letter.toLowerCase());
      if (index == -1) {
        if (!substituteOK)
          return;
        canvas2.drawText(letter, x, y, "#ffffff", 7, "monospace");
      }
      let sx = index * fontWidth;
      let sy = 0;
      let yOffset = 0;
      if (letter == ",") {
        yOffset = -1;
      }
      canvas2.sliceImage(this.fontimg, x + canvas2.cX, y + yOffset + canvas2.cY, fontWidth, fontHeight, sx, sy, fontWidth, fontHeight);
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
    constructor(name = "") {
      super();
      this.objects = [];
      this.name = name;
    }
    draw() {
      for (let i = 0; i < this.objects.length; i++) {
        this.objects[i].draw();
      }
    }
    drawGUI() {
    }
    keyDown(key) {
    }
    keyUp(key) {
    }
    step() {
      for (let i = 0; i < this.objects.length; i++) {
        this.objects[i].step();
      }
    }
  };

  // src/js/keyboard.js
  var KEYS = {};
  var _isKeyDown = (code) => KEYS[code] || 0;
  var _releaseKey = (code) => delete KEYS[code];
  addEventListener("keydown", (e) => {
    e.preventDefault();
    if (!e.repeat) {
      KEYS[e.code] = performance.now();
    }
  });
  addEventListener("keyup", (e) => _releaseKey(e.code));
  var whichKeyDown = () => Object.keys(KEYS).filter((code) => _isKeyDown(code));

  // src/js/game.js
  var assets = {
    images: {
      splash: "../img/splash1.webp",
      font: "../img/hampsterfont.webp",
      tiles: "../img/t.webp",
      selector: "../img/selector.webp"
    },
    spritesheets: {
      player: [
        {x: 0},
        {x: 16},
        {x: 32},
        {x: 48}
      ]
    }
  };
  var tileTypes = {
    1: 1,
    2: 2
  };
  var running = 1;
  var currentFrame = 0;
  var targetFrames = 60;
  var lastFrameTime = performance.now();
  var debug = getParameter("debug") || 0;
  var rooms = [];
  var debugStatuses = [];
  var canvas = new Canvas("c", WIDTH, HEIGHT);
  var text;
  var pressedLastFrame = [];
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
        running = 0;
        text.throwPanic(e);
      };
    };
  };
  var roomIndex = 0;
  var currentRoom = rooms[roomIndex];
  var searchForRoom = (name) => {
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].name == name)
        return i;
    }
    throw new Error("Room not found:" + name + ". Are you sure it's pushed?");
  };
  var changeRoom = (index) => {
    currentRoom = rooms[index];
    roomIndex = index;
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
    canvas.fill("black");
  };
  debugRoom.drawGUI = () => {
    debugStatuses.push("Current Frame:" + currentFrame + `(~${Math.round(currentFrame / targetFrames * 100) / 100} sec)`);
  };
  debugRoom.keyDown = (key) => {
    if (key == "Escape")
      changeRoom(searchForRoom("menu"));
  };
  var menuRoom = new Room("menu");
  menuRoom.options = [
    {label: "Start Game", action: (_) => {
      changeRoom(searchForRoom("game"));
    }}
  ];
  menuRoom.index = 0;
  menuRoom.draw = () => {
    canvas.fill("black");
  };
  menuRoom.drawGUI = () => {
    text.render(GAME_TITLE, 8, 7 * 4);
    for (let i = 0; i < menuRoom.options.length; i++) {
      if (i == menuRoom.index) {
        text.render(">", 8, 7 * (i + 5));
      }
      text.render(menuRoom.options[i].label, 16, 7 * (i + 5));
    }
  };
  menuRoom.keyDown = (key) => {
    if (pressedLastFrame.includes(key))
      return;
    const keyActions = {
      ArrowUp: () => menuRoom.index--,
      ArrowDown: () => menuRoom.index++,
      Enter: () => menuRoom.options[menuRoom.index].action()
    };
    const action = keyActions[key];
    if (action)
      action();
    if (menuRoom.index >= menuRoom.options.length)
      menuRoom.index = 0;
    if (menuRoom.index < 0)
      menuRoom.index = menuRoom.options.length - 1;
  };
  var getTileType = (x, y, data) => {
    for (let i = 0; i < data.tiles.length; i++) {
      let tile = data.tiles[i];
      if (tile.x == x && tile.y == y)
        return tileTypes[tile.id];
    }
    return 0;
  };
  var renderTiles = (data) => {
    for (let i = 0; i < data.tiles.length; i++) {
      let tile = data.tiles[i];
      let tileLocation = convertTileToScreen(tile.x, tile.y);
      let tId = tile.id;
      if (tile.id == 2) {
        tId = 3;
        getTileType(tile.x, tile.y - 1, data) == 2 ? tId += 1 : tId += 0;
        getTileType(tile.x, tile.y + 1, data) == 2 ? tId += 2 : tId += 0;
        getTileType(tile.x - 1, tile.y, data) == 2 ? tId += 4 : tId += 0;
        getTileType(tile.x + 1, tile.y, data) == 2 ? tId += 8 : tId += 0;
      }
      canvas.sliceImage(assets.images.tiles, tileLocation.x, tileLocation.y, SCALE, SCALE, tId * 16, 0, 16, 16);
    }
  };
  var gameRoom = new Room("game");
  gameRoom.data = {tiles: []};
  gameRoom.draw = () => {
    canvas.fill("black");
    renderTiles(gameRoom.data);
  };
  var levelEditor = new Room("editor");
  levelEditor.currentTile = {x: 0, y: 0, id: 0};
  levelEditor.data = {tiles: []};
  levelEditor.step = (_) => {
    let tileLocation = convertTileToScreen(levelEditor.currentTile.x, levelEditor.currentTile.y);
    if (tileLocation.x < canvas.cX)
      canvas.cX = tileLocation.x;
    if (tileLocation.x >= canvas.cX + 256)
      canvas.cX = tileLocation.x - canvas.width;
    if (tileLocation.y < canvas.cY)
      canvas.cY = tileLocation.y;
    if (tileLocation.y > canvas.cY + 224)
      canvas.cY = tileLocation.y - canvas.height;
    debugStatuses.push("Current tile:" + levelEditor.currentTile.x + "," + levelEditor.currentTile.y);
    debugStatuses.push("Current tile ID:" + levelEditor.currentTile.id);
    debugStatuses.push("Camera:" + canvas.cX + "," + canvas.cY);
  };
  levelEditor.keyDown = (key) => {
    if (pressedLastFrame.includes(key))
      return;
    const {currentTile, data} = levelEditor;
    const {x, y, id} = currentTile;
    const keyActions = {
      ArrowUp: () => currentTile.y--,
      ArrowDown: () => currentTile.y++,
      ArrowLeft: () => currentTile.x--,
      ArrowRight: () => currentTile.x++,
      PageUp: () => currentTile.id++,
      PageDown: () => currentTile.id--,
      KeyP: () => console.log(data),
      Enter: () => {
        data.tiles = data.tiles.filter((tile) => tile.x !== x || tile.y !== y);
        data.tiles.push({id, x, y});
      }
    };
    const action = keyActions[key];
    if (action)
      action();
  };
  levelEditor.draw = () => {
    canvas.fill("#010101");
    renderTiles(levelEditor.data);
    canvas.drawLine(-canvas.width * 100, 0, canvas.width * 100, 0, "white");
    canvas.drawLine(0, -canvas.height * 100, 0, canvas.height * 100, "white");
    text.render("(0,0)", 1 - canvas.cX, 1 - canvas.cY);
    let tileLocation = convertTileToScreen(levelEditor.currentTile.x, levelEditor.currentTile.y);
    canvas.ctx.globalAlpha = 0.5;
    canvas.sliceImage(assets.images.tiles, tileLocation.x, tileLocation.y, SCALE, SCALE, levelEditor.currentTile.id * 16, 0, 16, 16);
    canvas.ctx.globalAlpha = 1;
    canvas.drawImage(assets.images.selector, tileLocation.x, tileLocation.y, SCALE, SCALE);
  };
  rooms.push(loadingRoom);
  rooms.push(menuRoom);
  rooms.push(gameRoom);
  rooms.push(levelEditor);
  rooms.push(debugRoom);
  currentRoom = rooms[roomIndex];
  var main = () => {
    if (!running)
      return;
    requestAnimationFrame(main);
    let now = performance.now();
    let delta = now - lastFrameTime;
    if (delta < 1e3 / targetFrames)
      return;
    currentFrame++;
    debugStatuses = [];
    currentRoom.step();
    currentRoom.draw();
    currentRoom.drawGUI();
    let currentKeys = whichKeyDown();
    for (let i = 0; i < currentKeys.length; i++) {
      if (debug)
        debugStatuses.push(currentKeys[i]);
      currentRoom.keyDown(currentKeys[i]);
    }
    pressedLastFrame = currentKeys;
    if (debug) {
      text.render("FPS:" + Math.round(1e3 / delta), 0, 0);
      text.render(currentRoom.name, canvas.width - 8 * currentRoom.name.length, 0);
      debugStatuses.push("Debug mode");
      if (currentFrame <= 60 * 5) {
        debugStatuses.push("Dimensions:" + canvas.width + "x" + canvas.height);
        debugStatuses.push("Have fun!");
      }
    }
    for (let i = 0; i < debugStatuses.length; i++) {
      text.render(debugStatuses[i], 0, canvas.height - 7 * (debugStatuses.length - i));
    }
    lastFrameTime = now;
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
    console.log("Images loaded.");
    currentRoom.updateStatus("Loading complete!");
    setTimeout(() => {
      main();
    }, 1e3);
  };
  window.onload = () => {
    document.title = GAME_TITLE;
    init();
  };
})();
//# sourceMappingURL=game.js.map
