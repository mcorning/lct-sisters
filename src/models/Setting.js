// Docs: https://vuex-orm.org/guide/model/defining-models.html

import { Model } from '@vuex-orm/core';
import '@/fp/monads/EitherAsync';
import { firstOrNone } from '@/fp/utils';

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
    return Setting.all()[0];
  }

  static updatePromise(settings) {
    console.log(
      'Update Setting collection with',
      JSON.stringify(settings, null, 3)
    );
    this.$create({ data: settings });
  }

  static update(settings) {
    this.$create({ data: settings })
      .then((v) => v)
      .toEither()
      .cata({
        ok: (v) =>
          firstOrNone(v).match({
            Some: (value) => {
              return value;
            },
            None: () => console.log(`There is no Settings to update `),
          }),
        error: (err) => {
          // let global error handler take over so we see the error in the snackbar.
          err.message = +'Setting.update() had issues';
          throw err;
        },
      });
  }

  static deletePromise() {
    console.log(`Deleting Settings`);
    this.$delete(1);
  }

  static async deleteAll() {
    let p = await this.$deleteAll();
    return p;
  }

  static deleteAllPromise() {
    this.$deleteAll();
  }
}
