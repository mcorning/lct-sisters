<template>
  <v-menu
    bottom
    left
    :close-on-content-click="false"
    :offset-x="isOffsetX"
    :offset-y="isOffsetY"
    :open-on-hover="isOpenOnHover"
    :transition="transition"
    :value="openMenu"
  >
    <template v-slot:activator="{ on }">
      <v-btn v-if="icon" :color="color" v-on="on">
        <v-icon>{{ icon }}</v-icon>
      </v-btn>
      <v-list-item
        v-else-if="isSubMenu"
        class="d-flex justify-space-between"
        v-on="on"
      >
        <v-icon>mdi-chevron-left</v-icon>

        {{ name }}
        <div class="flex-grow-1"></div>
      </v-list-item>
      <!-- <v-btn v-else :color="color" v-on="on" @click="openMenu = true" text>{{
        name
      }}</v-btn> -->
      <v-btn v-else dark icon v-on="on" @click="openMenu = true">
        <v-icon>mdi-dots-vertical</v-icon>
      </v-btn>
    </template>
    <v-list>
      <template v-for="(item, index) in menuItems">
        <v-divider v-if="item.isDivider" :key="index" />
        <nestedMenuCard
          v-else-if="item.menu"
          :key="index"
          :name="item.name"
          :menu-items="item.menu"
          @nestedMenu-click="emitClickEvent"
          :is-open-on-hover="false"
          :is-offset-x="true"
          :is-offset-y="false"
          :is-sub-menu="true"
        />
        <v-list-item v-else :key="index" ripple @click="emitClickEvent(item)">
          <v-list-item-avatar>
            <v-avatar :color="getColorOfCurrentGraph(item)" size="36">
              <v-icon dark>{{ item.icon }}</v-icon>
            </v-avatar>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title v-html="item.name"> </v-list-item-title>
            <v-list-item-subtitle v-html="item.subtitle">
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </template>
    </v-list>
  </v-menu>
</template>

<script>
import { getRandomIntInclusive } from '../../utils/helpers';

export default {
  name: 'nestedMenu',

  components: {
    nestedMenuCard: () => import('./nestedMenu.vue'),
  },
  props: {
    name: String,
    icon: String,
    menuItems: Array,
    color: { type: String, default: 'secondary' },
    isOffsetX: { type: Boolean, default: false },
    isOffsetY: { type: Boolean, default: true },
    isOpenOnHover: { type: Boolean, default: false },
    isSubMenu: { type: Boolean, default: false },
    transition: { type: String, default: 'scale-transition' },
  },

  data: () => ({
    openMenu: false,
    graphName: 'Sisters',
    gender: ['men', 'women'],
  }),

  methods: {
    emitClickEvent(item) {
      if (!item.color) {
        this.graphName = item.action;
      }
      this.$emit('nestedMenu-click', item);
      this.openMenu = false;
    },
    getAvatar() {
      const gender = this.gender[getRandomIntInclusive(0, 1)];
      const id = getRandomIntInclusive(1, 99);
      const avatar = `https://randomuser.me/api/portraits/${gender}/${id}.jpg`;
      return avatar;
    },
    getColorOfCurrentGraph(item) {
      if (!item.color) {
        return item.name === this.graphName ? 'green' : 'red';
      }
      return item.color;
    },
  },
};
</script>
