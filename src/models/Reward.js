// Docs: https://vuex-orm.org/guide/model/defining-models.html

import { Model } from '@vuex-orm/core';

console.log('Loading Reward entity');

export default class Reward extends Model {
  static entity = 'rewards';
  static primaryKey = 'rid';

  static fields() {
    return {
      // Name of Sponsor
      biz: this.string(''),

      // socket.io userID for Sponsor
      sid: this.string(''),

      // sid in reward stream
      rid: this.string(''),


    };
  }

  static getPoints(sid) {
    return Reward.query().where('sid', sid).length;
  }

  static update({ sid, biz, rid }) {
    console.log('rid, sid, biz :>> ', { rid, sid, biz });
    return this.$create({
      data: { rid, sid, biz },
    });
  }

  static delete(rid) {
    return this.$delete(rid);
  }

  static deleteAll() {
    return this.$deleteAll();
  }
}
