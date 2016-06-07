"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Animal = function () {
    function Animal(type) {
        _classCallCheck(this, Animal);

        this.type = type;
    }

    _createClass(Animal, null, [{
        key: "isAnimal",
        value: function isAnimal(obj, type) {
            if (!Animal.prototype.isPrototypeOf(obj)) {
                return false;
            }
            return type ? obj.type === type : true;
        }
    }]);

    return Animal;
}();

var Dog = function (_Animal) {
    _inherits(Dog, _Animal);

    function Dog(name, breed) {
        _classCallCheck(this, Dog);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Dog).call(this, "dog"));

        _this.name = name;
        _this.breed = breed;
        return _this;
    }

    _createClass(Dog, [{
        key: "bark",
        value: function bark() {
            console.log("ruff, ruff");
        }
    }, {
        key: "print",
        value: function print() {
            console.log("The dog " + this.name + " is a " + this.breed);
        }
    }], [{
        key: "isDog",
        value: function isDog(obj) {
            return Animal.isAnimal(obj, "dog");
        }
    }]);

    return Dog;
}(Animal);