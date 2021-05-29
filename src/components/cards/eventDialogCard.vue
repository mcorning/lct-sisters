<template>
  <!-- Event Menu -->
  <v-dialog max-width="400">
    <v-card v-if="parsedEvent" color="grey lighten-4" max-width="400px" flat>
      <v-toolbar :color="getToolbarColor()" dark>
        <v-toolbar-title v-html="parsedEvent.input.name"></v-toolbar-title>
      </v-toolbar>
      <v-row id="pickersRow" justify="space-around">
        <v-spacer></v-spacer>
        <!-- StartTime picker -->
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
        <!-- EndTime Picker -->
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
        <!-- Delete Visit -->
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

        <!-- Abandon changes with revert() -->
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
        <!-- Save Visit -->
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
        <!-- Log Visit -->
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
    </v-card>
  </v-dialog>
  <!-- End Event Menu -->
</template>

<script>
export default {
  props: {
    parsedEvent: Object,
    starttime: String,
    endtime: String,
    visitorIsOnline: Boolean,
    userID: String,
  },
  data() {
    return {
      modalStart: false,
      modalEnd: false,
      startTime: '',
      endTime: '',
    };
  },
  methods: {
    allowedStep: (m) => m % 15 === 0,

    getToolbarColor() {
      return this.parsedEvent.color === 'primary'
        ? 'primary lighten-2'
        : 'secondary darken-2';
    },

    getGraphNameFromVisit() {
      const status = this.parsedEvent.input.loggedNodeId
        ? `is logged on the <strong>${this.parsedEvent.input.graphName}</strong> graph`
        : `is <strong>not logged</strong> to any graph yet. ${
            !this.visitorIsOnline
              ? '<br/>You are <strong>not</strong> online right now.'
              : '<br/>During or after your visit, log the visit to the graph'
          }`;
      return `<small>Place ID: <strong>${this.parsedEvent.input.place_id}</strong>
      <br/>
      Visit ID: <strong>${this.parsedEvent.input.id}</strong>
      <br/> ${status}</small>`;
    },
  },
};
</script>

<style lang="scss" scoped></style>
