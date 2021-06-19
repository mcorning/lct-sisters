// Docs: https://vuex-orm.org/guide/model/defining-models.html

import { Model } from '@vuex-orm/core';

console.log('Loading State entity');

export default class State extends Model {
  static entity = 'states';

  static fields() {
    return {
      id: this.string(''),
      sessionID: this.string(''),
      username: this.string('enter your name'),
      people: this.string('list your people'),
      business: this.string('enter your business'),
      openAt: this.string('00:00'),
      closeAt: this.string('11:59'),

      usesPublicCalendar: this.boolean(false),

      avgStay: this.number(20),
      slotInterval: this.number(30),
    };
  }

  static updatePromise(state) {
    return new Promise((resolve, reject) => {
      console.log(
        'Update State collection with',
        JSON.stringify(state, null, 3)
      );
      this.$update({
        where: this.id,
        data: state,
      })
        .then((p) => resolve(p))
        .catch((e) => reject(e));
    });
  }

  static deletePromise() {
    return new Promise((resolve, reject) => {
      console.log(`Deleting State ID = ${this.id}`);
      this.$delete(this.id)
        .then((p) => {
          if (p) {
            resolve(p);
          } else {
            throw 'Nothing to delete';
          }
        })
        .catch((e) => reject(e));
    });
  }

  static async deleteAll() {
    let p = await this.$deleteAll();
    return p;
  }

  static deleteAllPromise() {
    return new Promise((resolve, reject) => {
      this.$deleteAll()
        .then((p) => resolve(p))
        .catch((e) => reject(e));
    });
  }
}
