<template>
  <!-- Event Menu -->
  <v-dialog
    v-model="dialog"
    :max-width="options.width"
    :style="{ zIndex: options.zIndex }"
    @keydown.enter="agree"
    @keydown.esc="cancel"
  >
    <v-card dark class="overflow-hidden">
      <v-row align="center" justify="space-around">
        <v-col class="text-center" cols="2">
          <span class="group pa-10 ">
            <v-icon color="yellow" x-large>{{ options.icon }}</v-icon>
          </span></v-col
        >
        <v-col cols="8 text-left pt-8">
          <h4 class="pt-2">{{ title }}</h4>
          <v-card-subtitle
            v-show="!!message"
            class="pa-4 "
            v-html="message"
          ></v-card-subtitle>
        </v-col>
      </v-row>

      <v-row id="apptRow" justify="space-around">
        <v-col v-if="isAppointment">
          <v-card-text>
            <v-text-field
              label="Customer"
              v-model="customer"
              dense
              placeholder="Customer name"
            ></v-text-field>
          </v-card-text>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-menu
            ref="menu"
            v-model="datemenu"
            :close-on-content-click="false"
            :nudge-right="40"
            transition="scale-transition"
            offset-y
            min-width="290px"
            :return-value.sync="date"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-text-field
                v-model="date"
                :label="dateLabel"
                prepend-icon="event"
                readonly
                v-bind="attrs"
                v-on="on"
              ></v-text-field>
            </template>
            <v-date-picker
              v-model="date"
              @input="setDateAndClose"
            ></v-date-picker>
          </v-menu>
        </v-col>
      </v-row>

      <v-row id="pickersRow" justify="space-around">
        <v-spacer></v-spacer>
        <v-col cols="4">
          <v-dialog
            ref="dialogStart"
            v-model="modalStart"
            :return-value.sync="starttime"
            persistent
            width="290px"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-text-field
                v-model="starttime"
                label="Start"
                prepend-icon="mdi-clock-time-four-outline"
                readonly
                hide-details
                v-bind="attrs"
                v-on="on"
              ></v-text-field>
            </template>
            <v-time-picker
              v-if="modalStart"
              v-model="starttime"
              full-width
              :allowed-minutes="allowedStep"
            >
              <v-spacer></v-spacer>
              <v-btn text color="primary" @click="modalStart = false">
                Cancel
              </v-btn>
              <v-btn
                text
                color="primary"
                @click="$refs.dialogStart.save(starttime)"
              >
                OK
              </v-btn>
            </v-time-picker>
          </v-dialog>
        </v-col>

        <v-spacer></v-spacer>
        <v-col cols="4">
          <v-dialog
            ref="dialogEnd"
            v-model="modalEnd"
            :return-value.sync="endtime"
            persistent
            width="290px"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-text-field
                v-model="endtime"
                label="End"
                prepend-icon="mdi-clock-time-four-outline"
                readonly
                hide-details
                v-bind="attrs"
                v-on="on"
              ></v-text-field>
            </template>
            <v-time-picker
              v-if="modalEnd"
              v-model="endtime"
              full-width
              :allowed-minutes="allowedStep"
            >
              <v-spacer></v-spacer>

              <v-btn text color="primary" @click="modalEnd = false">
                Cancel
              </v-btn>
              <v-btn
                text
                color="primary"
                @click="$refs.dialogEnd.save(endtime)"
              >
                OK
              </v-btn>
            </v-time-picker>
          </v-dialog>
        </v-col>

        <v-spacer></v-spacer>
      </v-row>

      <v-card-actions class="pt-3">
        <template v-for="(btn, index) in options.buttons">
          <v-btn
            v-if="btn.label"
            :key="index"
            tile
            :color="btn.color"
            class="body-2 "
            :outlined="btn.outlined"
            @click.native="answer(btn.act)"
          >
            {{ btn.label }}
          </v-btn>
          <v-spacer v-else :key="index"></v-spacer>
        </template>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <!-- End Event Menu -->
</template>

<script>
export default {
  props: {
    customEventOptions: {
      type: Object,
    },
  },

  computed: {
    isAppointment() {
      if (!this.options.parsedEvent) {
        return false;
      }
      const x = !!this.options.parsedEvent.input.provider;
      return x;
    },
    dateLabel() {
      const x = `${this.isAppointment ? 'Appointment' : 'Visit'} Date`;
      return x;
    },
  },

  data() {
    return {
      datemenu: false,
      date: false,
      customer: '',

      modalStart: false,
      modalEnd: false,

      ready: false,
      dialog: false,
      resolve: null,
      reject: null,
      message: null,
      title: null,
      starttime: null,
      endtime: null,

      options: {
        color: 'grey',
        width: 450,
        zIndex: 200,
        noconfirm: false,
      },
    };
  },
  methods: {
    setDateAndClose() {
      this.datemenu = false;
      console.info('New Visit Date', this.date);
      this.dialog = false;
      this.$emit('setDate', this.date);
    },

    answer(act) {
      console.log(act);
      this.dialog = false;
      this.resolve(act);
    },

    convertTimeStringToMs(timeString) {
      const d = new Date(this.date);
      d.setHours(timeString.slice(0, 2));
      d.setMinutes(timeString.slice(3, 5));
      console.log(d.toString());
      const time = d.getTime();
      return time;
    },

    setCustomOptions(options) {
      this.options = { ...this.options, ...options };
    },

    // options is an object with name-value pairs (as opposed to props)
    // NOTE: if the caller set a buttons array element to null
    // that element will not appear withe the remaining buttons
    open(title, message, options) {
      this.dialog = true;
      this.title = title;
      this.message = message;
      this.date = new Date(options.parsedEvent.input.date)
        .toISOString()
        .substr(0, 10);
      this.starttime = options.parsedEvent.start.time;
      this.endtime = options.parsedEvent.end.time;
      this.options = { ...this.options, ...options };
      console.groupCollapsed('All Options:>');
      console.log(JSON.stringify(this.options, null, 3));
      console.groupEnd();

      return new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    },
    cancel() {
      this.resolve(0);
      this.dialog = false;
    },
    agree() {
      this.resolve(1);
      this.dialog = false;
    },

    allowedStep: (m) => m % 15 === 0,
  },
  watch: {
    starttime(newVal, oldVal) {
      if (oldVal) {
        this.$emit('setTime', this.convertTimeStringToMs(newVal), true);
      }
    },

    endtime(newVal, oldVal) {
      if (oldVal) {
        this.$emit('setTime', this.convertTimeStringToMs(newVal), false);
      }
    },
  },

  mounted() {
    // TODO
    // this dialog is mounted before it's used, so customeEventOptions will be null
    // so do we need this merge?
    this.options = { ...this.options, ...this.customEventOptions };
    this.ready = true;
  },
};
</script>

<style>
.group {
  display: flex;
  flex: 1;
  justify-content: space-around;
}
</style>
