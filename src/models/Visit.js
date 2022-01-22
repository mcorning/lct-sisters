// Docs: https://vuex-orm.org/guide/model/defining-models.html

import { Model } from '@vuex-orm/core';

console.log('Loading Visit entity');

export default class Visit extends Model {
  static entity = 'visits';
  ageOfExpiredEvents = 14;
  static primaryKey = 'id';

  static fields() {
    return {
      id: this.attr(null), // Unique generated value

      // From Map component (for the graph component (calendar uses only name))
      name: this.string(''), // POI or "Gathering"
      place_id: this.string(''), // Unique ID of space or place

      // From Calendar component
      marked: this.string(''), // DateTime Visit made it to the calendar
      color: this.string('secondary'), // New event: Secondary. Logged event: Primary
      start: this.number(''), // Epoch milliseconds of Visit start
      end: this.number(''), // Epoch milliseconds of Visit end
      date: this.string(''), // Date string of start to event values
      interval: this.string(''), // String composed of start and end timestamps
      timed: this.boolean(true), // True means Visit isn't all day
      category: this.string(), // used for COVID-safe appointments

      // From the graph component
      // default loggedVisitId is -1 so we can check for unlogged visits without getting confused by IDs of 0 and 1
      loggedVisitId: this.number(-1), // internal RedisGraph node ID of the Visit edge
      graphName: this.string(''), // graphname may be set by sponsor

      shared: this.boolean(false), // set true when someone shares an event

      // for Redis Stream-based code, we need a cross-ref to the Stream ID of the warning
      wsid: this.string(''),
    };
  }

  // can't give this static method (called by indirection in Calendar)
  // the same name as the shipping static method, Visit.find()
  static get(id) {
    return this.find(id);
  }
  static getVisits(active, expiredTimestamp) {
    return this.query()
      .where((visit) =>
        active
          ? visit.start >= expiredTimestamp
          : visit.start < expiredTimestamp
      )
      .get();
  }
  static getMyVisits(active, expiredTimestamp) {
    return this.getVisits(active, expiredTimestamp)
      .where((visit) => visit.category === 'You')
      .get();
  }

  static update(visit) {
    return this.$create({
      data: visit,
    });
  }

  static delete(id) {
    return this.$delete(id);
  }

  static convertLoggedVisitId() {
    this.$update({
      where: (visit) => typeof visit.loggedVisitId === 'string',

      data(visit) {
        visit.loggedVisitId = Number(visit.loggedVisitId);
      },
    });
  }

  // App.js onLogVisit() used this function to update the visit with loggedVisitId and graphName
  static updateLoggedVisitId(data) {
    const { visitId, loggedVisitId, graphName, color } = data;

    console.log(`Updated Visit with`, JSON.stringify(data, null, 3));
    return this.$update({
      where: visitId,
      data: {
        loggedVisitId,
        graphName,
        color,
      },
    });
  }

  static deletePromise(data) {
    return new Promise((resolve, reject) => {
      const { id, category } = data.entity;
      // ensure the incoming data is for Visits (not Appointments)
      if (category !== 'You') {
        reject({
          violation: 'contract',
          message: 'Object was not a Visit or Shift',
        });
      }
      console.log(`Deleting Visit id ${id}`);
      this.$delete(id)
        .then((p) => {
          if (p) {
            resolve(p);
          } else {
            throw new Error('No VISIT to DELETE');
          }
        })
        .catch((e) => reject(e));
    });
  }

  static async deleteAll() {
    await this.$deleteAll();
  }

  static deleteAllPromise() {
    return new Promise((resolve, reject) => {
      this.$deleteAll()
        .then((p) => resolve(p))
        .catch((e) => reject(e));
    });
  }
}
