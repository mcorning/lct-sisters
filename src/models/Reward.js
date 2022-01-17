// Docs: https://vuex-orm.org/guide/model/defining-models.html

import { Model } from '@vuex-orm/core';
import { nullable } from 'pratica';

console.log('Loading Reward entity');

export default class Reward extends Model {
  static entity = 'rewards';
  static primaryKey = 'uid';

  static fields() {
    return {
      // Name of Sponsor
      biz: this.string(''),

      // socket.io userID for Sponsor
      uid: this.string(''),

      // last ssid stored in biz stream for this uid
      ssid: this.string(''),

      // increments for each visit to biz
      points: this.number(),
    };
  }

  static getPoints(uid) {
    return nullable(Reward.find(uid)).cata({
      Just: (reward) => reward.points,
      Nothing: () => null,
    });
  }

  static rewardMap() {
    const rewards = Reward.all();
    const x = [];
    return rewards.reduce((a, c) => {
      x.push({ uid: c.uid, ssid: c.ssid });
      a.set(c.biz, x);
      return a;
    }, new Map());
  }

  static update({ uid, biz, ssid }) {
    console.log('uid, biz, ssid :>> ', { uid, biz, ssid });
    const sponsor = Reward.find(uid);
    let points = 1;
    // have we seen sponsor yet? if so, incr points
    if (sponsor) {
      points = sponsor.points + 1;
    }
    console.log('\tPOINTS :>>', points);
    return this.$create({
      data: { uid, biz, ssid, points },
    });
  }

  static delete(uid) {
    return this.$delete(uid);
  }

  static deleteAll() {
    return this.$deleteAll();
  }
}
