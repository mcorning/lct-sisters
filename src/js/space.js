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

    onSharePlace(decoded) {
      const route = this.$route.query;
      const place_id = decoded || route.place_id;
      const start = Number(route.start);
      const end = route.shift
        ? DateTime.fromMillis(start)
            .plus({ hours: Number(route.shift) })
            .toMillis()
        : Number(route.end);
      // replace the "escaped" underscores with spaces
      const name = route.name.replace(/_/g, ' ');
      const shared = true;
      this.callVisitUpdate({ place_id, start, end, name, shared });
    },

    updateLatLng({ place_id, lat, lng }) {
      Place.updateLatLng({ place_id, lat, lng })
        .toEither()
        .cata({
          ok: (result) => result, // marker rendered (without a label) from inside EitherAsync
          error: (err) => {
            // let global error handler take over so we see the error in the snackbar.
            err.message = +'Place.updateLatLng() had issues';
            throw err;
          },
        });
    },

    callVisitUpdate({ place_id, start, end, name, shared, gatheringName }) {
      let visit = {
        id: randomId(),
        name: gatheringName || name,
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

    onVisitPlace(data) {
      const { placeId, gatheringName } = data;
      const currentPlace = Place.getPlace(placeId);
      const { name, place_id } = currentPlace;
      const start = roundTime(Date.now());
      const end = start + this.avgStay;
      this.callVisitUpdate({
        place_id,
        start,
        end,
        name: name || gatheringName,
        gatheringName,
      });
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
