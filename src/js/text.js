// draws text to the screen by splicing a font sheet.

class TextRenderer {
    constructor(canvas, fontimg) {
        this.fontimg = fontimg; // MUST BE AN IMAGE OBJECT
        this.fontWidth = 7;
        this.fontHeight = 7;
        this.fontChars = "abcdefghijklmnopqrstuvwxyz1234567890.,!?:;)(~>";
        this.canvas = canvas;
    }

    drawLetter(letter, x, y, substituteOK=0) {
        let index = this.fontChars.indexOf(letter.toLowerCase());
        if (index == -1) {
            if (!substituteOK) return;
            this.canvas.drawText(letter, x, y, "#ffffff", 7, "monospace");
        }
        let sx = index * this.fontWidth;
        let sy = 0;
        // draw image to context
        let yOffset = 0;
        // if the letter is ",", offset it by -1
        if (letter == ",") {
            yOffset = -1;
        }
        this.canvas.sliceImage(this.fontimg, x, y + yOffset, this.fontWidth, this.fontHeight, sx, sy, this.fontWidth, this.fontHeight);
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
            this.drawLetter(text[i], x + (xOffset * this.fontWidth), y + (heightOffset * this.fontHeight));
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