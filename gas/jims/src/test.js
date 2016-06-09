class Animal {
    constructor(type) {
        this.type = type;
    }
    static isAnimal(obj, type) {
        if (!Animal.prototype.isPrototypeOf(obj)) {
            return false;
        }
        return type ? obj.type === type : true;
    }
}
class Dog extends Animal {
    constructor(name, breed) {
        super("dog");
        this.name = name;
        this.breed = breed;
    }
    bark() {
        console.log("ruff, ruff");
    }
    print() {
        console.log("The dog " + this.name + " is a " + this.breed);
    }
    static isDog(obj) {
        return Animal.isAnimal(obj, "dog");
    }
}