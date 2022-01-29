// Docs: https://vuex-orm.org/guide/model/defining-models.html

import { Model } from '@vuex-orm/core';

console.log('Loading Reward entity');

export default class Reward extends Model {
  static entity = 'rewards';
  static primaryKey = 'rsid';

  static fields() {
    return {
      // Name of Sponsor
      biz: this.string(''),

      // socket.io userID for Sponsor
      sid: this.string(''),

      // sid in reward stream
      rsid: this.string(''),
    };
  }

  static getPoints(sid) {
    return Reward.query().where('sid', sid).length;
  }

  static update({ rsid, sid, biz }) {
    console.log('rsid, sid, biz :>> ', { rsid, sid, biz });
    return this.$create({
      data: { rsid, sid, biz },
    });
  }

  static delete(rsid) {
    return this.$delete(rsid);
  }

  static deleteAll() {
    return this.$deleteAll();
  }
}
