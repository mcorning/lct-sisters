// Docs: https://vuex-orm.org/guide/model/defining-models.html

import { Model } from '@vuex-orm/core';

console.log('Loading Appointment entity');

export default class Appointment extends Model {
  static entity = 'appointments';
  ageOfExpiredEvents = 14;

  static fields() {
    return {
      id: this.attr(null), // Unique generated value

      // From Map component (for the graph component (calendar uses only name))
      business: this.string(''), // same value as Room in server
      name: this.string('customer'), // name of customer"
      provider: this.string(''), // name of service provider"

      // From Calendar component
      date: this.string(''), // Date string of start to event values
      start: this.number(''), // Epoch milliseconds of Appointment start
      end: this.number(''), // Epoch milliseconds of Appointment end
      timed: this.boolean(true), // True means Appointment isn't all day
      category: this.string('Them'), // used for COVID-safe appointments

      color: this.string('appointment'), // special kind of event
    };
  }

  static getAppointments(active, expiredTimestamp) {
    return this.query()
      .where((appointment) =>
        active
          ? appointment.start >= expiredTimestamp
          : appointment.start < expiredTimestamp
      )
      .get();
  }
  static getMyAppointments(active, expiredTimestamp) {
    return this.getAppointments(active, expiredTimestamp)
      .where((appointment) => appointment.category === 'You')
      .get();
  }

  // val must be an object
  static async update(val) {
    // const {business, customer, provider, date, start, end, } = val;
    let a = await this.$create({
      data: val,
    });
    return a;
  }
  // Calendar addEvent() creates the appointment (without reference to the exposure graph (see below))
  static updatePromise(val) {
    return new Promise((resolve, reject) => {
      if (val.category !== 'Them') {
        throw {
          violation: 'contract',
          message: 'Object was not an Appointment',
        };
      }
      console.log(
        'Promise to update Appointment with',
        JSON.stringify(val, null, 3)
      );
      this.$create({
        data: val,
      })
        .then((a) => resolve(a))
        .catch((e) => reject(e));
    });
  }

  static async delete(val) {
    let a = await this.$delete(val);
    return a;
  }

  static deletePromise(val) {
    return new Promise((resolve, reject) => {
      console.log(`Deleting Appointment id ${val}`);
      this.$delete(val)
        .then((a) => {
          if (a) {
            resolve(a);
          } else {
            throw 'Nothing to delete';
          }
        })
        .catch((e) => reject(e));
    });
  }

  static async deleteAll() {
    let a = await this.$deleteAll();
    return a;
  }

  static deleteAllPromise() {
    return new Promise((resolve, reject) => {
      this.$deleteAll()
        .then((a) => resolve(a))
        .catch((e) => reject(e));
    });
  }
}
