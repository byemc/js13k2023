class Object {
    draw() {}
    step() {}
}

class Room extends Object {
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
}



export { Object, Room };