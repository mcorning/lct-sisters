// Docs: https://vuex-orm.org/guide/model/defining-models.html

import { Model } from '@vuex-orm/core';

console.log('Loading Visit entity');

export default class Visit extends Model {
  static entity = 'visits';
  ageOfExpiredEvents = 14;

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
      loggedNodeId: this.string(''), // ID of the graph node for this Visit
      graphName: this.string(''), // graphname may be 'Sand box' for users' playground
    };
  }

  static validateVisits() {
    return new Promise((resolve, reject) => {
      this.$delete(
        (visit) => Number.isNaN(visit.end) || Number.isNaN(visit.start)
      )
        .then((p) => resolve(p))
        .catch((e) => reject(e));
    });
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
  static updateFieldPromise(data) {
    return new Promise((resolve, reject) => {
      const { entity } = data;

      // ensure the incoming data is for Visits (not Appointments)
      if (entity.category !== 'You') {
        reject({
          violation: 'contract',
          message: 'Object was not a Visit or Shift',
        });
      }
      this.$update({
        where: entity.id,
        data: entity,
      })
        .then((p) => {
          resolve(p[0]);
        })
        .catch((e) => reject(e));
    });
  }

  // Calendar addEvent() creates the visit (without reference to the exposure graph (see below))
  static updatePromise(data) {
    return new Promise((resolve, reject) => {
      const { entity } = data;
      // ensure the incoming data is for Visits (not Appointments)
      if (entity.category !== 'You') {
        reject({
          violation: 'contract',
          message: 'Object was not a Visit or Shift',
        });
      }
      console.log('update Visit with', JSON.stringify(entity, null, 3));
      this.$create({
        data: entity,
      })
        .then((p) => resolve(p))
        .catch((e) => reject(e));
    });
  }

  // App.js onLogVisit() used this function to update the visit with loggedNodeId and graphName
  static updateLoggedPromise(data) {
    const { visitId, loggedNodeId, useGraphName } = data;
    return new Promise((resolve, reject) => {
      console.log(`Update Visit with`, JSON.stringify(data, null, 3));
      this.$update({
        where: visitId,
        data: {
          loggedNodeId: loggedNodeId,
          graphName: useGraphName,
          color: 'primary',
        },
      })
        .then((p) => resolve(p))
        .catch((e) => reject(e));
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
            throw 'No VISIT to DELETE';
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
