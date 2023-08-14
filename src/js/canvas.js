
// Holds canvas, context and adds endpoints for graphics

import { pi } from "./utils.js"
class Canvas {
    constructor(id="c", w=128, h=128) {
        this.canvas = document.getElementById(id);
        this.canvas.width = w;
        this.canvas.height = h;

        this.ctx = this.canvas.getContext("2d");
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.textBaseline = "top";

        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // camera
        this.cX = 0;
        this.cY = 0;
    }

    fill(c="black") {
        this.ctx.fillStyle = c;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    drawImage(image, x, y, width = image.width, height = image.height) {
        console.debug("drawImage", image, x, y, width, height);
        this.ctx.drawImage(image, x-this.cX, y-this.cY, width, height);
    }

    sliceImage(img, x, y, w, h, cropX, cropY, cropW, cropH, direction=0) {
        // console.debug("sliceImage", img, x, y, w, h, cropX, cropY, cropW, cropH, direction);
        this.ctx.save();
        this.ctx.translate((x+w/2)-this.cX, (y+h/2)-this.cY);
        this.ctx.rotate(direction * pi/180);
        this.ctx.drawImage(img, cropX, cropY, cropW, cropH, -w/2, -h/2, w, h);
        this.ctx.restore();
        // console.log(`${x}, ${y}, ${w}, ${h}, ${cropX}, ${cropY}, ${cropW}, ${cropH}`);
    }

    drawText(text, x, y, c="white", size=16, font="monospace") {
        this.ctx.fillStyle = c;
        this.ctx.font = `${size}px ${font}`;
        this.ctx.fillText(text, x, y);
    }

    drawLine(x1, y1, x2, y2, c="white", w=1) {
        this.ctx.strokeStyle = c;
        this.ctx.lineWidth = w;
        this.ctx.beginPath();
        this.ctx.moveTo(x1-this.cX, y1-this.cY);
        this.ctx.lineTo(x2-this.cX, y2-this.cY);
        this.ctx.stroke();
    }
}

export { Canvas };
