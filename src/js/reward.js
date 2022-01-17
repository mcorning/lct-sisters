import { err, success, printJson } from '@/utils/helpers';
import Reward from '@/models/Reward';

export const rewardMixin = {
  name: 'rewardMixin',
  methods: {
    redeemReward(uid) {
      return Reward.delete(uid);
    },
    getPointsFromCustomer(uid) {
      return Reward.getPoints(uid);
    },
    rewardMap() {
      return Reward.rewardMap();
    },
    rewardingSponsors() {
      return Reward.query().orderBy('biz').get();
    },
    updateRewardPoints({ uid, biz, sid }) {
      Reward.update({ uid, biz, sid })
        .then((result) =>
          console.log(
            success('updateRewardPoints result :>> ', printJson(result))
          )
        )
        .catch((e) => console.log(err('e :>> ', e)));
    },
  },
};
