// Docs: https://vuex-orm.org/guide/model/defining-models.html

import { Model } from '@vuex-orm/core';
import { firstOrNone } from '@/fp/functors/utils';

console.log('Loading Setting entity');

export default class Setting extends Model {
  static entity = 'settings';

  static fields() {
    return {
      id: this.number(1),
      sessionID: this.string(''),
      username: this.string(''),
      userID: this.string(''),
      people: this.string(''),
      business: this.string(''),
      openAt: this.string('00:00'),
      closeAt: this.string('11:59'),

      usesPublicCalendar: this.boolean(false),

      avgStay: this.number(20),
      slotInterval: this.number(30),
    };
  }

  static getSettings() {
    let x = Setting.all()[0];
    console.log('settings:', JSON.stringify(x, null, 3));
    return x;
  }

  static updatePromise(settings) {
    return new Promise((resolve, reject) => {
      console.log(
        'Update Setting collection with',
        JSON.stringify(settings, null, 3)
      );
      this.$create(settings)
        .then((p) => resolve(p))
        .catch((e) => reject(e));
    });
  }

  static update(settings) {
    // settings like this puts too much knowledge about this api on the caller.
    // better if we wrap the settings data in a data object here.
    this.$create({ data: settings })

      .toEither()
      // .map((visit) =>
      //   console.log(
      //     `Updated Visit for ${firstOrNone(visit).name} with`,
      //     JSON.stringify(visit, null, 3)
      //   )
      // )
      .matchWith({
        // firstOrNone is a utility function for arrays to fetch the first element or a None.
        ok: (v) => console.log(firstOrNone(v)),
        error: (err) => {
          // let global error handler take over so we see the error in the snackbar.
          console.log('Leaving error', err, 'to global error handler');
        },
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
