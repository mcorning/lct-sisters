import Place from '@/models/Place';
import 'either-async';

import {
  DateTime,
  getNow,
  t,
  parseDate,
  roundTime,
  safeDateTime,
} from '@/utils/luxonHelpers';
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

    /**
     * @param {*} date can be null or ISODate
     * @param {*} time can be ms or time literal
     * @param {*} incr can be null or number of minutes
     * @returns         rounded milliseconds
     */
    getTimeFromQuery(date, time, incr) {
      console.log(`getTimeFromQuery( ${date},${time}, ${incr})`);
      const dateTimeAsDateTime = parseDate(date ? Number(time) : time).cata({
        // if time is ms, Just has value
        Just: (dateJS) => DateTime.fromJSDate(dateJS),
        // otherwise, work harder to produce a DateTime
        Nothing: () => {
          return safeDateTime(date, time, incr);
        },
      });

      // now round the time and return millis to caller
      return roundTime(dateTimeAsDateTime.toMillis());
    },

    /*
     * query comes from three places:
     *    1) Share an event (ISOdate and ms have value (only use ms))
     *    2) visitor logs with QR (no date, no time, default to now)
     *    3) Employee logs in to work (no date, ISOTime)
     *
     * always pass a date to getTimeFromQuery()
     */
    onSharePlace(decoded) {
      // apparently destructuring doesn't work with Firefox
      // const { query } = this.$route.query;
      const place_id = decoded || this.$route.query.place_id;
      const date = this.$route.query.date ?? t().toISODate();
      const start = this.getTimeFromQuery(date, this.$route.query.time);
      const end = this.getTimeFromQuery(
        date,
        this.$route.query.end,
        this.$route.query.avgStay
      );

      // replace the "escaped" underscores with spaces
      const name = this.$route.query.name.replace(/_/g, ' ');
      const shared = true;

      this.callVisitUpdate({
        place_id,
        start,
        end,
        name,
        shared,
      });
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

    callUpdateVisit(visit) {
      // see time.js
      this.updateVisit(visit).then((results) => {
        // pass results from space to time in params for Time.vue
        if (this.$router.currentRoute.name !== 'Time') {
          this.$router.push({
            name: 'Time',
            params: results,
          });
        }
      });
    },

    // works when connected and when not connected
    callVisitUpdate({ place_id, start, end, name, shared, gatheringName }) {
      let visit = {
        id: randomId(),
        name: gatheringName || name,
        place_id,

        date: DateTime.fromMillis(start).toISODate(),
        start,
        end,
        shared,

        timed: true,
        marked: getNow(),
        graphName: this.namespace,
      };
      if (this.$socket.connected) {
        // onLogVisit() is in graph.js
        this.onLogVisit(visit)
          .then((graphData) => {
            // add graphData to visit
            const loggedVisit = {
              ...visit,
              ...graphData,
            };
            this.callUpdateVisit(loggedVisit);
          })
          .catch((e) => {
            // the global error handler UI take over
            this.$emit('error', e.error);
          });
      } else {
        this.callUpdateVisit(visit);
      }
    },

    onVisitPlace(data) {
      const { placeId, gatheringName } = data;
      const currentPlace = Place.getPlace(placeId);
      const { name, place_id } = currentPlace;
      const start = roundTime(Date.now());
      const end = start + this.avgStay; // avgStay is ms (in Model.vue)
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
