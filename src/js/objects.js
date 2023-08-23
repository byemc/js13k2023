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

    remove(id = 99999999) {
        let foundIndex = this.objects.findIndex(x => x.id === id);
        console.debug(`Searched for ${id}, found at index ${foundIndex}`);

        if (foundIndex !== -1) this.objects.splice(foundIndex, 1);

        console.debug(this.objects);
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