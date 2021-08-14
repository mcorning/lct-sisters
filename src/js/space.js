import Place from '@/models/Place';

import { roundTime } from '@/utils/helpers';
import { DateTime, getNow } from '@/utils/luxonHelpers';
import crypto from 'crypto';
const randomId = () => crypto.randomBytes(8).toString('hex');
// import Place from '@/models/Place';
// TODO this is a good reason to refactor Place to include Visits
/**
 * Makers let us revisit a place.
 * Iterate visits entity
 * Find place using visit.place_id
 * Use filtered places to add Markers to map (map passed in to event handler)
 */

export const spaceMixin = {
  name: 'spaceMixin',
  methods: {
    onToWork() {},

    onVisitPlace() {
      // TODO this is a Maybe
      if (!this.state.currentPlace) {
        return;
      }
      const starttime = roundTime(Date.now());
      const endtime = starttime + this.avgStay;
      const visit = {
        id: randomId(),
        name: this.state.currentPlace,
        place_id: this.state.currentPlace_id,
        start: starttime,
        end: endtime,
        date: DateTime.fromMillis(starttime).toISODate(),
        category: 'You',

        timed: true,
        marked: getNow(),
        graphName: this.graphname,
        loggedNodeId: '', // this will contain the internal id of the relationship in redisGraph

        // TODO setup isDefaultGraph
        color: this.isDefaultGraph ? 'secondary' : 'sandboxmarked',
      };
      this.updateVisit(visit);
    },

    onMarkerClicked(marker) {
      // TODO this should be a safeFind()
      const x = Place.find(marker.place_id);
      this.updateState({ currentPlace: x.name, currentPlace_id: x.place_id });
    },

    onMarkerAdded(place) {
      //default place (coming from getMarkers()) is position.
      // convert other sources of place to position before sending it here
      place.lat = place.position.lat;
      place.lng = place.position.lng;
      Place.update(place);
    },

    onDeletePlace(placeId) {
      Place.delete(placeId);
    },

    onMakeAppointment() {
      alert('Under construction');
    },
  },
};
