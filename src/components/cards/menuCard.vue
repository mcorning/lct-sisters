<template>
  <nestedMenu
    name="Menu"
    :menu-items="fileMenuItems"
    @nestedMenu-click="onMenuItemClick"
  />
</template>

<script>
export default {
  props: {
    username: String,
    auditLog: {
      type: Array,
      default: () => [{ name: 'hello' }, { name: 'there' }],
    },
  },
  components: {
    nestedMenu: () => import('./nestedMenuCard'),
  },
  computed: {
    tail() {
      return this.auditLog;
    },

    fileMenuItems() {
      const x = [
        // { isDivider: true },
        // {
        //   name: 'Select a Graph',
        //   menu: [
        //     {
        //       name: 'Sisters',
        //       subtitle: 'Where real data goes',
        //       icon: 'mdi-graphql',
        //       action: 'Sisters',
        //     },
        //     {
        //       name: 'Sandbox',
        //       subtitle: 'Play around with LCT safely',
        //       icon: 'mdi-graphql',
        //       action: 'Sandbox',
        //     },
        //   ],
        // },
        // { isDivider: true },

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

        // { isDivider: true },
      ];
      return x;
    },
  },
  data: () => ({
    fileMenuItemsX: [
      {
        name: 'Menu Item 1',
        action: () => {
          console.log('menu-item-1');
        },
      },
      { isDivider: true },
      { name: 'Menu Item 2' },
      {
        name: 'Sub 1',
        menu: [
          { name: '1.1' },
          { name: '1.2' },
          {
            name: 'Sub-menu 2',
            menu: [
              { name: '2.1' },
              { name: '2.2' },
              {
                name: 'Sub-menu 3',
                menu: [
                  { name: '3.1' },
                  { name: '3.2' },
                  {
                    name: 'Sub-menu 4',
                    menu: [{ name: '4.1' }, { name: '4.2' }, { name: '4.3' }],
                  },
                ],
              },
            ],
          },
        ],
      },

      { name: 'Menu Item 3' },
      { isDivider: true },
      {
        name: 'Menu Item 4',
        action: () => {
          console.log('menu-item-4');
        },
      },
      {
        name: 'Menu Item 5',
        action: () => {
          console.log('menu-item-5');
        },
      },
    ],
  }),
  methods: {
    changeGraph(graph) {
      console.log(graph);
      this.$emit('changeGraph', graph);
    },
    act(action) {
      console.log(action);
      this.$emit('act', action);
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
        default:
          this.act(item.action);
      }
    },
  },
};
</script>

<style lang="scss" scoped></style>
