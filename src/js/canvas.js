
// Holds canvas, context and adds endpoints for graphics

const floor = function (...args) {
    return Math.floor(...args);
}

class Canvas {
    constructor(id="c", w=128, h=128) {
        this.canvas = document.getElementById(id);
        this.canvas.width = w;
        this.canvas.height = h;

        this.context = this.canvas.getContext("2d");
        this.context.imageSmoothingEnabled = false;
        this.context.textBaseline = "top";

        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    fill(c="black") {
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

    drawText(text, x, y, c="white", size=16, font="monospace") {
        this.context.fillStyle = c;
        this.context.font = `${size}px ${font}`;
        this.context.fillText(text, x, y);
    }

    drawLine(x1, y1, x2, y2, c="white", w=1) {
        this.context.strokeStyle = c;
        this.context.lineWidth = w;
        this.context.beginPath();
        this.context.moveTo(x1, y1);
        this.context.lineTo(x2, y2);
        this.context.stroke();
    }
}

export { Canvas };
