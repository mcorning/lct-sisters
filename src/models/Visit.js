// Docs: https://vuex-orm.org/guide/model/defining-models.html

import { Model } from '@vuex-orm/core';
import '@/fp/monads/EitherAsync';
import { allOrNone, firstOrNone } from '@/fp/utils';
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
        (visit) =>
          Number.isNaN(visit.end) ||
          Number.isNaN(visit.start) ||
          !visit.id ||
          visit.id.startsWith('$')
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
  // static updateFieldPromise(data) {
  //   return new Promise((resolve, reject) => {
  //     const { entity } = data;

  //     // ensure the incoming data is for Visits (not Appointments)
  //     if (entity.category !== 'You') {
  //       reject({
  //         violation: 'contract',
  //         message: 'Object was not a Visit or Shift',
  //       });
  //     }
  //     this.$update({
  //       where: entity.id,
  //       data: entity,
  //     })
  //       .then((p) => {
  //         resolve(p[0]);
  //       })
  //       .catch((e) => reject(e));
  //   });
  // }

  // Model add/updateVisit() creates the visit (without reference to the exposure graph (see below))
  // error handling for data handled by client
  // static updatePromise(data) {
  //   const { visit } = data;
  //   console.log(
  //     `Updated Visit for ${visit.name} with`,
  //     JSON.stringify(visit, null, 3)
  //   );
  //   return this.$create({
  //     data: visit,
  //   })
  //     .then((p) => p[0])
  //     .catch((e) => e);
  // }

  static update(visit) {
    return this.$create({
      data: visit,
    })
      .toEither()
      .map((visits) =>
        allOrNone(visits).match({
          Some: (value) => {
            console.log(JSON.stringify(value, null, 3));
            return value;
          },
          None: () => console.log(`there is no visit to update `),
        })
      )
      .cata({
        ok: (v) =>
          firstOrNone(v).match({
            Some: (v) => v,
            None: () => console.log(`NOOP`),
          }),
        error: (err) => {
          // let global error handler take over so we see the error in the snackbar.
          err.message = +'Visit.update() had issues';
          throw err;
        },
      });
  }

  // App.js onLogVisit() used this function to update the visit with loggedNodeId and graphName
  static updateById(data) {
    const { visitId, loggedNodeId, graphName } = data;
    console.log(`Updated Visit with`, JSON.stringify(data, null, 3));
    return this.$update({
      where: visitId,
      data: {
        loggedNodeId: loggedNodeId,
        graphName: graphName,
        color: 'primary',
      },
    })
      .toEither()
      .cata({
        ok: (v) => v,
        error: (err) => {
          // let global error handler take over so we see the error in the snackbar.
          err.message = +'Visit.updateById() had issues';
          throw err;
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
