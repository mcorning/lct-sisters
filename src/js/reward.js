import { err, success, printJson } from '@/utils/helpers';
import Reward from '@/models/Reward';

export const rewardMixin = {
  name: 'rewardMixin',
  methods: {
    redeemReward(rsid) {
      return Reward.delete(rsid);
    },
    getPointsFromCustomer(sid) {
      return Reward.getPoints(sid);
    },

    getSponsorRewards(sid) {
      return Reward.query().where('sid', sid).orderBy('rid').get();
    },

    rewardingSponsors() {
      return Reward.query().orderBy('biz').get();
    },
    updateRewardPoints({ rsid, sid, biz }) {
      Reward.update({ rsid, sid, biz })
        .then((result) =>
          console.log(
            success('updateRewardPoints result :>> ', printJson(result))
          )
        )
        .catch((e) => console.log(err('e :>> ', e)));
    },
  },
};
