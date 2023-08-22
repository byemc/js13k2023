class GameObject {
    draw() {}
    step() {}
    keyDown(key) {}
    keyUp(key) {}
    onclick(pos){}
}


class Room extends GameObject {
    constructor(name="") {
        super();
        this.objects = [];
        this.name = name; // needs to be unique, otherwise the searching code will just use the first one it finds.
        this.background = "#000000";
    }

    init(){}

    destory(id=99999999) {
        this.objects.findIndex(x => x.id === id);
    }

    draw() {
        for (const item of this.objects) {
            item.draw();
        }
    }

    drawGUI() {}

    keyDown(key) {
        for (const item of this.objects) {
            item.keyDown(key);
        }
    }

    step() {
        for (let i = 0; i < this.objects.length; i++) {
            this.objects[i].step();
        }
    }


}



export { GameObject, Room };