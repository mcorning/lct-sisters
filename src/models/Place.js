// Docs: https://vuex-orm.org/guide/model/defining-models.html

import { Model } from '@vuex-orm/core';

console.log('Loading Place entity');

export default class Place extends Model {
  static entity = 'places';
  static primaryKey = 'place_id';

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

  static getPlace(id) {
    return Place.find(id);
  }

  static getPlaceMap() {
    return Place.all().reduce((a, c) => {
      a.set(c.place_id, c);
      return a;
    }, new Map());
  }

  // TODO deprecate? we already have necessary data in GoogleMap after updating cache.
  static getPosition(id) {
    if (!id) {
      throw { code: -1, message: 'Missing a place_id' };
    }
    const p = Place.find(id);
    if (!p) {
      throw {
        code: 0,
        message: `place_id ${id} not found in Place collection`,
      };
    }

    const plus_code =
      p.plus_code?.global_code || p.plus_code || 'not available';
    const lat = p.lat || p.geometry.location.lat() || p.latLng.lat() || 0;
    const lng = p.lng || p.geometry.location.lng() || p.latLng.lat() || 0;

    return { lat, lng, plus_code };
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
