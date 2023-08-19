// draws text to the screen by splicing a font sheet.

class TextRenderer {
    constructor(canvas, fontimg) {
        this.fontimg = fontimg; // MUST BE AN IMAGE OBJECT
        this.fontWidth = 5;
        this.fontHeight = 5;
        this.spacing = 1;
        this.charWidth = this.fontWidth + this.spacing;
        this.charHeight = this.fontHeight + this.spacing;
        this.fontChars = "abcdefghijklmnopqrstuvwxyz1234567890.,!?:;)(~>";
        this.canvas = canvas;
    }

    drawLetter(letter, x, y, substituteOK=1) {
        let { canvas, fontWidth, fontHeight } = this;

        let index = this.fontChars.indexOf(letter.toLowerCase());
        if (index == -1) {
            if (!substituteOK) return;
            canvas.drawText(letter, x, y, "#ffffff", 7, "monospace");
        }
        let sx = index * fontWidth;
        let sy = 0;
        // draw image to context
        let yOffset = 0;
        // if the letter is ",", offset it by -1
        if (letter == ",") {
            yOffset = -1;
        }
        canvas.sliceImage(this.fontimg, x+canvas.cX, y + yOffset + canvas.cY, fontWidth, fontHeight, sx, sy, fontWidth, fontHeight); 
            // canvas.cX and canvas.cY are the camera offsets. we dont want to have text flying off the screen.
            // you can counteract this by specifying x-cX and x-cY when calling this.
    }

    render(text, x, y) {
        let heightOffset = 0;
        let xOffset = 0;
        for (let i = 0; i < text.length; i++) {
            if (text[i] == "\n") {
                heightOffset++;
                xOffset = 0;
                continue;
            }
            this.drawLetter(text[i], (x + (xOffset * (this.fontWidth + this.spacing))), y + (heightOffset * this.fontHeight));
            xOffset++;
        }
    }

    throwPanic = (err) => {
        // This function is called when an error is caught but unhandled.
        // It'll show the error on-screen.
    
        this.canvas.fill("#00000080") // 50% black
        
        this.render(err, 0, 0);
        throw err;
    }
}

export { TextRenderer };