import Place from '@/models/Place';
import '@/fp/monads/EitherAsync';
import { allOrNone } from '@/fp/utils';

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

    onVisitPlace(placeId) {
      const currentPlace = Place.getPlace(placeId);
      const starttime = roundTime(Date.now());
      const endtime = starttime + this.avgStay;
      const visit = {
        id: randomId(),
        name: currentPlace.name,
        // TODO is this the only way to get the place_id? if so, we need the markerClicked event handlers after all
        place_id: currentPlace.place_id,
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
      // see time.js
      this.updateVisit(visit);
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
          ok: console.log, // marker rendered (without a label) from inside EitherAsync
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
