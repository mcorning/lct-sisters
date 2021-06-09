// Docs: https://vuex-orm.org/guide/model/defining-models.html

import { DateTime } from '../utils/luxonHelpers';

export default class Event {
  constructor(params = {}) {
    this.event = { ...params };
  }

  getInterval() {
    return `${DateTime.fromMillis(this.event.start).toFormat(
      'T'
    )}-${DateTime.fromMillis(this.event.end).toFormat('T')}`;
  }
  isAppointment() {
    console.log(this.event.category);
    return this.event.category === 'Them';
  }

  getStartTimeString() {
    return DateTime.fromMillis(this.event.start).toFormat('T');
  }
  getEndTimeString() {
    return DateTime.fromMillis(this.event.end).toFormat('T');
  }

  setStart(ms) {
    this.event.start = ms;
  }

  setEnd(ms) {
    this.event.end = ms;
  }
}
