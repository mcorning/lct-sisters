// Docs: https://vuex-orm.org/guide/model/defining-models.html

import { Model } from '@vuex-orm/core';

console.log('Loading Place entity');

export default class Place extends Model {
  static entity = 'places';
  static primaryKey = 'placeId';

  static fields() {
    return {
      // From Map component (for the graph component (calendar uses only name))
      // we are using googlemaps property names to eliminate naming errors
      name: this.string(''), // POI or "Gathering"
      formatted_address: this.string(''), // Street address (if available)
      place_id: this.string(''), // Unique ID of space or place
      plus_code: this.string(''), // Global address string
      lat: this.number(), // Latitude of visited space/place
      lng: this.number(), // Longitude of visited space/place
    };
  }

  // val must be an object
  static async update(val) {
    let p = await this.$create({
      data: val,
    });
    return p;
  }

  static updatePromise(place) {
    return new Promise((resolve, reject) => {
      const data = {
        ...place,
        plus_code: place.plus_code.global_code,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      console.log(
        'Update Place collection with',
        JSON.stringify(place, null, 3)
      );
      this.$create({
        data: data,
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
      console.log(`Deleting Place ID = ${val}`);
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
