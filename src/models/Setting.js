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
      userID: this.string(''),
      people: this.string(''),
      business: this.string(''),
      openAt: this.string('00:00'),
      closeAt: this.string('11:59'),

      usesPublicCalendar: this.boolean(false),

      avgStay: this.number(20),
      slotInterval: this.number(30),

      lastVaccinationDate: this.string(),
      lastFluShot: this.string(),
    };
  }

  static update(settings) {
    console.log(settings);
    return this.$create({ data: settings });
  }

  static delete() {
    return this.$delete(1);
  }

  static deleteAll() {
    return this.$deleteAll();
  }
}
