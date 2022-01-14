// Docs: https://vuex-orm.org/guide/model/defining-models.html

import { Model } from '@vuex-orm/core';
import { nullable } from 'pratica';

console.log('Loading Reward entity');

export default class Reward extends Model {
  static entity = 'rewards';
  static primaryKey = 'bid';

  static fields() {
    return {
      // Name of Sponsor
      biz: this.string(''),

      // socket.io userID for Sponsor
      bid: this.string(''),

      // last sid stored in biz stream for this bid
      sid: this.string(''),

      // increments for each visit to biz
      points: this.number(),
    };
  }

  static getPoints(bid) {
    return nullable(Reward.find(bid)).cata({
      Just: (reward) => reward.points,
      Nothing: () => null,
    });
  }

  static rewardMap() {
    const rewards = Reward.all();
    const x = [];
    return rewards.reduce((a, c) => {
      x.push({ bid: c.bid, sid: c.sid });
      a.set(c.biz, x);
      return a;
    }, new Map());
  }

  static update({ bid, biz, sid }) {
    console.log('bid, biz, sid :>> ', { bid, biz, sid });
    const sponsor = Reward.find(bid);
    let points = 1;
    // have we seen sponsor yet? if so, incr points
    if (sponsor) {
      points = sponsor.points + 1;
    }
    console.log('\tPOINTS :>>', points);
    return this.$create({
      data: { bid, biz, sid, points },
    });
  }

  static delete(bid) {
    return this.$delete(bid);
  }

  static deleteAll() {
    return this.$deleteAll();
  }
}
