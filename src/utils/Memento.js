export default class Memento {
  constructor(visit) {
    this.visit = visit;
  }
}

Memento.prototype = {
  dehydrate: function(memento) {
    // this.visit = JSON.parse(memento);
    return JSON.parse(memento).visit;
  },

  hydrate: function() {
    return JSON.stringify(this);
  },
};
