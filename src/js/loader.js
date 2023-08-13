// Loads a list of assets and calls a callback when done
// Shows a loading screen while loading

// Depends on canvas.js and text.js

class Loader {
    constructor(canvas, splashImg, fontRenderer) {
        this.canvas = canvas;
        this.splashImg = splashImg;
        this.fontRenderer = fontRenderer;
        this.assets = [];
        this.loaded = 0;
        this.total = 0;
        this.loading = false;
        this.callback = null;
    }
}