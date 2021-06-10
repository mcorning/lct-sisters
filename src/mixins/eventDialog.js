export default {
  data: () => ({
    customEventOptions: {
      buttons: [
        { label: 'Delete', act: 'DELETE' },
        { label: 'Cancel', act: 'CANCEL' },
        { spacer: true },
        {
          label: 'Save',
          color: 'secondary',
          outlined: true,
          act: 'SAVE',
        },
        { spacer: true },
        { label: 'Book', act: 'BOOK', tip: 'Make an appointment' },
        { spacer: true },
        { label: 'Log', act: 'LOG' },
      ],
    },
  }),

  methods: {
    showEventDialog() {
      const question = `Edit ${this.atWorkAt ? 'Shift at' : 'Visit to'} ${
        this.currentName
      }?`;
      const consequences = `${this.currentName} ${this.getGraphStatus()}`; //`You are editing place ID: ${this.parsedEvent.input.place_id}`;
      const icon = this.atWorkAt ? 'mdi-facebook-workplace' : 'mdi-calendar';

      const options = {
        icon: icon,
        parsedEvent: {}, // not sure we need this anymore
        starttime: this.starttime,
        endtime: this.endtime,
        visitorIsOnline: this.visitorIsOnline, // redundant if userID passed as well
        userID: this.userID,
        isAppointment: false,
      };
      this.EventModernDialog.setCustomOptions(this.customEventOptions);
      this.EventModernDialog.open(question, consequences, options).then(
        (action) => {
          switch (action) {
            case 'DELETE':
              this.deleteEvent(this.parsedEvent.input.id);
              break;
            case 'CANCEL':
              this.revert();
              break;
            case 'SAVE':
              this.saveVisit(this.parsedEvent.input);
              break;
            case 'BOOK':
              this.manageAppointments();
              break;

            case 'LOG':
              this.logVisit(this.parsedEvent.input);
              break;

            default:
              this.throwError(
                'Calendar.showEventDialog()',
                `Cannot handle ${action} action`,
                'This error does not effect you. Sorry for the interruption'
              );
          }

          this.reset();
        }
      );
    },
  },

  created() {
    console.log('Event Dialog created');
  },
};
