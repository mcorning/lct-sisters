import Place from '@/models/Place';
import 'either-async';

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
    onToWork(placeId) {
      alert('onToWork is under construction for ' + placeId);
    },
    onMakeAppointment(placeId) {
      alert('onMakeAppointment is under construction for ' + placeId);
    },
    onShareGathering(placeId) {
      alert('onShareGathering is under construction for ' + placeId);
    },

    // TODO NOTE: be sure any method in this mixin is included in the render() function in Model.
    // and that the method is included in the scoped-slot and props of dependent components; e.g., GoogleMaps
    onSharePlace() {
      const place_id = this.$route.query.place_id;
      const start = Number(this.$route.query.start);
      const end = Number(this.$route.query.end);
      // replace the "escaped" underscores with spaces and distinguish this event as a Gathering
      const name = `Gathering at: ${this.$route.query.name.replace(/_/g, ' ')}`;
      const shared = true;
      this.callVisitUpdate({ place_id, start, end, name, shared });
    },

    callVisitUpdate({ place_id, start, end, name, shared }) {
      let visit = {
        id: randomId(),
        name,
        place_id,

        date: DateTime.fromMillis(start).toISODate(),
        start,
        end,
        shared,

        category: 'You',
        timed: true,
        marked: getNow(),
        graphName: '', // set at Log time
        loggedVisitId: '', // this will contain the internal id of the relationship in redisGraph
        color: this.isDefaultGraph ? 'secondary' : 'sandboxmarked',
      };

      // see time.js
      this.updateVisit(visit);
    },

    onVisitPlace(placeId) {
      const currentPlace = Place.getPlace(placeId);
      const { name, place_id } = currentPlace;
      const start = roundTime(Date.now());
      const end = start + this.avgStay;
      this.callVisitUpdate({ place_id, start, end, name });
    },

    onMarkerAdded(markedPlace) {
      // switch from position to Place's lat and lng
      const {
        position: { lat },
        position: { lng },
      } = markedPlace;
      const place = { ...markedPlace, lat, lng };
      Place.update(place)
        .toEither()
        .cata({
          ok: (markedPlace) => markedPlace, // marker rendered (without a label) from inside EitherAsync
          error: (err) => {
            // let global error handler take over so we see the error in the snackbar.
            err.message = +'Place.update() had issues';
            throw err;
          },
        });
    },

    onDeletePlace(placeId) {
      Place.delete(placeId)
        .toEither()
        .cata({
          ok: console.log,
          error: (err) => {
            // let global error handler take over so we see the error in the snackbar.
            err.message = +'Place.update() had issues';
            throw err;
          },
        });
    },
  },
};
