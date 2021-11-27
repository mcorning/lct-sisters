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
      usernumber: this.number(),
      userID: this.string(''),
      people: this.string(''),
      workplace: this.string(''),
      shift: this.number(),
      openAt: this.string('00:00'),
      closeAt: this.string('11:59'),

      usesPublicCalendar: this.boolean(false),

      avgStay: this.number(20),
      slotInterval: this.number(30),

      vaccinationStatus: this.number(0),
      recentFluShot: this.boolean(),
      warningsSent: this.number(0),
      warningsReceived: this.number(0),

      preferredGraph: this.string(this.$defaultGraphName),
      namespace: this.string(),
      location: this.string(),
      viewport: this.string(),
      global_code: this.string(),
      default_map_center: this.string(),
      zoom:this.string(),
      sid:this.string(), // Sponsor ID
      biz:this.string(), // Sponsor name
    };
  }

  static update(settings) {
    console.log(settings);
    return this.$create({ data: settings });
  }

  static incrementWarnings() {
    return this.$update({
      where: 1,
      data(setting) {
        setting.warningsReceived = (setting.warningsReceived || 0) + 1;
      },
    });
  }

  static delete() {
    return this.$delete(1);
  }

  static deleteAll() {
    return this.$deleteAll();
  }
}
