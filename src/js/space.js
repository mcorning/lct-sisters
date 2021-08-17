import Place from '@/models/Place';

import { roundTime, printJson } from '@/utils/helpers';
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

// function deserializeVisitAsMarker(visits) {
//   if (!visits) {
//     return;
//   }

//   this.place_map = this.state.place.getPlaceMap();
//   this.markersMap = new Map();
//   console.groupCollapsed(
//     warn(`deserializeVisitAsMarker(visits) making ${visits.length} markers:`)
//   );
//   if (visits) {
//     this.visitSet = new Set(visits);
//     visits.forEach((visit, index) => {
//       if (!visit.place_id) {
//         // these are appointments not visits
//         return;
//       }
//       const place = this.place_map.get(visit.place_id);
//       // if visit and place are not related, notify and skip further processing
//       if (!place) {
//         alert(
//           `Visit ${visit.id} does not have a Place corresponding to ${visit.place_id}`
//         );
//         return;
//       }

//       console.log('Using place:', printJson(place));
//       let m = {
//         title: visit.name,
//         label: { text: 'V' + index, color: 'white' },
//         name: visit.name,
//         place_id: visit.place_id,
//         position: { lat: place.lat, lng: place.lng },
//       };
//       this.markersMap.set(visit.name, m);
//       this.$emit('log', `added marker for ${visit.name}`);
//     });
//     console.groupEnd();
//   }
// }
export const spaceMixin = {
  name: 'spaceMixin',
  methods: {
    onToWork() {},

    onVisitPlace() {
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
      const x = Place.find(marker.place_id);
      this.updateState({ currentPlace: x.name, currentPlace_id: x.place_id });
    },

    onMarkerAdded(place) {
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
