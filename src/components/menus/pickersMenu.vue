<template>
  <div>
    <v-card>
      <v-hover v-slot="{ hover }">
        <v-toolbar :color="selectedEventParsed.input.color" dark dense>
          <v-toolbar-title v-html="selectedEventParsed.input.name" />
          <v-spacer />
          <v-expand-transition>
            <div
              v-if="hover"
              class="d-flex transition-fast-in-fast-out primary darken-2 v-card--reveal text-body2 white--text ma-3 pa-3"
            >
              Enlarge Event's QR code
            </div>
          </v-expand-transition>

          <v-btn text @click="$emit('enlargeQR')">
            <v-icon>qr_code_2</v-icon>
          </v-btn>
        </v-toolbar>
      </v-hover>
      <v-card-subtitle class="pb-1"
        >You can edit the Date and Time fields</v-card-subtitle
      >
      <!-- Pickers row -->
      <v-row justify="space-around" align="center" no-gutters>
        <v-col cols="4">
          <v-text-field
            v-model="pickedDate"
            label="Date"
            prepend-icon="event"
            readonly
            @click="pick(1, true, false)"
          ></v-text-field>
        </v-col>
        <v-col cols="3">
          <v-text-field
            v-model="pickedStartTime"
            label="Starting"
            prepend-icon="mdi-clock-time-on-outline"
            readonly
            @click="pick(2, true, false)"
          ></v-text-field>
        </v-col>
        <v-col cols="3">
          <v-text-field
            v-model="pickedEndTime"
            label="Ending"
            prepend-icon="mdi-clock-time-four-outline"
            readonly
            @click="pick(3, true, false)"
          ></v-text-field>
        </v-col>
        <v-date-picker v-if="picked == 1" v-model="pickedDate">
          <v-spacer></v-spacer>
          <v-btn text color="primary" @click="pick(0, false, false)">
            Cancel
          </v-btn>
          <v-btn text color="primary" @click="pick(0, false, true)">
            OK
          </v-btn></v-date-picker
        >
        <v-time-picker
          v-if="picked == 2"
          v-model="pickedStartTime"
          :max="pickedEndTime"
        >
          <v-spacer></v-spacer>
          <v-btn text color="primary" @click="pick(0, false, false)">
            Cancel
          </v-btn>
          <v-btn text color="primary" @click="pick(0, false, true)">
            OK
          </v-btn></v-time-picker
        >
        <v-time-picker
          v-if="picked == 3"
          v-model="pickedEndTime"
          :min="pickedStartTime"
        >
          <v-spacer></v-spacer>
          <v-btn text color="primary" @click="pick(0, false, false)">
            Cancel
          </v-btn>
          <v-btn text color="primary" @click="pick(0, false, true)">
            OK
          </v-btn></v-time-picker
        >
      </v-row>

      <v-divider />

      <v-card-actions v-if="!editing">
        <v-btn dark @click="noDateTime"> <v-icon>close</v-icon> </v-btn>
        <v-btn dark @click="deleteEvent"> <v-icon>delete</v-icon> </v-btn>
        <v-spacer />
        <v-btn v-show="dirty" color="primary" @click="newDateTime">
          <v-icon>save</v-icon>
        </v-btn>
        <v-spacer />
        <v-tooltip top>
          <template v-slot:activator="{ on, attrs }">
            <v-btn v-bind="attrs" v-on="on" color="primary" @click="share">
              <v-icon>share</v-icon>
            </v-btn>
          </template>
          <span>Email this event to others </span>
        </v-tooltip>
        <v-tooltip top>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              v-on="on"
              v-if="!selectedEventParsed.input.loggedVisitId"
              :disabled="!isConnected"
              color="primary"
              @click="logEvent"
            >
              <v-icon>cloud_done</v-icon>
            </v-btn>
          </template>
          <span>Finish the workflow </span>
        </v-tooltip>
      </v-card-actions></v-card
    >
  </div>
</template>

<script>
export default {
  name: 'pickersMenu',
  props: {
    selectedEventParsed: Object,
    mailToUri: String,
    isConnected: Boolean,
  },
  components: {},
  data() {
    return {
      banner: false,
      editing: false,
      dirty: false,
      picked: 0,
      pickDate: false,
      pickStartTime: false,
      pickedDate: null,
      pickedStartTime: null,
      pickedEndTime: null,
    };
  },
  methods: {
    getmailToUri() {
      console.log(this.mailToUri);
      return this.mailToUri;
    },
    deleteEvent() {
      this.dirty = false;
      this.$emit('deleteEvent');
      // this.$emit('noDateTime');
    },

    pick(index, editing, dirty) {
      this.editing = editing;
      this.picked = index;
      this.dirty = dirty;
    },

    newDateTime() {
      this.dirty = false;
      this.$emit('newDateTime', {
        pickedDate: this.pickedDate,
        pickedStartTime: this.pickedStartTime,
        pickedEndTime: this.pickedEndTime,
      });
    },
    noDateTime() {
      this.dirty = false;
      this.$emit('noDateTime');
    },
    share() {
      this.dirty = false;
      this.$emit('share');
    },
    logEvent() {
      // const start = new Date(
      //   this.pickedDate + ' ' + this.pickedStartTime
      // ).getTime();
      // const end = new Date(
      //   this.pickedDate + ' ' + this.pickedEndTime
      // ).getTime();
      this.dirty = false;
      this.$emit('logEvent', {
        pickedDate: this.pickedDate,
        pickedStartTime: this.pickedStartTime,
        pickedEndTime: this.pickedEndTime,
      });
    },
  },
  watch: {
    selectedEventParsed() {
      console.log('pickersMenu.selectedEventParsed:');
      console.log(JSON.stringify(this.selectedEventParsed.input, null, 3));
    },
  },
  mounted() {
    const vm = this;
    vm.pickedDate = vm.selectedEventParsed.start.date;

    vm.pickedStartTime = vm.selectedEventParsed.start.time;
    vm.pickedEndTime = vm.selectedEventParsed.end.time;
  },
};
</script>
