
// Holds canvas, context and adds endpoints for graphics
class Canvas {
    constructor(id="c", w=128, h=128, camera=null) {
        this.canvas = document.getElementById(id);
        this.canvas.width = w;
        this.canvas.height = h;

        this.ctx = this.canvas.getContext("2d");
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.textBaseline = "top";

        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // camera
        this.camera = camera;
    }

    setDimensions (w, h) {
        this.canvas.width = w;
        this.canvas.height = h;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    fill(color="black", ignoreCamera=false) {
        this.ctx.fillStyle = color;
        if (!ignoreCamera) this.cameraStart();
        this.ctx.fillRect(0, 0, this.width / this.camera.scale, this.height / this.camera.scale);
        if (!ignoreCamera) this.cameraEnd();
    }

    drawText(text, x, y, color="#ffffff", size=5, font="monospace") {
        // this ignores the camera anyway
        this.ctx.font = `${size}px ${font}`;
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
    }

    drawImage(img, x, y, w=img.width, h=img.height, ignoreCamera=false) {
        if (!ignoreCamera && this.isPixelOutOfCamera(x,y)) return;
        if (!ignoreCamera) this.cameraStart();
        this.ctx.drawImage(img, x, y, w, h);
        if (!ignoreCamera) this.cameraEnd();
    }

    sliceImage(img, x, y, w, h, sliceX, sliceY, sliceW, sliceH, direction=0, ignoreCamera=true) {
        if (!ignoreCamera && this.isPixelOutOfCamera(x,y)) return;
        if (!ignoreCamera) this.cameraStart()
            else this.ctx.save();
        if (direction) {
            this.ctx.translate((w / 2), (h / 2));
            this.ctx.rotate(direction);
        }
        this.ctx.drawImage(img, sliceX, sliceY, sliceW, sliceH, x, y, w, h);
        // this.ctx.fillRect(x, y, w, h);
        this.cameraEnd();
    }

    drawRect(x, y, w, h, color="#ffffff", ignoreCamera=false) {
        if (!ignoreCamera && this.isPixelOutOfCamera(x,y)) return;
        this.ctx.fillStyle = color;
        if (!ignoreCamera) this.cameraStart();
        this.ctx.fillRect(x, y, w, h);
        if (!ignoreCamera) this.cameraEnd();
    }

    drawLine(x1, y1, x2, y2, color="#ffffff", ignoreCamera=false) {
        if (!ignoreCamera && this.isPixelOutOfCamera(x1,y1)) return;
        if (!ignoreCamera && this.isPixelOutOfCamera(x2,y2)) return;
        this.ctx.strokeStyle = color;
        if (!ignoreCamera) this.cameraStart();
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        if (!ignoreCamera) this.cameraEnd();
    }

    strokeRect(x, y, w, h, color="#ffffff", ignoreCamera=false) {
        if (!ignoreCamera && this.isPixelOutOfCamera(x,y)) return;
        this.ctx.strokeStyle = color;
        if (!ignoreCamera) this.cameraStart();
        this.ctx.strokeRect(x, y, w, h);
        if (!ignoreCamera) this.cameraEnd();
    }



    

    // The following methods are for code reused when the camera is used
    cameraStart() {
        this.ctx.save();
        this.ctx.setTransform(1,0,0,1,0,0);
        this.ctx.scale(this.camera.scale, this.camera.scale);
        this.ctx.translate(-this.camera.x, -this.camera.y);
        // this.ctx.rotate(this.camera.rotation);
    }

    isPixelOutOfCamera(x,y) {
        if (x * this.camera.scale > this.width) return 1;
        if (y * this.camera.scale > this.height) return 1;
        return 0;
    }

    cameraEnd() {
        this.ctx.restore();
    }

}

export { Canvas };
