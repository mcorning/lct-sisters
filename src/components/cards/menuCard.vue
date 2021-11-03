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
      // see example nested object below
      const x = [
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
      ];
      return x;
    },
  },
  data() {
    return {};
  },
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
      this.act(item.action);
    },
  },
};

/* Example nested menu structure
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
*/
</script>

<style lang="scss" scoped></style>
