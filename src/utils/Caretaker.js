export default class Caretaker {
  constructor() {
    this.mementos = {};
  }

  add = function(key, memento) {
    this.mementos[key] = memento;
  };
  get = function(key) {
    return this.mementos[key];
  };
}
