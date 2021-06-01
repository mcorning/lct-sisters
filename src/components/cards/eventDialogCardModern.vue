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
      <v-row id="pickersRow" justify="space-around">
        <v-spacer></v-spacer>
        <v-col cols="4">
          <v-dialog
            ref="dialogStart"
            v-model="modalStart"
            :return-value.sync="options.starttime"
            persistent
            width="290px"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-text-field
                v-model="options.starttime"
                :disabled="!parsedEvent"
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
              v-model="options.starttime"
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
                @click="$refs.dialogStart.save(options.starttime)"
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
            :return-value.sync="options.endtime"
            persistent
            width="290px"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-text-field
                v-model="options.endtime"
                :disabled="!parsedEvent"
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
              v-model="options.endtime"
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
                @click="$refs.dialogEnd.save(options.endtime)"
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
    <!-- <v-card
      v-if="options.parsedEvent"
      color="grey lighten-4"
      max-width="400px"
      flat
    >
      <v-toolbar :color="getToolbarColor()" dark>
        <v-toolbar-title v-html="parsedEvent.input.name"></v-toolbar-title>
      </v-toolbar>
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
                v-model="startTime"
                :disabled="!parsedEvent"
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
              v-model="startTime"
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
                v-model="endTime"
                :disabled="!parsedEvent"
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
              v-model="endTime"
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

      <v-row dense id="modifyEventRow" justify="space-around">
        <v-col cols="9">
          <v-row align="center" justify="space-around">
            <v-col class="text-center">Modify Event</v-col>
          </v-row>
          <v-row id="moveVisitRow" dense>
            <v-col>Move</v-col>
            <v-col>
              <v-btn outlined icon @click="$emit('modifyEvent', 'move', 'up')">
                <v-icon>mdi-arrow-up</v-icon>
              </v-btn>
            </v-col>
            <v-col>
              <v-btn outlined icon @click="$emit('modifyEvent', 'move', 'dn')">
                <v-icon>mdi-arrow-down</v-icon>
              </v-btn>
            </v-col>
          </v-row>
          <v-row id="expandVisitRow" dense>
            <v-col>Collapse</v-col>
            <v-col>
              <v-btn
                outlined
                icon
                @click="$emit('modifyEvent', 'collapse', 'up')"
              >
                <v-icon>mdi-arrow-collapse-up</v-icon>
              </v-btn>
            </v-col>
            <v-col>
              <v-btn
                outlined
                icon
                @click="$emit('modifyEvent', 'collapse', 'both')"
              >
                <v-icon>mdi-arrow-collapse-vertical</v-icon>
              </v-btn>
            </v-col>
            <v-col>
              <v-btn
                outlined
                icon
                @click="$emit('modifyEvent', 'collapse', 'dn')"
              >
                <v-icon>mdi-arrow-collapse-down</v-icon>
              </v-btn>
            </v-col>
          </v-row>
          <v-row id="expandVisitRow" dense>
            <v-col>Expand</v-col>
            <v-col>
              <v-btn
                outlined
                icon
                @click="$emit('modifyEvent', 'expand', 'up')"
              >
                <v-icon>mdi-arrow-expand-up</v-icon>
              </v-btn>
            </v-col>
            <v-col>
              <v-btn
                outlined
                icon
                @click="$emit('modifyEvent', 'expand', 'both')"
              >
                <v-icon>mdi-arrow-expand-vertical</v-icon>
              </v-btn>
            </v-col>
            <v-col>
              <v-btn
                outlined
                icon
                @click="$emit('modifyEvent', 'expand', 'dn')"
              >
                <v-icon>mdi-arrow-expand-down</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <v-card-text v-html="getGraphNameFromVisit"> </v-card-text>
      <v-card-actions>
        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <div class="text-center">
              <v-btn
                v-bind="attrs"
                v-on="on"
                :disabled="!parsedEvent"
                @click="$emit('goRight')"
                ><v-icon>mdi-delete</v-icon></v-btn
              ><br />
              <small>Delete</small>
            </div>
          </template>
          <span>Delete Visit</span></v-tooltip
        >

        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <div class="text-center">
              <v-btn
                v-bind="attrs"
                v-on="on"
                :disabled="!parsedEvent"
                @click="$emit('revert')"
                ><v-icon>mdi-cancel</v-icon></v-btn
              ><br />
              <small>Cancel</small>
            </div>
          </template>
          <span>Abandon changes</span></v-tooltip
        >
        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <div class="text-center">
              <v-btn
                v-bind="attrs"
                v-on="on"
                :disabled="!parsedEvent"
                outlined
                color="secondary"
                @click="$emit('saveVisit')"
                ><v-icon>mdi-content-save</v-icon></v-btn
              ><br />
              <small>Save</small>
            </div>
          </template>
          <span>Save Visit locally</span></v-tooltip
        >
        <v-spacer></v-spacer>
        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <div class="text-center">
              <v-btn
                v-bind="attrs"
                v-on="on"
                :disabled="!userID"
                @click="$emit('goLeft')"
                ><v-icon>mdi-graphql</v-icon></v-btn
              ><br />
              <small>{{ userID ? 'Log' : 'Not online' }}</small>
            </div>
          </template>
          <span>Log Visit on Server</span></v-tooltip
        >
      </v-card-actions> 
    </v-card>-->
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
    parsedEvent() {
      // parsedEvent is readonly
      const x = this.options.parsedEvent;
      return x;
    },
  },

  data() {
    return {
      modalStart: false,
      modalEnd: false,

      ready: false,
      dialog: false,
      resolve: null,
      reject: null,
      message: null,
      title: null,

      options: {
        color: 'grey',
        width: 450,
        zIndex: 200,
        noconfirm: false,
      },
    };
  },
  methods: {
    answer(act) {
      console.log(act);
      this.dialog = false;
      let data = {};
      if (act === 'SAVE') {
        const starttime = new Date();
        starttime.setHours(this.options.starttime.slice(0, 2));
        starttime.setMinutes(this.options.starttime.slice(3, 5));

        const endtime = new Date();
        endtime.setHours(this.options.endtime.slice(0, 2));
        endtime.setMinutes(this.options.endtime.slice(3, 5));

        data.starttime = starttime.getTime();
        data.endtime = endtime.getTime();
      }
      console.log('New start/end:', data.starttime, data.endtime);
      this.resolve({
        action: act,
        data,
      });
    },

    // options is an object with name-value pairs (as opposed to props)
    // NOTE: if the caller set a buttons array element to null
    // that element will not appear withe the remaining buttons
    open(title, message, options) {
      this.dialog = true;
      this.title = title;
      this.message = message;
      this.options = { ...this.options, ...options };
      console.log('All Options', JSON.stringify(this.options, null, 3));

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

    // getToolbarColor() {
    //   const color = this.ready ? this.options.parsedEvent.color : 'primary';
    //   return color === 'primary' ? 'primary lighten-2' : 'secondary darken-2';
    // },

    // getGraphNameFromVisit() {
    //   if (this.ready) {
    //     const status = this.options.parsedEvent.input.loggedNodeId
    //       ? `is logged on the <strong>${this.options.parsedEvent.input.graphName}</strong> graph`
    //       : `is <strong>not logged</strong> to any graph yet. ${
    //           !this.options.visitorIsOnline
    //             ? '<br/>You are <strong>not</strong> online right now.'
    //             : '<br/>During or after your visit, log the visit to the graph'
    //         }`;
    //     return `<small>Place ID: <strong>${this.options.parsedEvent.input.place_id}</strong>
    //   <br/>
    //   Visit ID: <strong>${this.options.parsedEvent.input.id}</strong>
    //   <br/> ${status}</small>`;
    //   }
    // },
  },

  mounted() {
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
