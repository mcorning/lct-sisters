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
      global_code: this.string(''), // Global address string
      lat: this.number(), // Latitude of visited space/place
      lng: this.number(), // Longitude of visited space/place
      url: this.string(), // google link to location
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

  static update(place) {
    return this.$create({
      data: place,
    });
  }
  static updateLatLng({ place_id, lat, lng }) {
    return this.$update({
      where: place_id,
      data: {
        lat,
        lng,
      },
    });
  }

  static delete(val) {
    return this.$delete(val);
  }

  static deleteAll() {
    return this.$deleteAll();
  }
}
