<template>
  <State>
    <v-app-bar slot-scope="{ isConnected }" color="primary" app dark>
      <v-toolbar-title
        >{{ 'Local Contact Tracing' }} - {{ namespace }}</v-toolbar-title
      >

      <v-spacer></v-spacer>
      {{ $version }}
      <v-icon right class="pl-3"
        >{{ isConnected ? 'mdi-lan-connect' : 'mdi-lan-disconnect' }}
      </v-icon>

      <!-- Begin Options Menu-->
      <nestedMenu
        :menu-items="fileMenuItems"
        @nestedMenu-click="onMenuItemClick"
      />
      <!-- End Options Menu-->
    </v-app-bar>
  </State>
</template>

<script>
import State from '../components/renderless/State.vue';

export default {
  name: 'AppLayoutHeader',
  props: {
    namespace: {
      type: String,
    },
  },
  components: {
    State,
    nestedMenu: () => import('../components/menus/nestedMenu.vue'),
  },
  computed: {
    fileMenuItems() {
      const x = [
        { isDivider: true },
        {
          name: 'Select a Graph',
          menu: [
            {
              name: 'Sisters',
              subtitle: 'Where real data goes',
              icon: 'mdi-graphql',
              action: 'Sisters',
            },
            {
              name: 'Sandbox',
              subtitle: 'Play around with LCT safely',
              icon: 'mdi-graphql',
              action: 'Sandbox',
            },
          ],
        },
        { isDivider: true },
        {
          name: 'Audit Log Tail:',
          subtitle: 'Captures key runtime data for review',
          icon: 'mdi-information-outline',
          color: 'yellow',
          menu: this.tail,
          // menu: [
          //   { name: '1.1' },
          //   { name: '1.2' },
          //   {
          //     name: 'Sub-menu 2',
          //     menu: [
          //       { name: '2.1' },
          //       { name: '2.2' },
          //       {
          //         name: 'Sub-menu 3',
          //         menu: [
          //           { name: '3.1' },
          //           { name: '3.2' },
          //           {
          //             name: 'Sub-menu 4',
          //             menu: [{ name: '4.1' }, { name: '4.2' }, { name: '4.3' }],
          //           },
          //         ],
          //       },
          //     ],
          //   },
          // ],
        },

        { isDivider: true },
        {
          subtitle: 'How are we doing?',
          name: 'Feedback',
          action: 'Feedback',
          icon: 'mdi-comment-quote-outline',
          color: 'purple',
        },
        {
          name: 'Docs',
          subtitle: 'LCT Docs (applies to all instances of LCT)',
          action: 'Docs',
          icon: 'mdi-information-variant',
          color: 'yellow',
        },

        { isDivider: true },

        {
          subtitle: 'Remove localStorage username/sessionID',
          name: 'Reset',
          action: 'Reset',
          icon: 'mdi-comment-quote-outline',
          color: 'orange',
        },
      ];
      return x;
    },
  },

  data() {
    return {
      graphName: '',
      feedbackDialog: false,
    };
  },

  methods: {
    // TODO this is part of the State component, too
    changeGraph(graphName) {
      this.graphName =
        graphName === 'Sandbox' ? 'Sandbox' : this.$defaultGraphName;
      // this server event gets delegated to redis.js
      //this.emitFromClient('changeGraph', this.graphName);
    },

    onMenuItemClick(item) {
      if (typeof item.action === 'function') {
        item.action();
        return;
      }
      switch (item.action) {
        case 'Sisters':
        case 'Sandbox':
          this.changeGraph(item.action);
          break;
        // case 'Audit Log':
        //   this.showAuditLog = true;
        //   break;
        case 'Docs':
          window.open(
            'https://lct-docs.netlify.app',
            '_blank',
            'noopener noreferrer'
          );
          break;
        case 'Feedback':
          this.feedbackDialog = true;
          break;
        case 'Donate':
          alert(
            'Your financial support makes this work possible. Email mcorning@soteriaInstitute.org for details. Thanks a 0xF4240.'
          );
          break;
        case 'Reset':
          // TODO replace with State renderless component
          // Visit.deleteAll();
          // Setting.deleteAll();
          window.location.reload();
          break;
      }
    },
  },
};
</script>

<style scoped></style>
