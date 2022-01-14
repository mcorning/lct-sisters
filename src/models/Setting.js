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
      zoom: this.string(),
      sid: this.string(), // Sponsor ID
      // place_id if oid has value.
      // updated by clicking the changeMapCenter() button on the biz infowindow.
      // right now, only one oid per place_id.
      // if same person has two restaurants, there needs to be a computer in both stores,
      // and they need to use the store's computer to generate the store's qr
      // (so the oid will be different)
      biz: this.string(),
      // Business address.
      // Stored when first approved.
      // Used as default value for subsequent QR print jobs
      address: this.string(),
      country: this.string(),
      // userID of the owner of biz.
      // updated by clicking the changeMapCenter() button on the biz infowindow.
      // oid gets added to QR URL.
      // system thanks oid when a customer scans the biz qr
      oid: this.string(),
      // the place_id of an address meaning it does not have to be validated later
      confirmedAddress: this.string(),
      userAgent:this.string(),
    };
  }

  static update(settings) {
    console.log(`Setting.update(${JSON.stringify(settings, null, 2)})`);
    this.$create({ data: settings });
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
