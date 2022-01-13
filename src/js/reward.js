import { err, success, printJson } from '@/utils/helpers';
import Reward from '@/models/Reward';

export const rewardMixin = {
  name: 'rewardMixin',
  methods: {
    rewardMap() {
      return Reward.rewardMap();
    },
    rewardingSponsors() {
      return Reward.query().orderBy('biz').get();
    },
    updateRewardPoints({ bid, biz, sid }) {
      Reward.update({ bid, biz, sid })
        .then((result) =>
          console.log(
            success('updateRewardPoints result :>> ', printJson(result))
          )
        )
        .catch((e) => console.log(err('e :>> ', e)));
    },
  },
};
