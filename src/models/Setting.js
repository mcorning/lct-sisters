// Docs: https://vuex-orm.org/guide/model/defining-models.html

import { Model } from '@vuex-orm/core';

console.log('Loading Setting entity');

export default class Setting extends Model {
  static entity = 'settings';

  static fields() {
    return {
      id: this.number(1),
      sessionID: this.string(''),
      username: this.string(''),
      people: this.string(''),
      business: this.string(''),
      openAt: this.string('00:00'),
      closeAt: this.string('11:59'),

      usesPublicCalendar: this.boolean(false),

      avgStay: this.number(20),
      slotInterval: this.number(30),
    };
  }

  static updatePromise(settings) {
    return new Promise((resolve, reject) => {
      console.log(
        'Update Setting collection with',
        JSON.stringify(settings, null, 3)
      );
      this.$create({
        data: settings,
      })
        .then((p) => resolve(p))
        .catch((e) => reject(e));
    });
  }

  static deletePromise() {
    return new Promise((resolve, reject) => {
      console.log(`Deleting Setting`);
      this.$delete(1)
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
