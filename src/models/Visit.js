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
      category: this.string('You'), // used for COVID-safe appointments

      // From the graph component
      loggedNodeId: this.string(''), // ID of the graph node for this Visit
      graphName: this.string(''), // graphname may be 'Sand box' for users' playground
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
  static updateFieldPromise(id, val) {
    return new Promise((resolve, reject) => {
      this.$update({
        where: id,
        data: val,
      })
        .then((p) => {
          resolve(p[0]);
        })
        .catch((e) => reject(e));
    });
  }
  // val must be an object
  static async update(val) {
    // const { id, name, logged, start, end, interval, timed } = val;
    let p = await this.$create({
      data: val,
    });
    return p;
  }
  // Calendar addEvent() creates the visit (without reference to the exposure graph (see below))
  static updatePromise(val) {
    return new Promise((resolve, reject) => {
      console.log('update Visit with', JSON.stringify(val, null, 3));
      this.$create({
        data: val,
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

  static async delete(val) {
    let p = await this.$delete(val);
    return p;
  }

  static deletePromise(val) {
    return new Promise((resolve, reject) => {
      console.log(`Deleting Visit id ${val}`);
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
