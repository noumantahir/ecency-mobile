import { useState, useEffect } from 'react';
import { withNavigation } from 'react-navigation';
import get from 'lodash/get';
import { connect } from 'react-redux';

import { getCommunity, getSubscriptions } from '../../../providers/steem/steem';
import { subscribeCommunity } from '../../../providers/steem/dsteem';

const CommunityContainer = ({ children, navigation, currentAccount, pinCode }) => {
  const [data, setData] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const tag = get(navigation, 'state.params.tag');

  useEffect(() => {
    getCommunity(tag).then((res) => {
      console.log('res :>> ', res);
      setData(res);
    });
  }, [tag]);

  useEffect(() => {
    if (data) {
      getSubscriptions(currentAccount.username).then((result) => {
        const _isSubscribed = result.some((item) => item[0] === data.name);
        setIsSubscribed(_isSubscribed);
      });
    }
  }, [data]);

  const _handleSubscribeButtonPress = () => {
    const _data = {
      isSubscribed: !isSubscribed,
      communityId: data.name,
    };

    subscribeCommunity(currentAccount, pinCode, _data).then((result) => {
      setIsSubscribed(!isSubscribed);
    });
  };

  return (
    children &&
    children({
      data,
      handleSubscribeButtonPress: _handleSubscribeButtonPress,
      isSubscribed: isSubscribed,
    })
  );
};

const mapStateToProps = (state) => ({
  currentAccount: state.account.currentAccount,
  pinCode: state.application.pin,
});

export default connect(mapStateToProps)(withNavigation(CommunityContainer));
