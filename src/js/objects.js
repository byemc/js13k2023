class Object {
    draw() {}
    step() {}
}


class Room extends Object {
    constructor(name="") {
        super();
        this.objects = [];
        this.name = name; // needs to be unique, otherwise the searching code will just use the first one it finds.
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
}



export { Object, Room };