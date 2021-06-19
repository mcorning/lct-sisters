// Docs: https://vuex-orm.org/guide/model/defining-models.html

import { Model } from '@vuex-orm/core';

console.log('Loading State entity');

export default class State extends Model {
  static entity = 'states';
  static fields() {
    return {
      username: this.string('enter your name'),
      people: this.string('list your people'),
      business: this.string('enter your business'),
      openAt: this.string('00:00'),
      closeAt: this.string('11:59'),

      usesPublicCalendar: this.boolean(false),

      avgStay: this.number(20),
      slotInterval: this.number(30),
    };
  }

  static getState() {
    return this;
  }
  static getUsername() {
    return this.username;
  }
  static getPeople() {
    return this.people;
  }
  static getBusiness() {
    return this.business;
  }
  static getOpenAt() {
    return this.openAt;
  }
  static getCloseAt() {
    return this.closeAt;
  }
  static getUsesPublicCalendar() {
    return this.usesPublicCalendar;
  }

  //  static updateFieldPromise(val) {
  //    return new Promise((resolve, reject) => {
  //      this.$update({
  //        data: val,
  //      })
  //        .then((p) => {
  //          // since we pass in an ID, we can only have a single possible resulting element
  //          resolve(p[0]);
  //        })
  //        .catch((e) => reject(e));
  //    });
  //  }

  static updatePromise(state) {
    return new Promise((resolve, reject) => {
      console.log(
        'Update State collection with',
        JSON.stringify(state, null, 3)
      );
      this.$create({
        data: state,
      })
        .then((p) => resolve(p))
        .catch((e) => reject(e));
    });
  }

  static async delete(val) {
    let p = await this.$delete(val);
    return p;
  }

  static deletePromise(val) {
    return new Promise((resolve, reject) => {
      console.log(`Deleting State ID = ${val}`);
      this.$delete(val)
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
